import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailIntegrationsService } from '../email-integrations/email-integrations.service';
import { ComposeEmailDto } from './dto/compose-email.dto';
import { ReplyEmailDto } from './dto/reply-email.dto';
export declare class EmailsService {
    private readonly prisma;
    private readonly integrations;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, integrations: EmailIntegrationsService, config: ConfigService);
    listThreads(orgId: string, contactId?: string, opportunityId?: string): Promise<{
        lastMessage: {
            id: string;
            createdAt: Date;
            bodyHtml: string;
            direction: import("@prisma/client").$Enums.EmailDirection;
            fromAddress: string;
            sentAt: Date | null;
        };
        messages: undefined;
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        opportunity: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        opportunityId: string | null;
        subject: string;
        createdById: string;
        lastMessageAt: Date;
    }[]>;
    getThread(id: string, orgId: string): Promise<{
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        opportunity: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        messages: ({
            trackingEvents: {
                id: string;
                ipAddress: string | null;
                userAgent: string | null;
                type: import("@prisma/client").$Enums.EmailTrackingType;
                messageId: string;
                url: string | null;
                occurredAt: Date;
            }[];
        } & {
            organizationId: string;
            id: string;
            createdAt: Date;
            subject: string;
            bodyHtml: string;
            threadId: string;
            messageId: string | null;
            direction: import("@prisma/client").$Enums.EmailDirection;
            fromAddress: string;
            toAddresses: string[];
            ccAddresses: string[];
            bodyText: string | null;
            sentAt: Date | null;
            openCount: number;
            clickCount: number;
        })[];
    } & {
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        opportunityId: string | null;
        subject: string;
        createdById: string;
        lastMessageAt: Date;
    }>;
    compose(dto: ComposeEmailDto, userId: string, orgId: string): Promise<{
        thread: {
            organizationId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string | null;
            opportunityId: string | null;
            subject: string;
            createdById: string;
            lastMessageAt: Date;
        };
        message: {
            organizationId: string;
            id: string;
            createdAt: Date;
            subject: string;
            bodyHtml: string;
            threadId: string;
            messageId: string | null;
            direction: import("@prisma/client").$Enums.EmailDirection;
            fromAddress: string;
            toAddresses: string[];
            ccAddresses: string[];
            bodyText: string | null;
            sentAt: Date | null;
            openCount: number;
            clickCount: number;
        };
    }>;
    reply(threadId: string, dto: ReplyEmailDto, userId: string, orgId: string): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        subject: string;
        bodyHtml: string;
        threadId: string;
        messageId: string | null;
        direction: import("@prisma/client").$Enums.EmailDirection;
        fromAddress: string;
        toAddresses: string[];
        ccAddresses: string[];
        bodyText: string | null;
        sentAt: Date | null;
        openCount: number;
        clickCount: number;
    }>;
    recordTrackingEvent(msgId: string, type: 'OPEN' | 'CLICK', url: string | null, ipAddress: string | undefined, userAgent: string | undefined): Promise<void>;
    private loadIntegration;
    private injectTracking;
    private sendSmtp;
}
