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
  Query,
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
import { IsIn, IsOptional } from 'class-validator';
import { Role, UserPayload } from '@opsnext/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto, CUSTOM_FIELD_ENTITY_TYPES, CustomFieldEntityType } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';

// ---------------------------------------------------------------------------
// Inline query-param class
// ---------------------------------------------------------------------------

class ListCustomFieldsQueryDto {
  @IsOptional()
  @IsIn(CUSTOM_FIELD_ENTITY_TYPES)
  entityType?: CustomFieldEntityType;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * CustomFieldsController — REST API for managing the custom field schema.
 *
 * Custom field values are set via entity-specific service calls (e.g. from
 * ContactsService) and are not exposed as a separate HTTP endpoint here to
 * keep the API surface clean. Power users can call custom-fields service
 * methods directly in downstream features (EP-03+).
 *
 * All routes require JWT authentication (applied globally).
 * ADMIN and SALES_MANAGER can mutate field definitions.
 * All roles can read the schema.
 */
@ApiTags('custom-fields')
@ApiBearerAuth()
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFields: CustomFieldsService) {}

  /**
   * GET /custom-fields?entityType=Contact
   * Returns field definitions, optionally filtered by entity type.
   */
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.READ_ONLY)
  @ApiOperation({ summary: 'List custom field definitions (optionally filter by entityType)' })
  @ApiOkResponse({ description: 'Array of custom field definitions' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() query: ListCustomFieldsQueryDto,
  ) {
    return this.customFields.findAll(user.orgId, query.entityType);
  }

  /**
   * POST /custom-fields
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create a new custom field definition' })
  @ApiCreatedResponse({ description: 'Custom field created' })
  create(
    @Body() dto: CreateCustomFieldDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.customFields.create(dto, user.orgId);
  }

  /**
   * PATCH /custom-fields/:id
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update a custom field definition (entityType cannot be changed)' })
  @ApiOkResponse({ description: 'Updated custom field' })
  @ApiNotFoundResponse({ description: 'Custom field not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomFieldDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.customFields.update(id, dto, user.orgId);
  }

  /**
   * DELETE /custom-fields/:id
   * Removes the field definition and all stored values (DB cascade).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a custom field and all its stored values' })
  @ApiNoContentResponse({ description: 'Custom field deleted' })
  @ApiNotFoundResponse({ description: 'Custom field not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.customFields.delete(id, user.orgId);
  }
}
