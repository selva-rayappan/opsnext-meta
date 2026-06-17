import { ActivityType } from '@prisma/client';
export declare class CreateActivityDto {
    type: ActivityType;
    subject: string;
    body?: string;
    dueAt?: string;
    completedAt?: string;
    duration?: number;
    outcome?: string;
    contactId?: string;
    accountId?: string;
    leadId?: string;
    opportunityId?: string;
}
