# OpsNext CRM — System Architecture
## Phase 3: Architecture Design

**Document ID:** ARCH-001  
**Version:** 2.0  
**Date:** 2026-06-17  
**Status:** Approved — Implementation Anchor  
**Input documents:** BRD-001, FR-001, DM-001 through DM-005

---

## 1. Architecture Style

OpsNext CRM is a **modular monolith** in Phase 1 (all NestJS modules deployed as a single process). The internal module structure follows bounded context boundaries (from DM-001), making a future split into microservices feasible without rewriting business logic.

**Key architectural decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| Deployment model | Modular monolith | Operational simplicity for a <10-team SaaS; easier to debug, deploy, and iterate |
| Frontend rendering | Next.js App Router (SSR + Client Components) | SEO for marketing pages, fast initial load, progressive enhancement |
| API style | REST (JSON) | Universal tooling, easy to self-host, OpenAPI documentation |
| Auth | JWT RS256 + httpOnly cookie | Stateless API, asymmetric keys (public key distributable), XSS-safe tokens |
| Multi-tenancy | Row-level isolation | Single schema, lowest operational complexity for Phase 1 |
| Queue/Cache | Redis (BullMQ + ioredis) | Email delivery, webhook retries, rate limiting, permission cache |
| DB | PostgreSQL 16 | ACID, JSONB for flexible fields, native UUID, excellent Prisma support |

---

## 2. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          External World                                   │
│  Browser / Mobile / API Clients / Webhooks / SMTP / IMAP                 │
└──────────────┬──────────────────────────────┬───────────────────────────┘
               │ HTTPS :443                   │ HTTPS :443
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────────────────┐
│   Next.js Web App        │    │            NestJS API                    │
│   apps/web               │    │            apps/api                      │
│                          │    │                                          │
│  ┌───────────────────┐   │    │  ┌─────────────────────────────────┐    │
│  │ App Router Pages  │   │    │  │  Global Layer                   │    │
│  │ (auth, dashboard) │   │    │  │  ValidationPipe, Helmet,         │    │
│  │                   │   │    │  │  JwtAuthGuard, RolesGuard,       │    │
│  │ TanStack Query    │◄──┼────┼──│  TenantMiddleware, ThrottlerGuard│    │
│  │ React Hook Form   │   │    │  └──────────────┬──────────────────┘    │
│  │ Axios interceptors│   │    │                 │                        │
│  └───────────────────┘   │    │  ┌──────────────┴──────────────────┐    │
│                          │    │  │  Feature Modules                 │    │
│  Port: 3000              │    │  │  Auth · Users · Organizations    │    │
└──────────────────────────┘    │  │  Contacts · Accounts · Leads     │    │
                                │  │  Opportunities · Activities       │    │
                                │  │  Communication · Analytics        │    │
                                │  │  Platform                         │    │
                                │  └──────────────┬──────────────────┘    │
                                │                 │                        │
                                │  ┌──────────────┴──────────────────┐    │
                                │  │  Infrastructure Layer            │    │
                                │  │  PrismaModule · AuditModule      │    │
                                │  │  MailModule · EventEmitter2      │    │
                                │  │  BullMQ queues                   │    │
                                │  └──────────────┬──────────────────┘    │
                                │                 │                        │
                                │  Port: 3001     │                        │
                                └─────────────────┼────────────────────────┘
                                                  │
               ┌──────────────────────────────────┼───────────────────────┐
               │                                  │                        │
               ▼                                  ▼                        ▼
┌──────────────────────┐          ┌──────────────────────┐  ┌────────────────────┐
│   PostgreSQL 16      │          │   Redis 7             │  │  Object Storage    │
│                      │          │                       │  │  (S3-compatible)   │
│  Primary DB          │          │  - BullMQ queues      │  │                    │
│  Row-level tenancy   │          │  - Rate limit counters│  │  - Avatars         │
│  RLS (defence-depth) │          │  - Permission cache   │  │  - Exports         │
│  Port: 5432          │          │  - Session metadata   │  │  - Attachments     │
└──────────────────────┘          │  Port: 6379           │  └────────────────────┘
                                  └──────────────────────┘
```

---

## 3. Technology Stack (Pinned Versions)

| Layer | Package | Version |
|-------|---------|---------|
| Runtime | Node.js | 20 LTS |
| Frontend framework | Next.js | 14.2.x |
| Backend framework | NestJS | 10.x |
| ORM | Prisma | 5.x |
| DB | PostgreSQL | 16-alpine (Docker) |
| Cache/Queue | Redis | 7-alpine (Docker) |
| Queue library | BullMQ | 5.x |
| Auth | @nestjs/jwt, @nestjs/passport | 10.x |
| Validation | class-validator, class-transformer | 0.14.x |
| HTTP client | Axios | 1.x |
| State management | TanStack Query | v5 |
| Form validation | React Hook Form + Zod | 7.x + 3.x |
| CSS | Tailwind CSS | 3.x |
| Testing | Jest + Supertest | 29.x |
| E2E Testing | Playwright | 1.x |
| Package manager | pnpm | 9.12.x |
| Monorepo tooling | Turborepo | 2.x |
| Container | Docker + Docker Compose | 27.x |

---

## 4. Request Lifecycle

```
Browser Request
    │
    ▼
Next.js (apps/web)
    │  Axios with interceptors
    │  - Attaches Authorization: Bearer <access_token> header
    │  - On 401: auto-refresh then retry
    │
    ▼ HTTP to /api/v1/...
NestJS (apps/api)
    │
    ├─ Helmet (security headers)
    ├─ ThrottlerGuard (rate limiting via Redis — 300 req/min/tenant)
    ├─ TenantMiddleware (seeds TenantContext from JWT orgId)
    ├─ JwtAuthGuard (verifies RS256 JWT, populates req.user)
    ├─ RolesGuard (checks @Roles() decorator — fail-closed)
    ├─ ValidationPipe (class-validator on DTO, whitelist + transform)
    │
    ├─ Controller method
    │      │
    │      ▼
    │  Service method
    │      │
    │      ├─ TenantPrismaService (all queries auto-scoped to orgId)
    │      ├─ AuditService (fire-and-forget, never throws)
    │      └─ EventEmitter2 (domain events, after-commit)
    │
    └─ Response: JSON with HTTP status
         - 200/201/204 on success
         - RFC 7807 ProblemDetail on error
```

---

## 5. Authentication Flow

```
Register / Login
    │
    ├─ POST /api/v1/auth/register OR /api/v1/auth/login
    │
    ├─ Server returns:
    │   Body:   { accessToken: "eyJ..." }         (15-min RS256 JWT)
    │   Cookie: refresh_token=<raw_token>          (httpOnly, Secure, SameSite=Strict, Path=/api/v1/auth)
    │
    ├─ Client stores accessToken IN MEMORY only (never localStorage, never sessionStorage)
    │
    └─ On 401 (access token expired):
        │
        └─ POST /api/v1/auth/refresh (cookie sent automatically by browser)
            ├─ Server verifies refresh token, rotates it, returns new accessToken
            └─ Client retries original request with new accessToken
```

---

## 6. Infrastructure — Docker Compose (Development)

```yaml
# Summary of docker-compose.yml services
services:
  db:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    env: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes

  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [db, redis]
    env: DATABASE_URL, REDIS_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, ...

  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [api]
    env: NEXT_PUBLIC_API_URL=http://api:3001
```

---

## 7. Environment Variables

### apps/api — required

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Prisma connection string |
| `REDIS_URL` | `redis://localhost:6379` | BullMQ + cache |
| `JWT_PRIVATE_KEY` | `-----BEGIN RSA...` | RS256 signing key (newlines as `\n`) |
| `JWT_PUBLIC_KEY` | `-----BEGIN PUBLIC...` | RS256 verification key |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token TTL |
| `APP_URL` | `https://app.opsnext.io` | Used in email links |
| `SMTP_HOST` | `smtp.sendgrid.net` | |
| `SMTP_PORT` | `587` | |
| `SMTP_USER` | `apikey` | |
| `SMTP_PASS` | `SG.xxx` | |
| `SMTP_FROM` | `noreply@opsnext.io` | |
| `NODE_ENV` | `production` | Disables console-log email transport |

### apps/web — required

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.opsnext.io` | Public (browser-visible) |

---

## 8. Security Architecture

| Threat | Mitigation |
|---|---|
| XSS access token theft | Access token in memory only (not DOM-accessible storage) |
| CSRF on cookie-based refresh | SameSite=Strict on refresh_token cookie |
| Token replay | Refresh token family invalidation on reuse detection |
| Brute force login | 5-attempt lockout, 30-min duration, Redis rate limiting |
| Tenant data leakage | TenantPrismaService AsyncLocalStorage + PostgreSQL RLS |
| SQL injection | Prisma parameterized queries (no raw SQL in feature code) |
| Mass assignment | ValidationPipe whitelist: true strips unknown fields |
| Clickjacking | Helmet X-Frame-Options: DENY |
| Privilege escalation | RolesGuard fail-closed; role hierarchy enforced in UsersService |
| Audit evasion | AuditService uses direct PrismaService — cannot be skipped by tenant context |

---

## 9. Scalability Path

**Phase 1 (current):** Single-process NestJS on one server. PostgreSQL on a managed instance (e.g., Supabase, Railway, Neon). Handles 10–50 concurrent tenants comfortably.

**Phase 2 (Year 2):**
- Horizontal NestJS scaling behind a load balancer (stateless by design — JWT + DB sessions).
- Read replicas for PostgreSQL (analytics queries directed to replica).
- Redis Streams replace in-process EventEmitter2 for cross-process event delivery.
- BullMQ workers extracted to separate processes (email, webhook delivery, CSV exports).

**Phase 3 (Year 3):**
- Decompose into microservices along bounded context lines (DM-001).
- Each bounded context becomes an independent deployable.
- Communication via Redis Streams (already the Phase 2 event bus).
