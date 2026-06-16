import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Converts an organization name to a URL-safe slug.
 * e.g. "Acme Corp & Partners" → "acme-corp-partners"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // strip non-alphanumeric except spaces/hyphens
    .replace(/[\s]+/g, '-')         // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new organization with a slugified, unique name.
   * Appends a numeric suffix (e.g. -2, -3) if the slug is already taken.
   */
  async create(name: string) {
    const baseSlug = slugify(name);

    if (!baseSlug) {
      throw new ConflictException('Organization name produces an invalid slug');
    }

    // Find a unique slug by checking for existing orgs with that slug prefix
    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.organization.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    return this.prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        status: OrganizationStatus.ACTIVE,
      },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organisation not found');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException('Organisation not found');
    return org;
  }

  /**
   * Suspends an organization — users can no longer log in.
   * The record is retained; a background job or manual process restores it.
   */
  async suspend(id: string) {
    await this.findById(id);
    return this.prisma.organization.update({
      where: { id },
      data: { status: OrganizationStatus.SUSPENDED },
    });
  }

  /**
   * Marks an organization for deletion.
   * Actual hard-delete is performed by a scheduled job (not this method).
   */
  async delete(id: string) {
    await this.findById(id);
    return this.prisma.organization.update({
      where: { id },
      data: { status: OrganizationStatus.PENDING_DELETION },
    });
  }

  /**
   * @deprecated Use delete() instead. Kept for backward compatibility.
   */
  async scheduleDelete(id: string) {
    return this.delete(id);
  }

  /**
   * Returns user count statistics for an organization.
   */
  async getStats(orgId: string): Promise<{ totalUsers: number; activeUsers: number }> {
    const [total, active] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: orgId } }),
      this.prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
    ]);
    return { totalUsers: total, activeUsers: active };
  }
}
