import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role } from '@opsnext/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService, TenantContext } from '../prisma/tenant-prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ConfigService } from '@nestjs/config';

const BCRYPT_ROUNDS = 12;
const INVITE_EXPIRY_HOURS = 72;

/** Role levels used to enforce promotion rules */
const ROLE_LEVEL: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.SALES_MANAGER]: 60,
  [Role.SALES_REP]: 40,
  [Role.READ_ONLY]: 20,
};

export interface PaginatedUsers<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Runs a callback with the tenant context set to `orgId`.
 * This is the correct way to invoke TenantPrismaService methods from within
 * a service method that already has the orgId from the JWT payload.
 */
function withTenant<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    TenantContext.run({ organizationId: orgId }, () => {
      fn().then(resolve).catch(reject);
    });
  });
}

@Injectable()
export class UsersService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Returns a paginated, filtered, sorted list of users within an organization.
   */
  async findAll(
    orgId: string,
    query: ListUsersQueryDto,
  ): Promise<PaginatedUsers<Record<string, unknown>>> {
    const { page, limit, isActive, role, sortBy, order } = query;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where['isActive'] = isActive;
    if (role !== undefined) where['role'] = role;

    return withTenant(orgId, async () => {
      const [users, total] = await Promise.all([
        this.tenantPrisma.findMany('User', {
          where,
          orderBy: { [sortBy]: order },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }) as unknown as Promise<Record<string, unknown>[]>,
        this.tenantPrisma.count('User', { where }) as unknown as Promise<number>,
      ]);

      return { data: await users, total: await total, page, limit };
    });
  }

  /**
   * Finds a single user by ID, scoped to the organization. Throws NotFoundException if absent.
   */
  async findById(userId: string, orgId: string): Promise<Record<string, unknown>> {
    return withTenant(orgId, async () => {
      const user = (await (this.tenantPrisma.findFirst('User', {
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          organizationId: true,
        },
      }) as unknown as Promise<Record<string, unknown> | null>));

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      return user;
    });
  }

  /**
   * Finds a user by email without org scoping — used by the auth module for login.
   * Returns null if not found (avoids leaking existence to public callers).
   */
  async findByEmail(email: string): Promise<Record<string, unknown> | null> {
    // Cross-org lookup for auth — use raw PrismaService, no tenant filter
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
        organizationId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return (user as Record<string, unknown> | null) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Invitations
  // ---------------------------------------------------------------------------

  /**
   * Creates a UserInvite record and sends the invitation email.
   * Throws ConflictException if a pending invite or active user already exists for that email.
   */
  async invite(orgId: string, dto: InviteUserDto, invitedById: string): Promise<void> {
    await withTenant(orgId, async () => {
      // Check for existing active user in this org
      const existing = await (this.tenantPrisma.findFirst('User', {
        where: { email: dto.email.toLowerCase() },
      }) as Promise<unknown>);
      if (existing) {
        throw new ConflictException('A user with this email already exists in this organization');
      }

      // Check for a pending (non-expired, non-accepted) invite
      const existingInvite = await (this.tenantPrisma.findFirst('UserInvite', {
        where: {
          email: dto.email.toLowerCase(),
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      }) as Promise<unknown>);
      if (existingInvite) {
        throw new ConflictException('A pending invitation already exists for this email');
      }
    });

    // Generate a secure token and store its SHA-256 hash
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

    // Fetch inviter details and org name (cross-tenant lookups use raw prisma)
    const [inviter, org] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: invitedById },
        select: { firstName: true, lastName: true },
      }),
      this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      }),
    ]);

    await this.prisma.userInvite.create({
      data: {
        organizationId: orgId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        tokenHash,
        expiresAt,
        invitedById,
      },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const inviteUrl = `${appUrl}/invite/accept?token=${rawToken}`;
    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`.trim()
      : 'An administrator';
    const orgName = org?.name ?? 'your organization';

    await this.mail.sendInvite(dto.email, inviteUrl, orgName, inviterName);

    await this.audit.log({
      organizationId: orgId,
      actorId: invitedById,
      action: 'USER_INVITED',
      entityType: 'UserInvite',
      after: { email: dto.email, role: dto.role },
    });
  }

  /**
   * Accepts an invite: verifies the token, creates the User, marks the invite accepted.
   * Sends a welcome email on success.
   */
  async acceptInvite(
    token: string,
    firstName: string,
    lastName: string,
    password: string,
  ): Promise<Record<string, unknown>> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // All invite-acceptance queries are unscoped (no active tenant context yet)
    const invite = await this.prisma.userInvite.findFirst({
      where: { tokenHash },
    });

    if (!invite) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    if (invite.acceptedAt !== null) {
      throw new BadRequestException('This invitation has already been used');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    // Race-condition guard: check for existing user
    const existing = await this.prisma.user.findFirst({
      where: { email: invite.email, organizationId: invite.organizationId },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        organizationId: invite.organizationId,
        email: invite.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: invite.role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
      },
    });

    await this.prisma.userInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    const org = await this.prisma.organization.findUnique({
      where: { id: invite.organizationId },
      select: { name: true },
    });

    await this.mail.sendWelcome(user.email, user.firstName, org?.name ?? 'your organization');

    await this.audit.log({
      organizationId: invite.organizationId,
      actorId: user.id,
      action: 'USER_INVITE_ACCEPTED',
      entityType: 'User',
      entityId: user.id,
      after: { email: user.email, role: user.role },
    });

    return user as Record<string, unknown>;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle mutations
  // ---------------------------------------------------------------------------

  /**
   * Soft-deletes a user by setting isActive=false and revoking all refresh tokens.
   */
  async deactivate(userId: string, actorId: string, orgId: string): Promise<void> {
    const user = await this.requireUserInOrg(userId, orgId);

    if (!user.isActive) {
      throw new BadRequestException('User is already deactivated');
    }

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: userId,
      before: { isActive: true },
      after: { isActive: false },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Reactivates a previously deactivated user.
   */
  async reactivate(userId: string, actorId: string, orgId: string): Promise<void> {
    const user = await this.requireUserInOrg(userId, orgId);

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'USER_REACTIVATED',
      entityType: 'User',
      entityId: userId,
      before: { isActive: false },
      after: { isActive: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  /**
   * Updates a user's role. Enforces:
   *   - Actor cannot change their own role.
   *   - Actor cannot promote a user to a role equal to or higher than their own (no privilege escalation).
   *   - SUPER_ADMIN role cannot be assigned via this method.
   */
  async updateRole(
    userId: string,
    newRole: Role,
    actorId: string,
    orgId: string,
  ): Promise<void> {
    if (userId === actorId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    if (newRole === Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN role cannot be assigned via this endpoint');
    }

    const [user, actor] = await Promise.all([
      this.requireUserInOrg(userId, orgId),
      this.requireUserInOrg(actorId, orgId),
    ]);

    const actorLevel = ROLE_LEVEL[actor.role as Role] ?? 0;
    const newRoleLevel = ROLE_LEVEL[newRole] ?? 0;
    const targetCurrentLevel = ROLE_LEVEL[user.role as Role] ?? 0;

    if (newRoleLevel >= actorLevel) {
      throw new ForbiddenException(
        'You cannot promote a user to a role equal to or higher than your own',
      );
    }

    if (targetCurrentLevel >= actorLevel) {
      throw new ForbiddenException(
        'You cannot change the role of a user with equal or higher privileges',
      );
    }

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'USER_ROLE_UPDATED',
      entityType: 'User',
      entityId: userId,
      before: { role: user.role },
      after: { role: newRole },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  }

  /**
   * Hard-deletes a user record. Cascade handled by DB foreign keys.
   * This is irreversible — ADMIN only, explicit confirmation flag required.
   */
  async delete(userId: string, actorId: string, orgId: string): Promise<void> {
    if (userId === actorId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.requireUserInOrg(userId, orgId);

    await this.audit.log({
      organizationId: orgId,
      actorId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: userId,
      before: { email: user.email, role: user.role, isActive: user.isActive },
    });

    await this.prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Changes a user's password. Verifies the current password before updating.
   * Revokes all refresh tokens to force re-login on all devices.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.audit.log({
      organizationId: user.organizationId,
      actorId: userId,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens to force re-login on all devices
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Loads a user from the DB asserting it belongs to the given org.
   * Uses raw prisma (not tenantPrisma) to accept an explicit orgId assertion.
   * Throws NotFoundException if absent.
   */
  private async requireUserInOrg(
    userId: string,
    orgId: string,
  ): Promise<{
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    organizationId: string;
  }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
      select: { id: true, email: true, role: true, isActive: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found in this organization`);
    }

    return user;
  }
}
