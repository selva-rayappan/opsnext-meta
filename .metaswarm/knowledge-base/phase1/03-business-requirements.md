# OpsNext CRM — Business Requirements Document
## Phase 1 Foundation

**Document ID:** BRD-001
**Version:** 2.0
**Date:** 2026-06-16
**Author:** Product Management & Solution Architecture
**Status:** Approved — Binding for Phase 1 Architecture and Delivery
**Supersedes:** BRD-001 v1.0 (2026-06-16 — initial stub)
**Input documents:** PV-001 (Product Vision), UP-001 (User Personas), architecture.md

---

## Table of Contents

1. [Business Goals](#1-business-goals)
2. [Business Constraints](#2-business-constraints)
3. [Compliance and Legal Requirements](#3-compliance-and-legal-requirements)
4. [Revenue Model Assumptions](#4-revenue-model-assumptions)
5. [Multi-Tenancy Model Selection](#5-multi-tenancy-model-selection)
6. [Stakeholder Map](#6-stakeholder-map)
7. [Document Control](#7-document-control)

---

## 1. Business Goals

### 1.1 Primary Revenue Goal — Year 1

**Target: $120,000 ARR by end of Year 1 (December 2026).**

This is derived from 10 paying teams at an average contract value of $12,000 ARR ($1,000/month, or approximately $40/seat/month for a 25-seat team). This goal is intentionally conservative — it is a proof-of-business milestone, not a growth target. The Year 1 revenue goal exists to validate that:

- The product solves a real problem buyers will pay for.
- The pricing model sustains a small engineering team.
- Deployment and onboarding are repeatable without white-glove support.

Secondary revenue consideration: self-hosted customers pay no subscription fee to OpsNext. Self-hosted adoption in Year 1 is a community and pipeline investment, not a direct revenue driver. It establishes credibility and feeds the Year 2 conversion funnel.

### 1.2 Customer Acquisition Targets

| Milestone | Target | Timing |
|-----------|--------|--------|
| First paying team in production | 1 | Q2 2026 (private beta) |
| 5 paying teams live | 5 | Q3 2026 |
| 10 paying teams (Year 1 goal) | 10 | Q4 2026 |
| First self-hosted community deployment | 1 | Q3 2026 |
| Self-hosted active instances (opt-in ping) | 25+ | End of Year 1 |

**Acquisition channel assumptions:**

- Founder network and direct outbound: first 3 customers.
- Developer and community visibility (HN, GitHub, product forums): next 5–7.
- Inbound from self-hosted deployments converting to cloud: ongoing from Year 2.

No paid acquisition spend is planned for Year 1. All customer acquisition is founder-led and community-driven.

### 1.3 Product-Market Fit Indicators

Product-market fit is defined by observable signals, not survey scores alone.

**Strong PMF signals — all three must be present by end of Year 1:**

1. **Retention:** 8 of 10 paying teams active and paying after 3 months of use (80% 3-month retention).
2. **Organic expansion:** At least 3 teams have added seats without being solicited.
3. **Unsolicited advocacy:** At least 5 inbound leads cite an existing customer by name as a referral source.

**Early PMF checkpoint (Q3 2026):**

- Net Promoter Score (in-product survey, after 30 days of use) of 30+.
- At least one team has migrated live data from an existing CRM (Pipedrive, HubSpot, or spreadsheet) and continues to use OpsNext CRM as their primary system of record.

**Anti-PMF signals — trigger a product review gate if any occur:**

- More than 2 teams churn within 60 days citing "too complex" or "not different enough."
- Teams consistently using fewer than 3 of the 7 modules after 30 days.
- Repeated support tickets around data quality, pipeline inaccuracy, or audit trail failures (indicating core CRM workflow is not trustworthy).

### 1.4 Platform Adoption Metrics

These metrics are tracked per tenant via server-side event logging. No third-party analytics SDK is used (see Section 3.3).

| Metric | Year 1 Target | Measurement method |
|--------|---------------|--------------------|
| DAU / MAU ratio | 40%+ | Activity events per user per day |
| Median time to log an activity | Under 90 seconds | Server-side event timing (activity created event vs. form open event) |
| Pipeline stage updates per rep per week | 3+ | Opportunity stage change events |
| API usage (non-UI calls) | 30%+ of paying teams making API calls | API key creation + authenticated API call volume |
| Email integration activation rate | 60%+ of paying teams | Email sync connection events |
| Report generation frequency | Weekly exports from 70%+ of teams | Report generation events |

---

## 2. Business Constraints

### 2.1 Team and Budget Constraints

**Team composition at Phase 1 launch:**

- 1 Founder / Product Lead (full-stack capable; owns product management, architecture decisions, and go-to-market)
- 1–2 Software Engineers (full-stack TypeScript, NestJS, Next.js)
- No dedicated QA engineer in Year 1
- No dedicated DevOps engineer in Year 1
- No dedicated designer in Year 1 (design system established upfront; UI built from the component library by engineers)

**Implications of lean team — these are binding engineering constraints, not preferences:**

1. **No feature tiers to maintain.** A single feature surface reduces QA, code branching, and support surface area. All users on all plans access every feature.
2. **Automated testing is non-negotiable.** The 70% unit test coverage threshold and the Playwright E2E suite are CI enforcement gates, not targets. Broken builds do not ship. This is the QA strategy, not a supplement to it.
3. **Operator experience must be fully self-serve.** No engineer can be on-call to guide a customer deployment. Docker Compose, health checks, and migration commands must work end-to-end from documentation alone.
4. **Scope creep is an existential risk.** Any addition to Phase 1 scope must be measured against the constraint that two engineers cannot maintain a wide surface while also acquiring customers. The Out of Scope section of PV-001 (Section 8) is binding.

**Infrastructure budget constraint:** Bootstrapped or pre-seed. Infrastructure costs must stay under $500/month for the cloud-hosted offering at up to 10 paying teams. This means no expensive managed services in Year 1: no RDS Aurora, no managed Redis clusters, no Datadog, no CDN-delivered SPA hosting from a paid provider. Open-source and self-managed infrastructure only. A VPS (Hetzner, DigitalOcean, or equivalent) running Docker Compose is the Year 1 hosting model.

### 2.2 Time Constraints

| Milestone | Target date | Gate condition |
|-----------|-------------|----------------|
| BRD + Domain Model approved | Q2 2026 | This document reviewed and signed off |
| Architecture design approved | Q2 2026 | arch.md updated, multi-tenancy ADR written |
| Module 1 (Auth/RBAC) in staging | Q2 2026 | Security review passed, integration tests green |
| All 7 modules in private beta | Q3 2026 | Internal QA complete, zero P0 bugs |
| First paying customer in production | Q3 2026 | Production deploy + onboarding guide published |
| MVP generally available | Q4 2026 | 10 teams live, docs published, OpenAPI spec live |

**Hard deadline: Q4 2026 general availability.** Missing this date means entering 2027 without the Year 1 revenue milestone, which affects runway under a bootstrapped or pre-seed budget.

**Critical path dependencies:**

- Module 1 (User Roles & Permissions) blocks all other modules. It is the single critical path item. No other module begins implementation until Module 1 is security-reviewed and merged to main.
- Module 6 (Email & Communication History) has the highest external dependency risk (IMAP/SMTP/OAuth behavior varies significantly across email providers). It is scheduled last in the implementation sequence for this reason.
- Module 7 (Reporting & Dashboards) depends on all prior modules having stable, production-representative schemas. It is explicitly final.

### 2.3 Technical Constraints

**Self-hostability is a hard constraint, not a feature flag:**

Every capability built for the cloud-hosted offering must run identically on a self-hosted Docker Compose deployment. The following patterns are prohibited:

- Using cloud-provider-specific services as unswappable primary dependencies (e.g., AWS SES as the only email transport, S3 as the only file storage provider with no alternative).
- Features that require a callback to OpsNext infrastructure to function (e.g., license validation phone-home, cloud-only feature flags).
- Hardcoded infrastructure assumptions (region, domain, CDN URL, cloud provider ARN).

**Permitted cloud integrations (with documented self-hosted alternatives):**

| Capability | Cloud default | Self-hosted alternative |
|------------|---------------|------------------------|
| File/attachment storage | S3-compatible bucket | MinIO (included in Docker Compose) |
| Email sending | Configurable SMTP relay | Any SMTP server; self-hosted mail relay |
| Metrics and observability | Prometheus endpoint exposed | Operator provides Grafana/Prometheus |
| Background jobs | Redis-backed BullMQ queue | Redis is already a required dependency |

**Stack lock for Phase 1 — no deviations without an ADR:**

The stack defined in the project profile is locked for Phase 1:

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, React Hook Form
- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis
- Infrastructure: Docker + Docker Compose, GitHub Actions

No new frameworks, ORMs, databases, or third-party SDKs may be introduced without an Architecture Decision Record that documents the rationale, the alternatives considered, and the Engineering Lead's approval.

**Browser support:**

Latest two stable versions of Chrome, Firefox, Safari, and Edge. No IE11 support. Progressive enhancement for mobile-web (responsive design required; no native app in Year 1 per PV-001 Section 8).

### 2.4 Regulatory Constraints

**GDPR-ready architecture from Day 1:**

OpsNext CRM targets English-speaking markets including the UK and EU from the first paid customers. Full GDPR certification is a Year 2 goal, but the **data architecture must support GDPR obligations from the first schema commit.** Retrofitting GDPR support onto an architecture that was not designed for it is a multi-month engineering effort. The following capabilities must be designed in from day one, even if the admin UI surfaces for triggering them are minimal in Phase 1:

1. **Right to erasure:** The data model must support hard deletion of all PII associated with a Contact or User record. Soft-delete (`deletedAt` timestamp) is the default state transition; the hard purge path must be implemented, tested, and documented.
2. **Data portability:** Every tenant must be able to export all their data as structured JSON or CSV. The export pipeline is scoped strictly by `organizationId`.
3. **Audit trail:** All mutations to PII fields must be logged with actor identity and timestamp.
4. **Data minimization:** No PII fields should exist in the schema unless they serve a documented CRM purpose.

See Section 3 for the full compliance specification.

---

## 3. Compliance and Legal Requirements

### 3.1 Data Residency

**Cloud-hosted deployments:**

- Year 1: Single-region deployment (EU/Frankfurt as default; US East available on request).
- Year 2: Tenant-selectable data residency (US / EU / AU regions).

**Self-hosted deployments:**

- Operators retain full control of data residency. OpsNext CRM has no background process that calls home to OpsNext infrastructure.
- The Docker Compose configuration contains zero external telemetry endpoints by default.
- Any opt-in telemetry (e.g., a version ping for security advisory notifications) must be explicitly enabled by the operator and fully documented in the deployment guide.

**Data transfer guarantee:**

- No customer data (Contact records, pipeline data, email content) transits OpsNext infrastructure in the self-hosted configuration.
- The cloud-hosted API never reads from or writes to a self-hosted instance's database.

### 3.2 GDPR Architectural Requirements

These are non-negotiable design constraints enforced at the schema and API layer.

**Right to Erasure (GDPR Article 17):**

- The system must support hard deletion of all PII associated with a Contact record upon a verified erasure request.
- A soft-delete flag (`deletedAt`) is the intermediate state. The hard purge path must be implemented as an admin API endpoint and as a scheduled job for the tenant offboarding lifecycle.
- Cascade deletion behavior must be defined explicitly in the Prisma schema for all Contact-related entities:
  - Activities linked to the Contact: hard delete.
  - Email History records linked to the Contact: hard delete.
  - Notes linked to the Contact: hard delete.
  - Attachments linked to the Contact: hard delete from database and object storage.
  - Opportunity associations: de-associate (set `contactId = null`) — do not delete the Opportunity itself.
  - Lead records with this Contact: hard delete.
- Audit log entries that contain the Contact's PII (name, email, phone) must have those PII fields nulled out as part of the erasure. The audit log record itself (containing `action`, `timestamp`, `actorId`, `entityType`, `entityId`) must be retained — the fact of a deletion must be preserved; only the PII content within the log is erased.

**Right to Data Portability (GDPR Article 20):**

- Each tenant administrator must be able to export all data associated with their organization as structured JSON (primary) or CSV (secondary format for entity lists).
- The export must include: all Contact records, Account records, Lead records, Opportunity records, Activity logs, Email History records, and User records (excluding password hashes).
- The export pipeline is scoped by `organizationId` — a tenant administrator can only export their own organization's data.
- Export generation is asynchronous (a BullMQ job queued in Redis) for datasets larger than 1,000 records. The requesting admin receives a download link via in-platform notification and email when the export is ready. The download link is signed, time-limited to 24 hours, and served from the tenant's designated storage bucket.
- Export requests are logged to the audit trail.

**Data Minimization (GDPR Article 5(1)(c)):**

- The schema must not store fields that are not required for the CRM's stated purpose.
- No behavioral tracking of end-users for advertising or profiling purposes.
- No third-party pixel, tag manager, session recording script, or user fingerprinting code in the product UI.
- Server-side session analytics (if any) are limited to functional metrics: page load times, error rates, feature usage counts. No client-side analytics SDK is included in Year 1.

**Data Processing Agreement:**

- OpsNext CRM is the data processor. Each paying tenant (company) is the data controller for their Contact records.
- A Data Processing Agreement (DPA) template must be included in the Terms of Service before the first EU-based paying tenant signs up.
- The DPA documents: what data is processed, for what purpose, the sub-processors list, and the data subject rights procedures.

### 3.3 Privacy Policy Commitments

These are binding product decisions with direct engineering implications:

1. **No selling user data.** OpsNext CRM will never sell, share, or license tenant data or end-user behavioral data to any third party for any purpose, including advertising.
2. **No third-party analytics by default.** No Google Analytics, Mixpanel, Segment, Amplitude, Hotjar, FullStory, or equivalent SDK is bundled in the production build. If internal product analytics are introduced in Year 2, they will be: (a) server-side only, (b) opt-in for self-hosted operators, and (c) disclosed in the privacy policy with a data flow diagram.
3. **No advertising.** The platform does not display advertisements. Tenant data is never used to generate advertising profiles.
4. **Sub-processor transparency.** The privacy policy must list all third-party services that process customer data — hosting provider, transactional email provider, object storage — with their processing role and data geography.

### 3.4 Audit Trail Requirements

The audit trail is a first-class architectural feature, not a log file appended as an afterthought.

**Events that must be audited:**

| Event category | Examples | Required in Phase 1 |
|----------------|----------|---------------------|
| Authentication | Login, logout, failed login, password reset, token refresh | Yes |
| Authorization | Permission denied, role change, user deactivation | Yes |
| Entity create | Contact created, Lead created, Opportunity created | Yes |
| Entity update | Stage changed, owner changed, field value updated (field-level diff) | Yes |
| Entity delete | Contact deleted, Opportunity closed | Yes |
| Configuration change | Pipeline stage renamed, role permission modified | Yes |
| Data export | Export requested, export completed, export downloaded | Yes |
| Admin operations | User provisioned, user suspended, tenant created, tenant deleted | Yes |
| GDPR events | Erasure request received, erasure executed, data export completed | Yes |

**Audit log record — minimum required fields:**

```
{
  id:           UUID (primary key)
  tenantId:     UUID (organizationId — enforces tenant isolation on audit records)
  actorId:      UUID (nullable — null for system-initiated events)
  actorEmail:   string (snapshot at time of action — retained even if actor user is deleted)
  action:       string (enum: CREATE | UPDATE | DELETE | LOGIN | LOGOUT |
                         PERMISSION_DENIED | ROLE_CHANGE | CONFIG_CHANGE |
                         DATA_EXPORT | GDPR_ERASURE | TENANT_PROVISIONED |
                         TENANT_DELETED | SUPER_ADMIN_ACCESS)
  entityType:   string (e.g., "Contact", "Opportunity", "Role", "Organization")
  entityId:     UUID (nullable for non-entity actions)
  diff:         JSON (for UPDATE events: array of { field, oldValue, newValue })
  ipAddress:    string (for GDPR compliance: store only first 3 octets of IPv4;
                        store full IPv6 prefix /48)
  userAgent:    string
  superAdmin:   boolean (true if action was performed by a super-admin)
  timestamp:    DateTime (UTC, set by the database server, not the application clock)
}
```

**Immutability requirement:** Audit log records must not be updatable or deletable by any user-facing API operation, including tenant admins and super-admins. The only permitted modification is GDPR-mandated PII erasure in the `diff`, `actorEmail` fields — and this must be performed by a dedicated, audited admin job, not through a generic update endpoint.

**Retention policy:**

- Minimum retention: 24 months for all audit records.
- Post-tenant-deletion: the `tenantId`, `action: TENANT_DELETED`, `timestamp`, and `actorId` record is retained indefinitely in the system audit log. The content of tenant-specific audit records is purged as part of tenant offboarding (see Section 5.6).
- Tenants may export their audit logs at any time via the admin panel export.

**Performance constraint:** Audit log writes must not block the primary entity transaction. The implementation pattern is a post-transaction event emission (NestJS EventEmitter or BullMQ job) that writes the audit record asynchronously. Eventual consistency on audit records is acceptable; the primary entity mutation must be transactionally consistent and must not be rolled back due to an audit write failure.

### 3.5 Credential and Security Policy

- Passwords: minimum 12 characters, bcrypt with cost factor 12, no maximum length.
- API keys: 256-bit cryptographically random, stored as bcrypt hash (raw key shown once at creation only, never stored in plaintext).
- JWTs: signed with RS256 (asymmetric), 15-minute access token lifetime, 7-day refresh token stored in httpOnly Secure SameSite=Strict cookie.
- Secrets: in environment variables only. Never in logs, error messages, API responses, or version control.

---

## 4. Revenue Model Assumptions

### 4.1 Pricing Model — Per-Seat, Flat Pricing, No Feature Tiers

**The model:** Per-seat, per-month pricing. Flat rate — no Starter / Professional / Enterprise feature differentiation in Year 1.

Every user on every plan accesses every feature. This is a deliberate product and operational simplicity decision.

**Rationale for flat pricing:**

- Feature tiers require maintaining multiple code paths, feature flag evaluation, and upgrade prompts. A two-person engineering team cannot sustainably maintain a tiered feature matrix while simultaneously shipping seven CRM modules.
- The target buyer (VP Sales, Founder, CRM Admin) has been burned by feature-gating in HubSpot and Salesforce. "Everything unlocked from day one" is a meaningful and verifiable differentiator.
- Per-seat pricing scales linearly with customer value: as teams grow, revenue grows proportionally without a re-negotiation event.

**Year 1 pricing (subject to market validation during beta):**

| Plan | Price | Description |
|------|-------|-------------|
| Cloud Hosted | $40/seat/month (annual) or $48/seat/month (monthly) | Full feature access, OpsNext-managed infrastructure, email support |
| Self-Hosted | Free | Operator provides infrastructure; community support via GitHub only |
| Minimum team size | 5 seats | Floor set to reflect real team-CRM value threshold |

**Seat definition:** A seat is any active (non-deactivated) user account in a tenant organization. Deactivated users do not count toward billing. Seat count is measured at invoice generation (monthly), not at user creation.

**Minimum seat floor rationale:** Below 5 users, the multi-user value of OpsNext CRM (pipeline visibility, team activity tracking, role-based access) cannot be meaningfully demonstrated. Sub-5-seat accounts also create a disproportionate support burden relative to their revenue contribution.

### 4.2 Self-Hosted vs Cloud-Hosted Pricing

**Self-hosted is free. That is a deliberate product strategy, not a loss.**

The self-hosted tier generates value through three indirect mechanisms:

1. **Conversion pipeline.** Self-hosted teams that outgrow DIY operations convert to cloud-hosted. Based on comparable open-core products (GitLab, Gitea, Metabase), 5–10% of self-hosted deployments convert to a paid offering within 18 months.
2. **Community credibility.** An active self-hosted community produces GitHub stars, organic developer content, and inbound traffic that would otherwise require paid acquisition spend.
3. **Enterprise pipeline.** Companies that cannot use SaaS due to data residency or security policy requirements become candidates for managed self-hosted support contracts (a Year 2+ commercial offering).

**No support SLA for self-hosted in Year 1.** Self-hosted users are directed to GitHub Discussions and public documentation. Priority email support is a cloud-hosted benefit only.

### 4.3 Trial and Freemium Strategy

**No freemium tier in Year 1.**

Freemium increases support surface area, attracts non-target users (individuals, hobbyists), and dilutes product metrics with non-converting accounts. The product's value is demonstrated in the context of a real sales team workflow, not solo use.

**Trial model:**

- 14-day free trial for cloud-hosted accounts. Full access. No credit card required at signup.
- Trial tenants are provisioned as full tenant organizations with `status: TRIAL` and a `trialExpiresAt` timestamp.
- At trial expiration: tenant status transitions to `SUSPENDED`. The tenant's users receive `HTTP 402 Payment Required` on all write operations and `HTTP 403 Forbidden` on dashboard access. Read-only access is preserved for the admin user for 30 days to allow data export before commitment.
- Trial-to-paid conversion: manual in Year 1 (the founder sends a Stripe payment link after a qualification call). Automated self-serve billing (Stripe Checkout integration) is a Year 2 engineering investment.
- Data retention post-trial: 30 days post-expiration. After 30 days without conversion, the tenant is queued for deletion per the offboarding lifecycle in Section 5.5.

**Rationale for 14-day trial (not 30-day):** The product delivers measurable value within the first week for an active sales team (pipeline visibility, first deals tracked, first activity logs). A 30-day trial delays the buy/no-buy decision without providing additional evidence. 14 days creates appropriate urgency while allowing a full two-cycle week view of the sales pipeline.

### 4.4 Enterprise Tier Triggers — Year 3

An enterprise pricing tier is not planned for Year 1 or Year 2. The following capabilities, when introduced in Year 3, justify a separate enterprise pricing tier:

| Enterprise capability | Reason for enterprise pricing |
|-----------------------|-------------------------------|
| SSO — SAML 2.0 / OIDC | Implementation and ongoing compatibility maintenance cost; requested only by security-governed organizations |
| Custom roles beyond the 4 built-in roles | Configuration complexity and support overhead |
| Dedicated support SLA (4-hour response guarantee) | Engineering time cost; cannot be offered profitably below ~$50K ARR per customer |
| Audit log export via REST API | Compliance officer use case; not a workflow need for SMB |
| SOC 2 Type II compliance attestation | Annual audit cost recovered through enterprise pricing |
| Isolated cloud infrastructure per tenant | Database-per-tenant or schema-per-tenant for enterprise data segregation requirements |

**Year 3 enterprise pricing model:** Custom contract, minimum $50K ARR, negotiated per deal, not self-serve. The flat per-seat model remains the default for all non-enterprise accounts.

---

## 5. Multi-Tenancy Model Selection

This is the most architecturally consequential decision in Phase 1. The choice made here permeates every table, every query, every test, and every deployment concern. It is expensive to reverse once Module 1 is built. This decision is made in the BRD — not delegated to the architecture document — because it is driven by business constraints (team size, cost, self-hostability) as much as by technical factors.

### 5.1 Options Evaluated

#### Option A: Row-Level Tenancy — Single Database, `organizationId` on Every Table

**Architecture:** A single PostgreSQL database holds data for all tenants. Every tenant-scoped table has an `organizationId` UUID column that is a foreign key to the `organizations` table. Application middleware extracts the tenant identity from the authenticated user's JWT and injects it into every Prisma query as a non-bypassable `where` clause.

**Detailed Pros:**

- **Operational simplicity at scale.** One database to provision, back up, monitor, migrate, and restore. One `prisma migrate deploy` touches all tenants atomically. One backup schedule. One monitoring target.
- **Full Prisma compatibility.** Prisma's data model and query API are designed around this pattern. No hacks, no unsupported extensions, no dynamic datasource switching. The standard workflow — `schema.prisma` generates a typed client, `prisma migrate dev` runs in development — works as documented.
- **Self-hostability.** A single-database Docker Compose stack is understandable to any operator with basic Docker knowledge. No per-tenant provisioning scripts in the deployment layer. No per-tenant migration runner.
- **Cost efficiency at Phase 1 scale.** A single PostgreSQL instance serves 10–100 teams at a cost of $20–$100/month on a mid-tier VPS. No per-tenant database instances, no per-tenant connection pools, no per-tenant storage allocation.
- **Cross-tenant aggregate queries.** If OpsNext needs to run anonymized aggregate analytics across all tenants (product usage patterns, infrastructure capacity planning), these are trivial SQL queries with a GROUP BY. This is architecturally impossible in schema-per-tenant or database-per-tenant models without a separate analytics pipeline.
- **Team cognitive fit.** Two engineers can reason about, maintain, and debug one database schema. Adding per-tenant schema or database concerns doubles the surface area of every database-adjacent task.

**Detailed Cons:**

- **Weakest isolation guarantee of the three options.** A bug in the tenant middleware — a missing `organizationId` filter in a Prisma query, an unguarded raw SQL call — can expose one tenant's data to another. This is a code-quality and review-gate problem, not an architectural impossibility. It is mitigated by the controls documented in Section 5.3.
- **Noisy-neighbor potential.** A tenant running a large data export or a heavy reporting query can consume database I/O that affects query latency for other tenants. Mitigated by: async queuing for bulk operations, query timeout enforcement (5s hard timeout on all user-facing queries), read replica routing for reporting queries (Year 2 scaling concern, not Year 1 with 10 tenants).
- **Compliance perception gap.** Some buyers will ask "is my data in the same database as other companies?" The honest answer — "yes, but separated by row-level access controls, middleware enforcement, and database-level RLS" — satisfies SMB buyers. It will not satisfy enterprise buyers requiring physical isolation. This population is explicitly out of scope until Year 3.
- **Tenant offboarding is a multi-table cascade.** Deleting a tenant's data requires DELETE WHERE `organizationId = X` across many tables in the correct cascade order. This is manageable with a documented runbook and a tested deletion job, but it is less atomic than `DROP SCHEMA tenant_xyz`.

**Prisma compatibility: Excellent.** Standard `schema.prisma`, standard Prisma Client, standard migrations. A NestJS middleware injects `organizationId` context; a Prisma client extension enforces it on every query.

**Operational complexity: Low.** One database instance, one migration pipeline, one backup job, standard Postgres monitoring.

---

#### Option B: Schema-Per-Tenant — One PostgreSQL Schema Per Organization

**Architecture:** PostgreSQL supports multiple named schemas within a single database cluster. Each tenant receives their own schema (e.g., `org_abc123`). A shared `public` schema holds platform-level tables. The application switches the `search_path` connection parameter per request to route queries to the correct tenant schema.

**Detailed Pros:**

- **Stronger logical isolation than row-level.** A query executing within schema `org_abc123` cannot access tables in `org_xyz789` without an explicit cross-schema reference. A SQL injection vulnerability that doesn't include a cross-schema reference is contained to one tenant.
- **Cleaner tenant offboarding.** `DROP SCHEMA org_abc123 CASCADE` atomically removes all of that tenant's tables and data in one operation.
- **Compliance optics for mid-market buyers.** "Each customer has their own database schema" is a more satisfying statement to a security-conscious mid-market IT team than "we use row-level isolation." This distinction rarely affects buying decisions at the SMB level but becomes relevant at 100–500 employees.

**Detailed Cons:**

- **Prisma does not support schema-per-tenant as a first-class pattern.** Prisma generates one typed client per `schema.prisma`, bound to the schema specified in the `datasource` block. Switching schemas at runtime requires either: (a) generating one Prisma client per tenant (memory-prohibitive at scale), (b) using raw SQL connection parameters to inject `search_path` (bypasses Prisma's type safety and migration management), or (c) using Prisma's `$queryRaw` exclusively (loses all ORM benefits). None of these are supported patterns; all are documented anti-patterns by the Prisma team as of 2026. **This alone eliminates Option B as a viable choice given the stack constraint.**
- **Migration complexity.** A Prisma migration creates or alters tables in the schema specified in `schema.prisma`. With schema-per-tenant, each tenant schema must be migrated independently. A custom migration runner must be written, tested, and maintained — iterating over all tenant schemas and applying each migration in sequence. Migration failures mid-run (e.g., tenant 47 of 100 fails due to a data constraint violation) require a custom rollback strategy.
- **Schema proliferation.** At 100 tenants: 100 schemas, each containing the full table set. PostgreSQL handles this, but `pg_catalog` queries become slower, schema-scoped DDL locks multiply, and operational inspection (e.g., "which schema contains the oldest unprocessed queue job?") becomes complex.
- **Connection pool complications.** PgBouncer or pg pool configuration must be aware of per-schema routing, which complicates the standard connection pooling setup.
- **Self-hosted operator burden.** A team deploying OpsNext self-hosted for their own organization now encounters schema provisioning logic in the deployment runbook. This degrades the self-hosting value proposition.

**Prisma compatibility: Poor.** Runtime schema switching is not a supported Prisma pattern and requires custom workarounds that bypass core Prisma features.

**Operational complexity: High.** Custom migration runner, per-schema connection routing, schema-scoped backup strategy, complex monitoring.

---

#### Option C: Database-Per-Tenant — Separate PostgreSQL Instance Per Organization

**Architecture:** Each tenant organization receives its own PostgreSQL database, potentially on a dedicated host. A routing layer maps incoming authenticated API requests to the correct database connection string based on the tenant identity extracted from the JWT.

**Detailed Pros:**

- **Maximum isolation guarantee.** Physical database separation is the gold standard for tenant data isolation. Cross-tenant data access through normal application paths is architecturally impossible — there is no shared database state.
- **Independent scaling.** A high-traffic tenant can have their database host scaled independently without affecting other tenants.
- **Regulatory and enterprise fit.** Enterprise buyers in financial services, healthcare, or government who require dedicated infrastructure can be served with this model without change.
- **Independent backup and point-in-time recovery.** Restoring a single tenant's database to a point in time is a standard `pg_restore` operation with no risk of affecting other tenants.

**Detailed Cons:**

- **Operationally prohibitive at Phase 1 scale.** At 10 tenants: 10 databases to provision, configure, migrate, monitor, back up, and patch. At 100 tenants: 100 databases. Each idle PostgreSQL instance consumes 50–100MB of RAM at minimum. At 100 tenants on a shared host: 5–10GB consumed by idle databases before a single application query runs.
- **Prisma incompatibility with dynamic routing.** Prisma generates one client per datasource URL defined at build time. Supporting multiple tenant databases requires generating and managing one Prisma client instance per database URL at runtime — dynamically, based on tenant identity. This is not a supported Prisma pattern. A custom connection manager must be built that: instantiates client instances on demand, caches them, refreshes them on credential rotation, and disposes of them after timeout. This is a significant engineering investment.
- **Migration complexity is severe.** Each database schema change requires a migration job that: enumerates all tenant databases, connects to each in sequence, applies the migration, handles failures per-tenant, reports status, and handles rollback. This custom migration orchestrator does not exist in the Prisma ecosystem and must be built from scratch.
- **Self-hosting is impractical.** A self-hosted operator managing 5 internal teams must manage 5 PostgreSQL databases. The operational advantage of the Docker Compose deployment is destroyed.
- **Per-tenant infrastructure cost.** Even the smallest managed PostgreSQL instance (e.g., a t3.micro RDS or equivalent) costs $15–$30/month. At 100 tenants: $1,500–$3,000/month in database costs alone — before application servers, Redis, object storage, or load balancers. This violates the infrastructure budget constraint in Section 2.1.
- **Connection pool explosion.** Each tenant database requires its own connection pool. With 100 tenants and a pool minimum of 5 connections per database, the API server maintains 500 persistent database connections at idle. PostgreSQL's practical connection limit without pgBouncer is 100–200. This requires a PgBouncer cluster with tenant-aware routing — a further operational complexity multiplier.

**Prisma compatibility: Poor.** Dynamic datasource switching is not supported in standard Prisma. Custom runtime client management is required.

**Operational complexity: Very high.** Per-tenant provisioning pipeline, custom migration orchestrator, connection pool management at scale, per-tenant monitoring, per-tenant backup automation — all must be custom-built.

---

### 5.2 Decision: Option A — Row-Level Tenancy with `organizationId`

**SELECTED MODEL: Option A — Row-Level Tenancy. This decision is binding and final for Phase 1.**

**Definitive justification — the selection is unanimous across all Phase 1 evaluation dimensions:**

**Reason 1 — Prisma compatibility is a hard stack constraint.**
The technology stack is locked for Phase 1 (Section 2.3). Prisma is the ORM. Options B and C both require unsupported Prisma workarounds that defeat the purpose of using Prisma (type safety, migration management, schema-as-source-of-truth). Option A works with Prisma's standard, documented, first-class patterns with zero workarounds. This eliminates Options B and C from consideration as long as the stack constraint holds.

**Reason 2 — Self-hostability is a hard product constraint.**
Options B and C both impose per-tenant provisioning logic in the deployment layer. A self-hosted operator deploying OpsNext for their own team should not encounter tenant schema creation scripts or per-tenant database provisioning in their deployment runbook. Option A's single-database Docker Compose setup is deployable from the documentation alone, which is required by the self-hostability constraint (Section 2.3).

**Reason 3 — The team is two engineers.**
Option B requires a custom migration runner. Option C requires a custom connection router, a custom migration orchestrator, per-tenant monitoring instrumentation, and a per-tenant backup automation pipeline. Neither can be built and maintained by a two-person engineering team while simultaneously shipping seven CRM modules and acquiring the first 10 paying customers.

**Reason 4 — The isolation risk of Option A is a code-quality problem, not an unsolvable architectural problem.**
The risk of cross-tenant data exposure in Option A is real but controllable. The control strategy (Section 5.3) layers four independent enforcement mechanisms: JWT claim validation, Prisma middleware injection, PostgreSQL Row Level Security, and automated integration tests. Any single mechanism failing requires two others to fail simultaneously for a cross-tenant data exposure to occur. This is a substantially lower risk than the operational risks introduced by Options B and C.

**Reason 5 — Year 1 target customers do not require physical isolation.**
The target buyer is a 10–200 person B2B company. Enterprise buyers requiring database-level physical isolation are explicitly out of scope until Year 3 (PV-001, Section 5, Anti-Target). The compliance argument for Options B or C does not apply to the Year 1 target market and is not worth the engineering cost.

**Reason 6 — Option A is incrementally reversible; Options B and C are not.**
In Year 3, if an enterprise tier requiring physical isolation is introduced, the highest-value enterprise tenants can be migrated to dedicated database instances. The row-level model can be incrementally upgraded for selected tenants. Options B and C, if chosen in Year 1, cannot easily be consolidated to a single database for cost efficiency at scale.

**Precedent:** Row-level multi-tenancy is used in production by Linear, Vercel, Planetscale, and numerous other high-scale multi-tenant SaaS products. It is not an experimental pattern.

---

### 5.3 Tenant Isolation Guarantees

With row-level tenancy selected, the following four-layer defense-in-depth strategy enforces tenant isolation:

**Layer 1 — JWT claim enforcement (application entry point):**

Every authenticated API request carries a signed JWT containing the `organizationId` claim. The NestJS `JwtAuthGuard` validates the token signature using the server's RS256 public key. The `TenantGuard` middleware (applied to all routes under `/api/v1/`) extracts `organizationId` from the validated JWT payload and sets it on the `RequestContext` object. If `organizationId` is missing or the JWT is invalid, the request is rejected with `HTTP 401 Unauthorized` before any controller logic executes.

**Layer 2 — Prisma client middleware enforcement (database query layer):**

A Prisma middleware function intercepts every database operation before it reaches PostgreSQL:

- On every `findMany`, `findFirst`, `findUnique`, `count`, `update`, `updateMany`, `delete`, `deleteMany`: injects `organizationId: context.tenantId` into the `where` clause. If the query already includes an `organizationId` filter, the middleware asserts it matches `context.tenantId` (prevents a user from supplying a different tenant's `organizationId` in their request body).
- On every `create`: injects `organizationId: context.tenantId` into the `data` object. A user cannot create a record in a different organization by supplying an alternate `organizationId`.
- Throws `UnauthorizedException` if `context.tenantId` is not present at query time. This makes silent failures (an unset context) loud and testable.

Application code accesses the database exclusively through `TenantPrismaService`. Direct access to the base `PrismaService` is prohibited in all business-logic code. This prohibition is enforced by an ESLint rule that flags direct `PrismaService` injection outside of the `SystemModule` (which handles super-admin and tenant-lifecycle operations).

**Layer 3 — PostgreSQL Row Level Security (database enforcement layer):**

Row Level Security is enabled on all tenant-scoped tables as a defense-in-depth measure. Even if application middleware is bypassed (e.g., a compromised API server that skips the NestJS guard), Postgres enforces the `organizationId` check at the query execution layer.

RLS policy pattern per tenant-scoped table:

```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON contacts
  USING (organization_id = current_setting('app.current_tenant_id')::uuid);
```

The `TenantPrismaService` sets `app.current_tenant_id` on the database session at the start of each connection checkout via `SET LOCAL app.current_tenant_id = '<uuid>'`. The `SystemPrismaService` (super-admin use only) uses a superuser role that bypasses RLS, and its usage is logged to the system audit trail.

**Layer 4 — Automated integration tests (verification layer):**

Every entity type (Contact, Account, Lead, Opportunity, Activity, EmailHistory) has a dedicated integration test that:

1. Creates two separate organizations — Tenant A and Tenant B — with separate admin users.
2. Creates representative records in Tenant A's context using Tenant A's API credentials.
3. Authenticates as Tenant B's admin user.
4. Issues GET requests for the list endpoint — asserts the response contains zero records from Tenant A.
5. Issues GET requests for specific record IDs known to belong to Tenant A — asserts HTTP 404 (not 403, to prevent information disclosure about the existence of the record).
6. Issues UPDATE and DELETE requests for Tenant A record IDs — asserts HTTP 404.

These tests run on every CI pipeline execution. Any regression in tenant isolation fails the pipeline build before the code can be merged.

---

### 5.4 Cross-Tenant Access Prevention Strategy

The following controls together prevent cross-tenant data access:

| Control | Mechanism | Risk vector addressed |
|---------|-----------|----------------------|
| JWT `organizationId` claim validation | NestJS JwtAuthGuard + TenantGuard on every request | Missing or forged tenant context |
| Prisma client middleware | Injects `organizationId` on every query; rejects mismatched claims | Application code omitting organizationId filter |
| PostgreSQL RLS policies | Enforces `organization_id` filter at DB engine level | Application layer bypass (e.g., compromised server) |
| NULL constraint on `organization_id` | `NOT NULL` DB constraint on all tenant-scoped tables | Silent orphan records with no tenant association |
| Foreign key constraint on `organization_id` | FK to `organizations` table on all tenant-scoped tables | Invalid tenant IDs in data |
| Integration test suite | Automated cross-tenant isolation tests per entity on every CI run | Regression from new code that omits middleware |
| Code review gate | Architecture review rejects PRs with unguarded queries | Human review catches edge cases not caught by linting |
| Prohibited raw SQL | ESLint rule flags `$queryRaw`/`$executeRaw` outside SystemModule | Raw SQL bypassing the Prisma middleware |
| Scoped Redis cache keys | All cache keys prefixed `tenant:{organizationId}:` | Cache key collision between tenants |

**Explicitly prohibited patterns enforced at code review and via ESLint:**

- `prisma.$queryRaw()` or `prisma.$executeRaw()` in business-logic modules (only permitted in `SystemModule` with mandatory audit logging).
- Any controller endpoint that accepts `organizationId` from the request body, query string, or URL parameter (tenant identity must come from the JWT exclusively).
- Shared Redis cache keys that are not prefixed with `tenant:{organizationId}:`.
- Background jobs that query entities without explicit `organizationId` scoping.

---

### 5.5 Tenant Provisioning Lifecycle

#### Tenant Creation

**Trigger:** Cloud-hosted trial signup (self-service), or platform admin provisioning (for managed onboarding).

**Steps (all steps within a single database transaction — atomic rollback on any failure):**

1. Validate: organization name uniqueness, subdomain/slug format and uniqueness, admin email format and uniqueness.
2. Create `Organization` record: `status: TRIAL`, `trialExpiresAt: now() + 14 days`, generate UUID.
3. Create first `User` record: role `ADMIN`, linked to the new `Organization`.
4. Seed default pipeline stages: Prospecting → Discovery → Proposal → Negotiation → Closed Won / Closed Lost.
5. Seed default system roles: Admin, Sales Manager, Sales Rep, Read-Only — with their documented default permission sets.
6. Seed default activity types: Call, Email, Meeting, Note, Task.
7. Emit `tenant.created` event (written to audit trail; available as a webhook event in Year 2).
8. Send welcome email to the admin with login link and getting-started guide (async, outside the transaction).
9. Return HTTP 201 with `organizationId` and admin user credentials (one-time password, forced change on first login).

**Idempotency:** The signup flow is idempotent on `adminEmail`. If a signup request is submitted twice with the same email before the first completes, the second is rejected with `HTTP 409 Conflict`.

#### Tenant Activation (Trial to Paid)

**Trigger:** Payment confirmation (manual Stripe payment link in Year 1; Stripe webhook in Year 2).

1. Update `Organization.status: TRIAL → ACTIVE`.
2. Clear `trialExpiresAt`.
3. Log `TENANT_ACTIVATED` event to audit trail.
4. Send activation confirmation email to admin.

#### Tenant Suspension

**Trigger:** Trial expiry (automated scheduler), payment failure (manual in Year 1), or admin-initiated suspension.

1. Update `Organization.status → SUSPENDED`.
2. All API requests from this tenant's users return `HTTP 402 Payment Required` (trial expired) or `HTTP 403 Forbidden` (admin-suspended).
3. **Data is fully retained in all tables.** Suspension is a billing state transition, not a data deletion event.
4. Admin users retain read-only access for 30 days to allow data export before commitment or cancellation.
5. Send suspension notification email to tenant admin with re-activation instructions.

#### Tenant Deletion (Offboarding)

**Trigger:** Explicit cancellation request by tenant admin, 30 days post-suspension without re-activation, or platform admin-initiated purge.

See Section 5.6 for the full deletion and data purge specification.

#### Self-Service Data Export

**Trigger:** Tenant admin initiates from the admin panel export page.

1. Admin submits export request via `POST /api/v1/admin/export`.
2. A BullMQ job is enqueued with `organizationId` and `requestorUserId`.
3. The export request is logged to the audit trail.
4. The job runs asynchronously: queries all entity tables filtered by `organizationId`, serializes to JSON (one file per entity type), compresses into a ZIP archive.
5. The ZIP is written to the tenant's designated object storage path: `exports/{organizationId}/{timestamp}.zip`.
6. A signed, time-limited download URL (valid 24 hours) is generated.
7. The download URL is delivered to the requesting admin via in-platform notification and email.
8. The export file is automatically deleted from storage after 7 days.

---

### 5.6 Tenant Offboarding — Data Retention and Wipe Policy

**Retention schedule by tenant status:**

| Status | Data state | Duration before next transition |
|--------|------------|----------------------------------|
| `TRIAL` (not converted) | Full data, read-write for admin | Trial period (14 days) + 30-day grace |
| `SUSPENDED` (billing) | Full data, read-only for admin | 30 days |
| `CANCELLED` (explicit) | Full data, no user access | 30-day grace period |
| `PENDING_DELETION` | No user access; data retained | 7 days (final window for support recovery) |
| `DELETED` | Data purge job queued | Purge executes within 24 hours |
| `PURGED` | Organization row retained as tombstone; all PII data removed | Indefinite (tombstone for audit trail reference integrity) |

**Hard Deletion Job — execution order:**

The deletion job runs as a scheduled BullMQ worker. Execution is ordered to respect PostgreSQL foreign key constraints:

1. Log the deletion job start: write `DELETION_JOB_STARTED` to the system audit log with `organizationId`, `scheduledAt`, `executedBy` (system or super-admin ID).
2. Mark the organization: `status → DELETING` (prevents any concurrent API access during deletion).
3. Delete all `EmailHistory` records for the organization.
4. Delete all file attachments: iterate `Attachment` records, delete each from object storage, then delete the database record.
5. Delete all `Note` records.
6. Delete all `Activity` records.
7. Nullify `contactId` on all `Opportunity` records (de-associate contacts from opportunities rather than deleting the opportunity — preserves revenue history in the aggregate audit).
8. Delete all `Lead` records.
9. Delete all `Contact` records (PII).
10. Delete all `Account` records.
11. Delete all `Opportunity` records.
12. Delete all `TeamMembership` records.
13. Anonymize `User` records: replace `email`, `firstName`, `lastName`, `phone` with `[redacted]` placeholders before deleting the row — this preserves foreign key references in retained audit log records while removing PII.
14. Delete all `User` records.
15. Delete all `Role` and `Permission` records for the organization.
16. Delete all `PipelineStage` and `ActivityType` records.
17. Purge `AuditLog` records for the organization: **delete records that contain PII in `diff` fields** (field-level change records for Contact/User PII fields); **retain** records that are non-PII (stage changes, login events, configuration changes) — these are de-identified by this point because user records have been anonymized.
18. Update `Organization` record: `status → PURGED`, null out `name`, `domain`, `contactEmail`, `settings`. Retain: `id`, `createdAt`, `suspendedAt`, `deletedAt`, `purgedAt`.
19. Log `DELETION_JOB_COMPLETED` to the system audit log.

**Irreversibility guarantee:** Once the deletion job executes Step 18, recovery requires a full database restore from backup (which would restore all tenants, not just this one). Selective recovery of a deleted tenant's data is not supported after the grace period.

**Self-hosted offboarding:** A `pnpm opsnext tenant:delete --org-id <uuid>` CLI command in the admin tooling executes the same cascade deletion logic, wrapped in an interactive confirmation prompt and a pre-deletion data export.

---

### 5.7 Super-Admin vs Tenant-Admin Privilege Separation

OpsNext CRM enforces a strict two-tier privilege model with no overlap between tenant authority and platform authority.

#### Tenant Admin — Within-Tenant Authority

A Tenant Admin is a `User` record within a specific organization assigned the built-in `ADMIN` role. Their authority is:

- **Scope:** All data within their `organizationId`. The Prisma middleware and PostgreSQL RLS physically enforce this boundary.
- **Capabilities within tenant:** Create, suspend, and delete users; assign roles; configure pipeline stages; manage email integration settings; initiate data exports; view the organization's audit log; configure notification settings.
- **Cannot do:** Access other tenants' data; modify platform-level configuration; access super-admin API routes; create new tenant organizations; access billing infrastructure (Year 2 scope).

Tenant Admin is the maximum privilege level within a tenant. A Tenant Admin cannot elevate their own privileges to super-admin through any in-product flow.

#### Super Admin — Platform Authority

A Super Admin is an OpsNext platform operator. Super-admin accounts are provisioned exclusively via a CLI tool using a hardware-protected master secret stored outside the application.

**Super-admin capabilities:**

- Provision, suspend, and delete tenant organizations.
- View platform-wide aggregate metrics: tenant count, total active users, storage usage — anonymized and aggregated, not tenant-specific records.
- Perform read-only access to any tenant's data for support and compliance purposes. **Every such access is logged to the system audit trail with `superAdmin: true` and the tenant's admin is notified by email within 24 hours.**
- Initiate a data export on behalf of a tenant (support use case for data recovery or GDPR compliance).
- Execute the tenant data purge job after the retention period expires.
- Access the system audit log (cross-tenant view).
- Apply feature flags and platform configuration.

**Super-admin security controls:**

- Super-admin accounts have no password. Authentication uses a short-lived JWT (1-hour lifetime) issued by a separate super-admin CLI tool, signed with a dedicated RS256 key that is rotated quarterly.
- All super-admin actions are written to an immutable system audit log (a separate `SystemAuditLog` table, not the tenant-scoped `AuditLog` table).
- Super-admin read access to tenant data is read-only at the application API layer. Super-admins cannot create, update, or delete tenant entity records through the application API.
- Super-admin accounts cannot be created, modified, or deleted through the application API. Only via the CLI with the master secret.

**Route-level enforcement:**

```
Route hierarchy in NestJS:

/api/v1/*                   → @UseGuards(JwtAuthGuard, TenantGuard)
                                Validates JWT; injects organizationId from JWT.
                                All routes here are tenant-scoped.
                                Tenant-admin routes require ADMIN role check.

/api/v1/super/*             → @UseGuards(JwtAuthGuard, SuperAdminGuard)
                                Validates JWT; checks SUPER_ADMIN role claim.
                                TenantGuard is NOT applied.
                                SuperAdminAuditInterceptor logs every call.
                                organizationId is an explicit URL or body parameter,
                                not derived from JWT (cross-tenant by design).
```

`TenantGuard` and `SuperAdminGuard` are mutually exclusive by design. A single request cannot satisfy both. A super-admin cannot accidentally operate within the tenant context — they must explicitly pass a target `organizationId` as a parameter in the super-admin API routes. This prevents privilege confusion attacks.

---

## 6. Stakeholder Map

### 6.1 Primary Stakeholders

| Stakeholder | Role | Primary concerns | Authority level |
|-------------|------|-----------------|-----------------|
| Founder / Product Lead | Product strategy, architecture, go-to-market | Scope creep, time-to-revenue, product-market fit | Final decision authority on scope, pricing, product vision |
| Engineering Lead (may be Founder) | Technical implementation, code quality, security | Technical debt accumulation, security vulnerabilities, deployment reliability | Final authority on implementation approach; veto on technically infeasible requests |
| Beta Customer Cohort (first 3–5 teams) | Early adopters, feedback providers | Feature completeness for their workflow, data integrity, support quality | Advisory influence on Year 1 roadmap; no authority over architecture or pricing |
| Self-Hosted Community (GitHub) | Deployers, contributors, advocates | Documentation quality, API stability, upgrade safety, self-host feature parity | Influence over OSS-adjacent decisions; no authority over cloud product decisions |

### 6.2 Internal Role Accountability Matrix

Because Phase 1 operates with a lean team where roles overlap, the following documents accountability:

| Functional area | Accountable | Consulted |
|-----------------|-------------|-----------|
| Product scope and prioritization | Founder / Product Lead | Engineering Lead, Beta Customers |
| Architecture decisions and ADRs | Engineering Lead | External technical advisors |
| Security design and review | Engineering Lead | External security review pre-launch |
| UX and interaction design | Engineering Lead (from established component library) | Beta customer usability sessions |
| QA strategy and test coverage | Engineering Lead (CI gates enforce) | — |
| Infrastructure and DevOps | Engineering Lead / Founder | — |
| Customer onboarding | Founder | — |
| Pricing and commercial decisions | Founder | Engineering Lead (for billing system feasibility) |
| GDPR and legal compliance | Founder | External legal counsel for DPA template |

### 6.3 Decision Authority Matrix for Scope Changes

| Change type | Can decide unilaterally | Requires consultation | Requires document revision + commit |
|-------------|------------------------|----------------------|--------------------------------------|
| UI enhancement within an existing feature (no new DB schema) | Engineering Lead | — | No |
| New DB column on an existing entity (migration required) | Engineering Lead | Product Lead sign-off | No — log in ADR |
| New API endpoint within an existing module | Product Lead + Engineering Lead | — | No |
| New module beyond the 7 defined in Phase 1 | — | Beta customer impact assessment | Yes — BRD revision + PV-001 amendment |
| Remove a Phase 1 module from scope | — | Beta customer impact, revenue impact | Yes — BRD revision |
| Change the multi-tenancy model | — | Full architecture re-review | Yes — BRD revision, new ADR, Engineering Lead veto right |
| Change the pricing model or seat definition | Founder | Engineering Lead (billing system impact) | Yes — BRD revision |
| Change a core stack dependency (ORM, framework, DB) | — | External technical review | Yes — ADR required, Engineering Lead approval |
| Extend the Q4 2026 MVP deadline | Founder | Engineering Lead (feasibility assessment) | Yes — BRD revision |
| Add a compliance requirement (SOC 2, HIPAA, etc.) | — | External counsel, Engineering Lead | Yes — BRD revision, scope impact assessment |
| Change the GDPR data retention periods | — | Legal review | Yes — BRD revision |

### 6.4 Escalation Path

**For internal disagreements (scope, architecture, priorities):**

1. Engineering Lead and Product Lead alignment (self-resolution in the founder-led Phase 1 structure).
2. If unresolved: written brief documenting both positions, presented to any external technical advisors for input. Decision documented as an ADR.

**For beta customer feedback conflicts:**

Beta customers are advisory, not authoritative. A beta customer requesting a feature that conflicts with the product pillars in PV-001 does not override the pillars. The correct response: document the request in the backlog, evaluate against the roadmap and product vision, communicate the timeline or rationale for non-inclusion. Features that 3 or more beta customers independently request with clear workflow justification are escalated to the roadmap review at the Q3 2026 checkpoint.

**Scope dispute resolution principle:**

PV-001 (Product Vision, document ID PV-001) is the final arbiter of scope disputes. If a proposed change is consistent with the vision, mission, and product pillars in PV-001, it may be considered for roadmap inclusion. If it conflicts with PV-001, it requires a PV-001 amendment before any implementation work begins. This prevents scope drift by requiring explicit, documented vision amendments rather than silent feature additions.

---

## 7. Document Control

| Field | Value |
|-------|-------|
| Document ID | BRD-001 |
| Version | 2.0 |
| Phase | Phase 1 Foundation |
| Owner | Product Management & Solution Architecture |
| Input documents | PV-001 (Product Vision), UP-001 (User Personas), architecture.md, project-profile.json |
| Reviewers required before Module 1 build begins | Engineering Lead, Security Lead |
| Next mandatory review | After first 5 paying customers are live, or Q3 2026 — whichever comes first |
| Supersedes | BRD-001 v1.0 (2026-06-16 initial stub) |

**Version history:**

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-06-16 | Product Management | Initial stub — section headers and brief entries |
| 2.0 | 2026-06-16 | Product Management & Solution Architecture | Full specification — all sections expanded to binding architectural and business detail; multi-tenancy section fully evaluated with definitive decision and rationale |

**Change control:** Changes to Section 5 (Multi-Tenancy) or Section 3 (Compliance) require a version increment, a change log entry, and Engineering Lead sign-off. Changes to Section 1 (Business Goals) or Section 4 (Revenue Model) require Founder sign-off. All changes are committed to version control with a commit message referencing `BRD-001`.

**Binding status:** This document is binding for all Phase 1 architectural, implementation, and commercial decisions. Deviations from the decisions in this document — particularly the multi-tenancy model selection in Section 5.2 and the GDPR architecture requirements in Section 3.2 — require a written Architecture Decision Record that explicitly references BRD-001 and documents the rationale for the deviation.
