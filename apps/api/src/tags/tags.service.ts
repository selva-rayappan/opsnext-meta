import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

const DEFAULT_COLOR = '#6B7280';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Returns all tags for the given organization. */
  async findAll(orgId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new tag for the organization.
   * Tag names are unique per org (case-sensitive in the DB; the unique constraint
   * on [organizationId, name] enforces this).
   */
  async create(dto: CreateTagDto, orgId: string, actorId: string): Promise<Tag> {
    // Check for duplicate before attempting create to surface a friendly error
    const existing = await this.prisma.tag.findFirst({
      where: { organizationId: orgId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `A tag named "${dto.name}" already exists in this organization`,
      );
    }

    const tag = await this.prisma.tag.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        color: dto.color ?? DEFAULT_COLOR,
      },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'TAG_CREATED',
      entityType: 'Tag',
      entityId: tag.id,
      after: { name: tag.name, color: tag.color },
    });

    return tag;
  }

  /**
   * Partially updates a tag.
   * Throws NotFoundException if the tag does not belong to the org.
   */
  async update(id: string, dto: UpdateTagDto, orgId: string, actorId: string): Promise<Tag> {
    const existing = await this.prisma.tag.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    // If name is changing, check for duplicates
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.tag.findFirst({
        where: { organizationId: orgId, name: dto.name, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(
          `A tag named "${dto.name}" already exists in this organization`,
        );
      }
    }

    const tag = await this.prisma.tag.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'TAG_UPDATED',
      entityType: 'Tag',
      entityId: id,
      before: { name: existing.name, color: existing.color },
      after: { name: tag.name, color: tag.color },
    });

    return tag;
  }

  /**
   * Deletes a tag.
   * All ContactTag and AccountTag join records are removed by DB cascade.
   */
  async delete(id: string, orgId: string, actorId: string): Promise<void> {
    const existing = await this.prisma.tag.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException(`Tag ${id} not found`);
    }

    await this.prisma.tag.delete({ where: { id } });

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'TAG_DELETED',
      entityType: 'Tag',
      entityId: id,
      before: { name: existing.name, color: existing.color },
    });
  }
}
