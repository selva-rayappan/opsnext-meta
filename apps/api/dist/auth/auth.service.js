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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
const shared_1 = require("@opsnext/shared");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const BCRYPT_ROUNDS = 12;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
let AuthService = class AuthService {
    constructor(prisma, jwt, config, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
    }
    async register(dto, ip, ua) {
        const slug = this.slugify(dto.organizationName);
        const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
        if (existingOrg) {
            throw new common_1.BadRequestException('Organisation name already taken');
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const { org, user } = await this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: dto.organizationName, slug },
            });
            const createdUser = await tx.user.create({
                data: {
                    organizationId: organization.id,
                    email: dto.email.toLowerCase(),
                    passwordHash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    role: shared_1.Role.ADMIN,
                },
            });
            await tx.pipeline.create({
                data: {
                    organizationId: organization.id,
                    name: 'Sales Pipeline',
                    isDefault: true,
                    stages: {
                        create: [
                            { organizationId: organization.id, name: 'Prospecting', probability: 10, order: 0, stageType: client_1.StageType.OPEN },
                            { organizationId: organization.id, name: 'Qualification', probability: 25, order: 1, stageType: client_1.StageType.OPEN },
                            { organizationId: organization.id, name: 'Proposal', probability: 50, order: 2, stageType: client_1.StageType.OPEN },
                            { organizationId: organization.id, name: 'Negotiation', probability: 75, order: 3, stageType: client_1.StageType.OPEN },
                            { organizationId: organization.id, name: 'Closed Won', probability: 100, order: 4, stageType: client_1.StageType.WON },
                            { organizationId: organization.id, name: 'Closed Lost', probability: 0, order: 5, stageType: client_1.StageType.LOST },
                        ],
                    },
                },
            });
            return { org: organization, user: createdUser };
        });
        return this.issueTokens(user.id, org.id, user.role, user.email, ip, ua);
    }
    async login(email, password, ip, ua) {
        const user = await this.prisma.user.findFirst({
            where: { email: email.toLowerCase() },
        });
        const dummyHash = '$2b$12$invalidhashusedtoblindtimingattacksXXXXXXXXXXXXXXXXXX';
        const passwordMatch = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
        if (!user || !passwordMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.issueTokens(user.id, user.organizationId, user.role, user.email, ip, ua);
    }
    async refresh(rawRefreshToken, ip, ua) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });
        if (!stored) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (stored.revokedAt !== null) {
            await this.prisma.refreshToken.updateMany({
                where: { familyId: stored.familyId },
                data: { revokedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('Refresh token reuse detected — all sessions invalidated. Please log in again.');
        }
        if (stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        if (!stored.user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        return this.issueTokens(stored.userId, stored.user.organizationId, stored.user.role, stored.user.email, ip, ua, stored.familyId);
    }
    async logout(rawRefreshToken) {
        const tokenHash = this.hashToken(rawRefreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async requestPasswordReset(email) {
        const user = await this.prisma.user.findFirst({
            where: { email: email.toLowerCase() },
        });
        if (!user || !user.isActive)
            return;
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
        await this.prisma.passwordReset.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId,
                tokenHash,
                expiresAt,
            },
        });
        const resetUrl = `${this.config.getOrThrow('APP_URL')}/reset-password?token=${rawToken}`;
        this.mail.sendPasswordReset(user.email, resetUrl).catch(() => {
        });
    }
    async resetPassword(rawToken, newPassword) {
        const tokenHash = this.hashToken(rawToken);
        const record = await this.prisma.passwordReset.findUnique({
            where: { tokenHash },
            include: { user: true },
        });
        if (!record)
            throw new common_1.BadRequestException('Invalid or expired reset token');
        if (record.usedAt)
            throw new common_1.BadRequestException('Reset token already used');
        if (record.expiresAt < new Date())
            throw new common_1.BadRequestException('Reset token expired');
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { passwordHash },
            }),
            this.prisma.passwordReset.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.refreshToken.updateMany({
                where: { userId: record.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
    }
    async issueTokens(userId, orgId, role, email, ip, ua, existingFamilyId) {
        const payload = { sub: userId, orgId, role, email };
        const accessToken = this.jwt.sign(payload, {
            expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
            algorithm: 'RS256',
        });
        const rawRefreshToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = this.hashToken(rawRefreshToken);
        const familyId = existingFamilyId ?? (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + this.parseExpiry(this.config.get('JWT_REFRESH_EXPIRY', '7d')));
        await this.prisma.refreshToken.create({
            data: {
                userId,
                organizationId: orgId,
                tokenHash,
                familyId,
                expiresAt,
                ipAddress: ip ?? null,
                userAgent: ua ?? null,
            },
        });
        return { accessToken, refreshToken: rawRefreshToken };
    }
    hashToken(raw) {
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
    slugify(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 63);
    }
    parseExpiry(expiry) {
        const unit = expiry.slice(-1);
        const value = parseInt(expiry.slice(0, -1), 10);
        const map = {
            s: 1_000,
            m: 60_000,
            h: 3_600_000,
            d: 86_400_000,
        };
        return value * (map[unit] ?? 86_400_000);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map