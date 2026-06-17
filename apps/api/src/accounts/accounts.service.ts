import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';

/** Shape of an account row returned to callers. */
export type AccountRow = Prisma.AccountGetPayload<{
  include: {
    owner: { select: { id: true; firstName: true; lastName: true } };
    contactLinks: {
      include: {
        contact: { select: { id: true; firstName: true; lastName: true; email: true } };
      };
    };
    tags: { include: { tag: { select: { id: true; name: true; color: true } } } };
  };
}>;

/** Paginated list result. */
export interface PaginatedAccounts {
  data: AccountRow[];
  total: number;
  page: number;
  limit: number;
}

/** Standard include clause reused across read operations. */
const ACCOUNT_INCLUDE = {
  owner: { select: { id: true, firstName: true, lastName: true } },
  contactLinks: {
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
} satisfies Prisma.AccountInclude;

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated, optionally filtered and searched list of accounts
   * scoped to the given organization.
   */
  async findAll(orgId: string, query: ListAccountsQueryDto): Promise<PaginatedAccounts> {
    const { page, limit, q, isActive, ownerId, sortBy, order } = query;

    const where: Prisma.AccountWhereInput = { organizationId: orgId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (ownerId !== undefined) {
      where.ownerId = ownerId;
    }

    if (q && q.trim().length > 0) {
      const term = q.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { domain: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: ACCOUNT_INCLUDE,
      }),
      this.prisma.account.count({ where }),
    ]);

    return { data: data as AccountRow[], total, page, limit };
  }

  /**
   * Returns a single account by id scoped to the org, including its contact links.
   * Throws NotFoundException if not found.
   */
  async findById(id: string, orgId: string): Promise<AccountRow> {
    const account = await this.prisma.account.findFirst({
      where: { id, organizationId: orgId },
      include: ACCOUNT_INCLUDE,
    });

    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    return account as AccountRow;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /** Creates a new account and fires an audit log entry. */
  async create(dto: CreateAccountDto, actorId: string, orgId: string): Promise<AccountRow> {
    const account = await this.prisma.account.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        domain: dto.domain ?? null,
        industry: dto.industry ?? null,
        employeeCount: dto.employeeCount ?? null,
        website: dto.website ?? null,
        phone: dto.phone ?? null,
        notes: dto.notes ?? null,
        ownerId: dto.ownerId ?? null,
      },
      include: ACCOUNT_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'ACCOUNT_CREATED',
      entityType: 'Account',
      entityId: account.id,
      after: { name: account.name, domain: account.domain },
    });

    return account as AccountRow;
  }

  /** Partially updates an account and fires an audit log entry. */
  async update(
    id: string,
    dto: UpdateAccountDto,
    actorId: string,
    orgId: string,
  ): Promise<AccountRow> {
    const existing = await this.findById(id, orgId);

    const before: Record<string, unknown> = {
      name: existing.name,
      domain: existing.domain,
      industry: existing.industry,
      employeeCount: existing.employeeCount,
      website: existing.website,
      phone: existing.phone,
      ownerId: existing.ownerId,
    };

    const account = await this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.industry !== undefined && { industry: dto.industry }),
        ...(dto.employeeCount !== undefined && { employeeCount: dto.employeeCount }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      },
      include: ACCOUNT_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'ACCOUNT_UPDATED',
      entityType: 'Account',
      entityId: id,
      before,
      after: {
        name: account.name,
        domain: account.domain,
        industry: account.industry,
        employeeCount: account.employeeCount,
        website: account.website,
        phone: account.phone,
        ownerId: account.ownerId,
      },
    });

    return account as AccountRow;
  }

  /**
   * Soft-deletes an account by setting isActive=false.
   * Hard deletion is not supported to preserve referential integrity.
   */
  async softDelete(id: string, actorId: string, orgId: string): Promise<void> {
    await this.findById(id, orgId);

    await this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'ACCOUNT_DELETED',
      entityType: 'Account',
      entityId: id,
      after: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Tag management
  // ---------------------------------------------------------------------------

  /** Attaches a tag to an account. Idempotent — no error if tag already attached. */
  async addTag(accountId: string, tagId: string, orgId: string): Promise<void> {
    await this.findById(accountId, orgId);

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, organizationId: orgId },
    });
    if (!tag) {
      throw new NotFoundException(`Tag ${tagId} not found`);
    }

    await this.prisma.accountTag.upsert({
      where: { accountId_tagId: { accountId, tagId } },
      create: { accountId, tagId },
      update: {},
    });
  }

  /** Removes a tag from an account. No-op if tag is not currently attached. */
  async removeTag(accountId: string, tagId: string, orgId: string): Promise<void> {
    await this.findById(accountId, orgId);

    await this.prisma.accountTag.deleteMany({
      where: { accountId, tagId },
    });
  }
}
