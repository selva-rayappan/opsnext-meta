# OpsNext CRM — User Stories
## Phase 4: Delivery Planning

**Document ID:** PLAN-002  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Delivery Anchor  
**Input documents:** PLAN-001, UP-001 (Personas), FR-001

---

## Story Format

```
US-<EPIC>-<NNN>
As a <persona>
I want to <action>
So that <business outcome>

Acceptance Criteria:
- [ ] AC1
- [ ] AC2
```

**Personas reference:** Marcus (Sales Rep), Priya (Sales Manager), Sofia (Account Manager), Jordan (Marketing), Amir (CRM Admin), Dana (VP Sales) — from UP-001.

---

## Epic 01 — User Roles & Permissions (✅ Implemented)

### US-01-001: Register my organization
**As** Amir (CRM Admin)  
**I want to** register my company with an admin account  
**So that** I can set up OpsNext CRM for my team

**AC:**
- [x] POST /auth/register creates org + admin user in a single transaction
- [x] Returns access token (body) + refresh token (httpOnly cookie)
- [x] Org slug is auto-generated from org name
- [x] Duplicate org name returns 400

---

### US-01-002: Log in securely
**As** any authenticated user  
**I want to** log in with email and password  
**So that** I can access the CRM

**AC:**
- [x] Successful login returns access token (15 min) + refresh token cookie (7 days)
- [x] Wrong password returns generic "Invalid credentials" (no user enumeration)
- [x] Inactive account returns 401 with clear message
- [x] Account locks after 5 failed attempts in 15 minutes

---

### US-01-003: Stay logged in across sessions
**As** Marcus (Sales Rep)  
**I want to** remain logged in across browser sessions without re-entering my password  
**So that** I can pick up where I left off

**AC:**
- [x] Expired access token triggers automatic silent refresh
- [x] Refresh token rotates on each use
- [x] Reusing a rotated token invalidates entire token family and forces re-login
- [x] Access token lives in memory only (not localStorage)

---

### US-01-004: Invite a new team member
**As** Amir (CRM Admin)  
**I want to** invite a colleague by email with a specific role  
**So that** they can join the CRM without me having to share passwords

**AC:**
- [x] ADMIN can invite with any role except SUPER_ADMIN
- [x] Invitation email is sent with a 72-hour expiry link
- [x] Invite token is hashed before storage
- [x] Accepting invite creates user account; token is single-use
- [x] Pending invite for same email blocks a second invite

---

### US-01-005: Change a user's role
**As** Amir (CRM Admin)  
**I want to** promote or demote a user's role  
**So that** their access matches their current responsibilities

**AC:**
- [x] ADMIN can change any role below their own level
- [x] Cannot promote to own role or above (no privilege escalation)
- [x] Cannot change own role
- [x] Cannot assign SUPER_ADMIN role via this endpoint
- [x] Audit log entry written on role change

---

### US-01-006: Deactivate a departed user
**As** Amir (CRM Admin)  
**I want to** deactivate a user who has left the team  
**So that** they cannot access CRM data after their last day

**AC:**
- [x] Deactivation sets isActive=false and revokes all refresh tokens immediately
- [x] Deactivated user cannot log in
- [x] User record is retained (not deleted) — audit trail preserved
- [x] Admin can reactivate if needed
- [x] Audit log entry written

---

### US-01-007: Reset a forgotten password
**As** Marcus (Sales Rep)  
**I want to** reset my password via email if I forget it  
**So that** I can regain access without IT intervention

**AC:**
- [x] Always returns 200 (no email enumeration)
- [x] Reset link expires in 1 hour
- [x] Token is single-use (usedAt set on consumption)
- [x] All sessions revoked after successful reset
- [x] Atomic: password hash + token used + sessions revoked in one transaction

---

## Epic 02 — Contact & Account Management

### US-02-001: Add a new contact
**As** Marcus (Sales Rep)  
**I want to** create a contact record for a prospect I just spoke with  
**So that** their information is saved in the CRM and linked to my pipeline

**AC:**
- [ ] POST /contacts creates a Contact scoped to orgId
- [ ] Email uniqueness enforced within org (409 on duplicate)
- [ ] Owner defaults to the creating user
- [ ] ADMIN can override owner on creation
- [ ] Audit log entry created

---

### US-02-002: Search for a contact
**As** Sofia (Account Manager)  
**I want to** quickly find a contact by name, email, or company  
**So that** I can see their history before a call

**AC:**
- [ ] GET /contacts?q=<term> returns partial matches on firstName, lastName, email, company
- [ ] Results are scoped to my org only
- [ ] Response includes last activity date and linked opportunities count
- [ ] Search responds in < 300ms for orgs with 10,000 contacts

---

### US-02-003: Import contacts from a CSV
**As** Amir (CRM Admin)  
**I want to** bulk-import contacts from an exported spreadsheet  
**So that** I can migrate from our old CRM without manual data entry

**AC:**
- [ ] POST /contacts/import accepts CSV with required columns: email, first_name, last_name
- [ ] Optional columns: company, phone, title, source, owner_email
- [ ] Per-row validation errors returned in response (row number + error message)
- [ ] Duplicate emails (within import file) flagged per row — not silently deduplicated
- [ ] Duplicate emails (against existing contacts) flagged — user chooses to skip or update
- [ ] Max 1,000 rows per import request
- [ ] Successful rows committed even if some rows fail (partial success)
- [ ] Import audit log entry records count imported and failed

---

### US-02-004: Merge duplicate contacts
**As** Amir (CRM Admin)  
**I want to** merge two duplicate contact records into one  
**So that** I have a single clean record with the complete history

**AC:**
- [ ] POST /contacts/:id/merge with `{ mergeIntoId: "<uuid>" }` merges source into target
- [ ] All Activities, Tasks, Opportunities, EmailThreads from source re-linked to target
- [ ] Source Contact marked isActive=false, mergedIntoId set
- [ ] Tags and CustomFieldValues from source merged onto target (no duplicates)
- [ ] Operation is atomic (full rollback on failure)
- [ ] Cannot merge a contact that is already merged (tombstoned)

---

### US-02-005: Create and manage a company (Account)
**As** Sofia (Account Manager)  
**I want to** create an Account for a company and link multiple contacts to it  
**So that** I can see the full relationship map for an enterprise account

**AC:**
- [ ] POST /accounts creates Account
- [ ] POST /accounts/:id/contacts links existing Contact to Account
- [ ] One link can be marked isPrimary per Contact (the main company they work at)
- [ ] Account detail page shows all linked contacts + open opportunities
- [ ] ADMIN can set account owner; Sales Rep sees only owned accounts (unless org-wide scope)

---

### US-02-006: Define custom fields for contacts
**As** Amir (CRM Admin)  
**I want to** add a custom "Industry Vertical" dropdown field to all contacts  
**So that** reps can segment the pipeline by our specific business categories

**AC:**
- [ ] POST /custom-fields creates a field definition (entityType, name, fieldType, options for select)
- [ ] PATCH /contacts/:id/fields sets a custom field value
- [ ] Custom field values appear on Contact detail page
- [ ] Custom field values are included in CSV export and import
- [ ] Deleting a field definition removes all associated values

---

## Epic 03 — Lead Management

### US-03-001: Capture a new inbound lead
**As** Jordan (Marketing)  
**I want to** create a lead from a web form submission  
**So that** the sales team can follow up promptly

**AC:**
- [ ] POST /leads creates a Lead with status=NEW
- [ ] Source field is required for tracking ROI by channel
- [ ] Lead auto-assigned to a queue or to a specific owner if specified
- [ ] LeadCreated domain event fires → AuditLog entry

---

### US-03-002: Qualify and progress a lead
**As** Marcus (Sales Rep)  
**I want to** update a lead's status as I make contact and qualify them  
**So that** the pipeline reflects where each lead stands

**AC:**
- [ ] PATCH /leads/:id/status accepts NEW → CONTACTED → QUALIFIED | UNQUALIFIED
- [ ] Status changes are audited
- [ ] QUALIFIED leads appear in a "ready to convert" view
- [ ] UNQUALIFIED leads include a reason field

---

### US-03-003: Convert a qualified lead to an opportunity
**As** Marcus (Sales Rep)  
**I want to** convert a qualified lead into a contact and opportunity  
**So that** I can track the deal in the sales pipeline

**AC:**
- [ ] POST /leads/:id/convert creates Contact + optional Opportunity atomically
- [ ] Lead status set to CONVERTED with convertedAt timestamp
- [ ] If contact with same email already exists, conversion links to existing contact (no duplicate)
- [ ] If Opportunity created: takes pipeline, stage, amount, close date from conversion form
- [ ] Cannot convert an already-converted lead

---

### US-03-004: View my lead queue
**As** Marcus (Sales Rep)  
**I want to** see only my assigned leads sorted by score and creation date  
**So that** I can prioritize follow-ups

**AC:**
- [ ] GET /leads returns only own leads for SALES_REP role
- [ ] Sortable by: score desc, createdAt desc, status
- [ ] Filterable by: status, source, score range, date range
- [ ] Kanban view available (columns = status values)

---

## Epic 04 — Opportunity & Pipeline Tracking

### US-04-001: Create a deal in the pipeline
**As** Marcus (Sales Rep)  
**I want to** create an opportunity for a qualified prospect  
**So that** the deal is visible in the pipeline and tracked toward close

**AC:**
- [ ] POST /opportunities requires: name, pipelineId, stageId, closeDate
- [ ] Amount and contactId are optional at creation
- [ ] Owner defaults to creating user
- [ ] Initial stage recorded in StageHistory

---

### US-04-002: Move a deal through pipeline stages
**As** Marcus (Sales Rep)  
**I want to** drag a deal card to the next stage on the Kanban board  
**So that** the pipeline reflects the current state of negotiations

**AC:**
- [ ] PATCH /opportunities/:id/stage accepts stageId
- [ ] StageHistory entry created for every transition
- [ ] Probability auto-updates to Stage default (overridable)
- [ ] Moving to WON/LOST stage requires confirmation + additional fields (wonAt/lostReason)
- [ ] UI: drag-and-drop kanban board (Priya can see all team's deals)

---

### US-04-003: Record a won deal
**As** Marcus (Sales Rep)  
**I want to** mark a deal as won  
**So that** the win is recorded for commission tracking and pipeline reporting

**AC:**
- [ ] POST /opportunities/:id/won requires: wonAt (defaults to now), amount (optional)
- [ ] status=WON, stageId set to the WON stage, wonAt timestamp set
- [ ] OpportunityWon domain event fires
- [ ] Won deal cannot be edited (except by ADMIN)

---

### US-04-004: View pipeline health as a manager
**As** Priya (Sales Manager)  
**I want to** see the full team's pipeline value grouped by stage  
**So that** I can forecast accurately and coach underperforming reps

**AC:**
- [ ] SALES_MANAGER GET /opportunities returns all org opportunities (not scoped to self)
- [ ] Response includes aggregated value per stage
- [ ] Filterable by: owner, close date range, pipeline
- [ ] Forecast view shows weighted pipeline value (amount × probability) by month

---

## Epic 05 — Activity & Task Management

### US-05-001: Log a call with a prospect
**As** Marcus (Sales Rep)  
**I want to** log a call I just had with a contact  
**So that** there is a record of the conversation and outcome

**AC:**
- [ ] POST /activities with type=CALL requires: subject, contactId or opportunityId
- [ ] Duration and outcome are captured on completion
- [ ] Call appears in the contact's activity timeline immediately
- [ ] Audit log entry created

---

### US-05-002: Create a follow-up task
**As** Marcus (Sales Rep)  
**I want to** create a follow-up task after a call  
**So that** I don't forget to send the proposal on Thursday

**AC:**
- [ ] POST /tasks requires: title, assigneeId (defaults to self), dueAt
- [ ] Linked to Contact or Opportunity
- [ ] Task appears in "My Tasks" view with due date countdown
- [ ] URGENT tasks highlighted in red on task list

---

### US-05-003: Receive overdue task reminders
**As** Marcus (Sales Rep)  
**I want to** be notified when a task is overdue  
**So that** I don't drop follow-ups due to a busy schedule

**AC:**
- [ ] BullMQ job checks for overdue tasks every 15 minutes
- [ ] In-app notification (bell icon) created for overdue tasks
- [ ] Email sent for tasks > 1 hour overdue
- [ ] Notification is not repeated for the same task (idempotent)

---

## Epic 06 — Email & Communication History

### US-06-001: Send an email to a contact from the CRM
**As** Marcus (Sales Rep)  
**I want to** send an email to a contact directly from the CRM  
**So that** the email is automatically logged in the contact timeline

**AC:**
- [ ] POST /email/send requires: contactId, to, subject, body
- [ ] Email sent via org's configured SMTP integration
- [ ] EmailThread + EmailMessage created
- [ ] EMAIL_LOG Activity automatically created via domain event
- [ ] Tracking pixel embedded (configurable per org)

---

### US-06-002: See all email history with a contact
**As** Sofia (Account Manager)  
**I want to** see the complete email thread history with a contact  
**So that** I know exactly what was discussed before my call

**AC:**
- [ ] GET /contacts/:id/email-threads returns all threads, sorted by lastMessageAt
- [ ] Each thread shows all messages (sent + received)
- [ ] Open and click indicators shown per message
- [ ] Received replies matched by Message-ID header and appended to existing thread

---

## Epic 07 — Reporting & Dashboards

### US-07-001: See the current pipeline value at a glance
**As** Dana (VP Sales)  
**I want to** see total pipeline value, weighted forecast, and win rate on my dashboard  
**So that** I can quickly assess whether we're on track for the quarter

**AC:**
- [ ] Default dashboard includes: Pipeline Value widget, Win Rate widget, Deals by Stage chart, Top Reps leaderboard
- [ ] All widgets respect date range filter (default: this quarter)
- [ ] Widgets refresh every 5 minutes
- [ ] Dashboard loads within 2 seconds

---

### US-07-002: Export report data to CSV
**As** Priya (Sales Manager)  
**I want to** export the activity report for my team to a CSV  
**So that** I can share it in our weekly leadership meeting

**AC:**
- [ ] Every report has an "Export to CSV" button
- [ ] Export runs as an async job (returns jobId; UI polls until complete)
- [ ] Download link is a time-limited signed URL (expires 24 hours)
- [ ] Export includes all filtered columns, not just the page currently visible
- [ ] Max 50,000 rows per export

---

### US-07-003: Save a custom report
**As** Priya (Sales Manager)  
**I want to** save a filtered version of the Activity report scoped to my team  
**So that** I can open it in one click every Monday

**AC:**
- [ ] "Save report" captures current filter state
- [ ] Can be shared org-wide or kept private
- [ ] Saved reports appear in the Reports sidebar
- [ ] Can be edited or deleted by the owner (or ADMIN)
