# OpsNext CRM — Success Metrics
## Phase 1 | Product Management

**Document version:** 1.0
**Date:** 2026-06-16
**Author:** Product Management
**Status:** Approved — Baseline Measurement Framework
**Scope:** Phase 1 Foundation — Year 1 production release through 10-tenant milestone

---

## 1. Product Success Metrics Framework

### Measurement Philosophy

OpsNext CRM uses a hybrid framework: a single **North Star Metric** anchors all measurement, **OKRs** drive quarterly prioritization decisions, and a **HEART-derived** set of usage signals provides leading indicators before revenue metrics become statistically meaningful.

We deliberately avoid treating install count, signup count, or API call volume as primary metrics. They are lagging indicators that can be gamed (free self-hosted installs that never activate) or that do not correlate with revenue. A team that installs OpsNext CRM and never logs a lead has not experienced value.

### Why Not Pure HEART

HEART (Happiness, Engagement, Adoption, Retention, Task success) was designed for consumer products with millions of users. In Phase 1, with a target of 10 paying teams, statistical significance on happiness scores is impossible. We use HEART-inspired signals at the feature level but do not report on them at the business review level until Year 2.

### Why Not Pure OKRs

OKRs are goal-setting and prioritization tools. They tell you whether you met your targets but not whether your product is healthy. We pair OKRs with always-on usage telemetry so that a missed OKR can be diagnosed against product behavior data.

---

### North Star Metric

**Weekly Active Teams (WAT):** The number of distinct paying tenant organizations that have at least one user who performed a qualifying CRM action in the past 7 calendar days.

**Qualifying CRM actions** (must be at least one):
- Created or updated a Lead record
- Advanced an Opportunity stage
- Logged an Activity (call, meeting, email)
- Created or updated a Contact or Account

**Why this metric:**
WAT captures active CRM usage, not presence. A team counts only when a human is doing sales work inside the platform. It is sensitive to churn (a churned team disappears from WAT immediately), to onboarding success (a team that can't find value never enters WAT), and to product stickiness (a team that uses OpsNext CRM every week is embedding it into their workflow). It excludes read-only logins, dashboard glances, and admin configuration sessions, which are not evidence of sales execution value.

**WAT targets:**

| Period | WAT Target | Notes |
|--------|-----------|-------|
| End of Month 3 post-launch | 3 | First cohort onboarded and active |
| End of Month 6 post-launch | 6 | Second cohort, referral begins |
| End of Year 1 | 10 | Phase 1 milestone |
| End of Year 2 | 80 | Accounts for expected ~20% churn on 100-tenant base |

---

## 2. Business KPIs

### KPI-B01: Monthly Recurring Revenue (MRR)

| Field | Detail |
|-------|--------|
| **Definition** | Sum of all recurring subscription revenue contracted for the current month, excluding one-time fees, implementation charges, and professional services. Calculated as: (number of paying seats) x (per-seat monthly price). |
| **Measurement method** | Stripe subscription data via billing API. Automated monthly rollup into the internal metrics dashboard. Manual reconciliation check on the 2nd of each month by the Finance/Ops owner. |
| **Baseline** | $0 at launch (no pre-existing revenue) |
| **Year 1 target** | $15,000 MRR ($180K ARR) — assumes 10 paying teams averaging 8 seats at $25/seat/month |
| **Year 2 target** | $41,667 MRR ($500K ARR) — assumes 100 paying teams averaging ~5 seats at $25–$35/seat/month blended |
| **Why it matters** | MRR is the primary health indicator for a SaaS business. All product investment decisions in Phase 1 are calibrated against MRR growth rate. A flat or declining MRR in Month 6+ is a hard stop signal requiring root-cause analysis before continuing feature development. |

---

### KPI-B02: Number of Paying Tenants

| Field | Detail |
|-------|--------|
| **Definition** | Count of distinct tenant organizations with at least one active paid subscription seat as of the last day of the measurement period. Excludes: free trials, self-hosted unpaid instances, internal test tenants. |
| **Measurement method** | Stripe customer records filtered to active subscription status. Tenant count extracted from the `tenants` table in the OpsNext CRM database, joined to Stripe customer ID. Verified monthly against Stripe dashboard. |
| **Baseline** | 0 at launch |
| **Year 1 target** | 10 paying tenants |
| **Year 2 target** | 100 paying tenants |
| **Why it matters** | Tenant count measures market penetration independent of seat expansion within existing accounts. A high MRR with low tenant count means the product is over-indexed on large accounts, creating revenue concentration risk. Target: no single tenant should represent more than 25% of MRR by end of Year 1. |

---

### KPI-B03: Monthly Active Users (MAU) per Tenant

| Field | Detail |
|-------|--------|
| **Definition** | Average number of distinct users within a tenant organization who performed at least one qualifying CRM action (same definition as WAT) in a rolling 30-day window. Reported as: overall average across all tenants, P25 (bottom quartile tenant), and P75 (top quartile tenant). |
| **Measurement method** | Application event log in PostgreSQL (`activity_events` table, filtered by `event_type IN ('lead_created', 'lead_updated', 'opportunity_stage_changed', 'activity_logged', 'contact_created', 'contact_updated')`). Aggregated weekly by tenant. Dashboard updated daily. |
| **Baseline** | 0 at launch |
| **Year 1 target** | Average of 4 MAU per tenant (assumes teams of 6–10 with a mix of heavy and light users) |
| **Year 2 target** | Average of 6 MAU per tenant (deeper penetration within existing accounts) |
| **Why it matters** | Low MAU per tenant is the leading indicator of churn. If the admin and one sales rep are the only users in a 10-seat team, the other 8 seats are at risk at renewal. Target ratio: >60% of provisioned seats should be monthly active. |

---

### KPI-B04: Churn Rate (Tenant and User Level)

| Field | Detail |
|-------|--------|
| **Definition** | **Tenant churn:** Percentage of paying tenants who cancel or do not renew their subscription in a given month. Calculated as: (tenants who churned in month N) / (tenants at start of month N) x 100. **User-seat churn:** Percentage of individual paid seats removed (not replaced) in a given month. |
| **Measurement method** | Stripe subscription cancellation events and seat reduction events. Supplemented by exit survey responses (mandatory 2-question survey triggered on cancellation flow). Tenant churn tracked in internal CRM (OpsNext CRM dogfooding its own pipeline for renewals). |
| **Baseline** | Undefined at launch (no tenure to measure) |
| **Year 1 target** | Tenant churn: <5% monthly (i.e., <45% annually, acceptable for early-stage with high learning rate). Aspirational: <2% monthly by Month 9. |
| **Year 2 target** | Tenant churn: <2% monthly (<22% annually). User-seat churn: <3% monthly. |
| **Why it matters** | At 10 tenants, a single churn event is a 10% hit to MRR. Every churn event in Year 1 must have a documented root cause: product gap, pricing, competitive loss, or company shutdown. Churn without a documented reason is a data quality failure. |

---

### KPI-B05: Trial-to-Paid Conversion Rate

| Field | Detail |
|-------|--------|
| **Definition** | Percentage of trial tenant signups (organizations that activate a free trial) that convert to a paid subscription within 30 days of trial start. Calculated as: (trials that converted to paid in cohort) / (total trials started in cohort) x 100. Measured on 30-day, 60-day, and 90-day cohort windows. |
| **Measurement method** | Trial signup event captured in Stripe (trial subscription start). Conversion event is first successful charge on a paid plan. Cohort analysis in internal dashboard. Trial-to-paid journey tracked in OpsNext CRM itself (dogfooding). |
| **Baseline** | 0% at launch (no data) |
| **Year 1 target** | 25% 30-day trial-to-paid conversion. Benchmark context: Median B2B SaaS trial conversion is 15–25%; our target assumes high-intent inbound (developer and RevOps audiences who evaluated before signing up). |
| **Year 2 target** | 35% 30-day trial-to-paid conversion (product maturity and onboarding improvements). |
| **Why it matters** | Conversion rate is the primary signal for product-market fit at the top of the funnel. A conversion rate below 15% in Month 6 triggers a mandatory onboarding audit. The most common conversion blockers for B2B SaaS are: time-to-first-value too long, missing one critical feature, or pricing friction — each requiring a different intervention. |

---

### KPI-B06: Time-to-First-Value (TTFV)

| Field | Detail |
|-------|--------|
| **Definition** | Elapsed time from account activation (first login after email verification) to the moment the tenant creates their first Lead record. Measured in hours. Reported as median and P90. First Lead creation is the proxy for "aha moment" — the point where a team has committed real sales data to the system. |
| **Measurement method** | Event timestamps in the application event log: `user.first_login` and `lead.first_created` per tenant. Delta calculated server-side and stored in the `tenant_activation_metrics` table. Updated in real time. Reported weekly in the product dashboard. |
| **Baseline** | Undefined at launch |
| **Year 1 target** | Median TTFV < 4 hours. P90 TTFV < 24 hours. (Meaning: 90% of teams that will ever create a lead do so within their first 24 hours.) |
| **Year 2 target** | Median TTFV < 2 hours (guided onboarding wizard, in-app tooltips, sample data option). |
| **Why it matters** | TTFV is the single strongest predictor of 30-day retention in B2B SaaS. Teams that don't reach first value within 24 hours have a >60% probability of never returning (industry benchmark). A rising median TTFV is actionable: investigate whether users are stuck in the role/permission setup, blank-state confusion, or missing an import path. |

---

### KPI-B07: Net Promoter Score (NPS)

| Field | Detail |
|-------|--------|
| **Definition** | Standard NPS calculation: % of Promoters (score 9–10) minus % of Detractors (score 0–6) on the question "How likely are you to recommend OpsNext CRM to a colleague or another team?" Surveyed at the tenant admin level (one response per organization). |
| **Measurement method** | In-app NPS survey delivered via a non-intrusive modal to the CRM Administrator persona 30 days after paid activation, and again at 90-day intervals. Responses stored in the `nps_responses` table. No third-party NPS tool in Phase 1 (built in-app to avoid friction). Follow-up open-text question: "What is the one thing we could do to improve your score?" |
| **Baseline** | No baseline (first measurement at 30-day post-activation mark) |
| **Year 1 target** | NPS >= 30. Context: B2B SaaS median NPS is 31 (Satmetrix 2023). A score of 30 with 10 tenants means approximately 4–5 promoters and 1–2 detractors. |
| **Year 2 target** | NPS >= 45 (product maturity, community formation, integration ecosystem). |
| **Why it matters** | NPS with 10 tenants is not statistically significant but is qualitatively essential. Every individual NPS response in Year 1 is an interview opportunity. The open-text follow-up drives the Phase 2 backlog more reliably than any internal roadmap assumption. A sub-20 NPS by Month 9 triggers a mandatory customer advisory session with all active tenants. |

---

## 3. Product Usage KPIs

### KPI-P01: Daily / Weekly Active Users (DAU / WAU)

| Field | Detail |
|-------|--------|
| **Definition** | DAU: distinct users performing any CRM action on a given calendar day, across all tenants. WAU: same, over a rolling 7-day window. DAU/WAU ratio (stickiness coefficient) targets: > 0.20 (meaning users who are weekly active come back >1.4 days per week on average). |
| **Year 1 target** | WAU: 40 users (10 tenants x average 4 active users). Stickiness: >0.20. |
| **Measurement method** | `user_sessions` table with event timestamps, aggregated daily by cron job at 00:05 UTC. |

---

### KPI-P02: Feature Adoption Rate per Module

Percentage of active tenants (WAT) that have used each module at least once in the measurement period (30 days). A tenant "uses" a module when any user in that tenant performs a create, update, or delete operation on the module's primary entity.

| Module | Primary Entity | 30-Day Adoption Target (Year 1) |
|--------|---------------|--------------------------------|
| User Roles & Permissions | Role assignment | 100% (gating prerequisite — no team runs without roles) |
| Contact & Account Management | Contact created | 90% |
| Lead Management | Lead created | 80% |
| Opportunity & Pipeline | Opportunity created | 70% |
| Activity & Task Management | Activity logged | 80% |
| Email & Communication History | Email logged | 50% (requires email sync setup; lower threshold) |
| Reporting & Dashboards | Dashboard viewed | 60% (not all teams use it weekly) |

**Measurement method:** Module-level event flags per tenant in the `tenant_feature_usage` materialized view, refreshed daily.

---

### KPI-P03: API Usage (% of Paying Teams Using the API)

| Field | Detail |
|-------|--------|
| **Definition** | Percentage of paying tenant organizations that have made at least one authenticated REST API call (not via the OpsNext CRM web UI) in the trailing 30 days. API calls are identified by the presence of an API key header (`X-API-Key`) vs. a session JWT. |
| **Year 1 target** | >= 30% of paying teams (3 of 10 tenants actively using the API). Target reflects developer-first positioning — early adopters are expected to integrate. |
| **Year 2 target** | >= 60% of paying teams. |
| **Measurement method** | API gateway request logs, keyed by `tenant_id` and `auth_type = 'api_key'`. Aggregated monthly. |

---

### KPI-P04: Webhook Event Volume

| Field | Detail |
|-------|--------|
| **Definition** | Total webhook events delivered (HTTP 2xx response received from tenant endpoint) per week, across all tenants. Also tracked: delivery failure rate (4xx or 5xx response, or timeout) as a health metric — target < 2% failure rate. |
| **Year 1 target** | > 500 webhook events per week by end of Year 1 (assumes 5+ tenants with active webhook integrations averaging ~100 events/week each). |
| **Measurement method** | `webhook_delivery_log` table: event type, tenant ID, HTTP response code, delivery latency, retry count. Dashboard updated in real time. |

---

### KPI-P05: Average Deals in Pipeline per Active Team

| Field | Detail |
|-------|--------|
| **Definition** | Average number of open Opportunity records (status != 'Closed Won' and status != 'Closed Lost') per active tenant, measured at end of each week. "Active tenant" = WAT-qualifying tenant. |
| **Year 1 target** | >= 10 open opportunities per active team (below 10 suggests the team isn't using pipeline management; above 50 suggests data hygiene issues without a cleanup workflow). |
| **Measurement method** | Query against the `opportunities` table, grouped by `tenant_id`, filtered to open status. Weekly snapshot stored in `pipeline_health_snapshots`. |

---

### KPI-P06: Activity Log Entries per Rep per Week

| Field | Detail |
|-------|--------|
| **Definition** | Average number of Activity records (calls, meetings, emails, notes) created per Sales Rep role user per 7-day rolling window, per tenant. Excludes Admin and Read-Only roles. |
| **Year 1 target** | >= 5 activity entries per rep per week. Context: persona research (Marcus Chen) targets 6+ activity logs per day; a weekly minimum of 5 suggests at least basic logging behavior but is a conservative threshold for early adoption. |
| **Measurement method** | `activities` table, filtered by `created_by_user_role IN ('sales_rep', 'account_executive')`, grouped by user and week. Reported per tenant and as a cross-tenant average. |

---

## 4. Technical Health KPIs

### KPI-T01: API p95 Response Time

| Field | Detail |
|-------|--------|
| **Definition** | The 95th percentile response time for all authenticated API requests, measured at the NestJS application layer (excluding CDN-cached static assets). Measured in milliseconds. |
| **Target** | p95 < 300ms for read operations (GET). p95 < 500ms for write operations (POST, PUT, PATCH, DELETE). |
| **Aspirational** | p95 < 200ms read, p95 < 350ms write. |
| **Measurement method** | Prometheus histogram `http_request_duration_ms` scraped from the NestJS `/metrics` endpoint. Alerting via Grafana: PagerDuty notification when p95 > 500ms for > 5 consecutive minutes. |
| **Baseline** | Established from load testing before launch (target: meet production targets under 50 concurrent users). |

---

### KPI-T02: Error Rate (5xx and 4xx Ratio)

| Field | Detail |
|-------|--------|
| **Definition** | **5xx error rate:** Percentage of all API requests that return a 5xx HTTP status code (server errors) over a rolling 5-minute window. **4xx error rate:** Percentage returning a 4xx status code (client errors). Tracked separately because 5xx errors are platform failures; 4xx errors are often client misuse. |
| **Target** | 5xx rate < 0.1% in steady state. Alert at > 0.5% for > 2 minutes. 4xx rate: informational only unless > 5% (suggests integration misconfiguration). |
| **Measurement method** | Nginx access log aggregation into Prometheus counter `http_responses_total{status_class="5xx"}`. Real-time Grafana dashboard. Weekly report in team review. |

---

### KPI-T03: Uptime / Availability

| Field | Detail |
|-------|--------|
| **Definition** | Percentage of time the OpsNext CRM API and web application are available and returning valid responses, measured monthly. Calculated as: (total minutes in month - downtime minutes) / total minutes x 100. "Downtime" defined as: API p50 response time > 5 seconds OR 5xx error rate > 5% for > 1 consecutive minute. |
| **Target** | 99.5% monthly uptime (allows ~3.6 hours downtime per month). Aspirational Year 2 target: 99.9% (<44 minutes/month). |
| **Measurement method** | External synthetic monitoring via UptimeRobot (free tier sufficient for Phase 1) pinging `/health` endpoint every 60 seconds. Supplemented by internal Prometheus uptime counter. Monthly uptime report published to the team before each retrospective. |

---

### KPI-T04: Deployment Frequency

| Field | Detail |
|-------|--------|
| **Definition** | Number of deployments to the production environment per week. A "deployment" is any GitHub Actions workflow that successfully completes the production deploy job, regardless of scope (feature, patch, hotfix). |
| **Target** | >= 1 deployment per week in steady state. Maximum acceptable deployment frequency: 2 per day (more frequent than this in Phase 1 suggests instability). |
| **Measurement method** | GitHub Actions workflow run history, filtered to `deploy-production` job with status `success`. Tracked in the team's delivery metrics dashboard. |

---

### KPI-T05: Mean Time to Recovery (MTTR)

| Field | Detail |
|-------|--------|
| **Definition** | Average elapsed time from the moment an incident is declared (P1 or P2 severity) to the moment the service is restored to normal operation and the incident is closed. Measured in minutes. |
| **Target** | MTTR < 60 minutes for P1 (full outage or data corruption risk). MTTR < 4 hours for P2 (significant feature degradation affecting >50% of active users). |
| **Measurement method** | Incident records in the team's incident log (initially a GitHub issue labeled `incident`). Timestamps: `incident_declared_at`, `service_restored_at`. Calculated manually per incident, reported in post-mortems. |

---

### KPI-T06: Test Coverage

| Field | Detail |
|-------|--------|
| **Definition** | Percentage of application code (backend NestJS services + utility functions; excludes generated Prisma client code, migration files, and `node_modules`) covered by Jest unit or integration tests, as reported by Istanbul/c8. |
| **Target** | 70% minimum line coverage enforced in CI (build fails below this threshold). Aspirational: 80% by end of Phase 1. |
| **Measurement method** | Jest `--coverage` flag in GitHub Actions CI workflow. Coverage report uploaded as a build artifact. Coverage badge in README. Branch protection rule: merge blocked if coverage drops below 70%. |
| **Current baseline** | 0% (no tests exist at project start). First measurement after Module 1 (User Roles & Permissions) implementation. |

---

### KPI-T07: Security Audit Findings Count

| Field | Detail |
|-------|--------|
| **Definition** | Number of open security findings categorized by severity: Critical (CVSS >= 9.0), High (CVSS 7.0–8.9), Medium (CVSS 4.0–6.9), Low (CVSS < 4.0). A "finding" is a vulnerability identified in code review, dependency audit, or penetration test that has not yet been remediated and verified. |
| **Target** | Critical: 0 open at any time (immediate fix required, blocks deployment). High: 0 open at release gates. Medium: <= 5 open (tracked, scheduled). Low: tracked, no hard limit. |
| **Measurement method** | `npm audit` run in CI on every pull request. GitHub Dependabot alerts for dependency CVEs. Security review findings tracked as GitHub issues with `security` + severity labels. Count reported in monthly team review and in the Phase 1 done checklist. |

---

## 5. Module-Specific Success Criteria

### Module 1: User Roles & Permissions

| Metric | Definition | Target |
|--------|-----------|--------|
| **Role assignment rate** | Percentage of provisioned user accounts that have been assigned a non-default RBAC role (i.e., not left at the system default). Measures whether admins are actively configuring access control. | >= 95% of users have an explicit role assignment within 24 hours of account creation |
| **RBAC violation attempts blocked** | Number of authorization rejections (HTTP 403) per week resulting from a user attempting to access a resource or action their role does not permit. This is a security signal and an UX signal (too many legitimate 403s suggests role misconfiguration). | < 10 RBAC violations per tenant per week in steady state (spikes investigated) |
| **Admin onboarding time** | Elapsed time from first admin login to first non-admin user provisioned. Measures whether the RBAC setup flow is intuitive. | Median < 20 minutes |

---

### Module 2: Contact & Account Management

| Metric | Definition | Target |
|--------|-----------|--------|
| **Contacts created per active tenant (monthly)** | Total Contact records created in the trailing 30 days, divided by the number of WAT-qualifying tenants. Indicates whether the platform is being used as a real contact database, not just a pipeline tool. | >= 20 contacts per active tenant per month by Month 3 |
| **Duplicate detection rate** | Percentage of Contact creation attempts that trigger the duplicate detection warning (email or phone match on an existing record). Measures both data quality (high rate = dirty data import) and feature utility (feature is surfacing real duplication). | Feature fires on >= 5% of Contact creations (below this: duplicates may be going undetected). Alert if > 30% (suggests a bulk import without dedup pre-processing). |
| **Account-to-Contact link rate** | Percentage of Contact records that are linked to at least one Account record. Unmapped contacts indicate incomplete relationship modeling. | >= 70% of Contacts linked to an Account within 7 days of creation |

---

### Module 3: Lead Management

| Metric | Definition | Target |
|--------|-----------|--------|
| **Lead conversion rate (Lead to Opportunity)** | Percentage of Lead records that progress to status "Converted" and have an associated Opportunity record created. Measured over a rolling 90-day cohort. | >= 20% lead-to-opportunity conversion rate (Industry benchmark: 20–30% for inbound B2B SaaS) |
| **Average time-to-contact on new lead** | Elapsed time from Lead record creation to first Activity logged against that lead (call, email, or meeting). Measures speed of sales follow-up, not just assignment. | Median time-to-contact < 4 hours for leads created during business hours |
| **Lead assignment coverage** | Percentage of Lead records that have an assigned owner (`assigned_to_user_id` is not null) within 1 hour of creation. Leads without owners are dead leads. | >= 90% of leads assigned within 1 hour of creation |

---

### Module 4: Opportunity & Pipeline

| Metric | Definition | Target |
|--------|-----------|--------|
| **Pipeline coverage ratio** | Total value of open opportunities in the pipeline divided by the team's quarterly revenue target. Reported per tenant (requires tenants to set a revenue target in their settings). | >= 3.0x pipeline coverage (industry standard: 3x–4x is healthy for a B2B sales team) |
| **Win rate** | Percentage of opportunities that close as "Closed Won" out of all opportunities that reached a terminal state (Closed Won + Closed Lost) in the measurement period (rolling 90 days). | >= 25% win rate across tenants (varies widely by team; tracked as a trend more than an absolute) |
| **Average sales cycle length** | Median elapsed days from Opportunity creation date to Closed Won date, for closed-won deals in the trailing 90-day cohort. | Tracked as a trend metric; alert if avg cycle length increases > 20% quarter-over-quarter (suggests pipeline hygiene issues) |

---

### Module 5: Activity & Task Management

| Metric | Definition | Target |
|--------|-----------|--------|
| **Task completion rate** | Percentage of tasks with a due date that are marked "Completed" on or before their due date. Measured over a rolling 7-day window. Excludes tasks with no due date (those are tracked separately as "undated backlog"). | >= 70% on-time task completion rate per tenant |
| **Overdue task rate** | Percentage of all open tasks that are past their due date at any given daily snapshot. High overdue rate indicates either over-tasking (too many tasks assigned) or workflow abandonment. | < 15% overdue task rate at any daily snapshot; > 30% triggers an in-app nudge to the owning manager |
| **Activity log completeness** | Percentage of Activities that include both a note body (free text > 20 characters) and a linked entity (Contact, Lead, or Opportunity). Activities with no note and no link are "empty logs" — data without value. | >= 80% of Activity records have both a note body and a linked entity |

---

### Module 6: Email & Communication History

| Metric | Definition | Target |
|--------|-----------|--------|
| **Email log rate per rep per week** | Average number of emails logged to CRM records (either via manual log or IMAP sync) per Sales Rep user per 7-day rolling window. | >= 3 emails logged per rep per week (conservative; assumes partial adoption in Year 1 as email sync setup has friction) |
| **Email sync activation rate** | Percentage of paying tenants that have successfully connected at least one email account (IMAP/OAuth) to OpsNext CRM. Measures whether the email integration setup flow is accessible. | >= 50% of paying tenants have email sync active within 30 days of paid activation |
| **Communication timeline coverage** | Percentage of Contact records with at least one Communication History entry (email, call, or meeting) in the trailing 30 days, across all active tenants. Measures whether the communication history is being used as a relationship record, not just a contact directory. | >= 40% of Contacts have at least one communication entry in the trailing 30 days |

---

### Module 7: Reporting & Dashboards

| Metric | Definition | Target |
|--------|-----------|--------|
| **Dashboard view frequency** | Average number of times the Reports & Dashboards section is accessed per active tenant per week. Counts any navigation to the `/reports` or `/dashboard` route as a view event. | >= 3 dashboard views per active tenant per week |
| **Report export usage** | Number of report exports (CSV or PDF) performed per active tenant per month. Measures whether dashboards are being used for external communication (board reporting, pipeline reviews), not just internal glancing. | >= 2 report exports per active tenant per month |
| **Saved report usage** | Percentage of active tenants that have created at least one saved/pinned report or dashboard view. Indicates whether the reporting tool is embedded in the team's weekly workflow or used ad hoc. | >= 60% of active tenants have at least one saved report by Month 3 post-activation |

---

## 6. Definition of Phase 1 Done

Phase 1 is complete when every item in the following checklist is independently verifiable as TRUE. No item can be waived. All items must be true simultaneously, not sequentially.

### Infrastructure and Deployment

- [ ] OpsNext CRM deploys from a single `docker compose up` command on a fresh Ubuntu 22.04 LTS server with no pre-installed dependencies other than Docker Engine 24+ and Docker Compose v2+
- [ ] Deployment documentation is published, complete, and has been successfully followed by at least one person who is not a core team member
- [ ] `GET /health` endpoint returns HTTP 200 with database and Redis connectivity status within 200ms
- [ ] Database migrations run automatically on container startup via Prisma Migrate and are idempotent (running twice produces no error and no schema drift)
- [ ] GitHub Actions CI pipeline passes on every commit to `main` (lint, typecheck, unit tests, integration tests, build)

### All 7 Modules Live and Functional

- [ ] Module 1 (User Roles & Permissions): Admin can create users, assign roles (Admin, Sales Manager, Sales Rep, Read-Only), and role restrictions are enforced — verified by attempting an unauthorized action and receiving HTTP 403
- [ ] Module 2 (Contact & Account Management): Full CRUD on Contact and Account entities with relationship linking, activity timeline, and duplicate detection functional
- [ ] Module 3 (Lead Management): Lead creation, assignment, status progression (New → Contacted → Qualified → Converted / Disqualified), and lead-to-opportunity conversion flow all functional
- [ ] Module 4 (Opportunity & Pipeline): Kanban and list pipeline views functional, stage progression tracked with timestamps, opportunity value and close date fields functional
- [ ] Module 5 (Activity & Task Management): Activity logging (call, meeting, email, note) linked to any CRM entity functional; task creation with due date and assignee functional; overdue task visibility confirmed
- [ ] Module 6 (Email & Communication History): Manual email log functional; IMAP sync connects and populates Communication History timeline for at least one test email account
- [ ] Module 7 (Reporting & Dashboards): Pipeline by stage, activity by rep, and lead conversion rate reports functional with accurate data; at least one dashboard exportable to CSV

### API Completeness

- [ ] OpenAPI 3.0 specification published at `/api-docs` and covers all 7 modules with full CRUD operations
- [ ] Every UI operation has a documented REST API equivalent — verified by a manual API-parity audit against the OpenAPI spec
- [ ] Webhooks fire on Contact create/update/delete, Lead create/update/delete, Opportunity create/update/delete, and Activity create events — verified by end-to-end test with a webhook.site endpoint

### Security and Compliance

- [ ] Multi-tenant row-level isolation enforced: a user from Tenant A cannot read, write, or infer the existence of Tenant B's data — verified by automated penetration test scenario in the integration test suite
- [ ] All API endpoints require authentication — verified by attempting unauthenticated access to every documented endpoint and confirming HTTP 401 response
- [ ] Zero Critical or High severity security findings open at release gate
- [ ] Audit log captures all create, update, delete operations on all entities with user ID, tenant ID, timestamp, and before/after values
- [ ] Passwords stored as bcrypt hashes (cost factor >= 12) — verified by database inspection of the `users` table

### Quality Gates

- [ ] Jest unit + integration test coverage >= 70% (CI enforced, verified in last passing build artifact)
- [ ] Zero TypeScript compilation errors in strict mode (`tsc --noEmit` passes with `strict: true`)
- [ ] All Playwright end-to-end tests pass in the CI environment for the core user journey: signup → create lead → convert to opportunity → log activity → view pipeline report
- [ ] API p95 response time < 300ms (read) and < 500ms (write) under a load test simulating 20 concurrent users running the core workflow for 5 minutes

### Commercial Readiness

- [ ] At least 1 paying team (not internal) running OpsNext CRM in production with real sales data for >= 30 continuous days
- [ ] Trial sign-up flow functional end-to-end: signup → email verification → onboarding → first lead created, all without manual intervention by the OpsNext team
- [ ] Stripe integration functional: trial start, plan upgrade, and subscription cancellation all trigger correct database state changes
- [ ] NPS survey delivered to at least 2 paying tenant admins at 30-day mark with responses recorded

---

## 7. Review Cadence

### Weekly: Product and Engineering Standup Metrics Review

**Who:** Engineering Lead + Product Manager (5-minute async review, escalate anomalies synchronously)

**What is reviewed:**
- North Star Metric (WAT) — current week vs. prior week
- 5xx error rate trend
- API p95 response time
- Deployment frequency
- Any open P1/P2 incidents

**What decisions it informs:** Hotfix prioritization, immediate on-call escalation, sprint interrupt for production issues.

---

### Bi-Weekly: Product Health Review

**Who:** Product Manager, Engineering Lead, Design Lead (30-minute sync)

**What is reviewed:**
- Full KPI-P01 through KPI-P06 usage dashboard
- Module adoption rates (KPI-P02)
- TTFV trend (KPI-B06)
- Trial-to-paid funnel (KPI-B05)
- Open support or user feedback items that signal product gaps

**What decisions it informs:** Sprint backlog prioritization, feature flag decisions, onboarding flow improvements, documentation gaps to close.

---

### Monthly: Business Review

**Who:** Founding team / all stakeholders (60-minute sync)

**What is reviewed:**
- All KPI-B01 through KPI-B07 business metrics
- MRR and tenant count vs. plan
- Churn with root-cause documentation for each churned tenant
- NPS responses and open-text qualitative themes
- Technical health summary (uptime, MTTR, test coverage trend)
- Phase 1 Done checklist status (which items are complete, which are in progress)

**What decisions it informs:** Go/no-go decisions for new feature investment, pricing and packaging changes, sales and marketing spend reallocation, hire/no-hire for commercial roles.

---

### Quarterly: Phase Gate Review

**Who:** Full team including all leads (2-hour structured review)

**What is reviewed:**
- Full retrospective on all metrics for the quarter against targets
- Phase 1 Done checklist — go/no-go to declare Phase 1 complete and begin Phase 2 Domain Modeling
- Year 1 to Year 2 transition readiness assessment (100-tenant capacity planning, API v2 readiness, Year 2 milestone kickoff)
- Competitive landscape update

**What decisions it informs:** Phase completion declaration, Year 2 investment scope, SOC 2 Type I audit initiation, hiring plan for Year 2 growth.

---

### Metric Ownership

| Metric Category | Owner | Escalation Path |
|----------------|-------|----------------|
| MRR, Tenant Count, Churn, NPS | Product Manager | Founding team |
| Trial conversion, TTFV | Product Manager + Engineering Lead | Product Manager |
| DAU/WAU, Module adoption, Activity rates | Product Manager | Engineering Lead |
| API p95, Error rate, Uptime, MTTR | Engineering Lead | On-call engineer → Engineering Lead |
| Test coverage, Security findings | Engineering Lead | Engineering Lead → Product Manager |
| Deployment frequency | Engineering Lead | Self-managed |

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | SM-001 |
| **Phase** | Phase 1 Foundation |
| **Owner** | Product Management |
| **Reviewers** | Engineering Lead, Design Lead, Founding Commercial Team |
| **Next Review** | End of Q3 2026 (after first 3 paying customers are live and producing data) |
| **Supersedes** | None (inaugural document) |
| **Related documents** | PV-001 (Product Vision), UP-001 (User Personas) |

All numeric targets in this document are baselined against publicly available B2B SaaS benchmarks (Bessemer State of the Cloud 2024, OpenView PLG Benchmarks 2024, Satmetrix NPS Benchmarks 2023) and adjusted for the specific context of an early-stage, developer-first CRM targeting sub-200-employee teams. Targets should be revisited after 90 days of production data is available — they are hypotheses, not commitments.
