import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload, Role } from '@opsnext/shared';
import { ReportsService } from './reports.service';
import { CreateSavedReportDto } from './dto/create-saved-report.dto';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly service: ReportsService,
    @InjectQueue('reports') private readonly reportsQueue: Queue,
  ) {}

  // ── Standard report endpoints ────────────────────────────────────────────────

  @Get('pipeline-summary')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get pipeline value distribution by stages' })
  @ApiOkResponse({ description: 'Pipeline summary data' })
  getPipelineSummary(@CurrentUser() user: UserPayload) {
    return this.service.getPipelineSummary(user.orgId, user.role as Role, user.sub);
  }

  @Get('activity-by-rep')
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get rep activity performance' })
  @ApiOkResponse({ description: 'Activity by rep logs' })
  getActivityByRep(@CurrentUser() user: UserPayload) {
    return this.service.getActivityByRep(user.orgId, user.role as Role, user.sub);
  }

  @Get('lead-funnel')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get lead status and conversion rates funnel' })
  @ApiOkResponse({ description: 'Lead funnel data' })
  getLeadFunnel(@CurrentUser() user: UserPayload) {
    return this.service.getLeadFunnel(user.orgId, user.role as Role, user.sub);
  }

  @Get('win-loss')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get opportunity win/loss counts and ratios' })
  @ApiOkResponse({ description: 'Win/loss ratio stats' })
  getWinLossAnalysis(@CurrentUser() user: UserPayload) {
    return this.service.getWinLossAnalysis(user.orgId, user.role as Role, user.sub);
  }

  @Get('revenue-forecast')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get revenue forecasting totals' })
  @ApiOkResponse({ description: 'Forecast revenue grouped by months' })
  getRevenueForecast(@CurrentUser() user: UserPayload) {
    return this.service.getRevenueForecast(user.orgId, user.role as Role, user.sub);
  }

  @Get('export')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Export a CSV file for a report type (synchronous fallback)' })
  async export(
    @Query('type') type: string,
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportCsv(type, user.orgId, user.role as Role, user.sub);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    return res.status(200).send(csv);
  }

  // ── Saved Reports ────────────────────────────────────────────────────────────

  @Get('saved')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'List saved reports accessible to the current user' })
  @ApiOkResponse({ description: 'Array of saved reports (own + org-wide shared), ordered by createdAt desc' })
  getSavedReports(@CurrentUser() user: UserPayload) {
    return this.service.getSavedReports(user.orgId, user.sub);
  }

  @Post('saved')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Create a new saved report' })
  @ApiCreatedResponse({ description: 'Saved report created' })
  createSavedReport(
    @Body() dto: CreateSavedReportDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.createSavedReport(dto, user.sub, user.orgId);
  }

  @Delete('saved/:id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved report (creator or admin only)' })
  @ApiNoContentResponse({ description: 'Saved report deleted' })
  async deleteSavedReport(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.service.deleteSavedReport(id, user.sub, user.orgId, user.role as Role);
  }

  // ── Async CSV export via Bull queue ─────────────────────────────────────────

  @Post('export-job')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue an async CSV export job' })
  @ApiAcceptedResponse({ description: 'Export job queued; returns jobId' })
  async queueExport(
    @Body() body: { type: string },
    @CurrentUser() user: UserPayload,
  ): Promise<{ jobId: string | number }> {
    const job = await this.reportsQueue.add('export-csv', {
      type: body.type,
      orgId: user.orgId,
      role: user.role,
      userId: user.sub,
    });
    return { jobId: job.id };
  }

  @Get('export-job/:jobId')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Poll the status of an async CSV export job' })
  @ApiOkResponse({ description: 'Job status with optional csv/error fields' })
  async getExportStatus(
    @Param('jobId') jobId: string,
  ): Promise<{ status: string; csv?: string; error?: string }> {
    const job = await this.reportsQueue.getJob(jobId);
    if (!job) {
      return { status: 'not_found' };
    }
    const state = await job.getState();
    if (state === 'completed') {
      return { status: 'completed', csv: job.returnvalue as string };
    }
    if (state === 'failed') {
      return { status: 'failed', error: job.failedReason };
    }
    return { status: state };
  }
}
