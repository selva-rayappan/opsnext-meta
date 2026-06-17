import { UserPayload } from '@opsnext/shared';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
export declare class PipelinesController {
    private readonly service;
    constructor(service: PipelinesService);
    findAll(user: UserPayload): Promise<({
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
    findOne(id: string, user: UserPayload): Promise<{
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
    create(dto: CreatePipelineDto, user: UserPayload): Promise<{
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
    update(id: string, dto: UpdatePipelineDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<void>;
    createStage(pipelineId: string, dto: CreateStageDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        order: number;
        pipelineId: string;
        probability: number;
        stageType: import("@prisma/client").$Enums.StageType;
    }>;
    updateStage(pipelineId: string, stageId: string, dto: UpdateStageDto, user: UserPayload): Promise<{
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        order: number;
        pipelineId: string;
        probability: number;
        stageType: import("@prisma/client").$Enums.StageType;
    }>;
    deleteStage(pipelineId: string, stageId: string, user: UserPayload): Promise<void>;
    reorderStages(pipelineId: string, dto: ReorderStagesDto, user: UserPayload): Promise<{
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
