import { LeadStatus } from '@prisma/client';
export declare class ListLeadsQueryDto {
    page: number;
    limit: number;
    q?: string;
    status?: LeadStatus;
    ownerId?: string;
    sortBy: 'firstName' | 'lastName' | 'email' | 'company' | 'score' | 'createdAt';
    order: 'asc' | 'desc';
}
