import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
export declare class TasksService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string, query: ListTasksQueryDto, role: Role, userId: string): Promise<{
        data: ({
            contact: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            account: {
                id: string;
                name: string;
            } | null;
            lead: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            opportunity: {
                id: string;
                name: string;
            } | null;
            assignee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            organizationId: string;
            id: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            contactId: string | null;
            accountId: string | null;
            opportunityId: string | null;
            dueAt: Date | null;
            completedAt: Date | null;
            leadId: string | null;
            description: string | null;
            priority: import("@prisma/client").$Enums.TaskPriority;
            assigneeId: string;
            createdById: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    findById(id: string, orgId: string, role: Role, userId: string): Promise<{
        contact: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        account: {
            id: string;
            name: string;
        } | null;
        lead: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        opportunity: {
            id: string;
            name: string;
        } | null;
        assignee: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        contactId: string | null;
        accountId: string | null;
        opportunityId: string | null;
        dueAt: Date | null;
        completedAt: Date | null;
        leadId: string | null;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        assigneeId: string;
        createdById: string;
    }>;
    create(dto: CreateTaskDto, creatorId: string, orgId: string): Promise<{
        assignee: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        contactId: string | null;
        accountId: string | null;
        opportunityId: string | null;
        dueAt: Date | null;
        completedAt: Date | null;
        leadId: string | null;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        assigneeId: string;
        createdById: string;
    }>;
    update(id: string, dto: UpdateTaskDto, userId: string, orgId: string, role: Role): Promise<{
        assignee: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        contactId: string | null;
        accountId: string | null;
        opportunityId: string | null;
        dueAt: Date | null;
        completedAt: Date | null;
        leadId: string | null;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        assigneeId: string;
        createdById: string;
    }>;
    delete(id: string, userId: string, orgId: string, role: Role): Promise<{
        success: boolean;
    }>;
}
