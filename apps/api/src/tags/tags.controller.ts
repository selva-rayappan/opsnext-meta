import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role, UserPayload } from '@opsnext/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

/**
 * TagsController — REST API for managing organization-level tags.
 *
 * Tags are shared across Contact and Account entities within an org.
 * Reading tags is allowed by all roles; mutations are restricted to
 * ADMIN and SALES_MANAGER to keep the tag taxonomy clean.
 */
@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  /**
   * GET /tags
   * Returns all tags for the caller's organization.
   */
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.READ_ONLY)
  @ApiOperation({ summary: 'List all tags in the organization' })
  @ApiOkResponse({ description: 'Array of tag records' })
  findAll(@CurrentUser() user: UserPayload) {
    return this.tags.findAll(user.orgId);
  }

  /**
   * POST /tags
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiCreatedResponse({ description: 'Tag created' })
  create(
    @Body() dto: CreateTagDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tags.create(dto, user.orgId, user.sub);
  }

  /**
   * PATCH /tags/:id
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update a tag name or color' })
  @ApiOkResponse({ description: 'Updated tag record' })
  @ApiNotFoundResponse({ description: 'Tag not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tags.update(id, dto, user.orgId, user.sub);
  }

  /**
   * DELETE /tags/:id
   * Removes the tag and all ContactTag/AccountTag associations (via DB cascade).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Delete a tag (removes all associations)' })
  @ApiNoContentResponse({ description: 'Tag deleted' })
  @ApiNotFoundResponse({ description: 'Tag not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.tags.delete(id, user.orgId, user.sub);
  }
}
