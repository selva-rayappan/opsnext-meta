import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(orgId: string, query: ListActivitiesQueryDto, role: Role, userId: string) {
    const where: any = {
      organizationId: orgId,
    };

    // SALES_REP can only view their own activities
    if (role === Role.SALES_REP) {
      where.userId = userId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    if (query.accountId) {
      where.accountId = query.accountId;
    }

    if (query.leadId) {
      where.leadId = query.leadId;
    }

    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
    }

    if (query.q) {
      where.OR = [
        { subject: { contains: query.q, mode: 'insensitive' } },
        { body: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          account: { select: { id: true, name: true } },
          lead: { select: { id: true, firstName: true, lastName: true } },
          opportunity: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string, orgId: string, role: Role, userId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId: orgId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        account: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    // Role check
    if (role === Role.SALES_REP && activity.userId !== userId) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    return activity;
  }

  async create(dto: CreateActivityDto, userId: string, orgId: string) {
    // Validate that at least one target entity is linked
    if (!dto.contactId && !dto.accountId && !dto.leadId && !dto.opportunityId) {
      throw new BadRequestException('Activity must be linked to at least one entity (Contact, Account, Lead, or Opportunity)');
    }

    // Validate relationships exist and belong to tenant
    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: dto.contactId, organizationId: orgId },
      });
      if (!contact) throw new NotFoundException(`Contact ${dto.contactId} not found`);
    }

    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, organizationId: orgId },
      });
      if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, organizationId: orgId },
      });
      if (!lead) throw new NotFoundException(`Lead ${dto.leadId} not found`);
    }

    if (dto.opportunityId) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: { id: dto.opportunityId, organizationId: orgId },
      });
      if (!opportunity) throw new NotFoundException(`Opportunity ${dto.opportunityId} not found`);
    }

    const activity = await this.prisma.activity.create({
      data: {
        organizationId: orgId,
        userId,
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        duration: dto.duration ?? null,
        outcome: dto.outcome ?? null,
        contactId: dto.contactId ?? null,
        accountId: dto.accountId ?? null,
        leadId: dto.leadId ?? null,
        opportunityId: dto.opportunityId ?? null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId: userId,
      actorRole: Role.SALES_REP as any,
      action: 'activity.create',
      entityType: 'Activity',
      entityId: activity.id,
      after: activity as any,
    });

    return activity;
  }

  async update(id: string, dto: CreateActivityDto, userId: string, orgId: string, role: Role) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    // Role check: SALES_REP can only update their own activities
    if (role === Role.SALES_REP && activity.userId !== userId) {
      throw new ForbiddenException('You cannot update an activity that you did not create');
    }

    // Validate relationships if changed
    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: dto.contactId, organizationId: orgId },
      });
      if (!contact) throw new NotFoundException(`Contact ${dto.contactId} not found`);
    }

    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, organizationId: orgId },
      });
      if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    const updatedActivity = await this.prisma.activity.update({
      where: { id },
      data: {
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        duration: dto.duration ?? null,
        outcome: dto.outcome ?? null,
        contactId: dto.contactId ?? null,
        accountId: dto.accountId ?? null,
        leadId: dto.leadId ?? null,
        opportunityId: dto.opportunityId ?? null,
      },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId: userId,
      actorRole: role as any,
      action: 'activity.update',
      entityType: 'Activity',
      entityId: id,
      before: activity as any,
      after: updatedActivity as any,
    });

    return updatedActivity;
  }

  async delete(id: string, userId: string, orgId: string, role: Role) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    // Only managers and admins can delete activities
    if (role === Role.SALES_REP) {
      throw new ForbiddenException('SALES_REP is not allowed to delete activities');
    }

    await this.prisma.activity.delete({
      where: { id },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId: userId,
      actorRole: role as any,
      action: 'activity.delete',
      entityType: 'Activity',
      entityId: id,
      before: activity as any,
    });

    return { success: true };
  }
}
