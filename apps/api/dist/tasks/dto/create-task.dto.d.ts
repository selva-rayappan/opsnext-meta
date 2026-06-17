import { TaskPriority } from '@prisma/client';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    dueAt?: string;
    priority?: TaskPriority;
    assigneeId: string;
    contactId?: string;
    accountId?: string;
    leadId?: string;
    opportunityId?: string;
}
