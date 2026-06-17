import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertEmailIntegrationDto } from './dto/upsert-email-integration.dto';
import { EmailIntegration } from '@prisma/client';
type SafeIntegration = Omit<EmailIntegration, 'smtpPassEnc' | 'imapPassEnc'>;
export declare class EmailIntegrationsService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private readonly encryptionKey;
    constructor(prisma: PrismaService, config: ConfigService);
    findByOrg(orgId: string): Promise<SafeIntegration | null>;
    upsert(orgId: string, dto: UpsertEmailIntegrationDto): Promise<SafeIntegration>;
    remove(orgId: string): Promise<void>;
    testSmtp(orgId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    encrypt(text: string): string;
    decrypt(stored: string): string;
    private stripSecrets;
}
export {};
