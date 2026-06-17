import { Queue } from 'bull';
import { Response } from 'express';
import { UserPayload } from '@opsnext/shared';
import { ReportsService } from './reports.service';
import { CreateSavedReportDto } from './dto/create-saved-report.dto';
export declare class ReportsController {
    private readonly service;
    private readonly reportsQueue;
    constructor(service: ReportsService, reportsQueue: Queue);
    getPipelineSummary(user: UserPayload): Promise<{
        name: string;
        count: number;
        totalValue: number;
        expectedValue: number;
    }[]>;
    getActivityByRep(user: UserPayload): Promise<{
        name: string;
        email: string;
        CALL: number;
        MEETING: number;
        EMAIL_LOG: number;
        NOTE: number;
        total: number;
    }[]>;
    getLeadFunnel(user: UserPayload): Promise<{
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
    getWinLossAnalysis(user: UserPayload): Promise<{
        wonCount: number;
        wonValue: number;
        lostCount: number;
        lostValue: number;
        winRate: number;
    }>;
    getRevenueForecast(user: UserPayload): Promise<{
        month: string;
        totalValue: number;
        expectedValue: number;
    }[]>;
    export(type: string, user: UserPayload, res: Response): Promise<Response<any, Record<string, any>>>;
    getSavedReports(user: UserPayload): Promise<({
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        reportType: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    })[]>;
    createSavedReport(dto: CreateSavedReportDto, user: UserPayload): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        organizationId: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        reportType: string;
        filters: import("@prisma/client/runtime/library").JsonValue;
        isShared: boolean;
    }>;
    deleteSavedReport(id: string, user: UserPayload): Promise<void>;
    queueExport(body: {
        type: string;
    }, user: UserPayload): Promise<{
        jobId: string | number;
    }>;
    getExportStatus(jobId: string): Promise<{
        status: string;
        csv?: string;
        error?: string;
    }>;
}
