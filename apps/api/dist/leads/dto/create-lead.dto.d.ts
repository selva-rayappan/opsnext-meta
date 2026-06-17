import { LeadStatus } from '@prisma/client';
export declare class CreateLeadDto {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    status?: LeadStatus;
    score?: number;
    ownerId?: string;
    notes?: string;
}
