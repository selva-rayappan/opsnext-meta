import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(orgId: string, query: ListTasksQueryDto, role: Role, userId: string) {
    const where: any = {
      organizationId: orgId,
    };

    // SALES_REP can only view tasks assigned to them or created by them
    if (role === Role.SALES_REP) {
      where.OR = [
        { assigneeId: userId },
        { createdById: userId },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
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
        ...(where.OR || []),
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
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
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        account: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    // Role check: SALES_REP only views tasks assigned or created by them
    if (role === Role.SALES_REP && task.assigneeId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async create(dto: CreateTaskDto, creatorId: string, orgId: string) {
    // Verify assignee belongs to the organization
    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assigneeId, organizationId: orgId },
    });
    if (!assignee) {
      throw new NotFoundException(`Assignee ${dto.assigneeId} not found in your organization`);
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

    const task = await this.prisma.task.create({
      data: {
        organizationId: orgId,
        createdById: creatorId,
        title: dto.title,
        description: dto.description ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        priority: dto.priority,
        status: TaskStatus.OPEN,
        assigneeId: dto.assigneeId,
        contactId: dto.contactId ?? null,
        accountId: dto.accountId ?? null,
        leadId: dto.leadId ?? null,
        opportunityId: dto.opportunityId ?? null,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId: creatorId,
      actorRole: Role.SALES_REP as any,
      action: 'task.create',
      entityType: 'Task',
      entityId: task.id,
      after: task as any,
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string, orgId: string, role: Role) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    // Role check: SALES_REP can only update tasks they own/are assigned to
    if (role === Role.SALES_REP && task.assigneeId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    const data: any = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dueAt !== undefined) data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    if (dto.priority !== undefined) data.priority = dto.priority;
    
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        data.completedAt = new Date();
      } else if (dto.status !== TaskStatus.COMPLETED) {
        data.completedAt = null;
      }
    }

    if (dto.assigneeId !== undefined) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, organizationId: orgId },
      });
      if (!assignee) {
        throw new NotFoundException(`Assignee ${dto.assigneeId} not found in organization`);
      }
      data.assigneeId = dto.assigneeId;
    }

    if (dto.contactId !== undefined) data.contactId = dto.contactId;
    if (dto.accountId !== undefined) data.accountId = dto.accountId;
    if (dto.leadId !== undefined) data.leadId = dto.leadId;
    if (dto.opportunityId !== undefined) data.opportunityId = dto.opportunityId;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId: userId,
      actorRole: role as any,
      action: 'task.update',
      entityType: 'Task',
      entityId: id,
      before: task as any,
      after: updatedTask as any,
    });

    return updatedTask;
  }

  async delete(id: string, userId: string, orgId: string, role: Role) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    // Role check: Only manager/admin or the task creator can delete
    if (role === Role.SALES_REP && task.createdById !== userId) {
      throw new ForbiddenException('You can only delete tasks you created');
    }

    await this.prisma.task.delete({
      where: { id },
    });

    await this.audit.log({
      organizationId: orgId,
      actorId: userId,
      actorRole: role as any,
      action: 'task.delete',
      entityType: 'Task',
      entityId: id,
      before: task as any,
    });

    return { success: true };
  }
}
