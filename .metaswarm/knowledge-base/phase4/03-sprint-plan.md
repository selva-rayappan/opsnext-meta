# OpsNext CRM — Sprint Plan
## Phase 4: Delivery Planning

**Document ID:** PLAN-003  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Delivery Anchor  
**Input documents:** PLAN-001, PLAN-002, FR-001, ARCH-001

---

## Planning Parameters

| Parameter | Value |
|---|---|
| Sprint duration | 2 weeks |
| Total sprints (Phase 1) | 8 |
| Total timeline | 16 weeks (~4 months) |
| Team | 1 full-stack engineer (solo) |
| Velocity estimate | ~15 story points per sprint |
| Coverage gate | 70% before merge (enforced in CI) |
| Start date | 2026-07-01 |
| Target Phase 1 GA | 2026-10-26 |

**Story point scale:**
- 1 pt: trivial change (config, copy, 1 file)
- 2 pt: small feature (1 endpoint + DTO + test)
- 3 pt: medium feature (service + controller + 1 UI page + tests)
- 5 pt: large feature (multi-file, cross-module, complex business logic)
- 8 pt: very large (entire sub-domain, major UI flow, integration)

---

## Sprint 1 — Auth Foundation (EP-01, weeks 1–2)
**Sprint Goal:** Working login/register/logout with JWT + httpOnly cookies. Invite flow end-to-end.  
**Dates:** 2026-07-01 → 2026-07-14  
**Status:** ✅ COMPLETE

| Story | Points | Notes |
|---|---|---|
| Monorepo scaffold (pnpm workspaces, Turborepo, Docker Compose) | 3 | Done |
| Prisma schema — IAM entities (Org, User, RefreshToken, etc.) | 3 | Done |
| NestJS core (main.ts, AppModule, global pipes, Helmet, CORS) | 2 | Done |
| AuthService (register, login, refresh, logout) | 5 | Done |
| JWT RS256 strategy + JwtAuthGuard + Public decorator | 2 | Done |
| AuthController (all 6 endpoints, cookie management) | 2 | Done |
| Shared package types (Role, UserPayload, OrganizationStatus) | 1 | Done |
| **Total** | **18** | Slightly over — scope ok for foundation sprint |

**DoD:**
- [x] `pnpm dev` starts API + Web + DB + Redis with no errors
- [x] POST /auth/register creates org + user + returns tokens
- [x] POST /auth/login returns tokens; wrong password returns 401
- [x] POST /auth/refresh rotates token; reuse invalidates family
- [x] Swagger available at /api/docs

---

## Sprint 2 — User Management + Frontend Auth (EP-01, weeks 3–4)
**Sprint Goal:** Full user lifecycle (RBAC, invite, deactivate) + Next.js auth screens + user management page.  
**Dates:** 2026-07-15 → 2026-07-28  
**Status:** ✅ COMPLETE

| Story | Points | Notes |
|---|---|---|
| TenantPrismaService (AsyncLocalStorage pattern) | 5 | Done |
| TenantMiddleware (seeds context from JWT orgId) | 2 | Done |
| RolesGuard (fail-closed, SUPER_ADMIN bypass) | 2 | Done |
| UsersService (findAll, findById, invite, acceptInvite, deactivate, reactivate, updateRole, changePassword) | 5 | Done |
| UsersController (GET /me, PATCH /me/password, POST /invite, etc.) | 3 | Done |
| AuditService + AuditModule (@Global) | 2 | Done |
| MailService (nodemailer + console transport for dev) | 2 | Done |
| Next.js: login page + register page | 3 | Done |
| Next.js: forgot/reset password pages | 2 | Done |
| Next.js: dashboard layout + sidebar navigation | 3 | Done |
| Next.js: User Management page (list, invite modal, role/deactivate actions) | 5 | Done |
| **Total** | **34** | Split across parallel agent execution |

**DoD:**
- [x] Full auth flow works in browser (register → login → refresh → logout)
- [x] Invite email sent; invite link creates user account
- [x] ADMIN can deactivate a user; deactivated user's tokens revoked
- [x] SALES_MANAGER cannot promote above ADMIN
- [x] Cross-tenant isolation integration tests pass
- [x] 70% test coverage on auth + users modules (target for Sprint 3 — tests not yet written)

---

## Sprint 3 — Tests + Contact Management Foundation (EP-01 close + EP-02 start, weeks 5–6)
**Sprint Goal:** Close EP-01 with full test coverage. Begin Contact CRUD.  
**Dates:** 2026-07-29 → 2026-08-11  
**Status:** 🔲 NEXT

| Story | Points | Estimate |
|---|---|---|
| AuthService unit tests (register, login, refresh token rotation, family invalidation, password reset) | 5 | |
| UsersService unit tests (invite, deactivate, updateRole hierarchy, changePassword) | 3 | |
| RolesGuard unit tests (allowed, denied, no-decorator = deny, SUPER_ADMIN bypass) | 2 | |
| TenantPrismaService unit tests (context present, context missing throws, skipTenantFilter) | 2 | |
| Integration tests: full auth flow + cross-tenant isolation (read + write) | 5 | |
| Prisma schema migration: Contact + Account + Tag + CustomField entities | 3 | |
| ContactsService (CRUD, owner assignment, soft delete) | 3 | |
| ContactsController (GET /, GET /:id, POST /, PATCH /:id, DELETE /:id) | 2 | |
| **Total** | **25** | May need to defer Contact UI to Sprint 4 |

**DoD:**
- [ ] `pnpm test:cov` passes 70% threshold on all EP-01 modules
- [ ] All cross-tenant isolation tests green
- [ ] Contact CRUD endpoints pass integration tests
- [ ] Swagger updated with Contact endpoints

---

## Sprint 4 — Contacts & Accounts UI + Advanced Features (EP-02, weeks 7–8)
**Sprint Goal:** Full Contact and Account management with search, tags, CSV import, and UI.  
**Dates:** 2026-08-12 → 2026-08-25

| Story | Points | Estimate |
|---|---|---|
| AccountsService + AccountsController (CRUD) | 3 | |
| ContactAccountLink (link/unlink, isPrimary) | 2 | |
| Tag system (create tags, apply to contact/account, filter by tag) | 3 | |
| Custom fields (define field, set value, include in API response) | 5 | |
| Contact search endpoint (GET /contacts?q=) + ILIKE search | 3 | |
| Contact merge (POST /contacts/:id/merge, atomic re-linking) | 5 | |
| CSV import (POST /contacts/import, per-row validation, partial success) | 5 | |
| Next.js: Contact list page (paginated, search, filters, sort) | 3 | |
| Next.js: Contact detail page (info + activity timeline stub) | 3 | |
| Next.js: Account list + Account detail page | 3 | |
| Tests: Contacts + Accounts services + integration + import edge cases | 3 | |
| **Total** | **38** | Stretch sprint — may split CSV import to Sprint 5 |

**DoD:**
- [ ] Contact list renders with 1,000 seeded contacts in < 400ms
- [ ] CSV import processes 500-row file; errors reported per row
- [ ] Contact merge re-links all activities/opportunities to canonical record
- [ ] 70% test coverage on contacts + accounts modules

---

## Sprint 5 — Leads (EP-03, weeks 9–10)
**Sprint Goal:** Complete lead management from capture through conversion.  
**Dates:** 2026-08-26 → 2026-09-08

| Story | Points | Estimate |
|---|---|---|
| Prisma migration: Lead entity | 2 | |
| LeadsService (CRUD, status transitions, score) | 3 | |
| LeadsController (full REST + status endpoints) | 2 | |
| Lead conversion (POST /leads/:id/convert — atomic Contact + Opportunity) | 5 | |
| Lead owner scoping (SALES_REP = own only; SALES_MANAGER = team) | 2 | |
| Lead bulk CSV import | 3 | |
| Next.js: Lead list (table view + kanban by status) | 5 | |
| Next.js: Lead detail + conversion wizard | 3 | |
| Tests: LeadsService unit + conversion integration tests | 3 | |
| **Total** | **28** | |

**DoD:**
- [ ] Lead conversion is atomic (both Contact + Opportunity created or neither)
- [ ] Cannot convert an already-converted lead
- [ ] SALES_REP sees only own leads in GET /leads
- [ ] 70% test coverage on leads module

---

## Sprint 6 — Pipelines & Opportunities (EP-04, weeks 11–12)
**Sprint Goal:** Visual kanban pipeline with stage transitions, win/loss recording, and forecasting.  
**Dates:** 2026-09-09 → 2026-09-22

| Story | Points | Estimate |
|---|---|---|
| Prisma migration: Pipeline, Stage, Opportunity, StageHistory | 3 | |
| PipelinesService (CRUD, stage management, default pipeline) | 3 | |
| OpportunitiesService (CRUD, changeStage, markWon, markLost) | 5 | |
| OpportunitiesController (full REST + /won + /lost) | 3 | |
| Forecast endpoint (GET /opportunities/forecast?period=month) | 3 | |
| StageHistory recording (atomic with stage change) | 2 | |
| Next.js: Kanban board (drag-and-drop using dnd-kit) | 8 | |
| Next.js: Opportunity detail (stage history timeline, edit panel) | 3 | |
| Next.js: Pipeline settings page (manage stages, reorder) | 3 | |
| Tests: Opportunities service unit + stage transition integration | 3 | |
| **Total** | **36** | Kanban is the high-risk item |

**DoD:**
- [ ] Stage transition creates StageHistory entry in same transaction
- [ ] markLost requires lostReason
- [ ] SALES_MANAGER sees full org pipeline; SALES_REP sees own
- [ ] Kanban drag-and-drop triggers PATCH /opportunities/:id/stage
- [ ] 70% test coverage on pipelines + opportunities modules

---

## Sprint 7 — Activities, Tasks & Email (EP-05 + EP-06, weeks 13–14)
**Sprint Goal:** Log interactions, create tasks, send emails from CRM, sync replies.  
**Dates:** 2026-09-23 → 2026-10-06

| Story | Points | Estimate |
|---|---|---|
| Prisma migration: Activity, Task, EmailThread, EmailMessage, EmailTemplate | 3 | |
| ActivitiesService (CRUD, type enforcement, timeline) | 3 | |
| TasksService (CRUD, assignment, completion, overdue detection) | 3 | |
| BullMQ setup: overdue task check job (runs every 15 min) | 2 | |
| SMTP integration (org config, send email, create EmailThread + Activity) | 5 | |
| IMAP sync worker (BullMQ repeatable job, match replies by Message-ID) | 5 | |
| Email open/click tracking (pixel embed, link rewrite, event handler) | 3 | |
| Email templates (CRUD + use in compose) | 2 | |
| Next.js: Activity log page | 3 | |
| Next.js: Task list (kanban + list, priority highlighting, overdue) | 3 | |
| Next.js: Email compose modal + thread view | 5 | |
| Tests: activities + tasks + email service tests | 3 | |
| **Total** | **40** | IMAP sync is high-risk — may slip to Sprint 8 |

**DoD:**
- [ ] Sending email creates Activity of type EMAIL_LOG via domain event
- [ ] IMAP sync matches reply to existing thread by Message-ID header
- [ ] Overdue task notification sent via email within 5 minutes of job run
- [ ] 70% test coverage on activities + tasks + email modules

---

## Sprint 8 — Reporting, Polish & GA Prep (EP-07 + hardening, weeks 15–16)
**Sprint Goal:** Pre-built reports, dashboard, CSV export, bug fixes, performance, and production readiness.  
**Dates:** 2026-10-07 → 2026-10-20

| Story | Points | Estimate |
|---|---|---|
| Prisma migration: SavedReport, Dashboard | 1 | |
| ReportsService (pipeline summary, activity by rep, lead funnel, win/loss, forecast) | 5 | |
| SavedReport CRUD + sharing | 2 | |
| Dashboard widget API (save layout, fetch widget data) | 3 | |
| CSV export (BullMQ async job, signed S3 URL, polling endpoint) | 5 | |
| Next.js: Reports page (5 pre-built reports, filters, export button) | 5 | |
| Next.js: Dashboard page (drag-resize widgets, default + personal) | 5 | |
| Performance audit: p95 latency test for all list endpoints | 2 | |
| Security audit: OWASP top 10 checklist | 3 | |
| E2E tests: Playwright login flow, register + invite flow, pipeline stage change | 5 | |
| Production deployment setup (Docker production build, env validation) | 3 | |
| Final documentation (README, self-hosting guide) | 2 | |
| **Total** | **41** | Buffer: IMAP slip from S7 absorbs here |

**DoD:**
- [ ] All 5 pre-built reports return data in < 2 seconds
- [ ] Dashboard loads with 6 widgets in < 2 seconds
- [ ] E2E Playwright tests green in CI
- [ ] OWASP checklist signed off by security review
- [ ] Docker production build runs with `docker compose -f docker-compose.prod.yml up`
- [ ] Phase 1 GA criteria met (see success-metrics.md §1)

---

## Milestone Summary

| Milestone | Sprint | Date |
|---|---|---|
| EP-01 Code complete | S2 | 2026-07-28 |
| EP-01 Tests passing (70% coverage) | S3 | 2026-08-11 |
| EP-02 Complete | S4 | 2026-08-25 |
| EP-03 Complete | S5 | 2026-09-08 |
| EP-04 Complete | S6 | 2026-09-22 |
| EP-05 + EP-06 Complete | S7 | 2026-10-06 |
| EP-07 + GA Prep | S8 | 2026-10-20 |
| **Phase 1 General Availability** | **S8+** | **2026-10-26** |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| IMAP sync complexity (Sprint 7) | High | Medium | Timebox 1 sprint; defer full sync to Year 2 if needed; Phase 1 can ship with SMTP-only |
| Kanban drag-and-drop (Sprint 6) | Medium | Low | Use battle-tested `dnd-kit`; fallback to click-to-move if DnD has accessibility issues |
| Test coverage gate blockers | Medium | Medium | Write tests in same sprint as feature (not deferred) — Sprint 3 unblocks the pattern |
| PostgreSQL RLS (defence-in-depth) | Low | High | Not required for Phase 1 GA; App layer isolation is sufficient; RLS is Phase 2 hardening |
| 70% coverage on reports module | Low | Medium | Reports are pure read queries — easy to unit test with mock data |

---

## Definition of Done (All Epics)

A feature is "done" when:
1. All acceptance criteria from user story are verified.
2. Unit tests written for service layer (coverage ≥ 70%).
3. Integration tests cover the happy path and key error paths.
4. API endpoint documented in Swagger (`@ApiOperation`, response schemas).
5. Frontend feature works in browser (not just tests).
6. No TypeScript errors (`pnpm typecheck` clean).
7. No lint errors (`pnpm lint` clean).
8. `docker compose up` starts the full stack without errors.
9. Code reviewed (self-review checklist: security, multi-tenancy, RBAC).
10. Feature committed to `main` branch with passing CI.
