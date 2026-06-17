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
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@ApiTags('pipelines')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly service: PipelinesService) {}

  @Get()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'List all pipelines with their stages' })
  @ApiOkResponse({ description: 'List of pipelines' })
  findAll(@CurrentUser() user: UserPayload) {
    return this.service.findAll(user.orgId);
  }

  @Get(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get a pipeline by id' })
  @ApiOkResponse({ description: 'Pipeline record' })
  @ApiNotFoundResponse({ description: 'Pipeline not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.findById(id, user.orgId);
  }

  @Post()
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new pipeline' })
  @ApiOkResponse({ description: 'Created pipeline' })
  create(@Body() dto: CreatePipelineDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user.sub, user.orgId);
  }

  @Patch(':id')
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a pipeline' })
  @ApiOkResponse({ description: 'Updated pipeline' })
  @ApiNotFoundResponse({ description: 'Pipeline not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePipelineDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a pipeline' })
  @ApiNoContentResponse({ description: 'Pipeline deleted' })
  @ApiNotFoundResponse({ description: 'Pipeline not found' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.delete(id, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Stage Endpoints
  // ---------------------------------------------------------------------------

  @Post(':id/stages')
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new stage in a pipeline' })
  @ApiOkResponse({ description: 'Created stage' })
  createStage(
    @Param('id', ParseUUIDPipe) pipelineId: string,
    @Body() dto: CreateStageDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.createStage(pipelineId, dto, user.sub, user.orgId);
  }

  @Patch(':id/stages/:stageId')
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a stage in a pipeline' })
  @ApiOkResponse({ description: 'Updated stage' })
  updateStage(
    @Param('id', ParseUUIDPipe) pipelineId: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: UpdateStageDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.updateStage(pipelineId, stageId, dto, user.sub, user.orgId);
  }

  @Delete(':id/stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a stage from a pipeline' })
  @ApiNoContentResponse({ description: 'Stage deleted' })
  deleteStage(
    @Param('id', ParseUUIDPipe) pipelineId: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.deleteStage(pipelineId, stageId, user.sub, user.orgId);
  }

  @Post(':id/stages/reorder')
  @Roles(Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reorder stages in a pipeline' })
  @ApiOkResponse({ description: 'Ordered stages list' })
  reorderStages(
    @Param('id', ParseUUIDPipe) pipelineId: string,
    @Body() dto: ReorderStagesDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.reorderStages(pipelineId, dto.stageIds, user.sub, user.orgId);
  }
}
