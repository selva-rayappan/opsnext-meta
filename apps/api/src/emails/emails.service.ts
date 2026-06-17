import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityType, EmailDirection, EmailTrackingType } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { EmailIntegrationsService } from '../email-integrations/email-integrations.service';
import { ComposeEmailDto } from './dto/compose-email.dto';
import { ReplyEmailDto } from './dto/reply-email.dto';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrations: EmailIntegrationsService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Threads
  // ---------------------------------------------------------------------------

  async listThreads(orgId: string, contactId?: string, opportunityId?: string) {
    const where: Record<string, unknown> = { organizationId: orgId };
    if (contactId) where.contactId = contactId;
    if (opportunityId) where.opportunityId = opportunityId;

    const threads = await this.prisma.emailThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            direction: true,
            fromAddress: true,
            bodyHtml: true,
            sentAt: true,
            createdAt: true,
          },
        },
        contact: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return threads.map((t) => ({
      ...t,
      lastMessage: t.messages[0] ?? null,
      messages: undefined,
    }));
  }

  async getThread(id: string, orgId: string) {
    const thread = await this.prisma.emailThread.findFirst({
      where: { id, organizationId: orgId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            trackingEvents: true,
          },
        },
        contact: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!thread) {
      throw new NotFoundException(`Email thread ${id} not found`);
    }
    return thread;
  }

  // ---------------------------------------------------------------------------
  // Compose — creates thread + first message
  // ---------------------------------------------------------------------------

  async compose(dto: ComposeEmailDto, userId: string, orgId: string) {
    const integration = await this.loadIntegration(orgId);
    const smtpPass = integration.smtpPassEnc ? this.integrations.decrypt(integration.smtpPassEnc) : '';

    const messageId = uuidv4();
    const rfcMessageId = `<${messageId}@${integration.smtpFromEmail.split('@')[1]}>`;
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3001');

    // Build tracked body
    const trackedBody = this.injectTracking(dto.bodyHtml, messageId, appUrl);

    // Create thread + first message in a transaction
    const { thread, message } = await this.prisma.$transaction(async (tx) => {
      const newThread = await tx.emailThread.create({
        data: {
          organizationId: orgId,
          subject: dto.subject,
          contactId: dto.contactId ?? null,
          opportunityId: dto.opportunityId ?? null,
          createdById: userId,
          lastMessageAt: new Date(),
        },
      });

      const newMessage = await tx.emailMessage.create({
        data: {
          id: messageId,
          organizationId: orgId,
          threadId: newThread.id,
          messageId: rfcMessageId,
          direction: EmailDirection.OUTBOUND,
          fromAddress: integration.smtpFromEmail,
          toAddresses: dto.toAddresses,
          ccAddresses: dto.ccAddresses ?? [],
          subject: dto.subject,
          bodyHtml: trackedBody,
          bodyText: null,
          sentAt: new Date(),
        },
      });

      // Create EMAIL_LOG Activity
      await tx.activity.create({
        data: {
          organizationId: orgId,
          userId,
          type: ActivityType.EMAIL_LOG,
          subject: `Email sent: ${dto.subject}`,
          contactId: dto.contactId ?? null,
          opportunityId: dto.opportunityId ?? null,
        },
      });

      return { thread: newThread, message: newMessage };
    });

    // Send via SMTP (after DB write so we have the record even if send fails)
    await this.sendSmtp({
      integration,
      smtpPass,
      to: dto.toAddresses,
      cc: dto.ccAddresses,
      subject: dto.subject,
      html: trackedBody,
      rfcMessageId,
    });

    return { thread, message };
  }

  // ---------------------------------------------------------------------------
  // Reply
  // ---------------------------------------------------------------------------

  async reply(threadId: string, dto: ReplyEmailDto, userId: string, orgId: string) {
    const thread = await this.prisma.emailThread.findFirst({
      where: { id: threadId, organizationId: orgId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!thread) {
      throw new NotFoundException(`Email thread ${threadId} not found`);
    }

    const integration = await this.loadIntegration(orgId);
    const smtpPass = integration.smtpPassEnc ? this.integrations.decrypt(integration.smtpPassEnc) : '';

    const parentMessage = thread.messages[0];
    const messageId = uuidv4();
    const rfcMessageId = `<${messageId}@${integration.smtpFromEmail.split('@')[1]}>`;
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3001');

    const toAddresses = dto.toAddresses ?? parentMessage?.toAddresses ?? [];
    const trackedBody = this.injectTracking(dto.bodyHtml, messageId, appUrl);

    const { message } = await this.prisma.$transaction(async (tx) => {
      // Update thread's lastMessageAt
      await tx.emailThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });

      const newMessage = await tx.emailMessage.create({
        data: {
          id: messageId,
          organizationId: orgId,
          threadId,
          messageId: rfcMessageId,
          direction: EmailDirection.OUTBOUND,
          fromAddress: integration.smtpFromEmail,
          toAddresses,
          ccAddresses: dto.ccAddresses ?? [],
          subject: `Re: ${thread.subject}`,
          bodyHtml: trackedBody,
          bodyText: null,
          sentAt: new Date(),
        },
      });

      // Create EMAIL_LOG Activity
      await tx.activity.create({
        data: {
          organizationId: orgId,
          userId,
          type: ActivityType.EMAIL_LOG,
          subject: `Email sent: Re: ${thread.subject}`,
          contactId: thread.contactId ?? null,
          opportunityId: thread.opportunityId ?? null,
        },
      });

      return { message: newMessage };
    });

    // Send via SMTP
    await this.sendSmtp({
      integration,
      smtpPass,
      to: toAddresses,
      cc: dto.ccAddresses,
      subject: `Re: ${thread.subject}`,
      html: trackedBody,
      rfcMessageId,
      inReplyTo: parentMessage?.messageId ?? undefined,
    });

    return message;
  }

  // ---------------------------------------------------------------------------
  // Tracking
  // ---------------------------------------------------------------------------

  async recordTrackingEvent(
    msgId: string,
    type: 'OPEN' | 'CLICK',
    url: string | null,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<void> {
    const message = await this.prisma.emailMessage.findUnique({ where: { id: msgId } });
    if (!message) return;

    const trackingType = type === 'OPEN' ? EmailTrackingType.OPEN : EmailTrackingType.CLICK;

    await this.prisma.$transaction([
      this.prisma.emailTrackingEvent.create({
        data: {
          messageId: msgId,
          type: trackingType,
          url: url ?? null,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      }),
      type === 'OPEN'
        ? this.prisma.emailMessage.update({
            where: { id: msgId },
            data: { openCount: { increment: 1 } },
          })
        : this.prisma.emailMessage.update({
            where: { id: msgId },
            data: { clickCount: { increment: 1 } },
          }),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Load raw EmailIntegration (with encrypted fields) for send operations */
  private async loadIntegration(orgId: string) {
    const integration = await this.prisma.emailIntegration.findUnique({
      where: { organizationId: orgId },
    });
    if (!integration || !integration.isActive) {
      throw new NotFoundException(
        'Email integration not configured for this organization. Set it up at /email-integrations.',
      );
    }
    return integration;
  }

  /** Rewrite href links and append tracking pixel */
  private injectTracking(bodyHtml: string, messageId: string, appUrl: string): string {
    const base = `${appUrl}/api/v1/emails/track`;

    // Rewrite all http/https href links to click-tracking URLs
    const withClickTracking = bodyHtml.replace(
      /href="(https?:\/\/[^"]+)"/gi,
      (_match: string, url: string) => {
        const encoded = Buffer.from(url).toString('base64url');
        return `href="${base}/click/${messageId}/${encoded}"`;
      },
    );

    // Append open-tracking pixel
    const pixel = `<img src="${base}/open/${messageId}" width="1" height="1" style="display:none" alt="" />`;
    return `${withClickTracking}${pixel}`;
  }

  private async sendSmtp(opts: {
    integration: { smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpUser: string; smtpFromName: string; smtpFromEmail: string };
    smtpPass: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
    rfcMessageId: string;
    inReplyTo?: string;
  }): Promise<void> {
    const { integration, smtpPass, to, cc, subject, html, rfcMessageId, inReplyTo } = opts;

    const transport = nodemailer.createTransport({
      host: integration.smtpHost,
      port: integration.smtpPort,
      secure: integration.smtpSecure,
      auth: {
        user: integration.smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${integration.smtpFromName}" <${integration.smtpFromEmail}>`,
      to: to.join(', '),
      cc: cc?.join(', '),
      subject,
      html,
      messageId: rfcMessageId,
      ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
    };

    await transport.sendMail(mailOptions);
  }
}
