import { Prisma, LeadStatus } from '@prisma/client';
import { Role } from '@opsnext/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
export type LeadRow = Prisma.LeadGetPayload<{
    include: {
        owner: {
            select: {
                id: true;
                firstName: true;
                lastName: true;
            };
        };
    };
}>;
export interface PaginatedLeads {
    data: LeadRow[];
    total: number;
    page: number;
    limit: number;
}
export interface BulkImportResult {
    created: number;
    skipped: number;
    errors: Array<{
        index: number;
        reason: string;
    }>;
}
export interface BulkLeadInput {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    score?: number;
    notes?: string;
    ownerId?: string;
    status?: LeadStatus;
}
export declare class LeadsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string, query: ListLeadsQueryDto, userRole: Role, userId: string): Promise<PaginatedLeads>;
    findById(id: string, orgId: string): Promise<LeadRow>;
    create(dto: CreateLeadDto, actorId: string, orgId: string): Promise<LeadRow>;
    update(id: string, dto: UpdateLeadDto, actorId: string, orgId: string): Promise<LeadRow>;
    delete(id: string, actorId: string, orgId: string): Promise<void>;
    changeStatus(id: string, status: LeadStatus, actorId: string, orgId: string): Promise<LeadRow>;
    convert(id: string, dto: ConvertLeadDto, actorId: string, orgId: string): Promise<{
        lead: LeadRow;
        contact: Prisma.ContactGetPayload<Record<string, never>>;
        opportunity?: any;
    }>;
    bulkImport(leads: BulkLeadInput[], actorId: string, orgId: string): Promise<BulkImportResult>;
}
