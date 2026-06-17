import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload, Role } from '@opsnext/shared';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';

@ApiTags('activities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'List activities with pagination and filters' })
  @ApiOkResponse({ description: 'Paginated activities' })
  findAll(@Query() query: ListActivitiesQueryDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(user.orgId, query, user.role as Role, user.sub);
  }

  @Get(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get details of an activity log' })
  @ApiOkResponse({ description: 'Activity details' })
  @ApiNotFoundResponse({ description: 'Activity not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.findById(id, user.orgId, user.role as Role, user.sub);
  }

  @Post()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Log a customer activity' })
  @ApiOkResponse({ description: 'Created activity log' })
  create(@Body() dto: CreateActivityDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user.sub, user.orgId);
  }

  @Patch(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an activity' })
  @ApiOkResponse({ description: 'Updated activity' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.orgId, user.role as Role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiNoContentResponse({ description: 'Activity deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.delete(id, user.sub, user.orgId, user.role as Role);
  }
}
