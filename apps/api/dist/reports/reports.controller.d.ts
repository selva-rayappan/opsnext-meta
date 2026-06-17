import { Response } from 'express';
import { UserPayload } from '@opsnext/shared';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
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
}
