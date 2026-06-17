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
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role, UserPayload } from '@opsnext/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ContactsService, BulkContactInput } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';

// ---------------------------------------------------------------------------
// Inline request-body classes for simple endpoints
// ---------------------------------------------------------------------------

class LinkAccountBody {
  @ApiProperty({ description: 'Account UUID to link' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Contact role at this account (e.g. "Decision Maker")' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Mark this as the primary account for the contact' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

class AddTagBody {
  @ApiProperty({ description: 'Tag UUID to attach' })
  @IsUUID()
  tagId: string;
}

class MergeBody {
  @ApiProperty({ description: 'UUID of the contact that will survive the merge' })
  @IsUUID()
  mergeIntoId: string;
}

class BulkImportBody {
  @ApiProperty({ type: () => [CreateContactDto], description: 'Array of contacts to import' })
  contacts: BulkContactInput[];
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * ContactsController — REST API for contact management.
 *
 * Design contract:
 *  - organizationId is always taken from the JWT payload (user.orgId).
 *  - All routes require JWT authentication (applied globally).
 *  - @Roles() is declared per method with the least-privilege principle.
 *  - @ParseUUIDPipe validates all :id path params.
 */
@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  // ---------------------------------------------------------------------------
  // List & Read
  // ---------------------------------------------------------------------------

  /**
   * GET /contacts
   * Returns a paginated, filtered list of contacts for the caller's org.
   */
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.READ_ONLY)
  @ApiOperation({ summary: 'List contacts (paginated, filterable, sortable)' })
  @ApiOkResponse({ description: 'Paginated contact list' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() query: ListContactsQueryDto,
  ) {
    return this.contacts.findAll(user.orgId, query);
  }

  /**
   * GET /contacts/:id
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiOkResponse({ description: 'Contact record' })
  @ApiNotFoundResponse({ description: 'Contact not found in this organization' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.contacts.findById(id, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * POST /contacts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiCreatedResponse({ description: 'Contact created' })
  create(
    @Body() dto: CreateContactDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.contacts.create(dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Bulk import — MUST be declared before /:id routes
  // ---------------------------------------------------------------------------

  /**
   * POST /contacts/import
   * Declared before all /:id routes so that the literal segment "import" is not
   * treated as a UUID parameter by the Express router.
   */
  @Post('import')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Bulk-import contacts; skips duplicates by email' })
  @ApiOkResponse({ description: 'Import summary with created/skipped/errors counts' })
  @ApiBody({ type: BulkImportBody })
  bulkImport(
    @Body() dto: BulkImportBody,
    @CurrentUser() user: UserPayload,
  ) {
    return this.contacts.bulkImport(dto.contacts, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /**
   * PATCH /contacts/:id
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Partially update a contact' })
  @ApiOkResponse({ description: 'Updated contact record' })
  @ApiNotFoundResponse({ description: 'Contact not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.contacts.update(id, dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  /**
   * DELETE /contacts/:id
   * Soft-deletes (sets isActive=false). Hard deletion is not exposed.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Soft-delete a contact (sets isActive=false)' })
  @ApiNoContentResponse({ description: 'Contact deactivated' })
  @ApiNotFoundResponse({ description: 'Contact not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.contacts.softDelete(id, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Merge
  // ---------------------------------------------------------------------------

  /**
   * POST /contacts/:id/merge
   * Tombstones :id and marks it as merged into mergeIntoId.
   */
  @Post(':id/merge')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Merge a duplicate contact into another' })
  @ApiOkResponse({ description: 'Surviving (target) contact after merge' })
  @ApiNotFoundResponse({ description: 'Source or target contact not found' })
  merge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MergeBody,
    @CurrentUser() user: UserPayload,
  ) {
    return this.contacts.merge(id, dto.mergeIntoId, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Account links
  // ---------------------------------------------------------------------------

  /**
   * POST /contacts/:id/accounts
   */
  @Post(':id/accounts')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Link a contact to an account' })
  @ApiNoContentResponse({ description: 'Link created or updated' })
  @ApiNotFoundResponse({ description: 'Contact or account not found' })
  linkAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkAccountBody,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.contacts.linkAccount(id, dto.accountId, user.orgId, dto.title, dto.isPrimary);
  }

  /**
   * DELETE /contacts/:id/accounts/:accountId
   */
  @Delete(':id/accounts/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Remove a contact–account link' })
  @ApiNoContentResponse({ description: 'Link removed' })
  unlinkAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.contacts.unlinkAccount(id, accountId, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  /**
   * POST /contacts/:id/tags
   */
  @Post(':id/tags')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Attach a tag to a contact' })
  @ApiNoContentResponse({ description: 'Tag attached' })
  @ApiNotFoundResponse({ description: 'Contact or tag not found' })
  addTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTagBody,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.contacts.addTag(id, dto.tagId, user.orgId);
  }

  /**
   * DELETE /contacts/:id/tags/:tagId
   */
  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Remove a tag from a contact' })
  @ApiNoContentResponse({ description: 'Tag removed' })
  removeTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.contacts.removeTag(id, tagId, user.orgId);
  }
}
