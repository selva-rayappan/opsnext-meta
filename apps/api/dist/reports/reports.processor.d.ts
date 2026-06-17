import { Job } from 'bull';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
interface ExportCsvJobData {
    type: string;
    orgId: string;
    role: Role;
    userId: string;
}
export declare class ReportsProcessor {
    private readonly service;
    private readonly logger;
    constructor(service: ReportsService);
    exportCsv(job: Job<ExportCsvJobData>): Promise<string>;
}
export {};
