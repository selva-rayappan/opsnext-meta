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
var EmailIntegrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const nodemailer = __importStar(require("nodemailer"));
const prisma_service_1 = require("../prisma/prisma.service");
let EmailIntegrationsService = EmailIntegrationsService_1 = class EmailIntegrationsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(EmailIntegrationsService_1.name);
        const rawKey = this.config.get('ENCRYPTION_KEY', this.config.get('JWT_SECRET', 'fallback-32-char-dev-key-only!!').slice(0, 32));
        this.encryptionKey = Buffer.from(rawKey, 'utf8').slice(0, 32);
    }
    async findByOrg(orgId) {
        const integration = await this.prisma.emailIntegration.findUnique({
            where: { organizationId: orgId },
        });
        if (!integration)
            return null;
        return this.stripSecrets(integration);
    }
    async upsert(orgId, dto) {
        const existing = await this.prisma.emailIntegration.findUnique({
            where: { organizationId: orgId },
        });
        let smtpPassEnc;
        if (dto.smtpPass) {
            smtpPassEnc = this.encrypt(dto.smtpPass);
        }
        else if (existing) {
            smtpPassEnc = existing.smtpPassEnc;
        }
        else {
            smtpPassEnc = '';
        }
        let imapPassEnc = null;
        if (dto.imapPass) {
            imapPassEnc = this.encrypt(dto.imapPass);
        }
        else if (existing) {
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
    async remove(orgId) {
        const existing = await this.prisma.emailIntegration.findUnique({
            where: { organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Email integration not found for this organization');
        }
        await this.prisma.emailIntegration.delete({
            where: { organizationId: orgId },
        });
    }
    async testSmtp(orgId) {
        const integration = await this.prisma.emailIntegration.findUnique({
            where: { organizationId: orgId },
        });
        if (!integration) {
            throw new common_1.NotFoundException('Email integration not found for this organization');
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
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            this.logger.warn(`SMTP test failed for org ${orgId}: ${error}`);
            return { success: false, error };
        }
    }
    encrypt(text) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }
    decrypt(stored) {
        const [ivHex, authTagHex, ciphertextHex] = stored.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    }
    stripSecrets(integration) {
        const { smtpPassEnc, imapPassEnc, ...safe } = integration;
        return safe;
    }
};
exports.EmailIntegrationsService = EmailIntegrationsService;
exports.EmailIntegrationsService = EmailIntegrationsService = EmailIntegrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], EmailIntegrationsService);
//# sourceMappingURL=email-integrations.service.js.map