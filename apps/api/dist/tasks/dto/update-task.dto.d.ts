import { TaskPriority, TaskStatus } from '@prisma/client';
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    dueAt?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeId?: string;
    contactId?: string;
    accountId?: string;
    leadId?: string;
    opportunityId?: string;
}
