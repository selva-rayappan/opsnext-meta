import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
export declare class ActivitiesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(orgId: string, query: ListActivitiesQueryDto, role: Role, userId: string): Promise<{
        data: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
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
        } & {
            organizationId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            contactId: string | null;
            accountId: string | null;
            opportunityId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            subject: string;
            body: string | null;
            dueAt: Date | null;
            completedAt: Date | null;
            duration: number | null;
            outcome: string | null;
            leadId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    findById(id: string, orgId: string, role: Role, userId: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
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
    } & {
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        contactId: string | null;
        accountId: string | null;
        opportunityId: string | null;
        type: import("@prisma/client").$Enums.ActivityType;
        subject: string;
        body: string | null;
        dueAt: Date | null;
        completedAt: Date | null;
        duration: number | null;
        outcome: string | null;
        leadId: string | null;
    }>;
    create(dto: CreateActivityDto, userId: string, orgId: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        contactId: string | null;
        accountId: string | null;
        opportunityId: string | null;
        type: import("@prisma/client").$Enums.ActivityType;
        subject: string;
        body: string | null;
        dueAt: Date | null;
        completedAt: Date | null;
        duration: number | null;
        outcome: string | null;
        leadId: string | null;
    }>;
    update(id: string, dto: CreateActivityDto, userId: string, orgId: string, role: Role): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        contactId: string | null;
        accountId: string | null;
        opportunityId: string | null;
        type: import("@prisma/client").$Enums.ActivityType;
        subject: string;
        body: string | null;
        dueAt: Date | null;
        completedAt: Date | null;
        duration: number | null;
        outcome: string | null;
        leadId: string | null;
    }>;
    delete(id: string, userId: string, orgId: string, role: Role): Promise<{
        success: boolean;
    }>;
}
