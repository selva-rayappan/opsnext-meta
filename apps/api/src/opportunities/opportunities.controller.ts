import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload, Role } from '@opsnext/shared';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { ForecastQueryDto } from './dto/forecast-query.dto';
import { ChangeStageDto } from './dto/change-stage.dto';
import { MarkWonDto } from './dto/mark-won.dto';
import { MarkLostDto } from './dto/mark-lost.dto';

@ApiTags('opportunities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  @Get()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'List opportunities with pagination, filtering, and sorting' })
  @ApiOkResponse({ description: 'Paginated list of opportunities' })
  findAll(@Query() query: ListOpportunitiesQueryDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(user.orgId, query, user.role as Role, user.sub);
  }

  @Get('forecast')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get probability-weighted sales forecast metrics' })
  @ApiOkResponse({ description: 'Forecast data grouped by month' })
  getForecast(@Query() query: ForecastQueryDto, @CurrentUser() user: UserPayload) {
    return this.service.getForecast(user.orgId, query, user.role as Role, user.sub);
  }

  @Get(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get details of a single opportunity' })
  @ApiOkResponse({ description: 'Opportunity details with history' })
  @ApiNotFoundResponse({ description: 'Opportunity not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.findById(id, user.orgId);
  }

  @Post()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new opportunity' })
  @ApiOkResponse({ description: 'Created opportunity' })
  create(@Body() dto: CreateOpportunityDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user.sub, user.orgId);
  }

  @Patch(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiOkResponse({ description: 'Updated opportunity' })
  @ApiNotFoundResponse({ description: 'Opportunity not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.orgId);
  }

  @Patch(':id/stage')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transition an opportunity to a different stage' })
  @ApiOkResponse({ description: 'Opportunity record after stage change' })
  @ApiNotFoundResponse({ description: 'Opportunity or Stage not found' })
  changeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeStageDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.changeStage(id, body.stageId, user.sub, user.orgId);
  }

  @Post(':id/won')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark an opportunity as WON' })
  @ApiOkResponse({ description: 'Opportunity record after status change' })
  markWon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkWonDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.markWon(id, dto, user.sub, user.orgId);
  }

  @Post(':id/lost')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark an opportunity as LOST' })
  @ApiOkResponse({ description: 'Opportunity record after status change' })
  markLost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkLostDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.markLost(id, dto, user.sub, user.orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an opportunity' })
  @ApiNoContentResponse({ description: 'Opportunity deleted' })
  @ApiNotFoundResponse({ description: 'Opportunity not found' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.delete(id, user.sub, user.orgId);
  }
}
