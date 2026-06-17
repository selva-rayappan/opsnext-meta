import { ActivityType } from '@prisma/client';
export declare class ListActivitiesQueryDto {
    q?: string;
    type?: ActivityType;
    contactId?: string;
    accountId?: string;
    leadId?: string;
    opportunityId?: string;
    page: number;
    limit: number;
}
