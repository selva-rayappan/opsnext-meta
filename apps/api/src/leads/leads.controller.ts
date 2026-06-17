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
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LeadStatus } from '@prisma/client';
import { Role, UserPayload } from '@opsnext/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { LeadsService, BulkLeadInput } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

// ---------------------------------------------------------------------------
// Inline request-body classes for simple endpoints
// ---------------------------------------------------------------------------

class ChangeStatusBody {
  @ApiProperty({ enum: LeadStatus, description: 'New lead status (cannot be CONVERTED)' })
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

class BulkImportBody {
  @ApiProperty({ type: () => [CreateLeadDto], description: 'Array of leads to import' })
  leads: BulkLeadInput[];
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * LeadsController — REST API for lead management.
 *
 * Design contract:
 *  - organizationId is always taken from the JWT payload (user.orgId).
 *  - All routes require JWT authentication (applied globally).
 *  - @Roles() is declared per method with the least-privilege principle.
 *  - SALES_REP users see only their own leads; SALES_MANAGER+ see all.
 *  - @ParseUUIDPipe validates all :id path params.
 */
@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  // ---------------------------------------------------------------------------
  // List & Read
  // ---------------------------------------------------------------------------

  /**
   * GET /leads
   * Returns a paginated, filtered list of leads for the caller's org.
   * SALES_REP users automatically receive only their own leads.
   */
  @Get()
  @Roles(Role.READ_ONLY, Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List leads (paginated, filterable, sortable)' })
  @ApiOkResponse({ description: 'Paginated lead list' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() query: ListLeadsQueryDto,
  ) {
    return this.leads.findAll(user.orgId, query, user.role, user.sub);
  }

  /**
   * GET /leads/:id
   */
  @Get(':id')
  @Roles(Role.READ_ONLY, Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiOkResponse({ description: 'Lead record' })
  @ApiNotFoundResponse({ description: 'Lead not found in this organization' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.leads.findById(id, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * POST /leads
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiCreatedResponse({ description: 'Lead created' })
  create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.leads.create(dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Bulk import — MUST be declared before /:id routes
  // ---------------------------------------------------------------------------

  /**
   * POST /leads/import
   * Declared before all /:id routes so that the literal segment "import" is not
   * treated as a UUID parameter by the Express router.
   */
  @Post('import')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk-import leads; skips duplicates by email' })
  @ApiOkResponse({ description: 'Import summary with created/skipped/errors counts' })
  @ApiBody({ type: BulkImportBody })
  bulkImport(
    @Body() dto: BulkImportBody,
    @CurrentUser() user: UserPayload,
  ) {
    return this.leads.bulkImport(dto.leads, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /**
   * PATCH /leads/:id
   */
  @Patch(':id')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Partially update a lead' })
  @ApiOkResponse({ description: 'Updated lead record' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.leads.update(id, dto, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /**
   * DELETE /leads/:id
   * Hard-deletes the lead (unlike contacts which are soft-deleted).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hard-delete a lead' })
  @ApiNoContentResponse({ description: 'Lead deleted' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.leads.delete(id, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Status change
  // ---------------------------------------------------------------------------

  /**
   * PATCH /leads/:id/status
   * Updates only the status field. Cannot be set to CONVERTED — use /convert for that.
   */
  @Patch(':id/status')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change lead status (not CONVERTED — use /convert for that)' })
  @ApiOkResponse({ description: 'Updated lead record' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeStatusBody,
    @CurrentUser() user: UserPayload,
  ) {
    return this.leads.changeStatus(id, body.status, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Convert
  // ---------------------------------------------------------------------------

  /**
   * POST /leads/:id/convert
   * Atomically converts a lead to a Contact and optionally an Opportunity.
   */
  @Post(':id/convert')
  @Roles(Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Convert a lead to a contact (and optionally an opportunity)' })
  @ApiOkResponse({ description: 'Converted lead with created contact and optional opportunity' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.leads.convert(id, dto, user.sub, user.orgId);
  }
}
