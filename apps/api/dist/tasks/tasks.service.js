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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let TasksService = class TasksService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId, query, role, userId) {
        const where = {
            organizationId: orgId,
        };
        if (role === client_1.Role.SALES_REP) {
            where.OR = [
                { assigneeId: userId },
                { createdById: userId },
            ];
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.priority) {
            where.priority = query.priority;
        }
        if (query.assigneeId) {
            where.assigneeId = query.assigneeId;
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
                ...(where.OR || []),
                { title: { contains: query.q, mode: 'insensitive' } },
                { description: { contains: query.q, mode: 'insensitive' } },
            ];
        }
        const skip = (query.page - 1) * query.limit;
        const take = query.limit;
        const [total, items] = await Promise.all([
            this.prisma.task.count({ where }),
            this.prisma.task.findMany({
                where,
                skip,
                take,
                orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
                include: {
                    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                    createdBy: { select: { id: true, firstName: true, lastName: true } },
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
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: orgId },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
                account: { select: { id: true, name: true } },
                lead: { select: { id: true, firstName: true, lastName: true } },
                opportunity: { select: { id: true, name: true } },
            },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (role === client_1.Role.SALES_REP && task.assigneeId !== userId && task.createdById !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this task');
        }
        return task;
    }
    async create(dto, creatorId, orgId) {
        const assignee = await this.prisma.user.findFirst({
            where: { id: dto.assigneeId, organizationId: orgId },
        });
        if (!assignee) {
            throw new common_1.NotFoundException(`Assignee ${dto.assigneeId} not found in your organization`);
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
        const task = await this.prisma.task.create({
            data: {
                organizationId: orgId,
                createdById: creatorId,
                title: dto.title,
                description: dto.description ?? null,
                dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
                priority: dto.priority,
                status: client_1.TaskStatus.OPEN,
                assigneeId: dto.assigneeId,
                contactId: dto.contactId ?? null,
                accountId: dto.accountId ?? null,
                leadId: dto.leadId ?? null,
                opportunityId: dto.opportunityId ?? null,
            },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId: creatorId,
            actorRole: client_1.Role.SALES_REP,
            action: 'task.create',
            entityType: 'Task',
            entityId: task.id,
            after: task,
        });
        return task;
    }
    async update(id, dto, userId, orgId, role) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (role === client_1.Role.SALES_REP && task.assigneeId !== userId && task.createdById !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to update this task');
        }
        const data = {};
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.dueAt !== undefined)
            data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
        if (dto.priority !== undefined)
            data.priority = dto.priority;
        if (dto.status !== undefined) {
            data.status = dto.status;
            if (dto.status === client_1.TaskStatus.COMPLETED && task.status !== client_1.TaskStatus.COMPLETED) {
                data.completedAt = new Date();
            }
            else if (dto.status !== client_1.TaskStatus.COMPLETED) {
                data.completedAt = null;
            }
        }
        if (dto.assigneeId !== undefined) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assigneeId, organizationId: orgId },
            });
            if (!assignee) {
                throw new common_1.NotFoundException(`Assignee ${dto.assigneeId} not found in organization`);
            }
            data.assigneeId = dto.assigneeId;
        }
        if (dto.contactId !== undefined)
            data.contactId = dto.contactId;
        if (dto.accountId !== undefined)
            data.accountId = dto.accountId;
        if (dto.leadId !== undefined)
            data.leadId = dto.leadId;
        if (dto.opportunityId !== undefined)
            data.opportunityId = dto.opportunityId;
        const updatedTask = await this.prisma.task.update({
            where: { id },
            data,
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId: userId,
            actorRole: role,
            action: 'task.update',
            entityType: 'Task',
            entityId: id,
            before: task,
            after: updatedTask,
        });
        return updatedTask;
    }
    async delete(id, userId, orgId, role) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (role === client_1.Role.SALES_REP && task.createdById !== userId) {
            throw new common_1.ForbiddenException('You can only delete tasks you created');
        }
        await this.prisma.task.delete({
            where: { id },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId: userId,
            actorRole: role,
            action: 'task.delete',
            entityType: 'Task',
            entityId: id,
            before: task,
        });
        return { success: true };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map