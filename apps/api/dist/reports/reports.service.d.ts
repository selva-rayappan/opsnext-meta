import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPipelineSummary(orgId: string, role: Role, userId: string): Promise<{
        name: string;
        count: number;
        totalValue: number;
        expectedValue: number;
    }[]>;
    getActivityByRep(orgId: string, role: Role, userId: string): Promise<{
        name: string;
        email: string;
        CALL: number;
        MEETING: number;
        EMAIL_LOG: number;
        NOTE: number;
        total: number;
    }[]>;
    getLeadFunnel(orgId: string, role: Role, userId: string): Promise<{
        statusCounts: {
            NEW: number;
            CONTACTED: number;
            QUALIFIED: number;
            UNQUALIFIED: number;
            CONVERTED: number;
            total: number;
        };
        conversionRate: number;
    }>;
    getWinLossAnalysis(orgId: string, role: Role, userId: string): Promise<{
        wonCount: number;
        wonValue: number;
        lostCount: number;
        lostValue: number;
        winRate: number;
    }>;
    getRevenueForecast(orgId: string, role: Role, userId: string): Promise<{
        month: string;
        totalValue: number;
        expectedValue: number;
    }[]>;
    exportCsv(type: string, orgId: string, role: Role, userId: string): Promise<string>;
}
