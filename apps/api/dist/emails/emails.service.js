"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const nodemailer = __importStar(require("nodemailer"));
const uuid_1 = require("uuid");
const prisma_service_1 = require("../prisma/prisma.service");
const email_integrations_service_1 = require("../email-integrations/email-integrations.service");
let EmailsService = EmailsService_1 = class EmailsService {
    constructor(prisma, integrations, config) {
        this.prisma = prisma;
        this.integrations = integrations;
        this.config = config;
        this.logger = new common_1.Logger(EmailsService_1.name);
    }
    async listThreads(orgId, contactId, opportunityId) {
        const where = { organizationId: orgId };
        if (contactId)
            where.contactId = contactId;
        if (opportunityId)
            where.opportunityId = opportunityId;
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
    async getThread(id, orgId) {
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
            throw new common_1.NotFoundException(`Email thread ${id} not found`);
        }
        return thread;
    }
    async compose(dto, userId, orgId) {
        const integration = await this.loadIntegration(orgId);
        const smtpPass = integration.smtpPassEnc ? this.integrations.decrypt(integration.smtpPassEnc) : '';
        const messageId = (0, uuid_1.v4)();
        const rfcMessageId = `<${messageId}@${integration.smtpFromEmail.split('@')[1]}>`;
        const appUrl = this.config.get('APP_URL', 'http://localhost:3001');
        const trackedBody = this.injectTracking(dto.bodyHtml, messageId, appUrl);
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
                    direction: client_1.EmailDirection.OUTBOUND,
                    fromAddress: integration.smtpFromEmail,
                    toAddresses: dto.toAddresses,
                    ccAddresses: dto.ccAddresses ?? [],
                    subject: dto.subject,
                    bodyHtml: trackedBody,
                    bodyText: null,
                    sentAt: new Date(),
                },
            });
            await tx.activity.create({
                data: {
                    organizationId: orgId,
                    userId,
                    type: client_1.ActivityType.EMAIL_LOG,
                    subject: `Email sent: ${dto.subject}`,
                    contactId: dto.contactId ?? null,
                    opportunityId: dto.opportunityId ?? null,
                },
            });
            return { thread: newThread, message: newMessage };
        });
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
    async reply(threadId, dto, userId, orgId) {
        const thread = await this.prisma.emailThread.findFirst({
            where: { id: threadId, organizationId: orgId },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });
        if (!thread) {
            throw new common_1.NotFoundException(`Email thread ${threadId} not found`);
        }
        const integration = await this.loadIntegration(orgId);
        const smtpPass = integration.smtpPassEnc ? this.integrations.decrypt(integration.smtpPassEnc) : '';
        const parentMessage = thread.messages[0];
        const messageId = (0, uuid_1.v4)();
        const rfcMessageId = `<${messageId}@${integration.smtpFromEmail.split('@')[1]}>`;
        const appUrl = this.config.get('APP_URL', 'http://localhost:3001');
        const toAddresses = dto.toAddresses ?? parentMessage?.toAddresses ?? [];
        const trackedBody = this.injectTracking(dto.bodyHtml, messageId, appUrl);
        const { message } = await this.prisma.$transaction(async (tx) => {
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
                    direction: client_1.EmailDirection.OUTBOUND,
                    fromAddress: integration.smtpFromEmail,
                    toAddresses,
                    ccAddresses: dto.ccAddresses ?? [],
                    subject: `Re: ${thread.subject}`,
                    bodyHtml: trackedBody,
                    bodyText: null,
                    sentAt: new Date(),
                },
            });
            await tx.activity.create({
                data: {
                    organizationId: orgId,
                    userId,
                    type: client_1.ActivityType.EMAIL_LOG,
                    subject: `Email sent: Re: ${thread.subject}`,
                    contactId: thread.contactId ?? null,
                    opportunityId: thread.opportunityId ?? null,
                },
            });
            return { message: newMessage };
        });
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
    async recordTrackingEvent(msgId, type, url, ipAddress, userAgent) {
        const message = await this.prisma.emailMessage.findUnique({ where: { id: msgId } });
        if (!message)
            return;
        const trackingType = type === 'OPEN' ? client_1.EmailTrackingType.OPEN : client_1.EmailTrackingType.CLICK;
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
    async loadIntegration(orgId) {
        const integration = await this.prisma.emailIntegration.findUnique({
            where: { organizationId: orgId },
        });
        if (!integration || !integration.isActive) {
            throw new common_1.NotFoundException('Email integration not configured for this organization. Set it up at /email-integrations.');
        }
        return integration;
    }
    injectTracking(bodyHtml, messageId, appUrl) {
        const base = `${appUrl}/api/v1/emails/track`;
        const withClickTracking = bodyHtml.replace(/href="(https?:\/\/[^"]+)"/gi, (_match, url) => {
            const encoded = Buffer.from(url).toString('base64url');
            return `href="${base}/click/${messageId}/${encoded}"`;
        });
        const pixel = `<img src="${base}/open/${messageId}" width="1" height="1" style="display:none" alt="" />`;
        return `${withClickTracking}${pixel}`;
    }
    async sendSmtp(opts) {
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
        const mailOptions = {
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
};
exports.EmailsService = EmailsService;
exports.EmailsService = EmailsService = EmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_integrations_service_1.EmailIntegrationsService,
        config_1.ConfigService])
], EmailsService);
//# sourceMappingURL=emails.service.js.map