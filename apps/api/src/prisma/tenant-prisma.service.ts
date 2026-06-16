import { ForbiddenException, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

// ---------------------------------------------------------------------------
// Tenant context store — middleware sets organizationId here per-request
// ---------------------------------------------------------------------------

export interface TenantStore {
  organizationId: string;
}

/**
 * AsyncLocalStorage instance exported so middleware (and tests) can populate
 * the tenant context for the current async execution context.
 */
export const TenantContext = new AsyncLocalStorage<TenantStore>();

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface TenantQueryOptions {
  /**
   * Set to `true` ONLY for SUPER_ADMIN or internal system operations.
   * When true, `organizationId` is NOT injected and no context is required.
   */
  skipTenantFilter?: true;
}

// ---------------------------------------------------------------------------
// TenantPrismaService
// ---------------------------------------------------------------------------

/**
 * Wraps PrismaService and automatically injects `organizationId` from the
 * AsyncLocalStorage context into every query's `where` / `data` clause.
 *
 * Contract:
 *  - TenantContext set with organizationId → inject on every query.
 *  - Context missing + skipTenantFilter not `true` → ForbiddenException (never silently omits).
 *  - skipTenantFilter:true accepted only for SUPER_ADMIN / system paths.
 */
@Injectable()
export class TenantPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Internal: resolve organizationId or throw
  // -------------------------------------------------------------------------

  private resolveOrgId(opts?: TenantQueryOptions): string | null {
    if (opts?.skipTenantFilter === true) {
      return null;
    }
    const store = TenantContext.getStore();
    if (!store?.organizationId) {
      throw new ForbiddenException('Tenant context missing');
    }
    return store.organizationId;
  }

  // -------------------------------------------------------------------------
  // findMany
  // -------------------------------------------------------------------------

  findMany<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['findMany']['args'] = {} as Prisma.TypeMap['model'][M]['operations']['findMany']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['findMany']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    return delegate.findMany(merged) as Prisma.TypeMap['model'][M]['operations']['findMany']['result'];
  }

  // -------------------------------------------------------------------------
  // findFirst
  // -------------------------------------------------------------------------

  findFirst<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['findFirst']['args'] = {} as Prisma.TypeMap['model'][M]['operations']['findFirst']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['findFirst']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    return delegate.findFirst(merged) as Prisma.TypeMap['model'][M]['operations']['findFirst']['result'];
  }

  // -------------------------------------------------------------------------
  // findUnique
  // -------------------------------------------------------------------------

  findUnique<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['findUnique']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['findUnique']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    // findUnique uses compound unique keys; we merge tenant filter into where
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    // Use findFirst under the hood so tenant filter is always enforced
    return delegate.findFirst(merged) as Prisma.TypeMap['model'][M]['operations']['findUnique']['result'];
  }

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  create<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['create']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['create']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeData(args, { organizationId: orgId }) : args;
    return delegate.create(merged) as Prisma.TypeMap['model'][M]['operations']['create']['result'];
  }

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  update<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['update']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['update']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    return delegate.update(merged) as Prisma.TypeMap['model'][M]['operations']['update']['result'];
  }

  // -------------------------------------------------------------------------
  // updateMany
  // -------------------------------------------------------------------------

  updateMany<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['updateMany']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['updateMany']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    return delegate.updateMany(merged) as Prisma.TypeMap['model'][M]['operations']['updateMany']['result'];
  }

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  delete<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['delete']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['delete']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    return delegate.delete(merged) as Prisma.TypeMap['model'][M]['operations']['delete']['result'];
  }

  // -------------------------------------------------------------------------
  // count
  // -------------------------------------------------------------------------

  count<M extends Prisma.ModelName>(
    model: M,
    args: Prisma.TypeMap['model'][M]['operations']['count']['args'] = {} as Prisma.TypeMap['model'][M]['operations']['count']['args'],
    opts?: TenantQueryOptions,
  ): Prisma.TypeMap['model'][M]['operations']['count']['result'] {
    const orgId = this.resolveOrgId(opts);
    const delegate = this.delegate(model);
    const merged = orgId ? mergeWhere(args, { organizationId: orgId }) : args;
    return delegate.count(merged) as Prisma.TypeMap['model'][M]['operations']['count']['result'];
  }

  // -------------------------------------------------------------------------
  // Expose $transaction for callers that need atomic operations.
  // Callers are responsible for tenant isolation inside a transaction.
  // -------------------------------------------------------------------------

  get $transaction(): PrismaService['$transaction'] {
    return this.prisma.$transaction.bind(this.prisma);
  }

  /**
   * Expose the raw PrismaService for cross-tenant / system operations.
   * Only use when you have verified authorization in the calling code.
   */
  get raw(): PrismaService {
    return this.prisma;
  }

  // -------------------------------------------------------------------------
  // Private: get Prisma model delegate by name
  // -------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private delegate(model: Prisma.ModelName): Record<string, (...args: any[]) => any> {
    const key = model.charAt(0).toLowerCase() + model.slice(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (this.prisma as unknown as Record<string, any>)[key];
    if (!d) throw new Error(`Unknown Prisma model: ${model}`);
    return d;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeWhere(
  args: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...args,
    where: { ...(args['where'] as Record<string, unknown> | undefined ?? {}), ...extra },
  };
}

function mergeData(
  args: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...args,
    data: { ...(args['data'] as Record<string, unknown> | undefined ?? {}), ...extra },
  };
}
