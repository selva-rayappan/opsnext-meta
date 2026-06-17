import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';

/** Shape of a single contact row returned to callers. */
export type ContactRow = Prisma.ContactGetPayload<{
  include: {
    owner: { select: { id: true; firstName: true; lastName: true } };
    accountLinks: {
      include: { account: { select: { id: true; name: true } } };
    };
    tags: { include: { tag: { select: { id: true; name: true; color: true } } } };
  };
}>;

/** Paginated list result. */
export interface PaginatedContacts {
  data: ContactRow[];
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
export interface BulkContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
}

/** Standard include clause reused across read operations. */
const CONTACT_INCLUDE = {
  owner: { select: { id: true, firstName: true, lastName: true } },
  accountLinks: {
    include: { account: { select: { id: true, name: true } } },
  },
  tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
} satisfies Prisma.ContactInclude;

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated, optionally filtered and searched list of contacts
   * scoped to the given organization.
   */
  async findAll(orgId: string, query: ListContactsQueryDto): Promise<PaginatedContacts> {
    const { page, limit, q, isActive, ownerId, tagId, sortBy, order } = query;

    const where: Prisma.ContactWhereInput = { organizationId: orgId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (ownerId !== undefined) {
      where.ownerId = ownerId;
    }

    if (tagId !== undefined) {
      where.tags = { some: { tagId } };
    }

    if (q && q.trim().length > 0) {
      const term = q.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: CONTACT_INCLUDE,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data: data as ContactRow[], total, page, limit };
  }

  /**
   * Returns a single contact by id scoped to the org.
   * Throws NotFoundException if not found.
   */
  async findById(id: string, orgId: string): Promise<ContactRow> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: orgId },
      include: CONTACT_INCLUDE,
    });

    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }

    return contact as ContactRow;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /** Creates a new contact and fires an audit log entry. */
  async create(dto: CreateContactDto, actorId: string, orgId: string): Promise<ContactRow> {
    // Enforce email uniqueness within the org
    if (dto.email) {
      const duplicate = await this.prisma.contact.findFirst({
        where: { organizationId: orgId, email: dto.email },
      });
      if (duplicate) {
        throw new ConflictException(
          `A contact with email ${dto.email} already exists in this organization`,
        );
      }
    }

    const contact = await this.prisma.contact.create({
      data: {
        organizationId: orgId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        title: dto.title ?? null,
        source: dto.source ?? null,
        notes: dto.notes ?? null,
        ownerId: dto.ownerId ?? null,
      },
      include: CONTACT_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'CONTACT_CREATED',
      entityType: 'Contact',
      entityId: contact.id,
      after: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
      },
    });

    return contact as ContactRow;
  }

  /** Partially updates a contact and fires an audit log entry. */
  async update(
    id: string,
    dto: UpdateContactDto,
    actorId: string,
    orgId: string,
  ): Promise<ContactRow> {
    const existing = await this.findById(id, orgId);

    // Enforce email uniqueness if the email is being changed
    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.contact.findFirst({
        where: {
          organizationId: orgId,
          email: dto.email,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `A contact with email ${dto.email} already exists in this organization`,
        );
      }
    }

    const before: Record<string, unknown> = {
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      phone: existing.phone,
      title: existing.title,
      source: existing.source,
      ownerId: existing.ownerId,
    };

    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      },
      include: CONTACT_INCLUDE,
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'CONTACT_UPDATED',
      entityType: 'Contact',
      entityId: id,
      before,
      after: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        source: contact.source,
        ownerId: contact.ownerId,
      },
    });

    return contact as ContactRow;
  }

  /**
   * Soft-deletes a contact by setting isActive=false.
   * Hard deletion is not supported to preserve referential integrity.
   */
  async softDelete(id: string, actorId: string, orgId: string): Promise<void> {
    await this.findById(id, orgId);

    await this.prisma.contact.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'CONTACT_DELETED',
      entityType: 'Contact',
      entityId: id,
      after: { isActive: false },
    });
  }

  /**
   * Merges sourceId into targetId:
   *   - Tombstones the source contact (isActive=false, mergedIntoId=targetId).
   * Re-linking related entities (leads, opportunities, activities) is deferred
   * to later epics. For EP-02, a simple tombstone is sufficient.
   */
  async merge(
    sourceId: string,
    targetId: string,
    actorId: string,
    orgId: string,
  ): Promise<ContactRow> {
    if (sourceId === targetId) {
      throw new BadRequestException('Source and target contact must be different');
    }

    // Verify both contacts exist in the org
    await this.findById(sourceId, orgId);
    const target = await this.findById(targetId, orgId);

    // Tombstone the source
    await this.prisma.contact.update({
      where: { id: sourceId },
      data: { isActive: false, mergedIntoId: targetId },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'CONTACT_MERGED',
      entityType: 'Contact',
      entityId: sourceId,
      after: { mergedIntoId: targetId, isActive: false },
    });

    return target;
  }

  /**
   * Bulk-imports an array of contacts into the org.
   * Skips rows where the email already exists for this org.
   * Returns created / skipped / errors counts.
   */
  async bulkImport(
    contacts: BulkContactInput[],
    actorId: string,
    orgId: string,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = { created: 0, skipped: 0, errors: [] };

    // Pre-fetch all emails that already exist in this org to avoid N+1 lookups
    const emailsToCheck = contacts
      .map((c) => c.email?.toLowerCase())
      .filter((e): e is string => !!e);

    const existingEmails = new Set<string>();
    if (emailsToCheck.length > 0) {
      const existing = await this.prisma.contact.findMany({
        where: {
          organizationId: orgId,
          email: { in: emailsToCheck },
        },
        select: { email: true },
      });
      existing.forEach((c) => {
        if (c.email) existingEmails.add(c.email.toLowerCase());
      });
    }

    // Track emails seen in the current batch to handle intra-batch duplicates
    const batchEmails = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      const row = contacts[i];

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
        await this.prisma.contact.create({
          data: {
            organizationId: orgId,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email: normalizedEmail ?? null,
            phone: row.phone ?? null,
            source: row.source ?? null,
          },
        });
        result.created++;
      } catch (err) {
        // Catch any unexpected DB-level error (e.g. constraint race)
        result.errors.push({
          index: i,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'CONTACT_BULK_IMPORT',
      entityType: 'Contact',
      after: {
        created: result.created,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });

    return result;
  }

  // ---------------------------------------------------------------------------
  // Account links
  // ---------------------------------------------------------------------------

  /** Links a contact to an account, optionally with a title and isPrimary flag. */
  async linkAccount(
    contactId: string,
    accountId: string,
    orgId: string,
    title?: string,
    isPrimary?: boolean,
  ): Promise<void> {
    // Verify both entities exist in the org
    await this.findById(contactId, orgId);
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, organizationId: orgId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    await this.prisma.contactAccountLink.upsert({
      where: { contactId_accountId: { contactId, accountId } },
      create: {
        contactId,
        accountId,
        title: title ?? null,
        isPrimary: isPrimary ?? false,
      },
      update: {
        title: title ?? null,
        isPrimary: isPrimary ?? false,
      },
    });
  }

  /** Removes the link between a contact and an account. */
  async unlinkAccount(contactId: string, accountId: string, orgId: string): Promise<void> {
    await this.findById(contactId, orgId);

    await this.prisma.contactAccountLink.deleteMany({
      where: { contactId, accountId },
    });
  }

  // ---------------------------------------------------------------------------
  // Tag management
  // ---------------------------------------------------------------------------

  /** Attaches a tag to a contact. Idempotent — no error if tag already attached. */
  async addTag(contactId: string, tagId: string, orgId: string): Promise<void> {
    await this.findById(contactId, orgId);

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, organizationId: orgId },
    });
    if (!tag) {
      throw new NotFoundException(`Tag ${tagId} not found`);
    }

    // Use upsert to handle idempotency gracefully
    await this.prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId, tagId } },
      create: { contactId, tagId },
      update: {},
    });
  }

  /** Removes a tag from a contact. No-op if tag is not currently attached. */
  async removeTag(contactId: string, tagId: string, orgId: string): Promise<void> {
    await this.findById(contactId, orgId);

    await this.prisma.contactTag.deleteMany({
      where: { contactId, tagId },
    });
  }
}
