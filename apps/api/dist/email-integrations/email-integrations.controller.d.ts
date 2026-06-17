import { UserPayload } from '@opsnext/shared';
import { EmailIntegrationsService } from './email-integrations.service';
import { UpsertEmailIntegrationDto } from './dto/upsert-email-integration.dto';
export declare class EmailIntegrationsController {
    private readonly service;
    constructor(service: EmailIntegrationsService);
    findOne(user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpFromName: string;
        smtpFromEmail: string;
        smtpSecure: boolean;
        imapEnabled: boolean;
        imapHost: string | null;
        imapPort: number;
        imapUser: string | null;
        lastSyncAt: Date | null;
    } | null>;
    upsert(dto: UpsertEmailIntegrationDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpFromName: string;
        smtpFromEmail: string;
        smtpSecure: boolean;
        imapEnabled: boolean;
        imapHost: string | null;
        imapPort: number;
        imapUser: string | null;
        lastSyncAt: Date | null;
    }>;
    remove(user: UserPayload): Promise<void>;
    testSmtp(user: UserPayload): Promise<{
        success: boolean;
        error?: string;
    }>;
}
