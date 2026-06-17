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
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Role, UserPayload } from '@opsnext/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';

// ---------------------------------------------------------------------------
// Inline request-body classes
// ---------------------------------------------------------------------------

class AddTagBody {
  @ApiProperty({ description: 'Tag UUID to attach' })
  @IsUUID()
  tagId: string;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * AccountsController — REST API for account (company) management.
 *
 * Design contract:
 *  - organizationId is always taken from the JWT payload (user.orgId).
 *  - All routes require JWT authentication (applied globally).
 *  - @Roles() is declared per method with the least-privilege principle.
 *  - @ParseUUIDPipe validates all :id path params.
 */
@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  // ---------------------------------------------------------------------------
  // List & Read
  // ---------------------------------------------------------------------------

  /**
   * GET /accounts
   */
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.READ_ONLY)
  @ApiOperation({ summary: 'List accounts (paginated, filterable, sortable)' })
  @ApiOkResponse({ description: 'Paginated account list' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() query: ListAccountsQueryDto,
  ) {
    return this.accounts.findAll(user.orgId, query);
  }

  /**
   * GET /accounts/:id
   * Includes contact links with contact names.
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get an account by ID (includes linked contacts)' })
  @ApiOkResponse({ description: 'Account record with contact links' })
  @ApiNotFoundResponse({ description: 'Account not found in this organization' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accounts.findById(id, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * POST /accounts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiCreatedResponse({ description: 'Account created' })
  create(
    @Body() dto: CreateAccountDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accounts.create(dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /**
   * PATCH /accounts/:id
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Partially update an account' })
  @ApiOkResponse({ description: 'Updated account record' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.accounts.update(id, dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Soft delete
  // ---------------------------------------------------------------------------

  /**
   * DELETE /accounts/:id
   * Soft-deletes (sets isActive=false). Hard deletion is not exposed.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Soft-delete an account (sets isActive=false)' })
  @ApiNoContentResponse({ description: 'Account deactivated' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.accounts.softDelete(id, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  /**
   * POST /accounts/:id/tags
   */
  @Post(':id/tags')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Attach a tag to an account' })
  @ApiNoContentResponse({ description: 'Tag attached' })
  @ApiNotFoundResponse({ description: 'Account or tag not found' })
  addTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTagBody,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.accounts.addTag(id, dto.tagId, user.orgId);
  }

  /**
   * DELETE /accounts/:id/tags/:tagId
   */
  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  @ApiOperation({ summary: 'Remove a tag from an account' })
  @ApiNoContentResponse({ description: 'Tag removed' })
  removeTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.accounts.removeTag(id, tagId, user.orgId);
  }
}
