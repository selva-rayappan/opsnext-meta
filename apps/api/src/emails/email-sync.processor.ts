import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ActivityType, EmailDirection } from '@prisma/client';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { PrismaService } from '../prisma/prisma.service';
import { EmailIntegrationsService } from '../email-integrations/email-integrations.service';

interface SyncOrgJobData {
  integrationId: string;
  orgId: string;
}

@Processor('email-sync')
export class EmailSyncProcessor {
  private readonly logger = new Logger(EmailSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrations: EmailIntegrationsService,
  ) {}

  @Process('check-email-sync')
  async checkEmailSync(job: Job): Promise<{ enqueued: number }> {
    this.logger.log('Checking active IMAP integrations to sync…');

    const activeIntegrations = await this.prisma.emailIntegration.findMany({
      where: { isActive: true, imapEnabled: true },
    });

    this.logger.log(`Found ${activeIntegrations.length} IMAP-enabled integrations`);

    // Enqueue a sync-org job for each active IMAP integration
    // We do this by having the processor enqueue via the Bull queue.
    // Because we can't inject InjectQueue here without a circular dep,
    // we perform the sync inline in a bounded loop instead.
    for (const integration of activeIntegrations) {
      try {
        await this.syncOrganization(integration.id, integration.organizationId);
      } catch (err) {
        this.logger.error(
          `IMAP sync failed for org ${integration.organizationId}: ${(err as Error).message}`,
        );
      }
    }

    return { enqueued: activeIntegrations.length };
  }

  @Process('sync-org')
  async syncOrg(job: Job<SyncOrgJobData>): Promise<void> {
    const { integrationId, orgId } = job.data;
    try {
      await this.syncOrganization(integrationId, orgId);
    } catch (err) {
      this.logger.error(`IMAP sync failed for org ${orgId}: ${(err as Error).message}`);
      throw err; // Let Bull mark the job as failed
    }
  }

  // ---------------------------------------------------------------------------
  // Core sync logic
  // ---------------------------------------------------------------------------

  private async syncOrganization(integrationId: string, orgId: string): Promise<void> {
    const integration = await this.prisma.emailIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.imapEnabled || !integration.imapHost || !integration.imapUser) {
      this.logger.warn(`Integration ${integrationId} is not IMAP-ready, skipping`);
      return;
    }

    const imapPass = integration.imapPassEnc
      ? this.integrations.decrypt(integration.imapPassEnc)
      : '';

    const since = integration.lastSyncAt
      ? integration.lastSyncAt
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h on first sync

    const client = new ImapFlow({
      host: integration.imapHost,
      port: integration.imapPort ?? 993,
      secure: true,
      auth: {
        user: integration.imapUser,
        pass: imapPass,
      },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        // Search for messages received since lastSyncAt
        const searchResult = await client.search({ since });
        const uids = searchResult === false ? [] : searchResult;
        this.logger.log(`Org ${orgId}: found ${uids.length} messages since ${since.toISOString()}`);

        if (uids.length === 0) return;

        for await (const msg of client.fetch(uids, { envelope: true, source: true })) {
          if (!msg.source) continue;
          try {
            const parsed = await simpleParser(msg.source);

            const inReplyTo = parsed.inReplyTo ?? null;
            const fromAddress = parsed.from?.value[0]?.address ?? '';
            const toAddresses = (parsed.to
              ? Array.isArray(parsed.to)
                ? parsed.to.flatMap((a) => a.value.map((v) => v.address ?? ''))
                : parsed.to.value.map((v) => v.address ?? '')
              : []);
            const ccAddresses = (parsed.cc
              ? Array.isArray(parsed.cc)
                ? parsed.cc.flatMap((a) => a.value.map((v) => v.address ?? ''))
                : parsed.cc.value.map((v) => v.address ?? '')
              : []);
            const subject = parsed.subject ?? '(no subject)';
            const bodyHtml = parsed.html || parsed.textAsHtml || '';
            const bodyText = parsed.text ?? null;
            const rfcMessageId = parsed.messageId ?? null;
            const sentAt = parsed.date ?? new Date();

            // Check for duplicate by RFC messageId
            if (rfcMessageId) {
              const existing = await this.prisma.emailMessage.findFirst({
                where: { messageId: rfcMessageId, organizationId: orgId },
              });
              if (existing) continue; // already ingested
            }

            // Try to match In-Reply-To to an existing thread
            let threadId: string | null = null;
            if (inReplyTo) {
              const parentMsg = await this.prisma.emailMessage.findFirst({
                where: { messageId: inReplyTo, organizationId: orgId },
                select: { threadId: true },
              });
              if (parentMsg) {
                threadId = parentMsg.threadId;
              }
            }

            await this.prisma.$transaction(async (tx) => {
              if (!threadId) {
                // Orphan inbound — create a new thread
                const newThread = await tx.emailThread.create({
                  data: {
                    organizationId: orgId,
                    subject,
                    createdById: await this.getSystemUserId(orgId),
                    lastMessageAt: sentAt,
                  },
                });
                threadId = newThread.id;
              } else {
                // Update thread's lastMessageAt
                await tx.emailThread.update({
                  where: { id: threadId },
                  data: { lastMessageAt: sentAt },
                });
              }

              const newMsg = await tx.emailMessage.create({
                data: {
                  organizationId: orgId,
                  threadId: threadId!,
                  messageId: rfcMessageId,
                  direction: EmailDirection.INBOUND,
                  fromAddress,
                  toAddresses,
                  ccAddresses,
                  subject,
                  bodyHtml,
                  bodyText,
                  sentAt,
                },
              });

              // Create EMAIL_LOG Activity for inbound
              const systemUserId = await this.getSystemUserId(orgId);
              await tx.activity.create({
                data: {
                  organizationId: orgId,
                  userId: systemUserId,
                  type: ActivityType.EMAIL_LOG,
                  subject: `Email received: ${subject}`,
                },
              });

              return newMsg;
            });
          } catch (msgErr) {
            this.logger.error(
              `Failed to process message for org ${orgId}: ${(msgErr as Error).message}`,
            );
          }
        }
      } finally {
        lock.release();
      }

      // Update lastSyncAt
      await this.prisma.emailIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(`IMAP sync complete for org ${orgId}`);
    } finally {
      await client.logout().catch(() => {});
    }
  }

  /** Get the first ADMIN user id for the org to attribute system-generated activities */
  private async getSystemUserId(orgId: string): Promise<string> {
    const adminUser = await this.prisma.user.findFirst({
      where: { organizationId: orgId, role: 'ADMIN' },
      select: { id: true },
    });
    if (!adminUser) {
      throw new Error(`No ADMIN user found for org ${orgId}`);
    }
    return adminUser.id;
  }
}
