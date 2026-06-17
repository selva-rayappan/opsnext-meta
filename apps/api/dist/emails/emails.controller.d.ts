import { Request, Response } from 'express';
import { UserPayload } from '@opsnext/shared';
import { EmailsService } from './emails.service';
import { ComposeEmailDto } from './dto/compose-email.dto';
import { ReplyEmailDto } from './dto/reply-email.dto';
export declare class EmailsController {
    private readonly service;
    constructor(service: EmailsService);
    listThreads(contactId: string | undefined, opportunityId: string | undefined, user: UserPayload): Promise<{
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
    getThread(id: string, user: UserPayload): Promise<{
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
    compose(dto: ComposeEmailDto, user: UserPayload): Promise<{
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
    reply(id: string, dto: ReplyEmailDto, user: UserPayload): Promise<{
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
    trackOpen(messageId: string, req: Request, res: Response): Promise<void>;
    trackClick(messageId: string, encodedUrl: string, req: Request, res: Response): Promise<void>;
}
