import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, LeadStatus } from '@prisma/client';
import { Role } from '@opsnext/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a single lead row returned to callers. */
export type LeadRow = Prisma.LeadGetPayload<{
  include: {
    owner: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

/** Paginated list result. */
export interface PaginatedLeads {
  data: LeadRow[];
  total: number;
  page: number;
  limit: number;
}

/** Result from bulkImport. */
export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: Array<{ index: number; reason: string }>;
}

/** Input shape for bulk import rows. */
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Standard include clause reused across read operations. */
const LEAD_INCLUDE = {
  owner: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.LeadInclude;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated, optionally filtered list of leads scoped to the org.
   * SALES_REP users only see their own leads; SALES_MANAGER+ see all org leads.
   */
  async findAll(
    orgId: string,
    query: ListLeadsQueryDto,
    userRole: Role,
    userId: string,
  ): Promise<PaginatedLeads> {
    const { page, limit, q, status, ownerId, sortBy, order } = query;

    const where: Prisma.LeadWhereInput = { organizationId: orgId };

    // RBAC: SALES_REP can only see their own leads
    if (userRole === Role.SALES_REP) {
      where.ownerId = userId;
    } else if (ownerId !== undefined) {
      where.ownerId = ownerId;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (q && q.trim().length > 0) {
      const term = q.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { company: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.LeadOrderByWithRelationInput = { [sortBy]: order };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: LEAD_INCLUDE,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data: data as LeadRow[], total, page, limit };
  }

  /**
   * Returns a single lead by id scoped to the org.
   * Throws NotFoundException if not found.
   */
  async findById(id: string, orgId: string): Promise<LeadRow> {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId: orgId },
      include: LEAD_INCLUDE,
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    return lead as LeadRow;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /** Creates a new lead and fires an audit log entry. */
  async create(dto: CreateLeadDto, actorId: string, orgId: string): Promise<LeadRow> {
    const lead = await this.prisma.lead.create({
      data: {
        organizationId: orgId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        company: dto.company ?? null,
        source: dto.source ?? null,
        status: dto.status ?? LeadStatus.NEW,
        score: dto.score ?? 0,
        ownerId: dto.ownerId ?? null,
        notes: dto.notes ?? null,
      },
      include: LEAD_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      after: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        status: lead.status,
      },
    });

    return lead as LeadRow;
  }

  /** Partially updates a lead and fires an audit log entry. */
  async update(
    id: string,
    dto: UpdateLeadDto,
    actorId: string,
    orgId: string,
  ): Promise<LeadRow> {
    const existing = await this.findById(id, orgId);

    const before: Record<string, unknown> = {
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      phone: existing.phone,
      company: existing.company,
      source: existing.source,
      status: existing.status,
      score: existing.score,
      ownerId: existing.ownerId,
    };

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.score !== undefined && { score: dto.score }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: LEAD_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'LEAD_UPDATED',
      entityType: 'Lead',
      entityId: id,
      before,
      after: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        status: lead.status,
        score: lead.score,
        ownerId: lead.ownerId,
      },
    });

    return lead as LeadRow;
  }

  /**
   * Hard-deletes a lead.
   * Unlike contacts, leads can be fully removed from the system.
   */
  async delete(id: string, actorId: string, orgId: string): Promise<void> {
    await this.findById(id, orgId);

    await this.prisma.lead.delete({ where: { id } });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'LEAD_DELETED',
      entityType: 'Lead',
      entityId: id,
    });
  }

  /**
   * Changes the status of a lead.
   * CONVERTED status is not allowed via this method — use convert() instead.
   */
  async changeStatus(
    id: string,
    status: LeadStatus,
    actorId: string,
    orgId: string,
  ): Promise<LeadRow> {
    if (status === LeadStatus.CONVERTED) {
      throw new BadRequestException(
        'Cannot set status to CONVERTED directly. Use the convert endpoint instead.',
      );
    }

    const existing = await this.findById(id, orgId);

    const lead = await this.prisma.lead.update({
      where: { id },
      data: { status },
      include: LEAD_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'LEAD_STATUS_CHANGED',
      entityType: 'Lead',
      entityId: id,
      before: { status: existing.status },
      after: { status: lead.status },
    });

    return lead as LeadRow;
  }

  /**
   * Converts a lead to a Contact (and optionally an Opportunity).
   * The entire operation is wrapped in a Prisma transaction.
   *
   * Steps:
   *  1. Load lead; throw if already converted.
   *  2. Create Contact from lead fields.
   *  3. Optionally create Opportunity linked to the new contact.
   *  4. Update lead to status=CONVERTED with back-references.
   *  5. Audit log.
   */
  async convert(
    id: string,
    dto: ConvertLeadDto,
    actorId: string,
    orgId: string,
  ): Promise<{
    lead: LeadRow;
    contact: Prisma.ContactGetPayload<Record<string, never>>;
    opportunity?: Prisma.OpportunityGetPayload<Record<string, never>>;
  }> {
    const existingLead = await this.findById(id, orgId);

    if (existingLead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException(`Lead ${id} has already been converted`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Step 1: Create Contact
      const contact = await tx.contact.create({
        data: {
          organizationId: orgId,
          firstName: existingLead.firstName,
          lastName: existingLead.lastName,
          email: existingLead.email ?? null,
          phone: existingLead.phone ?? null,
          title: existingLead.company ?? null,
          source: existingLead.source ?? null,
          ownerId: existingLead.ownerId ?? null,
        },
      });

      // Step 2: Optionally create Opportunity
      let opportunity: Prisma.OpportunityGetPayload<Record<string, never>> | undefined;

      if (dto.createOpportunity) {
        // Resolve pipeline: use provided pipelineId or fall back to default pipeline
        let pipelineId = dto.pipelineId;

        if (!pipelineId) {
          const defaultPipeline = await tx.pipeline.findFirst({
            where: { organizationId: orgId, isDefault: true },
            select: { id: true },
          });
          if (!defaultPipeline) {
            throw new BadRequestException(
              'No default pipeline found. Please provide a pipelineId.',
            );
          }
          pipelineId = defaultPipeline.id;
        }

        // Resolve first stage in the pipeline
        const firstStage = await tx.stage.findFirst({
          where: { pipelineId },
          orderBy: { order: 'asc' },
          select: { id: true },
        });

        if (!firstStage) {
          throw new BadRequestException(
            `Pipeline ${pipelineId} has no stages. Add stages before converting leads.`,
          );
        }

        opportunity = await tx.opportunity.create({
          data: {
            organizationId: orgId,
            name: dto.opportunityTitle ?? `${existingLead.firstName} ${existingLead.lastName}`,
            pipelineId,
            stageId: firstStage.id,
            contactId: contact.id,
            ownerId: existingLead.ownerId ?? null,
            // amount is stored as BigInt in the schema; multiply by 100 to store cents
            // but since dto.amount is a plain number (dollars), store as-is in BigInt
            amount: dto.amount !== undefined ? BigInt(Math.round(dto.amount * 100)) : null,
            closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days out
          },
        });
      }

      // Step 3: Update lead to CONVERTED
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          convertedContactId: contact.id,
          convertedOpportunityId: opportunity?.id ?? null,
        },
        include: LEAD_INCLUDE,
      });

      return { lead: updatedLead as LeadRow, contact, opportunity };
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'LEAD_CONVERTED',
      entityType: 'Lead',
      entityId: id,
      after: {
        convertedContactId: result.contact.id,
        convertedOpportunityId: result.opportunity?.id ?? null,
      },
    });

    return result;
  }

  /**
   * Bulk-imports an array of leads into the org.
   * Skips rows where the email already exists for this org.
   * Returns created / skipped / errors counts.
   */
  async bulkImport(
    leads: BulkLeadInput[],
    actorId: string,
    orgId: string,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = { created: 0, skipped: 0, errors: [] };

    // Pre-fetch all emails that already exist in this org to avoid N+1 lookups
    const emailsToCheck = leads
      .map((l) => l.email?.toLowerCase())
      .filter((e): e is string => !!e);

    const existingEmails = new Set<string>();
    if (emailsToCheck.length > 0) {
      const existing = await this.prisma.lead.findMany({
        where: {
          organizationId: orgId,
          email: { in: emailsToCheck },
        },
        select: { email: true },
      });
      existing.forEach((l) => {
        if (l.email) existingEmails.add(l.email.toLowerCase());
      });
    }

    // Track emails seen in the current batch to handle intra-batch duplicates
    const batchEmails = new Set<string>();

    for (let i = 0; i < leads.length; i++) {
      const row = leads[i];

      if (!row.firstName?.trim() || !row.lastName?.trim()) {
        result.errors.push({ index: i, reason: 'firstName and lastName are required' });
        continue;
      }

      const normalizedEmail = row.email?.toLowerCase();

      if (normalizedEmail) {
        if (existingEmails.has(normalizedEmail) || batchEmails.has(normalizedEmail)) {
          result.skipped++;
          continue;
        }
        batchEmails.add(normalizedEmail);
      }

      try {
        await this.prisma.lead.create({
          data: {
            organizationId: orgId,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email: normalizedEmail ?? null,
            phone: row.phone ?? null,
            company: row.company ?? null,
            source: row.source ?? null,
            score: row.score ?? 0,
            notes: row.notes ?? null,
            ownerId: row.ownerId ?? null,
            status: row.status ?? LeadStatus.NEW,
          },
        });
        result.created++;
      } catch (err) {
        result.errors.push({
          index: i,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'LEAD_BULK_IMPORT',
      entityType: 'Lead',
      after: {
        created: result.created,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });

    return result;
  }
}
