import { PrismaService } from '../prisma/prisma.service';
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(name: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("@prisma/client").$Enums.OrganizationStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("@prisma/client").$Enums.OrganizationStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findBySlug(slug: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("@prisma/client").$Enums.OrganizationStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    suspend(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("@prisma/client").$Enums.OrganizationStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("@prisma/client").$Enums.OrganizationStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    scheduleDelete(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("@prisma/client").$Enums.OrganizationStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(orgId: string): Promise<{
        totalUsers: number;
        activeUsers: number;
    }>;
}
