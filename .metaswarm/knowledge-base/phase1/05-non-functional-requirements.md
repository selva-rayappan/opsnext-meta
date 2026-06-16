# OpsNext CRM — Non-Functional Requirements (Phase 1)

**Document status:** Approved for Phase 1 development  
**Owner:** Technical Architect & Security Lead  
**Last updated:** 2026-06-16  
**Stack:** Next.js 14 · NestJS · TypeScript (strict) · Prisma · PostgreSQL · Redis  
**Deployment models:** Self-hosted (Docker Compose) and Cloud-hosted SaaS

---

## Table of Contents

1. [Performance Requirements](#1-performance-requirements)
2. [Security Requirements](#2-security-requirements)
3. [Scalability Requirements](#3-scalability-requirements)
4. [Availability & Reliability](#4-availability--reliability)
5. [Maintainability & Operability](#5-maintainability--operability)
6. [Compliance](#6-compliance)
7. [API Contract Requirements](#7-api-contract-requirements)
8. [Testing Requirements](#8-testing-requirements)

---

## 1. Performance Requirements

### 1.1 API Response Time SLOs

All measurements are end-to-end HTTP response time at the load balancer, excluding network latency to the client. SLOs apply under normal load (up to the concurrent user target defined in §1.4).

| Endpoint category | p50 | p95 | p99 |
|---|---|---|---|
| Read — simple lookup (GET /leads/:id) | < 50 ms | < 150 ms | < 400 ms |
| Read — paginated list (GET /leads?page=N) | < 100 ms | < 300 ms | < 600 ms |
| Read — search / filtered query | < 150 ms | < 400 ms | < 800 ms |
| Write — create / update (POST, PATCH) | < 100 ms | < 300 ms | < 600 ms |
| Write — delete (soft-delete) | < 75 ms | < 200 ms | < 400 ms |
| Authentication — login | < 200 ms | < 500 ms | < 1 000 ms |
| Authentication — token refresh | < 50 ms | < 150 ms | < 300 ms |
| File upload (< 5 MB) | < 500 ms | < 1 500 ms | < 3 000 ms |

**Degraded-mode ceiling:** No API request (excluding file uploads) shall exceed 5 000 ms before the server returns an error response. Requests that would exceed this limit MUST be terminated with HTTP 503 and a `Retry-After` header.

### 1.2 Frontend Core Web Vitals

Measured on a mid-range device (Moto G4 class) on a 4G connection. Targets align with Google's "Good" thresholds.

| Metric | Target | Hard limit |
|---|---|---|
| Largest Contentful Paint (LCP) | < 2.5 s | < 4.0 s |
| First Input Delay (FID) / INP | < 100 ms | < 200 ms |
| Cumulative Layout Shift (CLS) | < 0.10 | < 0.25 |
| Time to First Byte (TTFB) | < 800 ms | < 1 800 ms |
| Total Blocking Time (TBT) | < 200 ms | < 600 ms |

Server-Side Rendering (SSR) via Next.js App Router is mandatory for all authenticated pages. Static generation is used for marketing/public pages.

### 1.3 Database Query Time Targets

| Query type | p50 | p95 | p99 |
|---|---|---|---|
| Primary key / unique index lookup | < 5 ms | < 20 ms | < 50 ms |
| Single-table filtered query (indexed columns) | < 10 ms | < 40 ms | < 100 ms |
| Multi-table join (2–3 tables) | < 20 ms | < 80 ms | < 200 ms |
| Aggregation / reporting query | < 100 ms | < 500 ms | < 1 000 ms |
| Full-text search (pg_trgm or tsvector) | < 50 ms | < 200 ms | < 500 ms |

Queries that exceed the p99 threshold must be flagged in slow-query logs (threshold: 200 ms). All queries must run through Prisma's generated client; raw SQL is only permitted for reporting queries and must be reviewed by the technical lead.

### 1.4 Concurrent User Targets

| Scope | Year 1 target | Year 2 target |
|---|---|---|
| Per-tenant concurrent sessions | 25 | 50 |
| System-wide concurrent sessions | 250 (10 tenants × 25) | 5 000 (100 tenants × 50) |
| Peak burst (2× sustained, 30-second window) | 500 | 10 000 |

Load tests (k6) must validate Year 1 targets before each production release.

### 1.5 Background Job Processing SLOs

| Job type | Start latency (time from trigger to first execution) | Completion SLO |
|---|---|---|
| Email notification dispatch | < 30 s | 95% within 2 min |
| Email sync (IMAP/OAuth pull) | < 5 min (polling interval) | 99% within 10 min |
| Data export (GDPR / CSV) | < 60 s | 95% within 5 min |
| Webhook delivery (outbound) | < 10 s | 95% within 1 min; 3 retries with exponential backoff |
| Scheduled reports | Within 5 min of scheduled time | 99% within 15 min |

Failed jobs must be retried with exponential backoff (base 5 s, max 5 attempts). After max retries, the job is moved to a dead-letter queue and an alert is fired.

---

## 2. Security Requirements

### 2.1 Authentication

**JWT specification:**

| Parameter | Value |
|---|---|
| Signing algorithm | RS256 (asymmetric, 2048-bit RSA key pair) |
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| Access token storage | In-memory only on the client (never localStorage) |
| Refresh token storage | httpOnly cookie; `Secure=true`; `SameSite=Strict`; `Path=/api/auth` |
| Token payload | `sub` (userId), `tenantId`, `role`, `sessionId`, `iat`, `exp` |
| Key rotation | Private key rotation every 90 days; public keys served via JWKS endpoint (`/api/.well-known/jwks.json`) |

Refresh tokens are stored server-side in Redis (`session:{sessionId}`) with TTL matching the 7-day expiry. On each use, the refresh token is rotated (new token issued, old token invalidated — one-time use). Token family tracking is implemented to detect refresh token theft (if a revoked token is presented, the entire family is invalidated).

### 2.2 Authorization

- **RBAC enforcement:** Role checks are applied at the NestJS Guard layer (`@UseGuards(JwtAuthGuard, RolesGuard)`) on every controller method. No endpoint is publicly accessible without an explicit `@Public()` decorator.
- **Tenant isolation:** Every database query is scoped by `tenantId` using a NestJS `ClsModule` (continuation-local storage) middleware that extracts `tenantId` from the verified JWT. Prisma middleware intercepts all queries and enforces `WHERE tenant_id = :tenantId`. Missing `tenantId` on a query throws an internal error (fail-closed).
- **Permission model:** Owner > Admin > Manager > Sales Rep > Viewer. Permissions are defined in a static permission matrix (not in the database) to prevent privilege escalation via database manipulation.
- **Cross-tenant access:** Zero-trust. No API path allows cross-tenant data access. Super-admin access (for platform operators) is a separate authentication flow with MFA requirement and immutable audit log.

### 2.3 Input Validation

- All NestJS controller inputs are validated via `class-validator` DTOs with `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` applied globally.
- Prisma's parameterized query generation is the sole mechanism for database interaction. Raw SQL interpolation is prohibited in code review.
- File uploads: MIME type verified server-side (not trusting `Content-Type` header); file size limit enforced at the reverse proxy (Nginx: `client_max_body_size 10m`).
- String fields: maximum length enforced at DTO level and as PostgreSQL column constraints.

### 2.4 Secrets Management

- All secrets (database credentials, JWT private keys, OAuth client secrets, SMTP credentials) are loaded exclusively via environment variables.
- Secrets must never appear in: application logs, error responses, stack traces sent to clients, or version control.
- `.env` files are listed in `.gitignore`. A `.env.example` file with placeholder values documents required variables.
- In production (cloud-hosted), secrets are injected via the orchestration platform's secrets store (Docker Swarm secrets or Kubernetes Secrets, sealed with SealedSecrets).
- JWT private keys are stored as PEM-encoded strings in environment variables, not as files mounted in containers (reduces attack surface).

### 2.5 Rate Limiting

| Endpoint group | Limit | Window | Behavior on exceed |
|---|---|---|---|
| Auth — POST /api/v1/auth/login | 10 requests | 15 minutes per IP | HTTP 429, `Retry-After` header, lock account after 5 consecutive failures |
| Auth — POST /api/v1/auth/refresh | 20 requests | 15 minutes per session | HTTP 429 |
| Auth — POST /api/v1/auth/forgot-password | 3 requests | 60 minutes per IP | HTTP 429, silent failure (no enumeration) |
| General API — reads | 300 requests | 1 minute per tenant | HTTP 429 |
| General API — writes | 60 requests | 1 minute per tenant | HTTP 429 |
| File uploads | 10 requests | 10 minutes per tenant | HTTP 429 |

Rate limit state is stored in Redis using a sliding window counter. Per-tenant limits are enforced in addition to per-IP limits to prevent one tenant degrading others.

### 2.6 Transport Security

- HTTPS is enforced for all endpoints. HTTP requests are redirected to HTTPS at the reverse proxy (Nginx `return 301 https://$host$request_uri`).
- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` on all responses.
- **Content Security Policy:** Implemented via Next.js middleware headers. Default policy:
  ```
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' wss:;
  frame-ancestors 'none';
  ```
- **Additional security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- TLS minimum version: TLS 1.2. TLS 1.3 preferred. SSLv3, TLS 1.0, and TLS 1.1 are disabled.
- Cipher suites: Mozilla Intermediate compatibility profile.

### 2.7 Password Policy

| Requirement | Value |
|---|---|
| Minimum length | 12 characters |
| Character classes | Must contain at least 3 of: uppercase, lowercase, digit, special character |
| Maximum length | 128 characters (bcrypt input limit handling) |
| Common password check | Reject passwords in the top-10,000 common passwords list |
| Hashing algorithm | bcrypt, cost factor 12 (re-evaluated annually; increase if hardware allows sub-100 ms hash) |
| Password history | Last 5 passwords may not be reused |
| Breach check | Integration with Have I Been Pwned (k-anonymity API) — Should Have Year 1 |

### 2.8 Session Security

- **Token revocation:** Refresh tokens are stored server-side in Redis. Logout invalidates the token immediately (O(1) deletion). Access tokens are short-lived (15 min) and not individually revocable; acceptable risk given the short window.
- **Concurrent session limits:** Maximum 5 active sessions per user. On login when at limit, the oldest session is revoked. Users can view and revoke individual sessions from account settings.
- **Session fixation:** A new session ID is generated on every successful login.
- **Idle timeout:** If a refresh token is not used for 24 hours, it is invalidated regardless of its 7-day TTL.

### 2.9 Dependency Security

- `npm audit --audit-level=high` runs as a required CI step. Critical or High severity vulnerabilities block merge.
- GitHub Dependabot alerts are enabled for all repositories. Dependabot auto-creates PRs for patch and minor dependency updates.
- A Software Bill of Materials (SBOM) is generated on each release using `cyclonedx-npm`.
- Third-party packages must be pinned to exact versions in `package.json` (no caret or tilde ranges in production dependencies).

### 2.10 Audit Logging

- All sensitive mutations are logged to an immutable audit trail:
  - User login / logout / failed login attempts
  - Password changes and resets
  - Role and permission changes
  - Data exports (GDPR)
  - Record create / update / delete (soft delete)
  - Tenant configuration changes
  - Admin impersonation events
- Audit log format: structured JSON, written to a dedicated `audit_logs` PostgreSQL table with `INSERT`-only access granted to the application user (no `UPDATE` or `DELETE`).
- Audit log fields: `id`, `timestamp`, `tenantId`, `actorId`, `actorRole`, `action`, `resourceType`, `resourceId`, `ipAddress`, `userAgent`, `diff` (before/after for mutations), `correlationId`.
- Audit logs are retained for a minimum of 2 years.

---

## 3. Scalability Requirements

### 3.1 API Tier Horizontal Scaling

The NestJS API tier is **stateless by design**:

- No in-process session state. All session data lives in Redis.
- No local file system dependencies for request processing. File uploads stream directly to object storage.
- All API instances connect to the same PostgreSQL primary and Redis cluster.
- Scaling is achieved by adding API container replicas behind a load balancer (round-robin, with health-check-based removal).

**Year 1 topology:** 2 API replicas (active-active) + 1 PostgreSQL primary + 1 Redis instance.  
**Year 2 topology:** 3–5 API replicas + 1 PostgreSQL primary + 1–2 read replicas + Redis Sentinel or Redis Cluster.

### 3.2 Database Scaling Path

| Phase | Approach | Trigger |
|---|---|---|
| Year 1 (0–10 tenants) | Single PostgreSQL primary, no read replicas | Default |
| Year 1 growth (10–30 tenants) | Add 1 read replica; route read-only queries via Prisma's `$replica` extension | p95 DB CPU > 70% sustained |
| Year 2 (30–100 tenants) | 1 primary + 2 read replicas + PgBouncer connection pooler | Concurrent connections > 80 |
| Beyond 100 tenants | Evaluate schema-per-tenant or database-per-tenant partitioning | p99 query time degradation |

**Connection pooling:** PgBouncer is deployed in transaction mode between NestJS and PostgreSQL. Pool size per API instance: `min: 5`, `max: 20`. Total max connections to PostgreSQL: `num_api_replicas × 20 + 10 (overhead)`.

**Row-level tenancy ceiling:** The current schema (all tenants in shared tables with `tenant_id` column) is validated to scale to approximately **500 tenants** on a single PostgreSQL instance (c5.2xlarge class: 8 vCPU, 16 GB RAM) before query performance degrades below SLO. Database sharding is a Year 3 concern.

### 3.3 Redis Usage

| Key pattern | Contents | TTL | Eviction |
|---|---|---|---|
| `session:{sessionId}` | Refresh token data, userId, tenantId, device info | 7 days | `volatile-lru` |
| `ratelimit:{tenantId}:{endpoint}` | Sliding window counter | 1–60 minutes (window size) | `volatile-lru` |
| `cache:tenant:{tenantId}:settings` | Tenant configuration object | 5 minutes | `volatile-lru` |
| `cache:user:{userId}:permissions` | Resolved permission set | 10 minutes (invalidated on role change) | `volatile-lru` |
| `lock:{resource}:{id}` | Distributed mutex for background jobs | 30 seconds | `volatile-lru` |
| `queue:{jobType}` | Bull/BullMQ job queue | Managed by BullMQ | N/A |

**Eviction policy:** `volatile-lru` (only evicts keys with TTLs). Redis `maxmemory` is set to 512 MB (Year 1); alarm fires at 80% utilization.

**Redis unavailability:** See §4.5.

### 3.4 File and Attachment Storage

| Phase | Storage backend | Configuration |
|---|---|---|
| Year 1 | Local disk (Docker volume) | Path: `/app/uploads`; max file size: 10 MB; max per-tenant storage: 5 GB |
| Year 2 | S3-compatible object storage (AWS S3 or MinIO self-hosted) | Pre-signed upload URLs; files never proxied through API tier |

The storage abstraction layer (`StorageService`) is implemented from day 1 with a provider interface, allowing the Year 2 switch from local disk to S3 without API contract changes. Local disk provider is the default; S3 provider is selected via `STORAGE_PROVIDER=s3` environment variable.

---

## 4. Availability & Reliability

### 4.1 Uptime SLA

| Deployment model | Monthly uptime target | Max downtime per month |
|---|---|---|
| Cloud-hosted (Anthropic-managed) | 99.5% | 3 hours 39 minutes |
| Self-hosted | User's responsibility; platform is designed to support 99.9% with proper infrastructure |

Planned maintenance windows are excluded from SLA calculations provided 48-hour advance notice is given to tenants.

### 4.2 Backup Policy

| Artifact | Frequency | Retention | Storage |
|---|---|---|---|
| PostgreSQL full backup | Daily (02:00 UTC) | 30 days | Off-site (separate cloud region or S3 bucket) |
| PostgreSQL WAL archiving | Continuous (streaming) | 7 days | Off-site |
| PostgreSQL point-in-time recovery | Available via WAL replay | 7-day window | Off-site |
| Application configuration | On every deploy | Indefinite (in version control) | Git |
| Redis snapshot (RDB) | Every 6 hours | 3 snapshots | Co-located (Redis is treated as ephemeral; reconstructible from DB) |

Backup integrity is verified weekly via automated restore-and-query test in a staging environment.

### 4.3 Disaster Recovery

| Target | Value | Notes |
|---|---|---|
| Recovery Time Objective (RTO) | 4 hours | Time from incident declaration to service restoration |
| Recovery Point Objective (RPO) | 1 hour | Maximum acceptable data loss |
| DR test frequency | Quarterly | Full restore drill in isolated environment |

RPO of 1 hour is achieved via WAL archiving with near-continuous shipping. The 1-hour gap covers the WAL archiving lag plus the time required to provision a standby.

### 4.4 Health Check Endpoints

Both endpoints are unauthenticated and must respond within 1 000 ms.

**`GET /health`** — Liveness probe

```json
{
  "status": "ok",
  "timestamp": "2026-06-16T12:00:00.000Z",
  "uptime": 3600
}
```

Returns `200 OK` if the process is alive. Returns `503` only if the process is in a fatal state. Does not check external dependencies (prevents cascading restart loops).

**`GET /ready`** — Readiness probe

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "migrations": "ok"
  },
  "timestamp": "2026-06-16T12:00:00.000Z"
}
```

Returns `200 OK` only when PostgreSQL connectivity is confirmed, Redis connectivity is confirmed, and all Prisma migrations have been applied. Returns `503` with a partial response body identifying the failing check if any dependency is unavailable. The load balancer removes the instance from the rotation when `/ready` returns `503`.

### 4.5 Graceful Degradation

| Component failure | Degraded behavior | Affected features |
|---|---|---|
| Redis unavailable | API continues serving requests; rate limiting is bypassed (fail-open, logged as alert); session validation falls back to JWT-only (stateless, no server-side revocation) | Rate limiting, token revocation, permission cache |
| Background job queue unavailable | Synchronous fallback for critical notifications (email sent inline); non-critical jobs queued in PostgreSQL table as fallback | Email sync, webhooks, scheduled reports |
| Read replica unavailable | All queries route to primary | Performance degradation only; no data loss |
| File storage unavailable | File upload endpoints return `503`; all other endpoints unaffected | File attachments |
| External email provider unavailable | Notification jobs are retried with exponential backoff; user is shown "delivery pending" status | Email notifications |

Redis failure is detected via a circuit breaker (5 failures in 10 seconds opens the circuit for 30 seconds). The degraded state is logged and a `redis_circuit_open` metric counter is incremented.

---

## 5. Maintainability & Operability

### 5.1 Structured Logging

- All application logs are emitted as **structured JSON** to stdout (12-factor app compliance). Log aggregation is handled by the infrastructure layer (e.g., CloudWatch, Loki, Datadog).
- **Log levels:** `error`, `warn`, `info`, `debug`. Production default: `info`. Debug level is enabled per-request via `X-Debug-Log: true` header (restricted to internal IPs).
- **Mandatory fields on every log line:**

| Field | Description |
|---|---|
| `timestamp` | ISO 8601 UTC |
| `level` | error / warn / info / debug |
| `correlationId` | UUID generated per request, propagated via `X-Correlation-ID` header (inbound respected, outbound always set) |
| `tenantId` | Extracted from JWT (null for unauthenticated requests) |
| `userId` | Extracted from JWT (null for unauthenticated requests) |
| `service` | `api` / `worker` / `scheduler` |
| `method` | HTTP method |
| `path` | Request path (query string stripped) |
| `statusCode` | HTTP response code |
| `durationMs` | Request duration in milliseconds |

- **PII in logs:** Email addresses, phone numbers, names, and free-text fields must never be logged. Log only IDs and opaque references.
- **Error logging:** Full stack traces are logged at `error` level server-side. Client receives only the `correlationId` and a generic message — never a stack trace.

### 5.2 Metrics

A Prometheus-compatible metrics endpoint is exposed at `GET /metrics` (restricted to internal network; not publicly accessible).

**Key metrics:**

| Metric name | Type | Description |
|---|---|---|
| `http_request_duration_seconds` | Histogram | Request latency, labeled by `method`, `path`, `status_code`, `tenant_id` |
| `http_requests_total` | Counter | Total requests, labeled by `method`, `path`, `status_code` |
| `http_errors_total` | Counter | 4xx and 5xx responses, labeled by `status_code` |
| `db_pool_size` | Gauge | Current PgBouncer pool size per server |
| `db_pool_available` | Gauge | Available connections in pool |
| `db_query_duration_seconds` | Histogram | Query execution time |
| `redis_connected` | Gauge | 1 if Redis connection is healthy, 0 if not |
| `job_queue_depth` | Gauge | Number of pending jobs per queue, labeled by `queue_name` |
| `job_processing_duration_seconds` | Histogram | Job execution time, labeled by `job_type` |
| `job_failures_total` | Counter | Failed jobs, labeled by `job_type` |
| `auth_login_attempts_total` | Counter | Login attempts, labeled by `success` (true/false) |
| `rate_limit_exceeded_total` | Counter | Rate limit hits, labeled by `endpoint`, `tenant_id` |
| `redis_circuit_open` | Gauge | 1 if Redis circuit breaker is open |

Metrics are scraped by Prometheus every 15 seconds. Grafana dashboards are provided as code (JSON) in the repository at `infra/grafana/dashboards/`.

### 5.3 Alerting Conditions

The following conditions must trigger an immediate alert (PagerDuty / OpsGenie / email):

| Condition | Threshold | Severity |
|---|---|---|
| API error rate (5xx) | > 1% of requests over 5-minute window | P1 |
| API p95 response time | > 1 000 ms sustained for 5 minutes | P2 |
| Database connection pool exhaustion | Available connections < 5 for 2 minutes | P1 |
| PostgreSQL primary unreachable | Any failure | P1 |
| Redis circuit breaker open | Any occurrence | P2 |
| Background job dead-letter queue depth | > 10 jobs | P2 |
| Disk usage (file storage volume) | > 85% | P2 |
| Failed login attempts | > 50 failures from single IP in 10 minutes | P2 (security) |
| SSL certificate expiry | < 14 days remaining | P2 |
| Backup job failure | Any failure | P1 |

### 5.4 Database Migration Strategy

- Migrations are managed exclusively by `prisma migrate`. Manual schema changes to production are prohibited.
- **CI pipeline:** `prisma migrate diff --exit-code` validates that the migration is consistent with the schema before deployment.
- **Deployment:** `prisma migrate deploy` runs as an init container / pre-deployment job before the new API version starts receiving traffic.
- **Backward compatibility rule:** Within a minor version (`v1.x`), no migration may:
  - Drop a column
  - Rename a column (add new column + backfill + rename is the safe path)
  - Change a column type destructively
  - Remove a table
  - Add a `NOT NULL` column without a `DEFAULT`

  Breaking schema changes are only permitted between major versions with a documented migration guide.

- **Rollback strategy:** Migrations are designed to be forward-only. Rollback is achieved by deploying the previous application version (which is compatible with the current schema due to the backward-compatibility rule). A separate `down` migration script is written for each migration but is only executed in emergencies with explicit approval.

### 5.5 Zero-Downtime Deployment

The deployment sequence guarantees no downtime:

1. Run `prisma migrate deploy` as a pre-deployment init container. Migration must be backward-compatible with the running version.
2. Start new API replicas. Load balancer health checks prevent traffic until `/ready` returns `200`.
3. Once new replicas are healthy, drain and stop old replicas (graceful shutdown: complete in-flight requests, max drain timeout 30 seconds).
4. Update DNS / load balancer configuration if applicable.

Rolling updates (Kubernetes `RollingUpdate` or Docker Swarm `update_config: parallelism: 1`) ensure at least one replica is always serving traffic.

**Graceful shutdown:** On `SIGTERM`, the application:
1. Stops accepting new connections (deregisters from load balancer via readiness probe returning `503`).
2. Completes all in-flight HTTP requests (up to 30-second timeout).
3. Drains active background job processing (up to 60-second timeout).
4. Closes database connection pool cleanly.
5. Exits with code 0.

---

## 6. Compliance

### 6.1 GDPR Architecture Requirements

The following architectural capabilities must be in place from day 1, even if the user-facing UX is delivered in Year 2:

| GDPR right | Architectural requirement | Phase 1 implementation |
|---|---|---|
| Right to erasure (Art. 17) | Hard-delete or anonymisation of all PII linked to a data subject | `DELETE /api/v1/users/me` triggers anonymisation: replace PII fields with `[DELETED]` tokens, delete personal contact data; audit log entry written (anonymised, no PII) |
| Right to data portability (Art. 20) | Export all data associated with a data subject as machine-readable JSON | Background job that queries all tables for `userId`, serialises to JSON archive, delivers via download link (valid 24 hours) |
| Right to access (Art. 15) | Return all personal data held about a subject | Same export pipeline as portability |
| Data minimisation (Art. 5(1)(c)) | Collect only fields necessary for the stated purpose | DTO validation enforces `whitelist: true`; no catch-all fields |
| Purpose limitation | Data collected for CRM use must not be repurposed | Documented data use policy; no analytics resale; telemetry is opt-in |

### 6.2 Data Retention Policy

| Data category | Retention period | Deletion mechanism |
|---|---|---|
| Active CRM records (leads, contacts, deals) | Indefinite while tenant is active | Manual deletion or GDPR erasure |
| Soft-deleted records | 30 days, then hard-deleted by a scheduled job | Automated background job |
| Audit logs | 2 years minimum | Automated archival after 2 years (compressed, off-site) |
| Application logs | 90 days | Log aggregation platform TTL |
| Session data (Redis) | 7 days (refresh token TTL) | Redis TTL |
| Password reset tokens | 1 hour | Database TTL enforced by scheduled cleanup job |
| GDPR export archives | 24 hours (download link validity) | Scheduled deletion job |

### 6.3 Cookie Policy

All cookies set by the application must comply with the following:

| Attribute | Value | Rationale |
|---|---|---|
| `HttpOnly` | `true` | Prevents JavaScript access; mitigates XSS token theft |
| `Secure` | `true` | Cookie only sent over HTTPS |
| `SameSite` | `Strict` | Prevents CSRF; cookie not sent on cross-site requests |
| `Path` | `/api/auth` | Refresh token cookie scope-limited to auth endpoints |
| `Max-Age` | 604800 (7 days) | Matches refresh token TTL |
| `Domain` | Explicit host (no leading dot) | Prevents subdomain inheritance |

No third-party tracking cookies are set. Analytics cookies (if used) require explicit consent and are opt-in.

### 6.4 PII Handling

**Fields classified as PII:**

| Table | PII fields |
|---|---|
| `users` | `email`, `firstName`, `lastName`, `phoneNumber`, `avatarUrl` |
| `contacts` | `email`, `firstName`, `lastName`, `phoneNumber`, `mobileNumber`, `linkedinUrl`, `address` |
| `leads` | `email`, `firstName`, `lastName`, `phoneNumber`, `company` (if sole trader) |
| `audit_logs` | `ipAddress`, `userAgent` |
| `email_messages` | `from`, `to`, `cc`, `bcc`, `subject`, `body` |

**Encryption at rest:**

- PostgreSQL data-at-rest encryption is mandatory: encrypted volume (EBS encryption / LUKS for self-hosted) or PostgreSQL Transparent Data Encryption (TDE) where available.
- Application-level encryption for the most sensitive fields (`users.email`, `contacts.email`) using AES-256-GCM with a key stored in the secrets manager (not in the database). This enables field-level search via deterministic encryption for lookups. Implementation library: `@anthropic/field-encryption` or equivalent.
- Backups are encrypted at rest using AES-256.
- Encryption keys are rotated annually. Key rotation must not require downtime.

---

## 7. API Contract Requirements

### 7.1 Versioning Policy

- All public API endpoints are prefixed with `/api/v1/`.
- The version number is incremented to `v2` only for **breaking changes**.
- **Breaking change definition:** Any change that would cause a correctly implemented v1 client to fail, including: removing a field from a response, changing a field's type, removing an endpoint, changing authentication requirements, changing required request fields.
- **Non-breaking changes** (allowed within `v1` without version bump): Adding optional request fields, adding response fields, adding new endpoints, relaxing validation rules.
- Multiple versions may be live simultaneously. `v1` must be supported for a minimum of 12 months after `v2` is released.

### 7.2 Deprecation Policy

- Deprecated endpoints are marked with `Deprecation: true` and `Sunset: <date>` response headers (RFC 8594).
- **Minimum notice period:** 90 days from deprecation announcement to removal.
- Deprecation announcements are communicated via: in-app notification to tenant admins, changelog entry, email to tenant technical contacts.
- Deprecated endpoints continue to function during the notice period; they return a `Warning: 299` response header.

### 7.3 Rate Limits

See §2.5 for rate limit values. Rate limit status is communicated via standard response headers:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 247
X-RateLimit-Reset: 1750072800
X-RateLimit-Policy: 300;w=60
```

### 7.4 API Boundary Definition

| Boundary | Path prefix | Authentication | Documentation |
|---|---|---|---|
| Public API (external integrations) | `/api/v1/` | JWT (Bearer) or API Key (`X-API-Key` header) | Published at `/api/docs` |
| Internal API (frontend ↔ backend) | `/api/v1/` (same prefix, restricted endpoints) | JWT (Bearer) via httpOnly cookie only; API Key not accepted | Internal docs only |
| Webhook callbacks (inbound) | `/api/v1/webhooks/` | HMAC-SHA256 signature verification (`X-Webhook-Signature` header) | Published |
| Health / metrics | `/health`, `/ready`, `/metrics` | None (restricted by network policy) | Not published |

**Public API key authentication:**
- API keys are scoped to a tenant and a set of permissions.
- API keys are stored as bcrypt hashes in the database (the raw key is shown only once on creation).
- API keys can be revoked instantly; revocation is checked on every request (Redis cache with 60-second TTL).
- API keys rotate every 365 days; owners are notified 30 days before expiry.

### 7.5 OpenAPI Specification

- The OpenAPI 3.1 specification is auto-generated from NestJS `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiProperty` decorators using `@nestjs/swagger`.
- The spec is published at `/api/docs` (Swagger UI) and `/api/docs-json` (raw JSON).
- The spec is also exported as a static file and committed to the repository on each release (`docs/api/openapi.json`), enabling diff-based review of API changes in PRs.
- All request and response DTOs must have complete `@ApiProperty` annotations including `description`, `example`, and `required`.
- The spec endpoint (`/api/docs`) is available in all environments. In production, it requires JWT authentication to prevent enumeration by unauthenticated actors.

### 7.6 Error Response Format

All API errors follow the **RFC 7807 Problem Details** standard:

```json
{
  "type": "https://opsnextcrm.com/errors/validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body contains invalid fields.",
  "instance": "/api/v1/leads",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

**Standard error type URIs:**

| Status code | `type` URI | `title` |
|---|---|---|
| 400 | `.../errors/bad-request` | Bad Request |
| 401 | `.../errors/unauthorized` | Authentication Required |
| 403 | `.../errors/forbidden` | Access Denied |
| 404 | `.../errors/not-found` | Resource Not Found |
| 409 | `.../errors/conflict` | Resource Conflict |
| 422 | `.../errors/validation-error` | Validation Failed |
| 429 | `.../errors/rate-limit-exceeded` | Too Many Requests |
| 500 | `.../errors/internal-error` | Internal Server Error |
| 503 | `.../errors/service-unavailable` | Service Unavailable |

- `correlationId` is always present to enable log correlation.
- Stack traces are never included in error responses.
- The `errors` array is present for 422 responses only; it lists per-field validation failures.

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Requirement | Specification |
|---|---|
| Framework | Jest (NestJS backend), Jest + React Testing Library (Next.js frontend) |
| Coverage threshold | **70% minimum** for lines, branches, functions, and statements |
| Enforcement | `jest --coverage --coverageThreshold='{"global":{"lines":70,"branches":70,"functions":70,"statements":70}}'` in CI; merge blocked if threshold not met |
| Coverage reporting | HTML report generated and uploaded as CI artifact; coverage trends tracked in Codecov or similar |
| Test file location | Co-located with source files (`*.spec.ts`) |
| Test isolation | Each test file is independent; no shared mutable state between tests; database calls are mocked using `jest.mock` |
| Mocking | External dependencies (database, Redis, email providers) are mocked in unit tests |

**Coverage exclusions** (must be explicitly listed in `jest.config.ts`): migration files, seeder scripts, generated Prisma client, `*.module.ts` files (covered by integration tests), `main.ts`.

### 8.2 Integration Tests

| Requirement | Specification |
|---|---|
| Framework | NestJS `Test.createTestingModule` |
| Database | Real PostgreSQL instance via Docker Compose (`docker-compose.test.yml`) |
| Database isolation | Each test suite creates a fresh database schema; transactions are rolled back after each test |
| Redis | Real Redis instance via Docker Compose |
| Coverage | All API endpoints must have at least one integration test covering the happy path |
| Authentication | Integration tests use a real JWT signed with the test private key |
| CI execution | Integration tests run in a Docker Compose environment in GitHub Actions |

Test database is seeded with a minimal fixture set (1 tenant, 2 users with different roles, sample records per entity) before each suite.

### 8.3 End-to-End Tests

| Requirement | Specification |
|---|---|
| Framework | Playwright |
| Browsers | Chromium (required), Firefox (required), WebKit (Should Have) |
| Execution environment | Headed in local development; headless in CI |
| Critical paths (Must Have Year 1) | |
| 1. Authentication flow | Register → Verify email → Login → Logout → Forgot password → Reset password |
| 2. Lead lifecycle | Create lead → View lead → Edit lead → Convert to opportunity |
| 3. Opportunity lifecycle | Create opportunity → Update stage → Add activity → Close won / Close lost |
| 4. Contact management | Create contact → Link to lead → View contact timeline |
| 5. Tenant admin | Invite user → Assign role → Deactivate user |
| Test data management | Playwright global setup creates test tenant and users via API; global teardown deletes them |
| CI integration | Playwright tests run against a fully deployed staging environment; deployment is gated on test pass |

### 8.4 Performance Tests

**Priority: Should Have (Year 1)**

| Requirement | Specification |
|---|---|
| Framework | k6 |
| Test type | Smoke test (constant 10 VU for 30 seconds) + Load test (ramp to concurrent user target) |
| Baseline endpoints | `POST /api/v1/auth/login`, `GET /api/v1/leads`, `POST /api/v1/leads`, `GET /api/v1/dashboard` |
| Pass criteria | p95 < API SLO targets from §1.1; error rate < 1% |
| CI integration | Smoke tests run on every deploy to staging; load tests run weekly and on release candidates |
| Threshold enforcement | k6 `thresholds` block enforces SLOs; non-zero exit code blocks deployment |

### 8.5 Security Tests

**Priority: Could Have (Year 1)**

| Requirement | Specification |
|---|---|
| Framework | OWASP ZAP (Zed Attack Proxy) — automated baseline scan |
| Scan type | ZAP Baseline Scan (passive scan only; no active attacks in CI) |
| CI integration | Run against staging environment on release candidate builds |
| Pass criteria | Zero High severity findings; Medium findings must be triaged and accepted or fixed before release |
| Scope | All `/api/v1/` endpoints; authenticated with a dedicated ZAP test user |
| Manual penetration test | Annually by an external security firm (Year 2 onward) |
| SAST | ESLint with `eslint-plugin-security` rules enabled in CI; findings block merge |

---

## Appendix A: SLO Summary Table

| Category | Metric | Target |
|---|---|---|
| Performance | API read p95 | < 300 ms |
| Performance | API write p95 | < 300 ms |
| Performance | LCP | < 2.5 s |
| Performance | CLS | < 0.10 |
| Availability | Monthly uptime (cloud) | 99.5% |
| Reliability | RTO | 4 hours |
| Reliability | RPO | 1 hour |
| Security | Access token TTL | 15 minutes |
| Security | Refresh token TTL | 7 days |
| Security | Bcrypt cost factor | 12 |
| Security | Rate limit (API reads) | 300 req/min/tenant |
| Testing | Unit test coverage | 70% minimum |
| Scalability | Row-level tenancy ceiling | ~500 tenants |

---

## Appendix B: Decision Log

| Decision | Rationale | Date |
|---|---|---|
| RS256 over HS256 for JWT | Asymmetric keys allow public key distribution for verification without exposing the signing secret; enables future microservice authentication | 2026-06-16 |
| Stateless API tier | Enables horizontal scaling without sticky sessions; no shared state between replicas | 2026-06-16 |
| Row-level tenancy over schema-per-tenant | Lower operational complexity for Year 1; schema-per-tenant is harder to migrate and query; row-level scales to 500 tenants which exceeds Year 2 target | 2026-06-16 |
| RFC 7807 Problem Details for errors | Standard format improves API client developer experience; machine-parseable error types enable automated error handling | 2026-06-16 |
| `volatile-lru` Redis eviction | Protects session data and rate limit state from arbitrary eviction under memory pressure while allowing cache keys to be evicted | 2026-06-16 |
| bcrypt cost factor 12 | Balances security (>100 ms hash time on modern hardware) and server load; reviewed annually | 2026-06-16 |
