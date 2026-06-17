# OpsNext CRM — Multi-Tenancy Strategy
## Phase 3: Architecture Design

**Document ID:** ARCH-005  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Implementation Anchor  
**Input documents:** BRD-001 (§5 Multi-tenancy selection), FR-001 (FR-AUTH-012), DM-001

---

## 1. Strategy Selected: Row-Level Isolation (Option A)

**Decision from BRD-001:** Row-level tenancy — all tenants share a single PostgreSQL schema; every record carries `organizationId`.

**Rationale:**

| Factor | Row-level | Schema-per-tenant |
|---|---|---|
| Operational complexity | Low (1 DB, 1 schema) | High (N schemas, N migrations) |
| Migration cost | Single migration per change | N migrations per change |
| Cross-tenant analytics | Easy (single query, SUPER_ADMIN) | Complex (cross-schema queries) |
| Tenant isolation (application) | Via TenantPrismaService | Automatic by schema |
| Tenant isolation (DB) | Via RLS (defence-in-depth) | Native |
| Max tenants before perf concerns | ~10,000 (with proper indexing) | Unlimited (each is isolated) |
| Phase 1 target tenants | 10–25 | — |

Row-level is the correct choice for Phase 1 scale. Schema-per-tenant migration is documented in ARCH-001 §9 as a Year 3 option.

---

## 2. Layer 1: Application Isolation — TenantPrismaService

This is the **primary enforcement mechanism**. Every query that touches tenant-scoped data goes through `TenantPrismaService`.

### How It Works

```typescript
// tenant-prisma.service.ts
export const TenantContext = new AsyncLocalStorage<TenantStore>();

@Injectable()
export class TenantPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveOrgId(options?: { skipTenantFilter?: boolean }): string | undefined {
    const store = TenantContext.getStore();
    if (!store) {
      if (options?.skipTenantFilter) return undefined;
      throw new ForbiddenException('Tenant context missing');  // hard fail — never silent
    }
    return store.organizationId;
  }

  async findMany(model: string, args: any = {}): Promise<unknown[]> {
    const orgId = this.resolveOrgId(args.options);
    const where = orgId ? { ...args.where, organizationId: orgId } : args.where;
    return (this.prisma as any)[model].findMany({ ...args, where });
  }

  // create, update, updateMany, delete, count — same pattern
  // .raw getter exposes PrismaService directly for SUPER_ADMIN / cross-tenant operations
}
```

### Context Seeding — TenantMiddleware

```typescript
// tenant.middleware.ts
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as UserPayload | undefined;
    if (user?.orgId) {
      // Runs the entire async chain inside the tenant context store
      TenantContext.run({ organizationId: user.orgId }, next);
    } else {
      next(); // Auth routes (/auth/*) — no context needed
    }
  }
}
```

**Applied in AppModule:**
```typescript
configure(consumer: MiddlewareConsumer) {
  consumer
    .apply(TenantMiddleware)
    .exclude({ path: 'api/v1/auth/(.*)', method: RequestMethod.ALL })
    .forRoutes({ path: '*', method: RequestMethod.ALL });
}
```

The middleware runs **after** `JwtAuthGuard` (which populates `req.user`). This ordering is critical.

### Guard Execution Order

```
Request arrives
    │
    ├─ ThrottlerGuard        (global — checks rate limit before anything)
    ├─ JwtAuthGuard          (global — validates JWT, sets req.user)
    ├─ TenantMiddleware      (sets AsyncLocalStorage from req.user.orgId)
    └─ RolesGuard            (global — checks @Roles() against req.user.role)
```

---

## 3. Layer 2: PostgreSQL RLS — Defence-in-Depth

RLS is applied as a **second layer**. If a bug in the application layer accidentally omits `organizationId` from a query, the database itself enforces isolation.

### Implementation Plan (Phase 2 Migration)

```sql
-- 1. Create app role (connection pool uses this role)
CREATE ROLE opsnext_app LOGIN PASSWORD '...';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO opsnext_app;
REVOKE DELETE ON "AuditLog" FROM opsnext_app;  -- AuditLog is immutable

-- 2. Create admin role (migrations and SUPER_ADMIN ops bypass RLS)
CREATE ROLE opsnext_admin SUPERUSER LOGIN PASSWORD '...';

-- 3. Enable RLS on all tenant tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'Team', 'TeamMember', 'UserInvite', 'RefreshToken',
    'PasswordReset', 'Contact', 'Account', 'Lead', 'Opportunity'
    -- ... all tables
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- 4. Create tenant isolation policy
-- NestJS sets this session variable at connection checkout from pool
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['User', 'Contact', 'Account' /*, ... */] LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
       USING (
         "organizationId" = current_setting(''app.current_org_id'', true)::uuid
         OR current_user = ''opsnext_admin''
       )',
      t
    );
  END LOOP;
END;
$$;

-- 5. AuditLog: never allow DELETE or UPDATE via RLS
CREATE POLICY audit_append_only ON "AuditLog"
  AS RESTRICTIVE
  FOR DELETE USING (false);
-- UPDATE is already blocked by REVOKE
```

### Setting Context in Prisma (Phase 2)

```typescript
// In TenantPrismaService, before each query:
await this.prisma.$executeRaw`
  SELECT set_config('app.current_org_id', ${orgId}, true)
`;
```

This sets the PG session variable for the duration of the transaction.

---

## 4. SUPER_ADMIN Exception

SUPER_ADMIN users operate across all tenants. They bypass:
- `RolesGuard` role checks (the guard explicitly short-circuits for `SUPER_ADMIN`).
- `TenantMiddleware` context seeding (they have no `orgId` in JWT; middleware detects this and skips).
- `TenantPrismaService` enforcement (SUPER_ADMIN calls use `.raw` accessor or pass `skipTenantFilter: true`).
- PostgreSQL RLS (SUPER_ADMIN connects as `opsnext_admin` role).

**SUPER_ADMIN endpoints** (all require `role === SUPER_ADMIN` verified by guard):
- `GET /api/v1/organizations` — list all orgs
- `POST /api/v1/organizations` — create new tenant
- `PATCH /api/v1/organizations/:id/suspend` — suspend a tenant
- `DELETE /api/v1/organizations/:id` — schedule deletion
- `GET /api/v1/audit-logs` — cross-tenant audit access

---

## 5. Cross-Tenant Operations (Application Layer)

Some operations legitimately span tenants or bypass tenant scoping. These are **always** performed with explicit authorization checks and use `PrismaService` directly (not `TenantPrismaService`).

| Operation | Service | Justification |
|---|---|---|
| Login email lookup | `AuthService.login` | Email is unique only within org; need global lookup first |
| Find user by email for invite | `UsersService.findByEmail` | Auth need; result scoped in downstream logic |
| AuditLog writes | `AuditService.log` | Always uses raw PrismaService; orgId provided explicitly |
| Token refresh | `AuthService.refresh` | Token lookup by hash (no orgId yet); orgId resolved from token record |
| Password reset token lookup | `AuthService.resetPassword` | Same pattern as refresh |
| Organization stats | `OrganizationsService.getStats` | SUPER_ADMIN aggregate queries |

**Rule:** Any code that calls `this.prisma.*` directly (bypassing TenantPrismaService) must include an explicit code comment explaining why tenant scoping is intentionally bypassed.

---

## 6. Tenant Isolation Test Matrix

These tests are **mandatory** and must pass before any feature is considered complete.

### Unit Tests (TenantPrismaService)

| Scenario | Expected |
|---|---|
| Call `findMany` with TenantContext set | Adds `organizationId` to WHERE clause |
| Call `findMany` without TenantContext | Throws `ForbiddenException('Tenant context missing')` |
| Call `findMany` with `skipTenantFilter: true` without context | Executes without orgId filter |
| Call `create` with TenantContext | Injects `organizationId` into data |
| Call `update` with TenantContext | Injects `organizationId` into WHERE clause |

### Integration Tests (cross-tenant isolation)

```typescript
describe('Cross-tenant isolation', () => {
  it('cannot read another org user', async () => {
    // org A user tries to GET /users/:id where :id belongs to org B
    const response = await request(app.getHttpServer())
      .get(`/api/v1/users/${orgBUser.id}`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(response.status).toBe(404);  // not 403 — never confirm existence
  });

  it('cannot update another org record', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/contacts/${orgBContact.id}`)
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ firstName: 'Hacker' });

    expect(response.status).toBe(404);
  });

  it('list endpoint never returns cross-tenant records', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${orgAToken}`);

    const ids = response.body.data.map((u: any) => u.id);
    expect(ids).not.toContain(orgBUser.id);
  });
});
```

---

## 7. Tenant Lifecycle

```
Organization.status transitions:

ACTIVE
  │
  ├──[Admin suspends]──────────────────► SUSPENDED
  │                                          │
  │                                          └──[Admin reactivates]──► ACTIVE
  │
  └──[SUPER_ADMIN schedules deletion]──► PENDING_DELETION
                                              │
                                              └──[30-day cleanup job]──► (deleted)
```

**SUSPENDED behavior:**
- All API requests from this org's users return `403 ERR_ORG_SUSPENDED`.
- Existing data is preserved.
- Re-activation returns to ACTIVE immediately.

**PENDING_DELETION behavior:**
- Same as SUSPENDED for login/API access.
- 30-day delay before actual data deletion (allows recovery if accidental).
- A scheduled BullMQ job checks daily for orgs with `deletionScheduledAt < now()` and hard-deletes the org + all cascading data.
- Before deletion: exports a final data archive to object storage and emails it to all ADMIN users.
