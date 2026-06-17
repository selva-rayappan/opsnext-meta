import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';

interface ExportCsvJobData {
  type: string;
  orgId: string;
  role: Role;
  userId: string;
}

@Processor('reports')
export class ReportsProcessor {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor(private readonly service: ReportsService) {}

  @Process('export-csv')
  async exportCsv(job: Job<ExportCsvJobData>): Promise<string> {
    const { type, orgId, role, userId } = job.data;
    this.logger.log(`Generating CSV export: type=${type}, orgId=${orgId}`);
    const csv = await this.service.exportCsv(type, orgId, role, userId);
    return csv; // stored as job.returnvalue by Bull
  }
}
