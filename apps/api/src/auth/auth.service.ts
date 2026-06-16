import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Role, UserPayload } from '@opsnext/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';

/** bcrypt cost factor — 12 rounds as per security spec */
const BCRYPT_ROUNDS = 12;

/** Password reset token TTL: 1 hour */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------

  /**
   * Creates a new Organisation + first ADMIN user in a single transaction.
   * Returns an access + refresh token pair.
   */
  async register(
    dto: RegisterDto,
    ip?: string,
    ua?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const slug = this.slugify(dto.organizationName);

    const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      throw new BadRequestException('Organisation name already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { org, user } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName, slug },
      });
      const createdUser = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.ADMIN,
        },
      });
      return { org: organization, user: createdUser };
    });

    return this.issueTokens(user.id, org.id, user.role as Role, user.email, ip, ua);
  }

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  /**
   * Validates email + password, updates lastLoginAt, and issues a token pair.
   * Always throws generic 'Invalid credentials' to prevent user enumeration.
   */
  async login(
    email: string,
    password: string,
    ip?: string,
    ua?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    // Constant-time guard: run bcrypt even when user not found to prevent timing attacks
    const dummyHash =
      '$2b$12$invalidhashusedtoblindtimingattacksXXXXXXXXXXXXXXXXXX';
    const passwordMatch = await bcrypt.compare(
      password,
      user ? user.passwordHash : dummyHash,
    );

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(
      user.id,
      user.organizationId,
      user.role as Role,
      user.email,
      ip,
      ua,
    );
  }

  // ---------------------------------------------------------------------------
  // refresh
  // ---------------------------------------------------------------------------

  /**
   * Rotates a refresh token.
   *
   * Token family invalidation:
   *  - If the token was already revoked (reuse detected) → revoke ALL tokens in
   *    the same familyId → throw 401. This prevents replay attacks.
   *  - Otherwise: revoke the presented token, issue a new token in the same family.
   */
  async refresh(
    rawRefreshToken: string,
    ip?: string,
    ua?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // ---- Reuse detection: token was already revoked ----
    if (stored.revokedAt !== null) {
      // Revoke entire family to force re-authentication on all devices
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected — all sessions invalidated. Please log in again.',
      );
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // ---- Rotate: revoke current token, issue new one in same family ----
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(
      stored.userId,
      stored.user.organizationId,
      stored.user.role as Role,
      stored.user.email,
      ip,
      ua,
      stored.familyId, // continue the same token family
    );
  }

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  /** Revokes the presented refresh token, clearing the session. */
  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // requestPasswordReset
  // ---------------------------------------------------------------------------

  /**
   * Creates a short-lived password reset record and sends a reset email.
   * Always returns successfully — never reveals whether the email exists.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    // Silent return — prevents email enumeration
    if (!user || !user.isActive) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${this.config.getOrThrow<string>('APP_URL')}/reset-password?token=${rawToken}`;

    // Fire-and-forget — do not leak errors to the caller
    this.mail.sendPasswordReset(user.email, resetUrl).catch(() => {
      // MailService logs internally; swallow here to avoid 500 from SMTP errors
    });
  }

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------

  /**
   * Validates the reset token, hashes the new password, and revokes all active
   * refresh tokens so the user must re-authenticate on all devices.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    const record = await this.prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) throw new BadRequestException('Invalid or expired reset token');
    if (record.usedAt) throw new BadRequestException('Reset token already used');
    if (record.expiresAt < new Date()) throw new BadRequestException('Reset token expired');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Atomic: update password + mark token used + revoke all refresh tokens
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // ---------------------------------------------------------------------------
  // issueTokens
  // ---------------------------------------------------------------------------

  /**
   * Signs a new RS256 access JWT (15 min) and stores a new refresh token
   * record (7 days) in the database.
   *
   * If `existingFamilyId` is provided, the new token continues that family;
   * otherwise a new familyId (UUID v4) is generated.
   */
  async issueTokens(
    userId: string,
    orgId: string,
    role: Role,
    email: string,
    ip?: string,
    ua?: string,
    existingFamilyId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: UserPayload = { sub: userId, orgId, role, email };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY', '15m'),
      algorithm: 'RS256',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = existingFamilyId ?? uuidv4();
    const expiresAt = new Date(
      Date.now() + this.parseExpiry(this.config.get<string>('JWT_REFRESH_EXPIRY', '7d')),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        organizationId: orgId,
        tokenHash,
        familyId,
        expiresAt,
        ipAddress: ip ?? null,
        userAgent: ua ?? null,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 63);
  }

  /** Parses a duration string like '15m', '7d', '1h' into milliseconds. */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    const map: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * (map[unit] ?? 86_400_000);
  }
}
