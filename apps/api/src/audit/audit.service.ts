import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@opsnext/shared';

export interface AuditLogParams {
  organizationId: string;
  actorId?: string;
  actorRole?: Role;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditService writes immutable audit log entries using the direct PrismaService
 * (never TenantPrismaService) to ensure reliability even in unusual tenant contexts.
 *
 * This service NEVER throws — all errors are caught and written to stderr so that
 * audit failures do not interrupt the primary operation.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          actorId: params.actorId ?? null,
          actorRole: params.actorRole ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          before: params.before !== undefined ? (params.before as Prisma.InputJsonValue) : Prisma.JsonNull,
          after: params.after !== undefined ? (params.after as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch (err) {
      // Audit failure must NEVER break the primary operation — log to stderr only.
      process.stderr.write(
        `[AuditService] Failed to write audit log: ${(err as Error).message}\n` +
          `  params: ${JSON.stringify({ action: params.action, entityType: params.entityType, entityId: params.entityId })}\n`,
      );
    }
  }
}
