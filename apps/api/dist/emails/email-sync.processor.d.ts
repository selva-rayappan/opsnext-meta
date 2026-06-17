import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EmailIntegrationsService } from '../email-integrations/email-integrations.service';
interface SyncOrgJobData {
    integrationId: string;
    orgId: string;
}
export declare class EmailSyncProcessor {
    private readonly prisma;
    private readonly integrations;
    private readonly logger;
    constructor(prisma: PrismaService, integrations: EmailIntegrationsService);
    checkEmailSync(job: Job): Promise<{
        enqueued: number;
    }>;
    syncOrg(job: Job<SyncOrgJobData>): Promise<void>;
    private syncOrganization;
    private getSystemUserId;
}
export {};
