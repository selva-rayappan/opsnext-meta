import {
  BadRequestException,
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Role } from '@opsnext/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { InviteUserDto } from './dto/invite-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersService } from './users.service';

// ---------------------------------------------------------------------------
// Inline request-body classes for simple endpoints
// ---------------------------------------------------------------------------

class AcceptInviteBody {
  @ApiProperty({ example: 'abc123hex...', description: 'Invite token from the email link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'P@ssw0rd!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password too weak',
  })
  password: string;
}

class UpdateRoleBody {
  @ApiProperty({ enum: Role, description: 'New role to assign' })
  @IsEnum(Role)
  role: Role;
}

class ChangePasswordBody {
  @ApiProperty({ description: 'Current (existing) password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password too weak',
  })
  newPassword: string;
}

class DeleteConfirmBody {
  @ApiProperty({
    description: 'Must be true to confirm permanent, irreversible deletion',
    example: true,
  })
  @IsBoolean()
  confirm: boolean;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * UsersController — REST API for user management.
 *
 * Design contract:
 *  - `organizationId` is ALWAYS taken from the JWT payload (`user.orgId`) — never from the body.
 *  - JwtAuthGuard + RolesGuard are applied at the class level.
 *  - Public routes (invite/accept) bypass JwtAuthGuard via @Public().
 *  - SALES_MANAGER list view is automatically scoped to SALES_REP role.
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ---------------------------------------------------------------------------
  // Own profile — accessible by all authenticated roles
  // ---------------------------------------------------------------------------

  /**
   * GET /users/me
   * Must be declared BEFORE GET /users/:id to avoid NestJS routing a literal
   * "me" string through the UUID param route.
   */
  @Get('me')
  @Roles(Role.READ_ONLY, Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({ description: 'Own user profile' })
  getMe(@CurrentUser() user: { sub: string; orgId: string }) {
    return this.users.findById(user.sub, user.orgId);
  }

  /**
   * PATCH /users/me/password
   * Must be declared BEFORE PATCH /users/:id/... routes.
   */
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.READ_ONLY, Role.SALES_REP, Role.SALES_MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change own password' })
  @ApiNoContentResponse({ description: 'Password changed; all active sessions revoked' })
  @ApiBadRequestResponse({ description: 'Current password incorrect or validation failed' })
  changePassword(
    @Body() dto: ChangePasswordBody,
    @CurrentUser() user: { sub: string },
  ): Promise<void> {
    return this.users.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }

  // ---------------------------------------------------------------------------
  // Invite acceptance — public (no JWT required)
  // ---------------------------------------------------------------------------

  /**
   * POST /users/invite/accept
   * Must be before POST /users/invite so NestJS does not partially match.
   */
  @Public()
  @Post('invite/accept')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Accept an invitation and set up your account' })
  @ApiCreatedResponse({ description: 'Account created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid, expired, or already-used token' })
  @ApiConflictResponse({ description: 'A user with this email already exists' })
  acceptInvite(@Body() dto: AcceptInviteBody) {
    return this.users.acceptInvite(dto.token, dto.firstName, dto.lastName, dto.password);
  }

  // ---------------------------------------------------------------------------
  // Invite management — ADMIN only
  // ---------------------------------------------------------------------------

  /**
   * POST /users/invite
   */
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Invite a new user to the organization' })
  @ApiCreatedResponse({ description: 'Invitation email sent' })
  @ApiConflictResponse({ description: 'User or pending invitation already exists for this email' })
  @ApiForbiddenResponse({ description: 'Cannot invite SUPER_ADMIN or insufficient permissions' })
  invite(
    @Body() dto: InviteUserDto,
    @CurrentUser() user: { sub: string; orgId: string },
  ): Promise<void> {
    return this.users.invite(user.orgId, dto, user.sub);
  }

  // ---------------------------------------------------------------------------
  // Listing & reading — ADMIN and SALES_MANAGER
  // ---------------------------------------------------------------------------

  /**
   * GET /users
   * SALES_MANAGER automatically receives only SALES_REP results (team scoping).
   */
  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'List users in the organization (paginated, filtered, sorted)' })
  @ApiOkResponse({ description: 'Paginated list of users' })
  findAll(
    @CurrentUser() user: { sub: string; orgId: string; role: Role },
    @Query() query: ListUsersQueryDto,
  ) {
    // SALES_MANAGER can only view their direct reports (SALES_REP)
    if (user.role === Role.SALES_MANAGER && query.role === undefined) {
      query.role = Role.SALES_REP;
    }

    return this.users.findAll(user.orgId, query);
  }

  /**
   * GET /users/:id
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ description: 'User record' })
  @ApiNotFoundResponse({ description: 'User not found in this organization' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { orgId: string },
  ) {
    return this.users.findById(id, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Role management — ADMIN only
  // ---------------------------------------------------------------------------

  /**
   * PATCH /users/:id/role
   */
  @Patch(':id/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Update a user's role" })
  @ApiNoContentResponse({ description: 'Role updated' })
  @ApiForbiddenResponse({ description: 'Cannot promote above own role or change own role' })
  @ApiNotFoundResponse({ description: 'User not found' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleBody,
    @CurrentUser() user: { sub: string; orgId: string },
  ): Promise<void> {
    return this.users.updateRole(id, dto.role, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Activation / deactivation — ADMIN only
  // ---------------------------------------------------------------------------

  /**
   * PATCH /users/:id/deactivate
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a user (soft delete — sets isActive=false)' })
  @ApiNoContentResponse({ description: 'User deactivated and all sessions revoked' })
  @ApiBadRequestResponse({ description: 'User is already deactivated' })
  @ApiNotFoundResponse({ description: 'User not found' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; orgId: string },
  ): Promise<void> {
    return this.users.deactivate(id, user.sub, user.orgId);
  }

  /**
   * PATCH /users/:id/reactivate
   */
  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivate a previously deactivated user' })
  @ApiNoContentResponse({ description: 'User reactivated' })
  @ApiBadRequestResponse({ description: 'User is already active' })
  @ApiNotFoundResponse({ description: 'User not found' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; orgId: string },
  ): Promise<void> {
    return this.users.reactivate(id, user.sub, user.orgId);
  }

  // ---------------------------------------------------------------------------
  // Hard delete — ADMIN only, requires explicit confirmation
  // ---------------------------------------------------------------------------

  /**
   * DELETE /users/:id
   * Body must contain `{ "confirm": true }` to prevent accidental deletion.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Permanently delete a user (irreversible — requires confirm:true)' })
  @ApiNoContentResponse({ description: 'User permanently deleted' })
  @ApiBadRequestResponse({ description: 'confirm flag not set to true' })
  @ApiForbiddenResponse({ description: 'Cannot delete your own account' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteConfirmBody,
    @CurrentUser() user: { sub: string; orgId: string },
  ): Promise<void> {
    if (!dto.confirm) {
      throw new BadRequestException(
        'You must send { "confirm": true } to permanently delete a user',
      );
    }

    return this.users.delete(id, user.sub, user.orgId);
  }
}
