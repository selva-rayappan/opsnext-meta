import { OpportunityStatus } from '@prisma/client';
export declare class ListOpportunitiesQueryDto {
    page: number;
    limit: number;
    q?: string;
    status?: OpportunityStatus;
    pipelineId?: string;
    stageId?: string;
    ownerId?: string;
    sortBy: 'name' | 'amount' | 'closeDate' | 'createdAt' | 'probability';
    order: 'asc' | 'desc';
}
