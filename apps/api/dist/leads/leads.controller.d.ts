import { LeadStatus } from '@prisma/client';
import { UserPayload } from '@opsnext/shared';
import { LeadsService, BulkLeadInput } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
declare class ChangeStatusBody {
    status: LeadStatus;
}
declare class BulkImportBody {
    leads: BulkLeadInput[];
}
export declare class LeadsController {
    private readonly leads;
    constructor(leads: LeadsService);
    findAll(user: UserPayload, query: ListLeadsQueryDto): Promise<import("./leads.service").PaginatedLeads>;
    findOne(id: string, user: UserPayload): Promise<{
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        source: string | null;
        ownerId: string | null;
        notes: string | null;
        company: string | null;
        score: number;
        convertedAt: Date | null;
        convertedContactId: string | null;
        convertedOpportunityId: string | null;
    }>;
    create(dto: CreateLeadDto, user: UserPayload): Promise<{
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        source: string | null;
        ownerId: string | null;
        notes: string | null;
        company: string | null;
        score: number;
        convertedAt: Date | null;
        convertedContactId: string | null;
        convertedOpportunityId: string | null;
    }>;
    bulkImport(dto: BulkImportBody, user: UserPayload): Promise<import("./leads.service").BulkImportResult>;
    update(id: string, dto: UpdateLeadDto, user: UserPayload): Promise<{
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        source: string | null;
        ownerId: string | null;
        notes: string | null;
        company: string | null;
        score: number;
        convertedAt: Date | null;
        convertedContactId: string | null;
        convertedOpportunityId: string | null;
    }>;
    remove(id: string, user: UserPayload): Promise<void>;
    changeStatus(id: string, body: ChangeStatusBody, user: UserPayload): Promise<{
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        source: string | null;
        ownerId: string | null;
        notes: string | null;
        company: string | null;
        score: number;
        convertedAt: Date | null;
        convertedContactId: string | null;
        convertedOpportunityId: string | null;
    }>;
    convert(id: string, dto: ConvertLeadDto, user: UserPayload): Promise<{
        lead: import("./leads.service").LeadRow;
        contact: import("@prisma/client").Prisma.ContactGetPayload<Record<string, never>>;
        opportunity?: any;
    }>;
}
export {};
