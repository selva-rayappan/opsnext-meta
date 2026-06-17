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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ActivitiesService = class ActivitiesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId, query, role, userId) {
        const where = {
            organizationId: orgId,
        };
        if (role === client_1.Role.SALES_REP) {
            where.userId = userId;
        }
        if (query.type) {
            where.type = query.type;
        }
        if (query.contactId) {
            where.contactId = query.contactId;
        }
        if (query.accountId) {
            where.accountId = query.accountId;
        }
        if (query.leadId) {
            where.leadId = query.leadId;
        }
        if (query.opportunityId) {
            where.opportunityId = query.opportunityId;
        }
        if (query.q) {
            where.OR = [
                { subject: { contains: query.q, mode: 'insensitive' } },
                { body: { contains: query.q, mode: 'insensitive' } },
            ];
        }
        const skip = (query.page - 1) * query.limit;
        const take = query.limit;
        const [total, items] = await Promise.all([
            this.prisma.activity.count({ where }),
            this.prisma.activity.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } },
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    lead: { select: { id: true, firstName: true, lastName: true } },
                    opportunity: { select: { id: true, name: true } },
                },
            }),
        ]);
        return {
            data: items,
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                pages: Math.ceil(total / query.limit),
            },
        };
    }
    async findById(id, orgId, role, userId) {
        const activity = await this.prisma.activity.findFirst({
            where: { id, organizationId: orgId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
                account: { select: { id: true, name: true } },
                lead: { select: { id: true, firstName: true, lastName: true } },
                opportunity: { select: { id: true, name: true } },
            },
        });
        if (!activity) {
            throw new common_1.NotFoundException(`Activity ${id} not found`);
        }
        if (role === client_1.Role.SALES_REP && activity.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this activity');
        }
        return activity;
    }
    async create(dto, userId, orgId) {
        if (!dto.contactId && !dto.accountId && !dto.leadId && !dto.opportunityId) {
            throw new common_1.BadRequestException('Activity must be linked to at least one entity (Contact, Account, Lead, or Opportunity)');
        }
        if (dto.contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: { id: dto.contactId, organizationId: orgId },
            });
            if (!contact)
                throw new common_1.NotFoundException(`Contact ${dto.contactId} not found`);
        }
        if (dto.accountId) {
            const account = await this.prisma.account.findFirst({
                where: { id: dto.accountId, organizationId: orgId },
            });
            if (!account)
                throw new common_1.NotFoundException(`Account ${dto.accountId} not found`);
        }
        if (dto.leadId) {
            const lead = await this.prisma.lead.findFirst({
                where: { id: dto.leadId, organizationId: orgId },
            });
            if (!lead)
                throw new common_1.NotFoundException(`Lead ${dto.leadId} not found`);
        }
        if (dto.opportunityId) {
            const opportunity = await this.prisma.opportunity.findFirst({
                where: { id: dto.opportunityId, organizationId: orgId },
            });
            if (!opportunity)
                throw new common_1.NotFoundException(`Opportunity ${dto.opportunityId} not found`);
        }
        const activity = await this.prisma.activity.create({
            data: {
                organizationId: orgId,
                userId,
                type: dto.type,
                subject: dto.subject,
                body: dto.body,
                dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
                completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
                duration: dto.duration ?? null,
                outcome: dto.outcome ?? null,
                contactId: dto.contactId ?? null,
                accountId: dto.accountId ?? null,
                leadId: dto.leadId ?? null,
                opportunityId: dto.opportunityId ?? null,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId: userId,
            actorRole: client_1.Role.SALES_REP,
            action: 'activity.create',
            entityType: 'Activity',
            entityId: activity.id,
            after: activity,
        });
        return activity;
    }
    async update(id, dto, userId, orgId, role) {
        const activity = await this.prisma.activity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!activity) {
            throw new common_1.NotFoundException(`Activity ${id} not found`);
        }
        if (role === client_1.Role.SALES_REP && activity.userId !== userId) {
            throw new common_1.ForbiddenException('You cannot update an activity that you did not create');
        }
        if (dto.contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: { id: dto.contactId, organizationId: orgId },
            });
            if (!contact)
                throw new common_1.NotFoundException(`Contact ${dto.contactId} not found`);
        }
        if (dto.accountId) {
            const account = await this.prisma.account.findFirst({
                where: { id: dto.accountId, organizationId: orgId },
            });
            if (!account)
                throw new common_1.NotFoundException(`Account ${dto.accountId} not found`);
        }
        const updatedActivity = await this.prisma.activity.update({
            where: { id },
            data: {
                type: dto.type,
                subject: dto.subject,
                body: dto.body,
                dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
                completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
                duration: dto.duration ?? null,
                outcome: dto.outcome ?? null,
                contactId: dto.contactId ?? null,
                accountId: dto.accountId ?? null,
                leadId: dto.leadId ?? null,
                opportunityId: dto.opportunityId ?? null,
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId: userId,
            actorRole: role,
            action: 'activity.update',
            entityType: 'Activity',
            entityId: id,
            before: activity,
            after: updatedActivity,
        });
        return updatedActivity;
    }
    async delete(id, userId, orgId, role) {
        const activity = await this.prisma.activity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!activity) {
            throw new common_1.NotFoundException(`Activity ${id} not found`);
        }
        if (role === client_1.Role.SALES_REP) {
            throw new common_1.ForbiddenException('SALES_REP is not allowed to delete activities');
        }
        await this.prisma.activity.delete({
            where: { id },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId: userId,
            actorRole: role,
            action: 'activity.delete',
            entityType: 'Activity',
            entityId: id,
            before: activity,
        });
        return { success: true };
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map