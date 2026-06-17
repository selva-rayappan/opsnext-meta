import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
export declare class PipelinesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string): Promise<({
        stages: {
            organizationId: string;
            id: string;
            name: string;
            createdAt: Date;
            order: number;
            pipelineId: string;
            probability: number;
            stageType: import("@prisma/client").$Enums.StageType;
        }[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
    })[]>;
    findById(id: string, orgId: string): Promise<{
        stages: {
            organizationId: string;
            id: string;
            name: string;
            createdAt: Date;
            order: number;
            pipelineId: string;
            probability: number;
            stageType: import("@prisma/client").$Enums.StageType;
        }[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
    }>;
    create(dto: CreatePipelineDto, actorId: string, orgId: string): Promise<{
        stages: {
            organizationId: string;
            id: string;
            name: string;
            createdAt: Date;
            order: number;
            pipelineId: string;
            probability: number;
            stageType: import("@prisma/client").$Enums.StageType;
        }[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
    }>;
    update(id: string, dto: UpdatePipelineDto, actorId: string, orgId: string): Promise<{
        stages: {
            organizationId: string;
            id: string;
            name: string;
            createdAt: Date;
            order: number;
            pipelineId: string;
            probability: number;
            stageType: import("@prisma/client").$Enums.StageType;
        }[];
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isDefault: boolean;
    }>;
    delete(id: string, actorId: string, orgId: string): Promise<void>;
    createStage(pipelineId: string, dto: CreateStageDto, actorId: string, orgId: string): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        order: number;
        pipelineId: string;
        probability: number;
        stageType: import("@prisma/client").$Enums.StageType;
    }>;
    updateStage(pipelineId: string, stageId: string, dto: UpdateStageDto, actorId: string, orgId: string): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        order: number;
        pipelineId: string;
        probability: number;
        stageType: import("@prisma/client").$Enums.StageType;
    }>;
    deleteStage(pipelineId: string, stageId: string, actorId: string, orgId: string): Promise<void>;
    reorderStages(pipelineId: string, stageIds: string[], actorId: string, orgId: string): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        order: number;
        pipelineId: string;
        probability: number;
        stageType: import("@prisma/client").$Enums.StageType;
    }[]>;
}
