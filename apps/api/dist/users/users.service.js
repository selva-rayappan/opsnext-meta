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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const shared_1 = require("@opsnext/shared");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_prisma_service_1 = require("../prisma/tenant-prisma.service");
const audit_service_1 = require("../audit/audit.service");
const mail_service_1 = require("../mail/mail.service");
const config_1 = require("@nestjs/config");
const BCRYPT_ROUNDS = 12;
const INVITE_EXPIRY_HOURS = 72;
const ROLE_LEVEL = {
    [shared_1.Role.SUPER_ADMIN]: 100,
    [shared_1.Role.ADMIN]: 80,
    [shared_1.Role.SALES_MANAGER]: 60,
    [shared_1.Role.SALES_REP]: 40,
    [shared_1.Role.READ_ONLY]: 20,
};
function withTenant(orgId, fn) {
    return new Promise((resolve, reject) => {
        tenant_prisma_service_1.TenantContext.run({ organizationId: orgId }, () => {
            fn().then(resolve).catch(reject);
        });
    });
}
let UsersService = class UsersService {
    constructor(tenantPrisma, prisma, audit, mail, config) {
        this.tenantPrisma = tenantPrisma;
        this.prisma = prisma;
        this.audit = audit;
        this.mail = mail;
        this.config = config;
    }
    async findAll(orgId, query) {
        const { page, limit, isActive, role, sortBy, order } = query;
        const where = {};
        if (isActive !== undefined)
            where['isActive'] = isActive;
        if (role !== undefined)
            where['role'] = role;
        return withTenant(orgId, async () => {
            const [users, total] = await Promise.all([
                this.tenantPrisma.findMany('User', {
                    where,
                    orderBy: { [sortBy]: order },
                    skip: (page - 1) * limit,
                    take: limit,
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }),
                this.tenantPrisma.count('User', { where }),
            ]);
            return { data: await users, total: await total, page, limit };
        });
    }
    async findById(userId, orgId) {
        return withTenant(orgId, async () => {
            const user = (await this.tenantPrisma.findFirst('User', {
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    organizationId: true,
                },
            }));
            if (!user) {
                throw new common_1.NotFoundException(`User ${userId} not found`);
            }
            return user;
        });
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findFirst({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
                passwordHash: true,
                organizationId: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user ?? null;
    }
    async invite(orgId, dto, invitedById) {
        await withTenant(orgId, async () => {
            const existing = await this.tenantPrisma.findFirst('User', {
                where: { email: dto.email.toLowerCase() },
            });
            if (existing) {
                throw new common_1.ConflictException('A user with this email already exists in this organization');
            }
            const existingInvite = await this.tenantPrisma.findFirst('UserInvite', {
                where: {
                    email: dto.email.toLowerCase(),
                    acceptedAt: null,
                    expiresAt: { gt: new Date() },
                },
            });
            if (existingInvite) {
                throw new common_1.ConflictException('A pending invitation already exists for this email');
            }
        });
        const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
        const [inviter, org] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: invitedById },
                select: { firstName: true, lastName: true },
            }),
            this.prisma.organization.findUnique({
                where: { id: orgId },
                select: { name: true },
            }),
        ]);
        await this.prisma.userInvite.create({
            data: {
                organizationId: orgId,
                email: dto.email.toLowerCase(),
                role: dto.role,
                tokenHash,
                expiresAt,
                invitedById,
            },
        });
        const appUrl = this.config.get('APP_URL', 'http://localhost:3000');
        const inviteUrl = `${appUrl}/invite/accept?token=${rawToken}`;
        const inviterName = inviter
            ? `${inviter.firstName} ${inviter.lastName}`.trim()
            : 'An administrator';
        const orgName = org?.name ?? 'your organization';
        await this.mail.sendInvite(dto.email, inviteUrl, orgName, inviterName);
        await this.audit.log({
            organizationId: orgId,
            actorId: invitedById,
            action: 'USER_INVITED',
            entityType: 'UserInvite',
            after: { email: dto.email, role: dto.role },
        });
    }
    async acceptInvite(token, firstName, lastName, password) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        const invite = await this.prisma.userInvite.findFirst({
            where: { tokenHash },
        });
        if (!invite) {
            throw new common_1.BadRequestException('Invalid or expired invitation token');
        }
        if (invite.acceptedAt !== null) {
            throw new common_1.BadRequestException('This invitation has already been used');
        }
        if (invite.expiresAt < new Date()) {
            throw new common_1.BadRequestException('This invitation has expired');
        }
        const existing = await this.prisma.user.findFirst({
            where: { email: invite.email, organizationId: invite.organizationId },
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                organizationId: invite.organizationId,
                email: invite.email,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role: invite.role,
                passwordHash,
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
                organizationId: true,
                createdAt: true,
            },
        });
        await this.prisma.userInvite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
        });
        const org = await this.prisma.organization.findUnique({
            where: { id: invite.organizationId },
            select: { name: true },
        });
        await this.mail.sendWelcome(user.email, user.firstName, org?.name ?? 'your organization');
        await this.audit.log({
            organizationId: invite.organizationId,
            actorId: user.id,
            action: 'USER_INVITE_ACCEPTED',
            entityType: 'User',
            entityId: user.id,
            after: { email: user.email, role: user.role },
        });
        return user;
    }
    async deactivate(userId, actorId, orgId) {
        const user = await this.requireUserInOrg(userId, orgId);
        if (!user.isActive) {
            throw new common_1.BadRequestException('User is already deactivated');
        }
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'USER_DEACTIVATED',
            entityType: 'User',
            entityId: userId,
            before: { isActive: true },
            after: { isActive: false },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    async reactivate(userId, actorId, orgId) {
        const user = await this.requireUserInOrg(userId, orgId);
        if (user.isActive) {
            throw new common_1.BadRequestException('User is already active');
        }
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'USER_REACTIVATED',
            entityType: 'User',
            entityId: userId,
            before: { isActive: false },
            after: { isActive: true },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
        });
    }
    async updateRole(userId, newRole, actorId, orgId) {
        if (userId === actorId) {
            throw new common_1.ForbiddenException('You cannot change your own role');
        }
        if (newRole === shared_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('SUPER_ADMIN role cannot be assigned via this endpoint');
        }
        const [user, actor] = await Promise.all([
            this.requireUserInOrg(userId, orgId),
            this.requireUserInOrg(actorId, orgId),
        ]);
        const actorLevel = ROLE_LEVEL[actor.role] ?? 0;
        const newRoleLevel = ROLE_LEVEL[newRole] ?? 0;
        const targetCurrentLevel = ROLE_LEVEL[user.role] ?? 0;
        if (newRoleLevel >= actorLevel) {
            throw new common_1.ForbiddenException('You cannot promote a user to a role equal to or higher than your own');
        }
        if (targetCurrentLevel >= actorLevel) {
            throw new common_1.ForbiddenException('You cannot change the role of a user with equal or higher privileges');
        }
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'USER_ROLE_UPDATED',
            entityType: 'User',
            entityId: userId,
            before: { role: user.role },
            after: { role: newRole },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });
    }
    async delete(userId, actorId, orgId) {
        if (userId === actorId) {
            throw new common_1.ForbiddenException('You cannot delete your own account');
        }
        const user = await this.requireUserInOrg(userId, orgId);
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: userId,
            before: { email: user.email, role: user.role, isActive: user.isActive },
        });
        await this.prisma.user.delete({ where: { id: userId } });
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, passwordHash: true, organizationId: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.audit.log({
            organizationId: user.organizationId,
            actorId: userId,
            action: 'USER_PASSWORD_CHANGED',
            entityType: 'User',
            entityId: userId,
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    async requireUserInOrg(userId, orgId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, organizationId: orgId },
            select: { id: true, email: true, role: true, isActive: true, organizationId: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${userId} not found in this organization`);
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        mail_service_1.MailService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map