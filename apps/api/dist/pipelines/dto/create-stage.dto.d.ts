import { StageType } from '@prisma/client';
export declare class CreateStageDto {
    name: string;
    probability?: number;
    stageType?: StageType;
}
