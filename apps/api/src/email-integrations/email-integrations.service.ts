import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertEmailIntegrationDto } from './dto/upsert-email-integration.dto';
import { EmailIntegration } from '@prisma/client';

type SafeIntegration = Omit<EmailIntegration, 'smtpPassEnc' | 'imapPassEnc'>;

@Injectable()
export class EmailIntegrationsService {
  private readonly logger = new Logger(EmailIntegrationsService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Derive a 32-byte key from ENCRYPTION_KEY, falling back to JWT_SECRET
    const rawKey = this.config.get<string>(
      'ENCRYPTION_KEY',
      this.config.get<string>('JWT_SECRET', 'fallback-32-char-dev-key-only!!').slice(0, 32),
    );
    this.encryptionKey = Buffer.from(rawKey, 'utf8').slice(0, 32);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async findByOrg(orgId: string): Promise<SafeIntegration | null> {
    const integration = await this.prisma.emailIntegration.findUnique({
      where: { organizationId: orgId },
    });
    if (!integration) return null;
    return this.stripSecrets(integration);
  }

  async upsert(orgId: string, dto: UpsertEmailIntegrationDto): Promise<SafeIntegration> {
    const existing = await this.prisma.emailIntegration.findUnique({
      where: { organizationId: orgId },
    });

    // Encrypt SMTP password — keep existing if no new value provided
    let smtpPassEnc: string;
    if (dto.smtpPass) {
      smtpPassEnc = this.encrypt(dto.smtpPass);
    } else if (existing) {
      smtpPassEnc = existing.smtpPassEnc;
    } else {
      smtpPassEnc = '';
    }

    // Encrypt IMAP password — keep existing if no new value provided
    let imapPassEnc: string | null = null;
    if (dto.imapPass) {
      imapPassEnc = this.encrypt(dto.imapPass);
    } else if (existing) {
      imapPassEnc = existing.imapPassEnc ?? null;
    }

    const data = {
      smtpHost: dto.smtpHost,
      smtpPort: dto.smtpPort,
      smtpUser: dto.smtpUser,
      smtpPassEnc,
      smtpFromName: dto.smtpFromName,
      smtpFromEmail: dto.smtpFromEmail,
      smtpSecure: dto.smtpSecure ?? false,
      imapEnabled: dto.imapEnabled ?? false,
      imapHost: dto.imapHost ?? null,
      imapPort: dto.imapPort ?? 993,
      imapUser: dto.imapUser ?? null,
      imapPassEnc,
    };

    const result = await this.prisma.emailIntegration.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...data },
      update: data,
    });

    return this.stripSecrets(result);
  }

  async remove(orgId: string): Promise<void> {
    const existing = await this.prisma.emailIntegration.findUnique({
      where: { organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException('Email integration not found for this organization');
    }
    await this.prisma.emailIntegration.delete({
      where: { organizationId: orgId },
    });
  }

  async testSmtp(orgId: string): Promise<{ success: boolean; error?: string }> {
    const integration = await this.prisma.emailIntegration.findUnique({
      where: { organizationId: orgId },
    });
    if (!integration) {
      throw new NotFoundException('Email integration not found for this organization');
    }

    const smtpPass = integration.smtpPassEnc ? this.decrypt(integration.smtpPassEnc) : '';

    const transport = nodemailer.createTransport({
      host: integration.smtpHost,
      port: integration.smtpPort,
      secure: integration.smtpSecure,
      auth: {
        user: integration.smtpUser,
        pass: smtpPass,
      },
    });

    try {
      await transport.verify();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.warn(`SMTP test failed for org ${orgId}: ${error}`);
      return { success: false, error };
    }
  }

  // ---------------------------------------------------------------------------
  // Encryption helpers (exported for use by EmailsService)
  // ---------------------------------------------------------------------------

  encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(stored: string): string {
    const [ivHex, authTagHex, ciphertextHex] = stored.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private stripSecrets(integration: EmailIntegration): SafeIntegration {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { smtpPassEnc, imapPassEnc, ...safe } = integration;
    return safe;
  }
}
