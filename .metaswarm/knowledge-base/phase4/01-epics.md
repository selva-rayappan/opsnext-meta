# OpsNext CRM — Epics
## Phase 4: Delivery Planning

**Document ID:** PLAN-001  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Delivery Anchor  
**Input documents:** FR-001, BRD-001, ARCH-001 through ARCH-005

---

## Epic Overview

7 epics map directly to the 7 functional modules from FR-001. Each epic is self-contained: it owns its DB schema additions, API endpoints, and frontend UI. Epics are sequenced by dependency — later epics reference data created by earlier ones.

| # | Epic | FR Prefix | Status | Target Sprint |
|---|---|---|---|---|
| EP-01 | User Roles & Permissions | FR-AUTH | ✅ Complete | Sprint 1–2 |
| EP-02 | Contact & Account Management | FR-CONTACT | ✅ Complete | Sprint 3–4 |
| EP-03 | Lead Management | FR-LEAD | ✅ Complete | Sprint 5 |
| EP-04 | Opportunity & Pipeline Tracking | FR-OPP | ✅ Complete | Sprint 6 |
| EP-05 | Activity & Task Management | FR-ACTIVITY | ✅ Complete | Sprint 7 |
| EP-06 | Email & Communication History | FR-EMAIL | ✅ Complete | Sprint 7–8 |
| EP-07 | Reporting & Dashboards | FR-REPORT | ✅ Complete | Sprint 8 |

---

## EP-01: User Roles & Permissions ✅

**Goal:** Full identity and access control — auth, RBAC, user management, invitations, audit log.

**Done criteria:**
- [x] JWT auth (register, login, refresh, logout, password reset)
- [x] 5 built-in roles: SUPER_ADMIN, ADMIN, SALES_MANAGER, SALES_REP, READ_ONLY
- [x] Role-based access control (fail-closed RolesGuard)
- [x] Multi-tenant row isolation (TenantPrismaService + TenantMiddleware)
- [x] User invite flow (email → accept → account setup)
- [x] User deactivate/reactivate (revokes all sessions)
- [x] Role update with hierarchy enforcement
- [x] Audit log on all IAM mutations
- [x] `/api/docs` Swagger UI
- [x] Next.js auth screens (login, register, forgot password, reset password)
- [x] Next.js user management UI (list, invite, deactivate, role change)

**Key metrics:**
- Authentication p95 < 300ms
- Zero cross-tenant data leaks (verified by integration test matrix)
- 70% test coverage on auth and users modules

---

## EP-02: Contact & Account Management ✅

**Goal:** Master data for people (Contacts) and companies (Accounts) — the foundation all sales activity builds on.

**Completed:** 2026-06-17

**Done criteria:**
- [x] Contact CRUD (create, read, update, soft-delete)
- [x] Account CRUD
- [x] Contact ↔ Account linking (many-to-many with isPrimary flag)
- [x] Tag system (create tags, apply to contacts/accounts, filter by tag)
- [x] Custom fields (org admin defines fields; reps fill values)
- [x] Contact/Account search (name, email, company, fuzzy)
- [x] Bulk import via CSV (email, first_name, last_name, company required)
- [x] Duplicate detection on import (flagged, not blocked)
- [x] Contact merge (tombstone source, point all FKs to canonical)
- [x] Owner assignment (ADMIN assigns; Sales Rep can only see/edit own unless org-wide scope set)
- [x] Next.js: Contact list (paginated, filterable, sortable)
- [x] Next.js: Contact detail page (timeline of activities + linked opps)
- [x] Next.js: Account list + Account detail page

**Key metrics:**
- Contact list renders ≤ 500ms (p95) with 10,000 contacts
- CSV import processes ≤ 1,000 rows per request
- Duplicate detection catches email duplicates within the same import

---

## EP-03: Lead Management ✅

**Goal:** Capture, qualify, score, and convert inbound leads into Contacts and Opportunities.

**Status:** Complete — 2026-06-17

**Done criteria:**
- [x] Lead CRUD (create, read, update, delete)
- [x] Lead status lifecycle: NEW → CONTACTED → QUALIFIED / UNQUALIFIED → CONVERTED
- [x] Lead score field (0–100; manual entry in Phase 3, auto-scoring in Year 2)
- [x] Lead source tracking (web, referral, cold-call, CSV import, API)
- [x] Lead-to-Contact conversion (creates Contact + optional Opportunity atomically)
- [x] Bulk lead import via CSV
- [x] Lead owner assignment and reassignment
- [x] SALES_MANAGER can view all team leads; SALES_REP sees only own
- [x] Next.js: Lead list with status kanban view + table view toggle
- [x] Next.js: Lead detail page with conversion wizard

**Key metrics:**
- Lead conversion creates Contact + Opportunity in a single transaction (no partial failures)
- Lead list renders in < 400ms with 5,000 leads

---

## EP-04: Opportunity & Pipeline Tracking ✅

**Goal:** Visual pipeline tracking, stage management, win/loss recording, and forecasting.

**Status:** Complete — 2026-06-17

**Done criteria:**
- [x] Pipeline CRUD (create, name, set as default)
- [x] Stage CRUD within a Pipeline (add/remove/reorder stages)
- [x] Opportunity CRUD
- [x] Stage transition (change stage → records StageHistory)
- [x] Win recording (requires wonAt, amount optional)
- [x] Loss recording (requires lostReason, lostAt)
- [x] Probability override per opportunity
- [x] Pipeline view (kanban board grouped by stage, drag-to-move)
- [x] Forecast view (weighted revenue by close date period)
- [x] SALES_MANAGER sees full team pipeline; SALES_REP sees own only
- [x] Next.js: Pipeline kanban board (drag-and-drop stage transitions)
- [x] Next.js: Opportunity detail page with stage history timeline
- [x] Next.js: Forecast table (by owner, by month)

**Key metrics:**
- Kanban board renders with 200 open opportunities in < 500ms
- Stage transition is atomic (history record + stage update in same transaction)

---

## EP-05: Activity & Task Management ✅

**Goal:** Log all customer interactions (calls, meetings, notes) and track to-dos (tasks).

**Status:** Complete — 2026-06-17

**Done criteria:**
- [x] Activity CRUD (type: CALL, MEETING, NOTE)
- [x] Activity linked to Contact / Account / Lead / Opportunity (at least one required)
- [x] Call completion recording (duration, outcome required)
- [x] Task CRUD (assign to any team member in same org)
- [x] Task priority levels (LOW, MEDIUM, HIGH, URGENT)
- [x] Task status lifecycle (OPEN → IN_PROGRESS → COMPLETED | CANCELLED)
- [x] Due date reminders via BullMQ (TaskReminderSchedulerService, cron every 30 min, sendTaskReminder email)
- [x] Activity timeline on Contact, Account, Lead, Opportunity detail pages (ActivityTimeline component)
- [x] SALES_MANAGER views team activity; SALES_REP views own
- [x] Next.js: Activity log with filters (type, date, owner, linked entity)
- [x] Next.js: Task list with kanban + list view, overdue highlighting (combined in /activities page)

**Key metrics:**
- Activity timeline on Contact detail loads < 300ms
- Overdue task notifications delivered within 5 minutes of due date

---

## EP-06: Email & Communication History ✅

**Goal:** Log emails sent from the CRM, sync received replies via IMAP, track opens/clicks.

**Status:** Complete — 2026-06-17

**Done criteria:**
- [x] SMTP integration configuration (per org — their own email server) — `EmailIntegration` model, AES-256-GCM encrypted passwords, `PUT /email-integrations` upsert
- [x] Send email from Contact / Opportunity detail page — `POST /emails/threads` creates EmailThread + EmailMessage, sends via nodemailer
- [x] IMAP sync (poll for replies, match to existing threads by Message-ID) — `EmailSyncProcessor` with imapflow + mailparser
- [x] Email open and click tracking (pixel + link rewrite) — `GET /emails/track/open/:id` 1x1 GIF, `GET /emails/track/click/:id/:url` redirect; links rewritten in bodyHtml at send time
- [x] Email templates (create, manage, use when composing) — `EmailTemplate` model, full CRUD, template selector in compose modal
- [x] Sent email creates EMAIL_LOG Activity automatically
- [x] Received reply creates EMAIL_LOG Activity automatically (in IMAP sync processor)
- [x] BullMQ queue for IMAP sync (runs every 5 minutes — `EmailSyncSchedulerService`)
- [x] Next.js: Email compose modal — `EmailComposeModal` component with template selector, chip inputs for To/CC, reply mode
- [x] Next.js: Thread view on Contact detail timeline — "Email" tab on contact detail page with thread list + thread detail panel + inline reply
- [x] Next.js: Email template manager — two-panel settings page at `/settings/email-templates`

**Key metrics:**
- IMAP sync latency: email appears in CRM within 10 minutes of receipt
- Open tracking: pixel load event processed within 30 seconds
- Delivery tracking: bounces recorded via SMTP delivery status notifications

---

## EP-07: Reporting & Dashboards ✅

**Goal:** Pre-built and custom reports giving sales leaders visibility into pipeline, activity, and revenue.

**Status:** Complete — 2026-06-17

**Done criteria:**
- [x] Pre-built reports: Pipeline Summary, Activity by Rep, Lead Funnel, Win/Loss Analysis, Revenue Forecast
- [x] Saved Reports (save filters, share org-wide) — `GET/POST/DELETE /reports/saved`, SavedReport model
- [x] Dashboard with configurable widget layout (stat cards, pipeline, win/loss, funnel, activities, tasks)
- [x] Date range filters (this week, this month, this quarter, custom range)
- [x] Owner/team filters on all reports
- [x] CSV export for all reports (direct download — synchronous fallback kept)
- [x] CSV export via async BullMQ job — `POST /reports/export-job` → `{ jobId }`, processor stores CSV in returnvalue
- [x] SALES_MANAGER: team reports scoped to their team
- [x] SALES_REP: personal performance reports only
- [x] ADMIN/EXECUTIVE: org-wide reports
- [x] Next.js: Reports page with sidebar nav per report type
- [x] Next.js: Dashboard page (summary stats, pipeline, activities, tasks)
- [x] Next.js: Export download UI with polling for async jobs (2-second interval, auto-download on complete)

**Key metrics:**
- Pre-built report renders < 2 seconds for 6-month window, org with 1,000 opportunities
- CSV export for 10,000 rows completes in < 30 seconds
- Dashboard widget data refreshes every 5 minutes (configurable)
