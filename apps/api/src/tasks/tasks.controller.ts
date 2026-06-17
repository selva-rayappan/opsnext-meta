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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'List tasks with filters' })
  @ApiOkResponse({ description: 'List of tasks' })
  findAll(@Query() query: ListTasksQueryDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(user.orgId, query, user.role as Role, user.sub);
  }

  @Get(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get details of a task' })
  @ApiOkResponse({ description: 'Task details' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.findById(id, user.orgId, user.role as Role, user.sub);
  }

  @Post()
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a task' })
  @ApiOkResponse({ description: 'Created task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user.sub, user.orgId);
  }

  @Patch(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a task' })
  @ApiOkResponse({ description: 'Updated task' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user.sub, user.orgId, user.role as Role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiNoContentResponse({ description: 'Task deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.service.delete(id, user.sub, user.orgId, user.role as Role);
  }
}
