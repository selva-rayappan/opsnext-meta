# OpsNext CRM — Module Boundaries
## Phase 3: Architecture Design

**Document ID:** ARCH-003  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Implementation Anchor  
**Input documents:** DM-001, ARCH-001

---

## 1. NestJS Module Map

Each bounded context maps 1:1 to a NestJS module (or a small cluster for the Platform context). This structure ensures that module-level injection boundaries enforce context isolation.

```
apps/api/src/
│
├── app.module.ts                    # Root — wires everything
│
├── prisma/                          # Infrastructure — GLOBAL
│   ├── prisma.module.ts             # @Global() — exports PrismaService + TenantPrismaService
│   ├── prisma.service.ts
│   └── tenant-prisma.service.ts
│
├── common/                          # Shared infrastructure (not a NestJS module)
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── middleware/
│   │   └── tenant.middleware.ts
│   ├── filters/
│   │   └── http-exception.filter.ts    # RFC 7807 ProblemDetail format
│   ├── pipes/
│   │   └── parse-uuid.pipe.ts          # Already using ParseUUIDPipe from @nestjs/common
│   └── interceptors/
│       └── audit-trail.interceptor.ts  # Phase 2: auto-audit on write operations
│
├── audit/                           # Infrastructure — GLOBAL
│   ├── audit.module.ts              # @Global() — exports AuditService
│   └── audit.service.ts
│
├── mail/                            # Infrastructure
│   ├── mail.module.ts               # exports MailService
│   └── mail.service.ts
│
├── auth/                            # Context: Identity & Access (auth sub-domain)
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── reset-password.dto.ts
│
├── users/                           # Context: Identity & Access (user sub-domain)
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       ├── invite-user.dto.ts
│       └── list-users-query.dto.ts
│
├── organizations/                   # Context: Identity & Access (org sub-domain)
│   ├── organizations.module.ts
│   ├── organizations.service.ts
│   └── organizations.controller.ts  # SUPER_ADMIN only; added in Phase 2
│
├── contacts/                        # Context: Contact Management [Phase 2]
│   ├── contacts.module.ts
│   ├── contacts.service.ts
│   ├── contacts.controller.ts
│   └── dto/
│
├── accounts/                        # Context: Contact Management [Phase 2]
│   ├── accounts.module.ts
│   ├── accounts.service.ts
│   └── accounts.controller.ts
│
├── leads/                           # Context: Sales [Phase 3]
│   ├── leads.module.ts
│   ├── leads.service.ts
│   └── leads.controller.ts
│
├── pipelines/                       # Context: Sales [Phase 3]
│   ├── pipelines.module.ts
│   ├── pipelines.service.ts
│   └── pipelines.controller.ts
│
├── opportunities/                   # Context: Sales [Phase 4]
│   ├── opportunities.module.ts
│   ├── opportunities.service.ts
│   └── opportunities.controller.ts
│
├── activities/                      # Context: Activity [Phase 5]
│   ├── activities.module.ts
│   ├── activities.service.ts
│   └── activities.controller.ts
│
├── tasks/                           # Context: Activity [Phase 5]
│   ├── tasks.module.ts
│   ├── tasks.service.ts
│   └── tasks.controller.ts
│
├── email/                           # Context: Communication [Phase 6]
│   ├── email.module.ts
│   ├── email.service.ts
│   └── email.controller.ts
│
└── reports/                         # Context: Analytics [Phase 7]
    ├── reports.module.ts
    ├── reports.service.ts
    └── reports.controller.ts
```

---

## 2. Module Dependency Graph

```
AppModule
  │
  ├── ConfigModule (global, @nestjs/config)
  ├── ThrottlerModule (global, Redis-backed)
  ├── EventEmitterModule (global, event bus)
  │
  ├── PrismaModule (@Global)          ← no dependencies
  ├── AuditModule (@Global)           ← depends on PrismaModule
  ├── MailModule                      ← depends on ConfigModule
  │
  ├── AuthModule ────────────────────────────────────────────┐
  │   imports: PrismaModule, MailModule, JwtModule, Passport │
  │   exports: AuthService, JwtModule                        │
  │                                                          │
  ├── UsersModule ─────────────────────────────────────────┐ │
  │   imports: PrismaModule, AuditModule, MailModule,      │ │
  │            ConfigModule                                │ │
  │   exports: UsersService                                │ │
  │                                                        │ │
  ├── OrganizationsModule                                  │ │
  │   imports: PrismaModule                                │ │
  │   exports: OrganizationsService                        │ │
  │                                                        │ │
  ├── [Phase 2+] ContactsModule                            │ │
  │   imports: PrismaModule, AuditModule                   │ │
  │                                                        │ │
  ├── [Phase 2+] AccountsModule                            │ │
  │   imports: PrismaModule, AuditModule                   │ │
  │                                                        │ │
  └── AuthModule also imports UsersModule ─────────────────┘─┘
      (for invite acceptance — cross-module but same context)
```

**Circular dependency prevention:**
- `UsersModule` exports `UsersService`.
- `AuthModule` imports `UsersModule` (for `acceptInvite`).
- `UsersModule` does NOT import `AuthModule` — this keeps the graph acyclic.
- If a future feature needs UsersService inside AuthService AND AuthService inside UsersService, introduce a `SharedAuthModule` that exports only the shared primitives.

---

## 3. Global Modules

| Module | Why global | What it provides |
|---|---|---|
| `ConfigModule` | Used everywhere; single source of env vars | `ConfigService` |
| `PrismaModule` | DB access needed in every feature module | `PrismaService`, `TenantPrismaService` |
| `AuditModule` | Audit logging is cross-cutting | `AuditService` |
| `EventEmitterModule` | Domain events are cross-cutting | `EventEmitter2` |
| `ThrottlerModule` | Rate limiting is applied globally | `ThrottlerGuard` |

**Non-global modules that might seem global:**
- `MailModule` — imported explicitly by modules that need it. This makes the email dependency visible in the module graph, which aids testing (mock MailModule only where needed).
- `JwtModule` — lives inside `AuthModule`, exported for use in strategies. Feature modules validate JWTs via `JwtAuthGuard` without importing `JwtModule` directly.

---

## 4. Controller Routing Table

All routes are prefixed `/api/v1` (set in `main.ts`).

| Module | Controller prefix | Key routes |
|---|---|---|
| Auth | `/auth` | POST /register, /login, /refresh, /logout, /forgot-password, /reset-password |
| Users | `/users` | GET /me, PATCH /me/password, POST /invite, POST /invite/accept, GET /, GET /:id, PATCH /:id/role, PATCH /:id/deactivate, PATCH /:id/reactivate, DELETE /:id |
| Organizations | `/organizations` | GET /:id, POST / (SUPER_ADMIN), PATCH /:id/suspend, DELETE /:id |
| Contacts [P2] | `/contacts` | CRUD + search + merge + import |
| Accounts [P2] | `/accounts` | CRUD + search + contacts |
| Leads [P3] | `/leads` | CRUD + convert + bulk import |
| Pipelines [P3] | `/pipelines` | CRUD + stages |
| Opportunities [P4] | `/opportunities` | CRUD + stage-change + won/lost |
| Activities [P5] | `/activities` | CRUD + filter by entity |
| Tasks [P5] | `/tasks` | CRUD + assign + complete |
| Email [P6] | `/email` | threads, messages, templates |
| Reports [P7] | `/reports` | saved reports, dashboards, export |

---

## 5. Shared Package (`packages/shared`)

The shared package contains only types/interfaces/constants that both `apps/api` and `apps/web` consume. It has zero runtime dependencies on NestJS or Next.js.

```
packages/shared/src/
├── index.ts                 # barrel export
└── types/
    ├── user.types.ts        # Role enum, UserPayload
    ├── auth.types.ts        # AuthTokens, LoginRequest, RegisterRequest
    └── organization.types.ts # OrganizationStatus enum, Organization interface
```

**Rules for shared package:**
- No framework-specific imports (no `@nestjs/*`, no `next/*`).
- Types only — no runtime logic.
- If a type needs to be extended (e.g., adding a field to `UserPayload`), both API and Web must be updated atomically (pnpm workspace makes this a single commit).

---

## 6. Module Boundary Rules

1. **No direct DB access from controllers** — controllers call services, services call PrismaService/TenantPrismaService.
2. **No business logic in DTOs** — DTOs validate shape and format only. Business rules live in services.
3. **No cross-context service injection** — `ContactsService` does not inject `LeadsService`. Cross-context communication uses domain events.
4. **Exception: auth sub-domain** — `AuthModule` imports `UsersModule` because user creation on invite acceptance is a shared concern within the IAM context. This is intentional, not a violation.
5. **TenantPrismaService is always used inside `withTenant()` in services** — never called with an implicit context that might be missing.
6. **AuditService is always fire-and-forget** — `await this.audit.log(...)` is safe but AuditService internally wraps in try/catch and never rethrows.
