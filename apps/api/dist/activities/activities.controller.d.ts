import { UserPayload } from '@opsnext/shared';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
export declare class ActivitiesController {
    private readonly service;
    constructor(service: ActivitiesService);
    findAll(query: ListActivitiesQueryDto, user: UserPayload): Promise<{
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
    findOne(id: string, user: UserPayload): Promise<{
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
    create(dto: CreateActivityDto, user: UserPayload): Promise<{
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
    update(id: string, dto: CreateActivityDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<{
        success: boolean;
    }>;
}
