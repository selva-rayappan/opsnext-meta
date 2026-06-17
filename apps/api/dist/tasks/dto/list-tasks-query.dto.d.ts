import { TaskStatus, TaskPriority } from '@prisma/client';
export declare class ListTasksQueryDto {
    q?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    contactId?: string;
    accountId?: string;
    leadId?: string;
    opportunityId?: string;
    page: number;
    limit: number;
}
