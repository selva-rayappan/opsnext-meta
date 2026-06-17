"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailSyncProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSyncProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const prisma_service_1 = require("../prisma/prisma.service");
const email_integrations_service_1 = require("../email-integrations/email-integrations.service");
let EmailSyncProcessor = EmailSyncProcessor_1 = class EmailSyncProcessor {
    constructor(prisma, integrations) {
        this.prisma = prisma;
        this.integrations = integrations;
        this.logger = new common_1.Logger(EmailSyncProcessor_1.name);
    }
    async checkEmailSync(job) {
        this.logger.log('Checking active IMAP integrations to sync…');
        const activeIntegrations = await this.prisma.emailIntegration.findMany({
            where: { isActive: true, imapEnabled: true },
        });
        this.logger.log(`Found ${activeIntegrations.length} IMAP-enabled integrations`);
        for (const integration of activeIntegrations) {
            try {
                await this.syncOrganization(integration.id, integration.organizationId);
            }
            catch (err) {
                this.logger.error(`IMAP sync failed for org ${integration.organizationId}: ${err.message}`);
            }
        }
        return { enqueued: activeIntegrations.length };
    }
    async syncOrg(job) {
        const { integrationId, orgId } = job.data;
        try {
            await this.syncOrganization(integrationId, orgId);
        }
        catch (err) {
            this.logger.error(`IMAP sync failed for org ${orgId}: ${err.message}`);
            throw err;
        }
    }
    async syncOrganization(integrationId, orgId) {
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
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const client = new imapflow_1.ImapFlow({
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
                const searchResult = await client.search({ since });
                const uids = searchResult === false ? [] : searchResult;
                this.logger.log(`Org ${orgId}: found ${uids.length} messages since ${since.toISOString()}`);
                if (uids.length === 0)
                    return;
                for await (const msg of client.fetch(uids, { envelope: true, source: true })) {
                    if (!msg.source)
                        continue;
                    try {
                        const parsed = await (0, mailparser_1.simpleParser)(msg.source);
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
                        if (rfcMessageId) {
                            const existing = await this.prisma.emailMessage.findFirst({
                                where: { messageId: rfcMessageId, organizationId: orgId },
                            });
                            if (existing)
                                continue;
                        }
                        let threadId = null;
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
                                const newThread = await tx.emailThread.create({
                                    data: {
                                        organizationId: orgId,
                                        subject,
                                        createdById: await this.getSystemUserId(orgId),
                                        lastMessageAt: sentAt,
                                    },
                                });
                                threadId = newThread.id;
                            }
                            else {
                                await tx.emailThread.update({
                                    where: { id: threadId },
                                    data: { lastMessageAt: sentAt },
                                });
                            }
                            const newMsg = await tx.emailMessage.create({
                                data: {
                                    organizationId: orgId,
                                    threadId: threadId,
                                    messageId: rfcMessageId,
                                    direction: client_1.EmailDirection.INBOUND,
                                    fromAddress,
                                    toAddresses,
                                    ccAddresses,
                                    subject,
                                    bodyHtml,
                                    bodyText,
                                    sentAt,
                                },
                            });
                            const systemUserId = await this.getSystemUserId(orgId);
                            await tx.activity.create({
                                data: {
                                    organizationId: orgId,
                                    userId: systemUserId,
                                    type: client_1.ActivityType.EMAIL_LOG,
                                    subject: `Email received: ${subject}`,
                                },
                            });
                            return newMsg;
                        });
                    }
                    catch (msgErr) {
                        this.logger.error(`Failed to process message for org ${orgId}: ${msgErr.message}`);
                    }
                }
            }
            finally {
                lock.release();
            }
            await this.prisma.emailIntegration.update({
                where: { id: integrationId },
                data: { lastSyncAt: new Date() },
            });
            this.logger.log(`IMAP sync complete for org ${orgId}`);
        }
        finally {
            await client.logout().catch(() => { });
        }
    }
    async getSystemUserId(orgId) {
        const adminUser = await this.prisma.user.findFirst({
            where: { organizationId: orgId, role: 'ADMIN' },
            select: { id: true },
        });
        if (!adminUser) {
            throw new Error(`No ADMIN user found for org ${orgId}`);
        }
        return adminUser.id;
    }
};
exports.EmailSyncProcessor = EmailSyncProcessor;
__decorate([
    (0, bull_1.Process)('check-email-sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailSyncProcessor.prototype, "checkEmailSync", null);
__decorate([
    (0, bull_1.Process)('sync-org'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailSyncProcessor.prototype, "syncOrg", null);
exports.EmailSyncProcessor = EmailSyncProcessor = EmailSyncProcessor_1 = __decorate([
    (0, bull_1.Processor)('email-sync'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_integrations_service_1.EmailIntegrationsService])
], EmailSyncProcessor);
//# sourceMappingURL=email-sync.processor.js.map