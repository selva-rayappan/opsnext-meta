"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const ACCOUNT_INCLUDE = {
    owner: { select: { id: true, firstName: true, lastName: true } },
    contactLinks: {
        include: {
            contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    },
    tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
};
let AccountsService = class AccountsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId, query) {
        const { page, limit, q, isActive, ownerId, sortBy, order } = query;
        const where = { organizationId: orgId };
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (ownerId !== undefined) {
            where.ownerId = ownerId;
        }
        if (q && q.trim().length > 0) {
            const term = q.trim();
            where.OR = [
                { name: { contains: term, mode: 'insensitive' } },
                { domain: { contains: term, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.account.findMany({
                where,
                orderBy: { [sortBy]: order },
                skip: (page - 1) * limit,
                take: limit,
                include: ACCOUNT_INCLUDE,
            }),
            this.prisma.account.count({ where }),
        ]);
        return { data: data, total, page, limit };
    }
    async findById(id, orgId) {
        const account = await this.prisma.account.findFirst({
            where: { id, organizationId: orgId },
            include: ACCOUNT_INCLUDE,
        });
        if (!account) {
            throw new common_1.NotFoundException(`Account ${id} not found`);
        }
        return account;
    }
    async create(dto, actorId, orgId) {
        const account = await this.prisma.account.create({
            data: {
                organizationId: orgId,
                name: dto.name,
                domain: dto.domain ?? null,
                industry: dto.industry ?? null,
                employeeCount: dto.employeeCount ?? null,
                website: dto.website ?? null,
                phone: dto.phone ?? null,
                notes: dto.notes ?? null,
                ownerId: dto.ownerId ?? null,
            },
            include: ACCOUNT_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'ACCOUNT_CREATED',
            entityType: 'Account',
            entityId: account.id,
            after: { name: account.name, domain: account.domain },
        });
        return account;
    }
    async update(id, dto, actorId, orgId) {
        const existing = await this.findById(id, orgId);
        const before = {
            name: existing.name,
            domain: existing.domain,
            industry: existing.industry,
            employeeCount: existing.employeeCount,
            website: existing.website,
            phone: existing.phone,
            ownerId: existing.ownerId,
        };
        const account = await this.prisma.account.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.domain !== undefined && { domain: dto.domain }),
                ...(dto.industry !== undefined && { industry: dto.industry }),
                ...(dto.employeeCount !== undefined && { employeeCount: dto.employeeCount }),
                ...(dto.website !== undefined && { website: dto.website }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
            },
            include: ACCOUNT_INCLUDE,
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'ACCOUNT_UPDATED',
            entityType: 'Account',
            entityId: id,
            before,
            after: {
                name: account.name,
                domain: account.domain,
                industry: account.industry,
                employeeCount: account.employeeCount,
                website: account.website,
                phone: account.phone,
                ownerId: account.ownerId,
            },
        });
        return account;
    }
    async softDelete(id, actorId, orgId) {
        await this.findById(id, orgId);
        await this.prisma.account.update({
            where: { id },
            data: { isActive: false },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'ACCOUNT_DELETED',
            entityType: 'Account',
            entityId: id,
            after: { isActive: false },
        });
    }
    async addTag(accountId, tagId, orgId) {
        await this.findById(accountId, orgId);
        const tag = await this.prisma.tag.findFirst({
            where: { id: tagId, organizationId: orgId },
        });
        if (!tag) {
            throw new common_1.NotFoundException(`Tag ${tagId} not found`);
        }
        await this.prisma.accountTag.upsert({
            where: { accountId_tagId: { accountId, tagId } },
            create: { accountId, tagId },
            update: {},
        });
    }
    async removeTag(accountId, tagId, orgId) {
        await this.findById(accountId, orgId);
        await this.prisma.accountTag.deleteMany({
            where: { accountId, tagId },
        });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map