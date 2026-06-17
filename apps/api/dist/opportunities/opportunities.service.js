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
exports.OpportunitiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let OpportunitiesService = class OpportunitiesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    serializeOpportunity(opp) {
        if (!opp)
            return opp;
        return {
            ...opp,
            amount: opp.amount !== null ? Number(opp.amount) / 100 : null,
        };
    }
    async findAll(orgId, query, userRole, userId) {
        const where = {
            organizationId: orgId,
        };
        if (userRole === client_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        if (query.q) {
            where.name = { contains: query.q, mode: 'insensitive' };
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.pipelineId) {
            where.pipelineId = query.pipelineId;
        }
        if (query.stageId) {
            where.stageId = query.stageId;
        }
        if (query.ownerId) {
            where.ownerId = query.ownerId;
        }
        const skip = (query.page - 1) * query.limit;
        const take = query.limit;
        const orderBy = {};
        if (query.sortBy === 'amount') {
            orderBy.amount = query.order;
        }
        else if (query.sortBy === 'closeDate') {
            orderBy.closeDate = query.order;
        }
        else if (query.sortBy === 'probability') {
            orderBy.probability = query.order;
        }
        else if (query.sortBy === 'name') {
            orderBy.name = query.order;
        }
        else {
            orderBy.createdAt = query.order;
        }
        const [total, items] = await Promise.all([
            this.prisma.opportunity.count({ where }),
            this.prisma.opportunity.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    stage: true,
                    pipeline: true,
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
        ]);
        const data = items.map((opp) => this.serializeOpportunity(opp));
        return {
            data,
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                pages: Math.ceil(total / query.limit),
            },
        };
    }
    async findById(id, orgId) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: { id, organizationId: orgId },
            include: {
                stage: true,
                pipeline: true,
                contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                account: { select: { id: true, name: true, website: true } },
                owner: { select: { id: true, firstName: true, lastName: true } },
                stageHistory: {
                    orderBy: { changedAt: 'desc' },
                    include: {
                        fromStage: true,
                        toStage: true,
                        changedBy: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (!opportunity) {
            throw new common_1.NotFoundException(`Opportunity ${id} not found`);
        }
        return this.serializeOpportunity(opportunity);
    }
    async create(dto, actorId, orgId) {
        const pipeline = await this.prisma.pipeline.findFirst({
            where: { id: dto.pipelineId, organizationId: orgId },
        });
        if (!pipeline) {
            throw new common_1.NotFoundException(`Pipeline ${dto.pipelineId} not found`);
        }
        const stage = await this.prisma.stage.findFirst({
            where: { id: dto.stageId, pipelineId: dto.pipelineId },
        });
        if (!stage) {
            throw new common_1.NotFoundException(`Stage ${dto.stageId} not found in pipeline ${dto.pipelineId}`);
        }
        if (dto.contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: { id: dto.contactId, organizationId: orgId },
            });
            if (!contact) {
                throw new common_1.NotFoundException(`Contact ${dto.contactId} not found`);
            }
        }
        if (dto.accountId) {
            const account = await this.prisma.account.findFirst({
                where: { id: dto.accountId, organizationId: orgId },
            });
            if (!account) {
                throw new common_1.NotFoundException(`Account ${dto.accountId} not found`);
            }
        }
        if (dto.ownerId) {
            const owner = await this.prisma.user.findFirst({
                where: { id: dto.ownerId, organizationId: orgId },
            });
            if (!owner) {
                throw new common_1.NotFoundException(`Owner user ${dto.ownerId} not found`);
            }
        }
        const ownerId = dto.ownerId ?? actorId;
        const probability = dto.probability ?? stage.probability;
        const centsAmount = dto.amount !== undefined ? BigInt(Math.round(dto.amount * 100)) : null;
        let status = client_1.OpportunityStatus.OPEN;
        let wonAt = null;
        let lostAt = null;
        if (stage.stageType === client_1.StageType.WON) {
            status = client_1.OpportunityStatus.WON;
            wonAt = new Date();
        }
        else if (stage.stageType === client_1.StageType.LOST) {
            status = client_1.OpportunityStatus.LOST;
            lostAt = new Date();
        }
        const opportunity = await this.prisma.$transaction(async (tx) => {
            const opp = await tx.opportunity.create({
                data: {
                    organizationId: orgId,
                    name: dto.name,
                    amount: centsAmount,
                    currency: dto.currency ?? 'USD',
                    closeDate: new Date(dto.closeDate),
                    pipelineId: dto.pipelineId,
                    stageId: dto.stageId,
                    contactId: dto.contactId ?? null,
                    accountId: dto.accountId ?? null,
                    ownerId,
                    probability,
                    status,
                    wonAt,
                    lostAt,
                },
                include: {
                    stage: true,
                    pipeline: true,
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            await tx.stageHistory.create({
                data: {
                    organizationId: orgId,
                    opportunityId: opp.id,
                    fromStageId: null,
                    toStageId: dto.stageId,
                    changedById: actorId,
                },
            });
            return opp;
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'OPPORTUNITY_CREATED',
            entityType: 'Opportunity',
            entityId: opportunity.id,
            after: {
                name: opportunity.name,
                amount: dto.amount,
                stageId: opportunity.stageId,
                pipelineId: opportunity.pipelineId,
                ownerId: opportunity.ownerId,
                status: opportunity.status,
            },
        });
        return this.serializeOpportunity(opportunity);
    }
    async update(id, dto, actorId, orgId) {
        const existing = await this.prisma.opportunity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Opportunity ${id} not found`);
        }
        const pipelineId = dto.pipelineId ?? existing.pipelineId;
        const stageId = dto.stageId ?? existing.stageId;
        if (dto.pipelineId && dto.pipelineId !== existing.pipelineId) {
            const pipeline = await this.prisma.pipeline.findFirst({
                where: { id: dto.pipelineId, organizationId: orgId },
            });
            if (!pipeline) {
                throw new common_1.NotFoundException(`Pipeline ${dto.pipelineId} not found`);
            }
        }
        let targetStage = null;
        if (stageId !== existing.stageId || dto.pipelineId !== existing.pipelineId) {
            targetStage = await this.prisma.stage.findFirst({
                where: { id: stageId, pipelineId },
            });
            if (!targetStage) {
                throw new common_1.NotFoundException(`Stage ${stageId} not found in pipeline ${pipelineId}`);
            }
        }
        if (dto.contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: { id: dto.contactId, organizationId: orgId },
            });
            if (!contact) {
                throw new common_1.NotFoundException(`Contact ${dto.contactId} not found`);
            }
        }
        if (dto.accountId) {
            const account = await this.prisma.account.findFirst({
                where: { id: dto.accountId, organizationId: orgId },
            });
            if (!account) {
                throw new common_1.NotFoundException(`Account ${dto.accountId} not found`);
            }
        }
        if (dto.ownerId) {
            const owner = await this.prisma.user.findFirst({
                where: { id: dto.ownerId, organizationId: orgId },
            });
            if (!owner) {
                throw new common_1.NotFoundException(`Owner user ${dto.ownerId} not found`);
            }
        }
        const centsAmount = dto.amount !== undefined ? (dto.amount !== null ? BigInt(Math.round(dto.amount * 100)) : null) : undefined;
        const probability = dto.probability !== undefined ? dto.probability : (targetStage ? targetStage.probability : undefined);
        let status = undefined;
        let wonAt = undefined;
        let lostAt = undefined;
        let lostReason = undefined;
        if (targetStage) {
            if (targetStage.stageType === client_1.StageType.WON) {
                status = client_1.OpportunityStatus.WON;
                wonAt = new Date();
                lostAt = null;
                lostReason = null;
            }
            else if (targetStage.stageType === client_1.StageType.LOST) {
                status = client_1.OpportunityStatus.LOST;
                lostAt = new Date();
                lostReason = 'Stage transition to Lost';
                wonAt = null;
            }
            else {
                status = client_1.OpportunityStatus.OPEN;
                wonAt = null;
                lostAt = null;
                lostReason = null;
            }
        }
        const opportunity = await this.prisma.$transaction(async (tx) => {
            const opp = await tx.opportunity.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(centsAmount !== undefined && { amount: centsAmount }),
                    ...(dto.currency !== undefined && { currency: dto.currency }),
                    ...(dto.closeDate !== undefined && { closeDate: new Date(dto.closeDate) }),
                    ...(dto.pipelineId !== undefined && { pipelineId: dto.pipelineId }),
                    ...(dto.stageId !== undefined && { stageId: dto.stageId }),
                    ...(dto.contactId !== undefined && { contactId: dto.contactId }),
                    ...(dto.accountId !== undefined && { accountId: dto.accountId }),
                    ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
                    ...(probability !== undefined && { probability }),
                    ...(status !== undefined && { status }),
                    ...(wonAt !== undefined && { wonAt }),
                    ...(lostAt !== undefined && { lostAt }),
                    ...(lostReason !== undefined && { lostReason }),
                },
                include: {
                    stage: true,
                    pipeline: true,
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (targetStage) {
                await tx.stageHistory.create({
                    data: {
                        organizationId: orgId,
                        opportunityId: id,
                        fromStageId: existing.stageId,
                        toStageId: dto.stageId,
                        changedById: actorId,
                    },
                });
            }
            return opp;
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'OPPORTUNITY_UPDATED',
            entityType: 'Opportunity',
            entityId: id,
            before: {
                name: existing.name,
                stageId: existing.stageId,
                amount: existing.amount !== null ? Number(existing.amount) / 100 : null,
                status: existing.status,
            },
            after: {
                name: opportunity.name,
                stageId: opportunity.stageId,
                amount: opportunity.amount !== null ? Number(opportunity.amount) / 100 : null,
                status: opportunity.status,
            },
        });
        return this.serializeOpportunity(opportunity);
    }
    async changeStage(id, stageId, actorId, orgId) {
        const existing = await this.prisma.opportunity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Opportunity ${id} not found`);
        }
        if (existing.stageId === stageId) {
            return this.findById(id, orgId);
        }
        const targetStage = await this.prisma.stage.findFirst({
            where: { id: stageId, pipelineId: existing.pipelineId },
        });
        if (!targetStage) {
            throw new common_1.NotFoundException(`Stage ${stageId} not found in pipeline ${existing.pipelineId}`);
        }
        let status = client_1.OpportunityStatus.OPEN;
        let wonAt = null;
        let lostAt = null;
        let lostReason = null;
        if (targetStage.stageType === client_1.StageType.WON) {
            status = client_1.OpportunityStatus.WON;
            wonAt = new Date();
        }
        else if (targetStage.stageType === client_1.StageType.LOST) {
            status = client_1.OpportunityStatus.LOST;
            lostAt = new Date();
            lostReason = 'Stage transition to Lost';
        }
        const opportunity = await this.prisma.$transaction(async (tx) => {
            const opp = await tx.opportunity.update({
                where: { id },
                data: {
                    stageId,
                    probability: targetStage.probability,
                    status,
                    wonAt,
                    lostAt,
                    lostReason,
                },
                include: {
                    stage: true,
                    pipeline: true,
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            await tx.stageHistory.create({
                data: {
                    organizationId: orgId,
                    opportunityId: id,
                    fromStageId: existing.stageId,
                    toStageId: stageId,
                    changedById: actorId,
                },
            });
            return opp;
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'OPPORTUNITY_STAGE_CHANGED',
            entityType: 'Opportunity',
            entityId: id,
            before: { stageId: existing.stageId, status: existing.status },
            after: { stageId: opportunity.stageId, status: opportunity.status },
        });
        return this.serializeOpportunity(opportunity);
    }
    async markWon(id, dto, actorId, orgId) {
        const existing = await this.prisma.opportunity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Opportunity ${id} not found`);
        }
        const wonStage = await this.prisma.stage.findFirst({
            where: { pipelineId: existing.pipelineId, stageType: client_1.StageType.WON },
        });
        if (!wonStage) {
            throw new common_1.BadRequestException('No WON stage found in this pipeline. Please configure a stage of type WON first.');
        }
        const opportunity = await this.prisma.$transaction(async (tx) => {
            const opp = await tx.opportunity.update({
                where: { id },
                data: {
                    stageId: wonStage.id,
                    probability: 100,
                    status: client_1.OpportunityStatus.WON,
                    wonAt: dto.wonAt ? new Date(dto.wonAt) : new Date(),
                    lostAt: null,
                    lostReason: null,
                },
                include: {
                    stage: true,
                    pipeline: true,
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (existing.stageId !== wonStage.id) {
                await tx.stageHistory.create({
                    data: {
                        organizationId: orgId,
                        opportunityId: id,
                        fromStageId: existing.stageId,
                        toStageId: wonStage.id,
                        changedById: actorId,
                    },
                });
            }
            return opp;
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'OPPORTUNITY_MARKED_WON',
            entityType: 'Opportunity',
            entityId: id,
            before: { status: existing.status, stageId: existing.stageId },
            after: { status: opportunity.status, stageId: opportunity.stageId },
        });
        return this.serializeOpportunity(opportunity);
    }
    async markLost(id, dto, actorId, orgId) {
        const existing = await this.prisma.opportunity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Opportunity ${id} not found`);
        }
        const lostStage = await this.prisma.stage.findFirst({
            where: { pipelineId: existing.pipelineId, stageType: client_1.StageType.LOST },
        });
        if (!lostStage) {
            throw new common_1.BadRequestException('No LOST stage found in this pipeline. Please configure a stage of type LOST first.');
        }
        const opportunity = await this.prisma.$transaction(async (tx) => {
            const opp = await tx.opportunity.update({
                where: { id },
                data: {
                    stageId: lostStage.id,
                    probability: 0,
                    status: client_1.OpportunityStatus.LOST,
                    lostAt: new Date(),
                    lostReason: dto.lostReason,
                    wonAt: null,
                },
                include: {
                    stage: true,
                    pipeline: true,
                    contact: { select: { id: true, firstName: true, lastName: true } },
                    account: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            if (existing.stageId !== lostStage.id) {
                await tx.stageHistory.create({
                    data: {
                        organizationId: orgId,
                        opportunityId: id,
                        fromStageId: existing.stageId,
                        toStageId: lostStage.id,
                        changedById: actorId,
                    },
                });
            }
            return opp;
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'OPPORTUNITY_MARKED_LOST',
            entityType: 'Opportunity',
            entityId: id,
            before: { status: existing.status, stageId: existing.stageId },
            after: { status: opportunity.status, stageId: opportunity.stageId },
        });
        return this.serializeOpportunity(opportunity);
    }
    async delete(id, actorId, orgId) {
        const existing = await this.prisma.opportunity.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Opportunity ${id} not found`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.stageHistory.deleteMany({
                where: { opportunityId: id },
            });
            await tx.opportunity.delete({
                where: { id },
            });
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'OPPORTUNITY_DELETED',
            entityType: 'Opportunity',
            entityId: id,
            before: { name: existing.name },
        });
    }
    async getForecast(orgId, query, userRole, userId) {
        const where = {
            organizationId: orgId,
            status: { in: [client_1.OpportunityStatus.OPEN, client_1.OpportunityStatus.WON] },
        };
        if (userRole === client_1.Role.SALES_REP) {
            where.ownerId = userId;
        }
        if (query.pipelineId) {
            where.pipelineId = query.pipelineId;
        }
        if (query.startDate || query.endDate) {
            where.closeDate = {};
            if (query.startDate) {
                where.closeDate.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.closeDate.lte = new Date(query.endDate);
            }
        }
        const items = await this.prisma.opportunity.findMany({
            where,
            select: {
                amount: true,
                probability: true,
                closeDate: true,
            },
        });
        let totalValue = 0;
        let expectedValue = 0;
        const monthlyMap = new Map();
        for (const item of items) {
            if (item.amount === null)
                continue;
            const dollarVal = Number(item.amount) / 100;
            const weightedVal = dollarVal * (item.probability / 100);
            totalValue += dollarVal;
            expectedValue += weightedVal;
            const dateObj = new Date(item.closeDate);
            const year = dateObj.getFullYear();
            const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${monthStr}`;
            const existingGroup = monthlyMap.get(key) || { totalValue: 0, expectedValue: 0, count: 0 };
            existingGroup.totalValue += dollarVal;
            existingGroup.expectedValue += weightedVal;
            existingGroup.count += 1;
            monthlyMap.set(key, existingGroup);
        }
        const monthly = Array.from(monthlyMap.entries())
            .map(([month, group]) => ({
            month,
            count: group.count,
            totalValue: group.totalValue,
            expectedValue: group.expectedValue,
        }))
            .sort((a, b) => a.month.localeCompare(b.month));
        return {
            summary: {
                totalValue,
                expectedValue,
                count: items.length,
            },
            monthly,
        };
    }
};
exports.OpportunitiesService = OpportunitiesService;
exports.OpportunitiesService = OpportunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], OpportunitiesService);
//# sourceMappingURL=opportunities.service.js.map