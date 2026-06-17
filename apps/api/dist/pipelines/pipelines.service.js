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
exports.PipelinesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let PipelinesService = class PipelinesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(orgId) {
        return this.prisma.pipeline.findMany({
            where: { organizationId: orgId },
            orderBy: { name: 'asc' },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }
    async findById(id, orgId) {
        const pipeline = await this.prisma.pipeline.findFirst({
            where: { id, organizationId: orgId },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!pipeline) {
            throw new common_1.NotFoundException(`Pipeline ${id} not found`);
        }
        return pipeline;
    }
    async create(dto, actorId, orgId) {
        const duplicate = await this.prisma.pipeline.findFirst({
            where: { organizationId: orgId, name: dto.name },
        });
        if (duplicate) {
            throw new common_1.ConflictException(`Pipeline with name "${dto.name}" already exists`);
        }
        const count = await this.prisma.pipeline.count({
            where: { organizationId: orgId },
        });
        const isDefault = count === 0 ? true : dto.isDefault ?? false;
        const pipeline = await this.prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.pipeline.updateMany({
                    where: { organizationId: orgId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.pipeline.create({
                data: {
                    organizationId: orgId,
                    name: dto.name,
                    isDefault,
                },
                include: { stages: true },
            });
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_CREATED',
            entityType: 'Pipeline',
            entityId: pipeline.id,
            after: { name: pipeline.name, isDefault: pipeline.isDefault },
        });
        return pipeline;
    }
    async update(id, dto, actorId, orgId) {
        const existing = await this.findById(id, orgId);
        if (dto.name && dto.name !== existing.name) {
            const duplicate = await this.prisma.pipeline.findFirst({
                where: { organizationId: orgId, name: dto.name, NOT: { id } },
            });
            if (duplicate) {
                throw new common_1.ConflictException(`Pipeline with name "${dto.name}" already exists`);
            }
        }
        const pipeline = await this.prisma.$transaction(async (tx) => {
            if (dto.isDefault === true && !existing.isDefault) {
                await tx.pipeline.updateMany({
                    where: { organizationId: orgId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.pipeline.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
                },
                include: {
                    stages: {
                        orderBy: { order: 'asc' },
                    },
                },
            });
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_UPDATED',
            entityType: 'Pipeline',
            entityId: id,
            before: { name: existing.name, isDefault: existing.isDefault },
            after: { name: pipeline.name, isDefault: pipeline.isDefault },
        });
        return pipeline;
    }
    async delete(id, actorId, orgId) {
        const existing = await this.findById(id, orgId);
        if (existing.isDefault) {
            throw new common_1.BadRequestException('Cannot delete the default pipeline');
        }
        const oppCount = await this.prisma.opportunity.count({
            where: { pipelineId: id, organizationId: orgId },
        });
        if (oppCount > 0) {
            throw new common_1.BadRequestException('Cannot delete pipeline that contains opportunities');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.stage.deleteMany({
                where: { pipelineId: id },
            });
            await tx.pipeline.delete({
                where: { id },
            });
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_DELETED',
            entityType: 'Pipeline',
            entityId: id,
            before: { name: existing.name },
        });
    }
    async createStage(pipelineId, dto, actorId, orgId) {
        await this.findById(pipelineId, orgId);
        const duplicate = await this.prisma.stage.findFirst({
            where: { pipelineId, name: dto.name },
        });
        if (duplicate) {
            throw new common_1.ConflictException(`Stage with name "${dto.name}" already exists in this pipeline`);
        }
        const count = await this.prisma.stage.count({
            where: { pipelineId },
        });
        const stage = await this.prisma.stage.create({
            data: {
                organizationId: orgId,
                pipelineId,
                name: dto.name,
                probability: dto.probability ?? 50,
                stageType: dto.stageType ?? 'OPEN',
                order: count,
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_STAGE_CREATED',
            entityType: 'Stage',
            entityId: stage.id,
            after: {
                pipelineId,
                name: stage.name,
                probability: stage.probability,
                stageType: stage.stageType,
                order: stage.order,
            },
        });
        return stage;
    }
    async updateStage(pipelineId, stageId, dto, actorId, orgId) {
        await this.findById(pipelineId, orgId);
        const existing = await this.prisma.stage.findFirst({
            where: { id: stageId, pipelineId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Stage ${stageId} not found in pipeline ${pipelineId}`);
        }
        if (dto.name && dto.name !== existing.name) {
            const duplicate = await this.prisma.stage.findFirst({
                where: { pipelineId, name: dto.name, NOT: { id: stageId } },
            });
            if (duplicate) {
                throw new common_1.ConflictException(`Stage with name "${dto.name}" already exists in this pipeline`);
            }
        }
        const stage = await this.prisma.stage.update({
            where: { id: stageId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.probability !== undefined && { probability: dto.probability }),
                ...(dto.stageType !== undefined && { stageType: dto.stageType }),
            },
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_STAGE_UPDATED',
            entityType: 'Stage',
            entityId: stageId,
            before: {
                name: existing.name,
                probability: existing.probability,
                stageType: existing.stageType,
            },
            after: {
                name: stage.name,
                probability: stage.probability,
                stageType: stage.stageType,
            },
        });
        return stage;
    }
    async deleteStage(pipelineId, stageId, actorId, orgId) {
        await this.findById(pipelineId, orgId);
        const existing = await this.prisma.stage.findFirst({
            where: { id: stageId, pipelineId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Stage ${stageId} not found in pipeline ${pipelineId}`);
        }
        const oppCount = await this.prisma.opportunity.count({
            where: { stageId, organizationId: orgId },
        });
        if (oppCount > 0) {
            throw new common_1.BadRequestException('Cannot delete stage containing opportunities');
        }
        const siblingStages = await this.prisma.stage.findMany({
            where: { pipelineId },
            orderBy: { order: 'asc' },
        });
        if (siblingStages.length <= 1) {
            throw new common_1.BadRequestException('Cannot delete the only stage in a pipeline');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.stage.delete({
                where: { id: stageId },
            });
            const remaining = siblingStages.filter((s) => s.id !== stageId);
            for (let i = 0; i < remaining.length; i++) {
                if (remaining[i].order !== i) {
                    await tx.stage.update({
                        where: { id: remaining[i].id },
                        data: { order: i },
                    });
                }
            }
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_STAGE_DELETED',
            entityType: 'Stage',
            entityId: stageId,
            before: { name: existing.name, pipelineId },
        });
    }
    async reorderStages(pipelineId, stageIds, actorId, orgId) {
        await this.findById(pipelineId, orgId);
        const siblingStages = await this.prisma.stage.findMany({
            where: { pipelineId },
            select: { id: true },
        });
        const siblingIds = siblingStages.map((s) => s.id);
        if (stageIds.length !== siblingIds.length ||
            !stageIds.every((id) => siblingIds.includes(id))) {
            throw new common_1.BadRequestException('Provided IDs do not match the stages in this pipeline');
        }
        await this.prisma.$transaction(async (tx) => {
            for (let i = 0; i < stageIds.length; i++) {
                await tx.stage.update({
                    where: { id: stageIds[i] },
                    data: { order: i },
                });
            }
        });
        await this.audit.log({
            organizationId: orgId,
            actorId,
            action: 'PIPELINE_STAGES_REORDERED',
            entityType: 'Pipeline',
            entityId: pipelineId,
            after: { order: stageIds },
        });
        return this.prisma.stage.findMany({
            where: { pipelineId },
            orderBy: { order: 'asc' },
        });
    }
};
exports.PipelinesService = PipelinesService;
exports.PipelinesService = PipelinesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PipelinesService);
//# sourceMappingURL=pipelines.service.js.map