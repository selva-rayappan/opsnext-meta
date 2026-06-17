import { UserPayload } from '@opsnext/shared';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
export declare class TasksController {
    private readonly service;
    constructor(service: TasksService);
    findAll(query: ListTasksQueryDto, user: UserPayload): Promise<{
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
    findOne(id: string, user: UserPayload): Promise<{
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
    create(dto: CreateTaskDto, user: UserPayload): Promise<{
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
    update(id: string, dto: UpdateTaskDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<{
        success: boolean;
    }>;
}
