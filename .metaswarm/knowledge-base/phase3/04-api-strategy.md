# OpsNext CRM — API Strategy
## Phase 3: Architecture Design

**Document ID:** ARCH-004  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Implementation Anchor  
**Input documents:** FR-001 (NFR sections), ARCH-001, ARCH-003

---

## 1. API Design Principles

1. **REST over JSON** — predictable, cache-friendly, tool-supported, easy to self-host.
2. **Versioned from day one** — all routes prefixed `/api/v1/`. Breaking changes require a new version, never modify v1 behavior.
3. **Every UI action = API endpoint** — no UI-only workflows (API parity principle from FR-001).
4. **RFC 7807 error format** — all errors return `application/problem+json`.
5. **Pagination on all list endpoints** — no unbounded result sets.
6. **OpenAPI at `/api/docs`** — auto-generated from NestJS decorators; always up-to-date.
7. **Idempotent writes where possible** — PUT is idempotent; POST is not. Use PATCH for partial updates.

---

## 2. URL Conventions

```
Base:   /api/v1

# Collection
GET     /api/v1/contacts              List contacts (paginated)
POST    /api/v1/contacts              Create contact

# Resource
GET     /api/v1/contacts/:id          Get single contact
PATCH   /api/v1/contacts/:id          Partial update
DELETE  /api/v1/contacts/:id          Soft delete (set isActive=false)

# Sub-resources
GET     /api/v1/contacts/:id/activities
POST    /api/v1/contacts/:id/tags

# Actions (not CRUD — use verb noun)
POST    /api/v1/leads/:id/convert     Convert lead → contact + opportunity
POST    /api/v1/opportunities/:id/won Mark opportunity won
POST    /api/v1/opportunities/:id/lost Mark opportunity lost
POST    /api/v1/users/invite/accept   Accept an invitation
POST    /api/v1/contacts/import       Bulk import via CSV

# Auth (special prefix, separate from resource routes)
POST    /api/v1/auth/register
POST    /api/v1/auth/login
POST    /api/v1/auth/refresh
POST    /api/v1/auth/logout
POST    /api/v1/auth/forgot-password
POST    /api/v1/auth/reset-password
```

**Rules:**
- IDs in paths are always UUIDs — validated with `ParseUUIDPipe`.
- Path segments are **kebab-case** (`/forgot-password`, `/invite/accept`).
- Query params are **camelCase** (`?sortBy=createdAt&order=asc`).
- No verbs in resource paths (use HTTP method + action sub-route instead).

---

## 3. HTTP Status Codes

| Scenario | Code |
|---|---|
| Successful GET/PATCH response with body | 200 |
| Successful POST that creates a resource | 201 |
| Successful DELETE, PATCH with no body | 204 |
| Validation failure (DTO error) | 400 |
| Missing or invalid JWT | 401 |
| Authenticated but insufficient role | 403 |
| Resource not found in org | 404 |
| Duplicate resource (unique constraint) | 409 |
| Rate limit exceeded | 429 |
| Unexpected server error | 500 |

---

## 4. Error Format — RFC 7807 ProblemDetail

All error responses use `Content-Type: application/problem+json`.

```json
{
  "type": "https://opsnext.io/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "Request body contains invalid fields",
  "instance": "/api/v1/users/invite",
  "errors": [
    { "field": "email", "message": "must be an email" },
    { "field": "role", "message": "must be one of: ADMIN, SALES_MANAGER, SALES_REP, READ_ONLY" }
  ]
}
```

**Error type registry:**

| type slug | HTTP | Trigger |
|---|---|---|
| `validation-failed` | 400 | DTO validation failure |
| `invalid-credentials` | 401 | Wrong email/password |
| `token-expired` | 401 | Expired access token |
| `token-reuse-detected` | 401 | Refresh token family violation |
| `account-deactivated` | 401 | Login by deactivated user |
| `account-locked` | 401 | Too many failed login attempts |
| `insufficient-permissions` | 403 | Role check failed |
| `tenant-context-missing` | 403 | TenantPrismaService called without context |
| `org-suspended` | 403 | Organization is suspended |
| `not-found` | 404 | Resource not found or cross-tenant access |
| `conflict` | 409 | Unique constraint / duplicate |
| `rate-limit-exceeded` | 429 | ThrottlerGuard triggered |

**Implementation:** `HttpExceptionFilter` in `apps/api/src/common/filters/` transforms NestJS exceptions into ProblemDetail format.

---

## 5. Pagination

All list endpoints accept and return the same pagination envelope:

**Query params:**
```
GET /api/v1/contacts?page=1&limit=25&sortBy=createdAt&order=desc
```

| Param | Default | Max | Notes |
|---|---|---|---|
| `page` | 1 | — | 1-based |
| `limit` | 25 | 100 | Enforced by `@Max(100)` on DTO |
| `sortBy` | `createdAt` | — | Allowlisted fields per resource |
| `order` | `desc` | — | `asc` or `desc` |

**Response envelope:**
```json
{
  "data": [ ... ],
  "total": 142,
  "page": 1,
  "limit": 25
}
```

**Cursor-based pagination** is deferred to Phase 2+ (needed for large contact lists with real-time updates).

---

## 6. Filtering & Searching

**Filtering** — explicit query params mapped to WHERE conditions:
```
GET /api/v1/contacts?isActive=true&ownerId=<uuid>&source=web
GET /api/v1/opportunities?status=OPEN&stageId=<uuid>&closeDate[gte]=2026-01-01
```

**Full-text search** — `q` query param triggers PostgreSQL `ILIKE` search on indexed columns:
```
GET /api/v1/contacts?q=acme
```
Phase 2+ upgrades to PostgreSQL full-text search (`tsvector`) for contacts and accounts.

**Filter DTO pattern:**
```typescript
class ListContactsQueryDto {
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsOptional() @IsUUID()
  ownerId?: string;

  @IsOptional() @IsString() @MaxLength(200)
  q?: string;

  // pagination fields inherited from PaginationQueryDto
}
```

---

## 7. Rate Limiting

**Provider:** `@nestjs/throttler` backed by Redis (consistent across multiple API instances).

| Scope | Limit | Window |
|---|---|---|
| Global (per tenant) | 300 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute (per IP) |
| Password reset | 3 requests | 1 hour (per email) |
| CSV import | 5 requests | 1 hour (per tenant) |

**Response on limit exceeded:**
```
HTTP 429 Too Many Requests
Retry-After: 47
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1750000000
```

---

## 8. Versioning Strategy

**Current:** URL-based versioning (`/api/v1/`).

**Policy:**
- `v1` is the stable contract. No breaking changes (removing fields, changing types, removing endpoints).
- Additive changes (new optional fields, new endpoints) are non-breaking and can be added to v1.
- Breaking changes require `/api/v2/` and a deprecation period of at minimum 6 months.
- `v1` and `v2` co-exist and are served from the same NestJS process (via `@nestjs/versioning`).

**Deprecation headers:**
```
Deprecation: Sun, 01 Jan 2028 00:00:00 GMT
Sunset: Sun, 01 Jul 2028 00:00:00 GMT
Link: <https://docs.opsnext.io/api/v2>; rel="successor-version"
```

---

## 9. OpenAPI / Swagger Setup

**URL:** `/api/docs` (development + staging; disabled in production via `NODE_ENV`).

**NestJS setup in `main.ts`:**
```typescript
const config = new DocumentBuilder()
  .setTitle('OpsNext CRM API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth')
  .addTag('users')
  .addTag('organizations')
  .addTag('contacts')
  .addTag('leads')
  .addTag('opportunities')
  .addTag('activities')
  .addTag('tasks')
  .addTag('reports')
  .build();
```

**Controller decorators used:**
- `@ApiTags('module-name')` — groups endpoints
- `@ApiBearerAuth()` — marks JWT-protected routes
- `@ApiOperation({ summary })` — one-line description
- `@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNoContentResponse` — success shapes
- `@ApiBadRequestResponse`, `@ApiNotFoundResponse`, `@ApiForbiddenResponse` — error shapes
- `@ApiProperty()` on all DTO fields — documents request/response body shapes

---

## 10. Request Validation

**Approach:** NestJS `ValidationPipe` with `class-validator` + `class-transformer`.

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strips unknown fields (prevents mass assignment)
  forbidNonWhitelisted: true, // 400 on unknown fields (surfaces mistakes early)
  transform: true,           // coerces types (string '25' → number 25 for @IsInt())
  transformOptions: {
    enableImplicitConversion: true,  // allows @IsBoolean() to accept 'true'/'false'
  },
}));
```

**DTO decorator guidelines:**
- All required fields: `@IsString()`, `@IsEmail()`, `@IsUUID()`, etc. (no `@IsOptional()`).
- Optional fields: `@IsOptional()` first, then type decorator.
- Enums: `@IsEnum(Role)`.
- Numbers from query string: `@Type(() => Number)` + `@IsInt()`.
- Booleans from query string: `@Transform(({ value }) => value === 'true')` + `@IsBoolean()`.

---

## 11. Response Serialization

**Approach:** Class-based response DTOs with `@Exclude()` on sensitive fields.

```typescript
class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;

  @Exclude()
  passwordHash: string; // never returned

  @Exclude()
  failedLoginCount: number;
}
```

For Phase 1, `select` clauses in Prisma queries exclude sensitive fields at the DB level (no passwordHash in response). Response DTO classes will be formalized in Phase 2.

---

## 12. CORS Configuration

```typescript
app.enableCors({
  origin: process.env.WEB_URL ?? 'http://localhost:3000',
  credentials: true,           // required for httpOnly cookie
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

In production, `WEB_URL` is set to the verified frontend domain. Wildcard `*` is never used (breaks `credentials: true`).
