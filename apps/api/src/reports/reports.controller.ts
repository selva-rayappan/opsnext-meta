import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
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

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('pipeline-summary')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get pipeline value distribution by stages' })
  @ApiOkResponse({ description: 'Pipeline summary data' })
  getPipelineSummary(@CurrentUser() user: UserPayload) {
    return this.service.getPipelineSummary(user.orgId, user.role as Role, user.sub);
  }

  @Get('activity-by-rep')
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY) // Sales rep shouldn't see leaderboard unless manager/admin
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
  @ApiOperation({ summary: 'Export a CSV file for a report type' })
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
}
