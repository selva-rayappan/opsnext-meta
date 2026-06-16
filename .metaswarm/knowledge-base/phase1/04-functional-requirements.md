# OpsNext CRM — Functional Requirements
## Phase 1 Foundation

**Document ID:** FR-001  
**Version:** 1.0  
**Date:** 2026-06-16  
**Author:** Product Management & Backend Lead  
**Status:** Approved — Implementation Anchor  
**Stack:** Next.js 14 + NestJS + TypeScript + Prisma + PostgreSQL + Redis  
**Multi-tenancy:** All operations are scoped to `organizationId` — no cross-tenant data access is permitted at any layer.

---

## Document Conventions

### MoSCoW Notation

| Tag | Meaning |
|-----|---------|
| **[M]** | Must Have — required for Phase 1 launch |
| **[S]** | Should Have — planned for Phase 1, deferrable if schedule-constrained |
| **[C]** | Could Have — desirable Year 1, may slip to Year 2 |
| **[W]** | Won't Have — explicitly out of scope for Year 1 |

### Actor Tags

| Tag | Role |
|-----|------|
| **[Admin]** | CRM Administrator / IT Admin |
| **[Sales Manager]** | Sales Manager / Director of Sales |
| **[Sales Rep]** | Sales Development Rep / Account Executive |
| **[Account Manager]** | Account Manager / Customer Success Manager |
| **[Marketing]** | Marketing / Lead Gen Specialist |
| **[Executive]** | VP of Sales / CRO |

### FR Numbering

Format: `FR-<MODULE>-<NNN>`  
Example: `FR-AUTH-001` (first requirement in the Auth/Roles module)

### API Parity Principle

Every functional requirement that describes a UI action implicitly requires an equivalent REST API endpoint. No UI-only workflows. This principle is not repeated per requirement — it is universal.

---

## Module Index

| # | Module | FR Prefix | Requirements |
|---|--------|-----------|-------------|
| 1 | User Roles & Permissions | FR-AUTH | FR-AUTH-001 – FR-AUTH-030 |
| 2 | Contact & Account Management | FR-CONTACT | FR-CONTACT-001 – FR-CONTACT-035 |
| 3 | Lead Management | FR-LEAD | FR-LEAD-001 – FR-LEAD-030 |
| 4 | Opportunity & Pipeline Tracking | FR-OPP | FR-OPP-001 – FR-OPP-030 |
| 5 | Activity & Task Management | FR-ACTIVITY | FR-ACTIVITY-001 – FR-ACTIVITY-025 |
| 6 | Email & Communication History | FR-EMAIL | FR-EMAIL-001 – FR-EMAIL-025 |
| 7 | Reporting & Dashboards | FR-REPORT | FR-REPORT-001 – FR-REPORT-030 |

---

## Module 1: User Roles & Permissions

### Overview

This module owns the complete identity and access control surface for OpsNext CRM. It covers authentication (email/password + JWT), role-based access control (RBAC), team and user management, invitation workflows, audit logging of sensitive mutations, and session lifecycle. Every other module delegates authorization decisions to this module.

---

### Functional Requirements

#### Authentication

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-AUTH-001 | The system shall allow users to register with an email address and password. Passwords must be hashed using bcrypt (cost factor ≥ 12) and never stored in plaintext. | [M] | [Admin] |
| FR-AUTH-002 | The system shall authenticate users via email/password and issue a JWT access token (15-minute expiry) and a refresh token (7-day expiry) stored in httpOnly, SameSite=Strict cookies. | [M] | All |
| FR-AUTH-003 | The system shall provide a token refresh endpoint that issues a new access token when presented with a valid, non-expired refresh token. Refresh token rotation must invalidate the previous refresh token on use. | [M] | All |
| FR-AUTH-004 | The system shall provide a logout endpoint that invalidates the current refresh token and clears auth cookies. | [M] | All |
| FR-AUTH-005 | The system shall enforce account lockout after 5 consecutive failed login attempts within a 15-minute window. Lockout duration is 30 minutes. The [Admin] may manually unlock an account. | [M] | [Admin] |
| FR-AUTH-006 | The system shall support password reset via email. A time-limited reset token (expires in 1 hour) is sent to the registered email address. Tokens are single-use. | [M] | All |
| FR-AUTH-007 | The system shall support Multi-Factor Authentication (MFA) via TOTP (RFC 6238 — Google Authenticator compatible). MFA enrollment, verification, and recovery code generation must be supported. | [S] | All |
| FR-AUTH-008 | The system shall allow [Admin] to enforce MFA organization-wide (all users must enroll before accessing the platform beyond the MFA setup screen). | [S] | [Admin] |

#### Role-Based Access Control (RBAC)

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-AUTH-009 | The system shall enforce five built-in roles: Admin, Sales Manager, Sales Rep, Account Manager, and Read-Only. Role definitions are immutable (cannot be renamed or deleted). | [M] | [Admin] |
| FR-AUTH-010 | The system shall resolve authorization at the API layer using a role-permission matrix stored in Redis (refreshed on role assignment change). Every controller action must check the calling user's role against the required permission scope before executing. | [M] | All |
| FR-AUTH-011 | The system shall enforce the following default role capabilities: (a) Admin: full CRUD on all entities, user management, configuration, audit log access; (b) Sales Manager: full CRUD on Leads, Opportunities, Activities; read on all Contacts/Accounts; view team pipeline and reports; cannot modify user roles; (c) Sales Rep: CRUD on own Leads, Opportunities, Activities, Contacts; read on Accounts; no access to team reports or other reps' Opportunities; (d) Account Manager: CRUD on Contacts, Accounts, Activities; read on Opportunities; no Lead management access; (e) Read-Only: read access to Contacts, Accounts, Opportunities, Activities; no create/update/delete. | [M] | [Admin] |
| FR-AUTH-012 | The system shall scope all data access by `organizationId`. A user authenticated under Organization A must never be able to read, write, or enumerate records belonging to Organization B, regardless of role. | [M] | All |
| FR-AUTH-013 | The system shall allow [Admin] to override the default visibility scope for Sales Rep to "team-wide" or "organization-wide" on a per-user basis. | [S] | [Admin] |

#### User Management & Invitations

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-AUTH-014 | The system shall allow [Admin] to invite new users by email address. An invitation email is sent containing a time-limited (72-hour) accept link. On acceptance, the user sets their password and activates the account. | [M] | [Admin] |
| FR-AUTH-015 | The system shall allow [Admin] to assign or change a user's role at any time. Role changes take effect on the user's next API request (permission cache TTL ≤ 30 seconds). | [M] | [Admin] |
| FR-AUTH-016 | The system shall allow [Admin] to deactivate a user account. Deactivated accounts cannot log in and all active sessions are invalidated immediately. Deactivated user records are retained (not deleted) to preserve audit trail and data attribution. | [M] | [Admin] |
| FR-AUTH-017 | The system shall allow [Admin] to reactivate a previously deactivated user account. | [M] | [Admin] |
| FR-AUTH-018 | The system shall allow [Admin] to create and manage Teams (named groups of users within an organization). A user may belong to multiple teams. Teams are used as a filter dimension in reporting and pipeline views. | [M] | [Admin] |
| FR-AUTH-019 | The system shall allow [Admin] to assign users to one or more Teams. Team assignments are reflected immediately in pipeline and reporting filter contexts. | [M] | [Admin] |
| FR-AUTH-020 | The system shall allow [Admin] to perform bulk user import via CSV. Required columns: email, first_name, last_name, role. Optional: team_name, title. Rows with invalid email format or duplicate email within the import are rejected with per-row error details returned in the API response. | [S] | [Admin] |
| FR-AUTH-021 | The system shall allow each authenticated user to update their own profile: first name, last name, title, phone, timezone, and avatar (image upload, max 2 MB, JPEG/PNG only). | [M] | All |
| FR-AUTH-022 | The system shall allow each authenticated user to change their own password when authenticated (requires current password confirmation). | [M] | All |

#### Session Management

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-AUTH-023 | The system shall allow users to view all active sessions (device type, IP address, last seen timestamp, browser/OS). | [S] | All |
| FR-AUTH-024 | The system shall allow users to revoke any specific active session or revoke all sessions except the current one. | [S] | All |
| FR-AUTH-025 | The system shall automatically expire idle sessions. Idle threshold is configurable by [Admin] per organization (default: 8 hours). | [S] | [Admin] |

#### Audit Logging

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-AUTH-026 | The system shall write an immutable audit log entry for every sensitive mutation: user create/update/deactivate/reactivate, role assignment change, login (success and failure), logout, password reset, MFA enroll/disable, invitation send/accept. | [M] | [Admin] |
| FR-AUTH-027 | The system shall record in each audit log entry: `organizationId`, `actorUserId`, `actorRole`, `targetEntityType`, `targetEntityId`, `action`, `previousValue` (masked for secrets), `newValue` (masked for secrets), `ipAddress`, `userAgent`, `timestamp`. | [M] | [Admin] |
| FR-AUTH-028 | The system shall allow [Admin] to query the audit log with filters: date range, actor user, action type, target entity type. Results are paginated (max 100 per page). | [M] | [Admin] |
| FR-AUTH-029 | The system shall allow [Admin] to export audit log entries as CSV. Export is scoped to the current organization only. | [S] | [Admin] |
| FR-AUTH-030 | Audit log entries shall never be deletable or editable by any user, including Admin. Deletion attempts return HTTP 405 Method Not Allowed. | [M] | [Admin] |

---

### Key User Stories

**US-AUTH-001 — First-Time User Onboarding**
- **Given** an [Admin] has entered a new user's email address and selected a role
- **When** the Admin submits the invitation form
- **Then** the system creates a pending user record with status `INVITED`, sends an invitation email to the provided address containing a unique accept link valid for 72 hours, and the Admin sees the new user appear in the user list with status badge "Invited"

**US-AUTH-002 — Login with Lockout Protection**
- **Given** a registered user enters an incorrect password 5 times within 15 minutes
- **When** the 5th failed attempt is submitted
- **Then** the system locks the account, returns HTTP 429 with a `retry_after` timestamp, logs the lockout event to the audit log, and sends an account-lock notification email to the user's registered address; no further authentication attempts are accepted until the lockout window expires or an Admin manually unlocks

**US-AUTH-003 — Role Change Takes Effect Immediately**
- **Given** a [Sales Rep] has an active session and is currently viewing a team-wide pipeline report (which they are not permitted to see)
- **When** an [Admin] changes that user's role from Sales Rep to Sales Manager
- **Then** the permission cache for that user is invalidated within 30 seconds, and the next API request made by the user reflects the new Sales Manager permission set without requiring logout/login

---

### Module Boundaries

**This module owns:**
- User identity (email, password hash, profile fields)
- Authentication token lifecycle (issue, refresh, revoke)
- Role definitions and role-permission mapping
- Team membership records
- User invitation workflow
- Session tracking and management
- Audit log for auth and user-management events

**This module delegates to:**
- All other modules own enforcement of entity-level CRUD permissions using the role context provided by this module's JWT claims
- Email delivery (invitations, password reset, lockout notifications) is handled by a shared notification service — this module produces the event and payload; the notification service owns delivery

---

## Module 2: Contact & Account Management

### Overview

This module owns the master record for people (Contacts) and companies (Accounts) within an organization's CRM. It manages the Contact–Account relationship, activity timelines on both entities, notes, file attachments, CSV import, and duplicate detection. All other modules reference Contact and Account as related entities but do not own their lifecycle.

---

### Functional Requirements

#### Accounts (Companies)

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-001 | The system shall allow users to create an Account record with fields: name (required), domain, industry, phone, billing address, website, number of employees, annual revenue, account owner (user), description, and custom tags. | [M] | [Sales Rep] [Account Manager] [Admin] |
| FR-CONTACT-002 | The system shall allow users to view an Account detail page showing: account fields, all associated Contacts, all Opportunities linked to the account, all Activities on the account, and the Communication History timeline. | [M] | All |
| FR-CONTACT-003 | The system shall allow users to update any field on an Account they own or have access to per their role. Field-level change history must be preserved in the audit log. | [M] | [Sales Rep] [Account Manager] [Admin] [Sales Manager] |
| FR-CONTACT-004 | The system shall allow [Admin] and [Sales Manager] to reassign Account ownership to another user. Bulk ownership reassignment (up to 500 records at a time) must be supported via the API and UI. | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-005 | The system shall allow users to delete an Account. Deletion is a soft-delete (sets `deletedAt` timestamp, retains record for 90 days before permanent purge). Deleting an Account does not cascade-delete its Contacts; the Contact–Account link is severed, and Contacts remain as orphan contacts. | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-006 | The system shall allow users to filter and search Accounts by: name, domain, owner, industry, tag, city/country, and date created. Searches are scoped to the current organization. | [M] | All |

#### Contacts (People)

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-007 | The system shall allow users to create a Contact record with fields: first name (required), last name (required), email (unique within org), phone, mobile, job title, department, linked Account, contact owner (user), lead source, tags, and description. | [M] | [Sales Rep] [Account Manager] [Marketing] [Admin] |
| FR-CONTACT-008 | The system shall enforce email uniqueness per organization at the database layer. Attempting to create a Contact with a duplicate email within the same organization returns a validation error identifying the existing record. | [M] | All |
| FR-CONTACT-009 | The system shall allow a Contact to be linked to zero or one Account at creation time, and the Account link may be updated at any time. | [M] | [Sales Rep] [Account Manager] [Admin] |
| FR-CONTACT-010 | The system shall allow users to view a Contact detail page showing: contact fields, linked Account, all Opportunities involving this contact, all Activities on this contact, and the Communication History timeline. | [M] | All |
| FR-CONTACT-011 | The system shall allow users to update Contact fields. Field-level change history must be preserved. | [M] | [Sales Rep] [Account Manager] [Admin] [Sales Manager] |
| FR-CONTACT-012 | The system shall allow [Admin] and [Sales Manager] to reassign Contact ownership. Bulk reassignment (up to 500 records) must be supported. | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-013 | The system shall allow users to delete a Contact (soft-delete, same policy as Accounts). Deletion must not delete associated Activities or Opportunities; those records have their `contactId` field set to null and are flagged with a `contactDeletedNote`. | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-014 | The system shall allow users to filter and search Contacts by: name, email, phone, account name, owner, tag, lead source, city/country, and date created. | [M] | All |

#### Contact–Account Relationship

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-015 | The system shall support a many-to-one relationship: a Contact belongs to at most one Account, but an Account may have many Contacts. | [M] | All |
| FR-CONTACT-016 | The system shall display all Contacts associated with an Account on the Account detail page, ordered by last activity date descending. | [M] | All |

#### Notes

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-017 | The system shall allow users to add free-text notes to any Contact or Account. Notes support Markdown formatting (rendered on display). | [M] | All |
| FR-CONTACT-018 | The system shall allow users to edit or delete their own notes. [Admin] and [Sales Manager] may edit or delete any note within the organization. | [M] | All |
| FR-CONTACT-019 | Notes shall appear on the entity's Activity Timeline in chronological order, interleaved with Activity and Email records. | [M] | All |

#### Attachments

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-020 | The system shall allow users to upload file attachments to Contact or Account records. Supported types: PDF, DOCX, XLSX, PNG, JPEG, CSV. Maximum file size: 25 MB per file, 500 MB total per organization. | [S] | All |
| FR-CONTACT-021 | The system shall display attachments in a dedicated "Files" section on the Contact and Account detail pages with: file name, upload date, uploader name, and file size. | [S] | All |

#### Activity Timeline

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-022 | The system shall render a unified Activity Timeline on Contact and Account detail pages. The timeline aggregates: Notes, Activities (calls, meetings, tasks), and Email records. Timeline entries are sorted descending by timestamp. | [M] | All |
| FR-CONTACT-023 | The system shall allow users to filter the Activity Timeline by entry type (Notes, Activities, Emails) and by date range. | [S] | All |

#### CSV Import

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-024 | The system shall allow [Admin] and [Sales Manager] to import Contacts via CSV upload. Required columns: first_name, last_name, email. Optional columns: phone, mobile, job_title, account_name, lead_source, tags, owner_email. | [M] | [Admin] [Sales Manager] [Marketing] |
| FR-CONTACT-025 | The system shall validate each CSV row before import. Validation errors (missing required field, invalid email format, email length > 255 chars) are returned row-by-row in a pre-import validation report. The user must acknowledge the report before the import proceeds. | [M] | [Admin] [Sales Manager] [Marketing] |
| FR-CONTACT-026 | During CSV import, the system shall detect rows whose email matches an existing Contact in the organization. Duplicates are presented to the user with three options: skip, overwrite, or create as new (not recommended — flagged with a warning). | [M] | [Admin] [Sales Manager] [Marketing] |
| FR-CONTACT-027 | The system shall process CSV imports asynchronously for files containing more than 100 rows. A background job is queued in Redis; the user receives a completion notification (in-app + email) with an import summary: total rows, imported, skipped, failed, error details. | [M] | [Admin] [Sales Manager] [Marketing] |
| FR-CONTACT-028 | The system shall allow [Admin] and [Sales Manager] to export Contacts to CSV. Export applies current filter/search state. Maximum export size: 50,000 rows per export. | [M] | [Admin] [Sales Manager] [Marketing] |

#### Duplicate Detection

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-029 | The system shall detect potential duplicate Contacts using a configurable matching strategy: exact email match (always enforced), fuzzy name + company match (optional, configurable by [Admin]). | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-030 | The system shall surface duplicate candidates in a dedicated "Duplicates Review" view accessible to [Admin] and [Sales Manager]. Each candidate pair shows a side-by-side field comparison. | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-031 | The system shall allow [Admin] and [Sales Manager] to merge two Contact records. The merge operation: retains the "winner" record's ID, copies all Activities, Notes, Emails, and Opportunity links from the "loser" record to the winner, and soft-deletes the loser record. Merge is irreversible. | [M] | [Admin] [Sales Manager] |
| FR-CONTACT-032 | The system shall warn users in real-time during Contact creation if the entered email matches an existing Contact (inline warning, not a hard block). | [M] | All |

#### Account CSV Import/Export

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-CONTACT-033 | The system shall allow [Admin] and [Sales Manager] to import Accounts via CSV. Required columns: name. Optional columns: domain, industry, phone, website, owner_email. | [S] | [Admin] [Sales Manager] |
| FR-CONTACT-034 | The system shall allow [Admin] and [Sales Manager] to export Accounts to CSV. | [S] | [Admin] [Sales Manager] |
| FR-CONTACT-035 | The system shall allow users to add custom tags to both Contacts and Accounts. Tags are free-text strings, scoped to the organization, and available as filter dimensions across list views and reports. | [M] | All |

---

### Key User Stories

**US-CONTACT-001 — CSV Import with Duplicate Handling**
- **Given** a [Marketing] user uploads a 250-row Contact CSV file where 30 rows have email addresses matching existing Contacts in the organization
- **When** the import validation completes
- **Then** the system presents a pre-import report showing 220 new records, 30 duplicate candidates (with existing Contact name and creation date shown for each), and prompts the user to choose: skip duplicates or overwrite; the import is not executed until the user confirms the choice; once confirmed, the import processes asynchronously and a completion notification is sent

**US-CONTACT-002 — Account 360-Degree View**
- **Given** an [Account Manager] opens an Account record for "Acme Corp" which has 5 Contacts, 3 open Opportunities, 12 Activities, and 8 email records
- **When** the Account detail page loads
- **Then** all 5 Contacts are listed with their titles and last activity dates; the Activity Timeline shows all 12 Activities and 8 Emails interleaved by timestamp; Opportunities are listed with current stage and value; the page loads within 2 seconds

**US-CONTACT-003 — Duplicate Contact Merge**
- **Given** the Duplicates Review view shows "John Smith, john@acme.com" and "John Smith, john@acme.com (imported)" as a duplicate pair
- **When** a [Sales Manager] selects the original record as the winner and confirms the merge
- **Then** all Activities, Notes, and Opportunity links from the duplicate are transferred to the original record; the duplicate is soft-deleted; the merge event is written to the audit log; the original Contact record now shows the combined activity count

---

### Module Boundaries

**This module owns:**
- Contact entity lifecycle (create, read, update, soft-delete)
- Account entity lifecycle (create, read, update, soft-delete)
- Contact–Account relationship management
- Notes on Contact and Account
- File attachments on Contact and Account
- CSV import and export for Contacts and Accounts
- Duplicate detection and merge logic for Contacts

**This module delegates to:**
- Module 5 (Activity & Task Management): Activity records that appear on the Contact/Account timeline are owned and written by Module 5; this module renders them read-only in the timeline
- Module 6 (Email & Communication History): Email entries in the timeline are owned by Module 6; this module renders them read-only
- Module 1 (Auth): Authorization checks for who may edit or view a given Contact/Account record

---

## Module 3: Lead Management

### Overview

This module owns the full lifecycle of a Lead — an unqualified prospective customer — from initial capture through qualification and conversion into a Contact and/or Opportunity. It manages lead assignment rules, status workflow, custom qualification fields, and lead-to-opportunity conversion. Once a Lead is converted, it is no longer a Lead; it becomes a Contact (and optionally an Opportunity) in the respective modules.

---

### Functional Requirements

#### Lead Capture

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-001 | The system shall allow users to manually create a Lead record with fields: first name (required), last name (required), email (required, unique per org), phone, company name, job title, lead source (picklist: Web, Email, Phone, Event, Referral, Social, Other), lead status (system-managed, see FR-LEAD-006), owner (user), campaign, description, and custom fields (as configured by [Admin]). | [M] | [Sales Rep] [Marketing] [Admin] |
| FR-LEAD-002 | The system shall expose a public REST API endpoint (`POST /api/v1/leads`) authenticated via API key that accepts a Lead payload and creates a Lead record. This enables web form integrations without a full OAuth flow. | [M] | [Admin] (integration setup) |
| FR-LEAD-003 | The system shall capture and store UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content) when supplied in the API lead creation payload. UTM fields are read-only after creation (not editable by users). | [M] | [Marketing] |
| FR-LEAD-004 | The system shall allow [Admin] to configure custom fields on the Lead object (text, number, date, dropdown with tenant-defined options). Custom fields appear in the Lead detail form, list view (optional column), and CSV import/export. | [S] | [Admin] |
| FR-LEAD-005 | The system shall support CSV import for Leads with the same validation and async processing behavior described in FR-CONTACT-024 through FR-CONTACT-027. Required columns: first_name, last_name, email. | [M] | [Admin] [Marketing] |

#### Lead Status Workflow

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-006 | The system shall enforce the following Lead status lifecycle: New → Contacted → Qualified → Converted (terminal) / Disqualified (terminal). Status transitions are one-directional (cannot move backward). The status field is only writeable by authorized users — it may not be set arbitrarily via direct field update outside the transition API. | [M] | [Sales Rep] [Marketing] [Sales Manager] [Admin] |
| FR-LEAD-007 | The system shall record a status change history entry on every Lead status transition, capturing: previous status, new status, changed by user, timestamp, and optional note. | [M] | All |
| FR-LEAD-008 | The system shall prevent deletion of a Lead in "Converted" status. Converted Leads are retained for attribution reporting. | [M] | All |
| FR-LEAD-009 | The system shall allow users to disqualify a Lead by selecting a disqualification reason from a picklist (Not a Fit, Budget, Timing, No Response, Duplicate, Other). Custom disqualification reasons may be added by [Admin]. The disqualification reason is required when setting status to Disqualified. | [M] | [Sales Rep] [Marketing] [Sales Manager] |

#### Lead Assignment

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-010 | The system shall allow [Admin] and [Sales Manager] to manually assign or reassign a Lead to any user within the organization. Assignment changes are logged to the Lead's change history. | [M] | [Admin] [Sales Manager] |
| FR-LEAD-011 | The system shall support round-robin automatic lead assignment. [Admin] configures an assignment pool (list of users) per lead source or globally. New Leads entering the system via API or import are distributed sequentially across pool members. | [S] | [Admin] |
| FR-LEAD-012 | The system shall notify the assigned user (in-app notification + email) when a Lead is assigned or reassigned to them. Notification includes Lead name, company, source, and a direct link to the Lead record. | [M] | [Sales Rep] [Marketing] |

#### Lead Qualification

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-013 | The system shall allow users to populate qualification fields on a Lead record. Qualification fields are the standard fields plus any custom fields configured by [Admin]. There is no system-computed lead score in Phase 1 — qualification is a manual, human-judgment process. | [M] | [Sales Rep] [Marketing] |
| FR-LEAD-014 | The system shall allow [Admin] to mark specific Lead fields as "required before qualification" — attempting to set status to "Qualified" while those fields are blank returns a validation error listing the missing fields. | [S] | [Admin] |

#### Lead-to-Contact/Opportunity Conversion

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-015 | The system shall allow users to convert a Lead to a Contact (and optionally to an Opportunity) via a conversion workflow. Conversion options: (a) Create a new Contact from Lead data; (b) Link to an existing Contact (if a Contact with the same email already exists); (c) Optionally create a new Opportunity and link it to the new/existing Contact. | [M] | [Sales Rep] [Sales Manager] [Admin] |
| FR-LEAD-016 | During conversion, the system shall map Lead fields to Contact fields: first_name, last_name, email, phone, company → linked Account name, job_title, lead_source. Custom fields on Lead do not auto-map (user must manually populate Contact custom fields post-conversion). | [M] | [Sales Rep] [Sales Manager] [Admin] |
| FR-LEAD-017 | Upon successful conversion, the system shall: (a) set Lead status to "Converted"; (b) store the `convertedContactId` and `convertedOpportunityId` (if applicable) on the Lead record; (c) retain the Lead record in read-only state; (d) preserve all Lead Activities and Notes by linking them to the new Contact. | [M] | All |
| FR-LEAD-018 | The system shall prevent a Lead from being converted more than once. Attempting to convert an already-converted Lead returns HTTP 409. | [M] | All |

#### Lead Ownership Transfer

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-019 | The system shall allow [Admin] and [Sales Manager] to perform bulk Lead ownership transfer: select up to 500 Leads and reassign all to a target user. | [S] | [Admin] [Sales Manager] |

#### Lead List and Search

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-020 | The system shall allow users to filter the Lead list by: status, owner, source, date created, date of last activity, campaign, and custom fields. [Sales Rep] sees only their own Leads by default; [Sales Manager] and [Admin] see all Leads. | [M] | All |
| FR-LEAD-021 | The system shall allow users to save named filter views on the Lead list. Saved views are per-user (not shared by default). [Admin] may create organization-wide shared views. | [S] | All |
| FR-LEAD-022 | The system shall allow CSV export of the Lead list applying current filter state. Maximum 50,000 rows. | [M] | [Admin] [Sales Manager] [Marketing] |

#### Lead Activity Timeline

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-LEAD-023 | The system shall display a unified Activity Timeline on each Lead detail page, showing all Activities and Notes associated with the Lead, in descending timestamp order. | [M] | All |

---

### Key User Stories

**US-LEAD-001 — API Lead Capture from Web Form**
- **Given** a marketing team has configured a web form with OpsNext CRM's API key and the `POST /api/v1/leads` endpoint
- **When** a website visitor submits the form with name, email, company, and UTM parameters
- **Then** the system creates a Lead record in "New" status, stores the UTM parameters as read-only fields, applies the configured round-robin assignment rule to assign the Lead to the next SDR in the pool, sends an assignment notification to that SDR, and the Lead appears in the SDR's "My Leads" queue within 5 seconds of form submission

**US-LEAD-002 — Lead Qualification Gate**
- **Given** [Admin] has configured "Company Name" and "Phone" as required-before-qualification fields
- **When** a [Sales Rep] attempts to change Lead status to "Qualified" with "Phone" left blank
- **Then** the system returns a validation error message listing "Phone is required before qualifying this Lead" and the status remains "Contacted"; the rep can see exactly which fields are blocking qualification without navigating away

**US-LEAD-003 — Lead Conversion to Opportunity**
- **Given** a [Sales Rep] has a Lead "Jane Doe, jane@example.com" in "Qualified" status with no existing Contact matching that email
- **When** the rep initiates conversion, selects "Create new Contact" and "Create new Opportunity" with deal name "Example Corp — Enterprise Plan" and value $24,000
- **Then** the system creates a Contact record for Jane Doe, creates an Opportunity linked to the Contact, sets the Lead status to "Converted" with `convertedContactId` and `convertedOpportunityId` populated, transfers all Lead Activities and Notes to the new Contact, and the Lead is locked to read-only; the rep is redirected to the new Opportunity record

---

### Module Boundaries

**This module owns:**
- Lead entity lifecycle (create, update, status transitions, convert, soft-delete)
- Lead assignment rules and assignment history
- Lead qualification fields and required-field gate
- Lead CSV import and export
- Lead Activity Timeline (rendered here; Activity records owned by Module 5)
- UTM parameter capture and storage

**This module delegates to:**
- Module 2 (Contact & Account Management): owns the Contact and Account records created during Lead conversion
- Module 4 (Opportunity & Pipeline): owns the Opportunity record created during Lead conversion
- Module 5 (Activity & Task Management): owns Activity records associated with Leads
- Module 1 (Auth): authorization checks for who may assign, qualify, or convert Leads

---

## Module 4: Opportunity & Pipeline Tracking

### Overview

This module owns the Opportunity entity — a qualified sales deal with an estimated value, a close date, and a stage in a defined pipeline. It provides Kanban and list pipeline views, configurable pipeline stages per tenant, deal probability, weighted forecasting, win/loss tracking, and stage history. It is the primary module for a [Sales Rep]'s daily deal management and a [Sales Manager]'s pipeline review workflow.

---

### Functional Requirements

#### Opportunity CRUD

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-001 | The system shall allow users to create an Opportunity record with fields: name (required), pipeline (required), stage (required, from pipeline's stage list), amount (currency, required), close date (required), probability (0–100%, auto-populated from stage default, user-overridable), linked Contact, linked Account, owner (user), opportunity type (New Business, Renewal, Upsell, Cross-sell), description, and tags. | [M] | [Sales Rep] [Account Manager] [Admin] [Sales Manager] |
| FR-OPP-002 | The system shall allow users to update any Opportunity field they own or have access to. Every field change is written to the Opportunity's change history log. | [M] | [Sales Rep] [Account Manager] [Admin] [Sales Manager] |
| FR-OPP-003 | The system shall allow [Admin] and [Sales Manager] to reassign Opportunity ownership. Bulk reassignment (up to 500 records) must be supported. | [M] | [Admin] [Sales Manager] |
| FR-OPP-004 | The system shall allow users to delete an Opportunity (soft-delete). Deletion does not cascade-delete linked Activities. | [M] | [Admin] [Sales Manager] |
| FR-OPP-005 | The system shall allow users to close an Opportunity as Won or Lost. When closing as Lost, a lost reason is required from a picklist (Price, Competitor, Timing, No Decision, Feature Gap, Other). [Admin] may add custom lost reasons. | [M] | [Sales Rep] [Account Manager] [Admin] [Sales Manager] |
| FR-OPP-006 | The system shall allow users to reopen a closed-won or closed-lost Opportunity back to an active stage. Reopen event is written to the stage history log. | [S] | [Admin] [Sales Manager] |

#### Pipeline Configuration

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-007 | The system shall allow [Admin] to create and manage pipeline definitions. A pipeline has: name, a list of ordered stages, and a default probability per stage. The system ships with one pre-built default pipeline ("Sales Pipeline") with stages: Prospecting (10%), Qualification (20%), Discovery (40%), Proposal Sent (60%), Negotiation (80%), Closed Won (100%), Closed Lost (0%). | [M] | [Admin] |
| FR-OPP-008 | The system shall allow [Admin] to add, rename, reorder, and delete pipeline stages. Deleting a stage is only permitted if no active Opportunities are in that stage; otherwise a validation error is returned listing affected Opportunity count. | [M] | [Admin] |
| FR-OPP-009 | The system shall allow [Admin] to configure a default probability percentage for each pipeline stage. When an Opportunity is moved to a stage, the probability field is auto-populated with the stage default. The user may manually override the probability after stage assignment. | [M] | [Admin] |
| FR-OPP-010 | The system shall support multiple pipelines per organization (e.g., "New Business Pipeline" and "Renewal Pipeline"). Each pipeline maintains its own independent stage list. | [S] | [Admin] |
| FR-OPP-011 | The system shall allow [Admin] to set a pipeline as the organization default. New Opportunities where no pipeline is specified inherit the default pipeline. | [M] | [Admin] |

#### Pipeline Views

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-012 | The system shall provide a Kanban board view of the pipeline. Each column represents a stage. Cards show: Opportunity name, Account name, amount, close date, and owner avatar. Cards are draggable between columns to update stage. | [M] | [Sales Rep] [Sales Manager] [Account Manager] |
| FR-OPP-013 | The system shall provide a list view of the pipeline with sortable and filterable columns: name, account, stage, amount, close date, owner, probability, last activity date. | [M] | All |
| FR-OPP-014 | The system shall allow users to filter the pipeline view by: owner, stage, pipeline (if multiple exist), close date range, amount range, opportunity type, and tag. [Sales Rep] sees only their own Opportunities by default. [Sales Manager] and [Admin] see all Opportunities. | [M] | All |
| FR-OPP-015 | The system shall allow users to save named pipeline views (per-user, with option for [Admin] to create org-wide shared views). | [S] | All |

#### Stage History

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-016 | The system shall record a stage history entry every time an Opportunity's stage changes: previous stage, new stage, changed by, timestamp, time spent in previous stage (in days). | [M] | All |
| FR-OPP-017 | The system shall display the stage history on the Opportunity detail page in the Activity Timeline, clearly distinguishing stage-change events from activity logs. | [M] | All |

#### Deal Value and Forecasting

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-018 | The system shall compute and display a "weighted value" for each Opportunity: `amount × (probability / 100)`. Weighted value is displayed on the Opportunity record and in pipeline aggregate views. | [M] | All |
| FR-OPP-019 | The system shall provide a Forecasting view showing: total pipeline value, total weighted pipeline value, breakdown by stage, breakdown by owner, breakdown by close date (monthly, quarterly). Filters: pipeline, owner, team, close date range. | [M] | [Sales Manager] [Executive] [Admin] |
| FR-OPP-020 | The system shall allow [Sales Manager] to enter a manager forecast override value per rep per month/quarter. Override values are stored separately from system-computed weighted values and displayed side-by-side. | [S] | [Sales Manager] |
| FR-OPP-021 | The system shall allow [Executive] and [Sales Manager] to export the Forecasting view as CSV. | [S] | [Sales Manager] [Executive] |

#### Win/Loss Analysis

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-022 | The system shall provide a Win/Loss report showing: closed-won count and value, closed-lost count and value, win rate by count, win rate by value, breakdown by lost reason, breakdown by owner, breakdown by opportunity type. | [M] | [Sales Manager] [Executive] [Admin] |
| FR-OPP-023 | The system shall allow filtering the Win/Loss report by: date range, owner, pipeline, opportunity type. | [M] | [Sales Manager] [Executive] |

#### Opportunity Activity Timeline

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-024 | The system shall display a unified Activity Timeline on each Opportunity detail page, showing: stage-change events, Activities (calls, meetings, tasks), Notes, and Email records associated with this Opportunity, in descending timestamp order. | [M] | All |

#### Opportunity–Contact–Account Relationships

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-025 | The system shall allow an Opportunity to be linked to one primary Contact and one Account. The Contact and Account links may be updated at any time. | [M] | All |
| FR-OPP-026 | The system shall display all Opportunities linked to a Contact on the Contact detail page, and all Opportunities linked to an Account on the Account detail page. | [M] | All |

#### Opportunity Search and Export

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-027 | The system shall allow users to search Opportunities by name, account name, contact name, and tags. | [M] | All |
| FR-OPP-028 | The system shall allow [Admin] and [Sales Manager] to export Opportunities to CSV applying current filter state. Maximum 50,000 rows. | [M] | [Admin] [Sales Manager] |

#### Stale Opportunity Detection

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-OPP-029 | The system shall flag Opportunities as "stale" when no Activity has been logged against them within a configurable inactivity threshold (default: 7 days, configurable by [Admin]). Stale Opportunities are visually surfaced in pipeline views and in the Sales Manager dashboard. | [M] | [Sales Manager] [Admin] |
| FR-OPP-030 | The system shall send a daily digest notification (in-app + email) to [Sales Manager] listing all stale Opportunities on their team. The digest is sent at 8:00 AM in the organization's configured timezone. | [S] | [Sales Manager] |

---

### Key User Stories

**US-OPP-001 — Stage Progression via Kanban**
- **Given** a [Sales Rep] has an Opportunity "Acme Corp — Enterprise Deal" in "Discovery" stage on the Kanban board
- **When** the rep drags the card to the "Proposal Sent" column
- **Then** the system updates the Opportunity's stage to "Proposal Sent", auto-populates the probability to the stage default (60%), records a stage-change entry in the history log with timestamp and time-in-previous-stage calculation, and the Kanban board reflects the change in real-time without a full page reload

**US-OPP-002 — Weighted Forecasting View**
- **Given** a [Sales Manager] opens the Forecasting view filtered to their team for Q3 2026
- **When** the view loads
- **Then** the system displays: total pipeline value, total weighted pipeline value (sum of amount × probability for all active Opportunities with close date in Q3), a breakdown table by rep showing each rep's pipeline value and weighted value, and a breakdown by stage; all figures update immediately when filter parameters change

**US-OPP-003 — Closing a Deal as Lost**
- **Given** a [Sales Rep] has an Opportunity in "Negotiation" stage
- **When** the rep clicks "Close as Lost" and selects lost reason "Competitor" with an optional note "Lost to Competitor X on pricing"
- **Then** the system sets the Opportunity stage to "Closed Lost", probability to 0%, records the lost reason and note on the record, writes a stage-change event to the history log, the Opportunity disappears from active pipeline views (but remains accessible via "Closed Deals" filter), and the Win/Loss report reflects the updated count

---

### Module Boundaries

**This module owns:**
- Opportunity entity lifecycle (create, read, update, close, reopen, soft-delete)
- Pipeline and stage configuration per tenant
- Stage history log
- Opportunity forecasting computations (weighted value, manager override)
- Win/Loss reporting data (owned here; surfaced in Module 7)
- Stale opportunity detection logic

**This module delegates to:**
- Module 2 (Contact & Account Management): Contact and Account entities linked to Opportunities are owned by Module 2; this module stores foreign keys only
- Module 5 (Activity & Task Management): Activity records on Opportunities are owned by Module 5; this module renders them in the timeline
- Module 7 (Reporting & Dashboards): aggregated pipeline metrics and charts are computed and rendered in Module 7 using Opportunity data
- Module 1 (Auth): authorization checks for record-level access

---

## Module 5: Activity & Task Management

### Overview

This module owns all activity records — calls, meetings, tasks, and follow-ups — that represent real-world interactions and planned work items within the CRM. Activities may be linked to any combination of Contact, Account, Opportunity, or Lead. The module handles task assignment, due dates, priority, reminders, and overdue notifications. Activity records form the backbone of the Activity Timeline rendered across all entity detail pages.

---

### Functional Requirements

#### Task CRUD

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-001 | The system shall allow users to create a Task with fields: title (required), description, assignee (user, defaults to creating user), due date (required), priority (Low, Medium, High, Urgent), status (Open, In Progress, Completed, Cancelled), related entity type (Contact, Account, Opportunity, Lead) and related entity ID. | [M] | All |
| FR-ACTIVITY-002 | The system shall allow users to update any Task field. Every status change is written to the Task's history. | [M] | All |
| FR-ACTIVITY-003 | The system shall allow users to mark a Task as complete by setting status to "Completed". Completed tasks remain visible in the Activity Timeline and in filtered task list views. | [M] | All |
| FR-ACTIVITY-004 | The system shall allow [Admin] and [Sales Manager] to assign Tasks to any user within the organization. Task assignment triggers an in-app and email notification to the assignee. | [M] | [Admin] [Sales Manager] |
| FR-ACTIVITY-005 | The system shall allow users to delete Tasks they created or are assigned to. [Admin] and [Sales Manager] may delete any Task. Deletion is a hard delete (tasks do not need to be retained for reporting). | [M] | All |

#### Call Logs

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-006 | The system shall allow users to log a Call with fields: subject (required), direction (Inbound, Outbound), duration (minutes), outcome (Connected — No Answer — Left Voicemail — Wrong Number), related entity (Contact, Lead, Account, Opportunity), date/time, notes, next step (free text). | [M] | [Sales Rep] [Account Manager] [Sales Manager] |
| FR-ACTIVITY-007 | The system shall display Call log entries in the Activity Timeline of the related entity immediately after creation. | [M] | All |

#### Meeting Logs

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-008 | The system shall allow users to log a Meeting with fields: subject (required), date/time (required), duration, attendees (free-text list of names or linked Contact records), location/video link, related entity (Contact, Account, Opportunity), outcome notes, follow-up tasks. | [M] | [Sales Rep] [Account Manager] [Sales Manager] |
| FR-ACTIVITY-009 | The system shall allow follow-up Tasks to be created directly from the Meeting log form in a single workflow (user fills meeting details and creates one or more follow-up Tasks without navigating away). | [M] | All |

#### Reminders and Notifications

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-010 | The system shall send in-app and email reminders for Tasks approaching their due date. Default reminder: 24 hours before due date. Users may configure per-task reminder timing (1 hour, 4 hours, 24 hours, 48 hours before due). | [M] | All |
| FR-ACTIVITY-011 | The system shall display a persistent in-app notification badge showing the count of tasks due today or overdue. Clicking the badge opens the filtered task list. | [M] | All |
| FR-ACTIVITY-012 | The system shall send a daily overdue task digest to each user listing all their overdue tasks. Digest is sent at 8:00 AM in the organization's configured timezone. Users may opt out of the daily digest in notification preferences. | [M] | All |
| FR-ACTIVITY-013 | The system shall allow [Sales Manager] to receive a daily digest showing overdue tasks for all members of their team (in addition to their own). | [M] | [Sales Manager] |

#### Activity Timeline Integration

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-014 | The system shall write all Call logs, Meeting logs, Task creates/completions, and Note events to the Activity Timeline of every linked entity (Contact, Account, Opportunity, Lead). A single Activity linked to multiple entities appears in each entity's timeline. | [M] | All |
| FR-ACTIVITY-015 | The system shall allow users to filter the Task list view by: assignee, status, priority, related entity type, due date range. | [M] | All |
| FR-ACTIVITY-016 | The system shall display a global Task List view (accessible from the main navigation) showing all tasks assigned to the current user, sorted by due date ascending by default. | [M] | All |

#### Follow-ups

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-017 | The system shall allow users to schedule a follow-up from any Activity log entry (Call, Meeting) by creating a linked Task with a pre-filled subject referencing the parent activity. | [M] | All |

#### Overdue Task Notifications

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-018 | The system shall visually flag overdue tasks (due date in the past, status not Completed or Cancelled) in all list views with a distinct visual indicator (red badge or label). | [M] | All |
| FR-ACTIVITY-019 | The system shall allow [Admin] to configure the global daily digest send time and the default task reminder window. | [S] | [Admin] |

#### Activity Analytics Data

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-020 | The system shall record all Activity events (task created, task completed, call logged, meeting logged) with `createdBy`, `assignedTo`, `relatedEntityType`, `relatedEntityId`, `organizationId`, and `timestamp` for use in Module 7 reporting. | [M] | All |

#### Quick Log

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-021 | The system shall provide a "Quick Log" shortcut accessible from Contact, Account, Lead, and Opportunity detail pages. Quick Log opens an inline form pre-filled with the current entity context, allowing a call or note to be logged in three clicks or fewer. | [M] | [Sales Rep] [Account Manager] |
| FR-ACTIVITY-022 | The system shall allow users to log multiple activities in sequence from the Quick Log without closing and reopening the form between entries. | [S] | [Sales Rep] [Account Manager] |

#### Task Bulk Operations

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-ACTIVITY-023 | The system shall allow [Admin] and [Sales Manager] to bulk-reassign tasks (select up to 200 tasks and change assignee). | [S] | [Admin] [Sales Manager] |
| FR-ACTIVITY-024 | The system shall allow [Admin] and [Sales Manager] to bulk-complete tasks (select up to 200 tasks and mark all as Completed). | [S] | [Admin] [Sales Manager] |
| FR-ACTIVITY-025 | The system shall allow [Admin] to configure notification preferences at the organization level (which notification types are sent via email vs. in-app only). Individual users may further restrict (but not expand) notification delivery to themselves. | [S] | [Admin] |

---

### Key User Stories

**US-ACTIVITY-001 — Post-Call Activity Log with Follow-up**
- **Given** a [Sales Rep] has just finished a discovery call with a Contact linked to an active Opportunity
- **When** the rep opens the Opportunity record and clicks "Quick Log → Call"
- **Then** the Quick Log form opens pre-filled with the Opportunity and linked Contact context; the rep fills in duration (25 min), outcome (Connected), and a brief note; upon saving, the call appears in the Opportunity's Activity Timeline immediately; the system prompts (non-blocking) "Schedule a follow-up?" and if the rep clicks yes, a Task creation form opens with subject pre-filled as "Follow up: [call subject]"

**US-ACTIVITY-002 — Overdue Task Notification**
- **Given** a [Sales Rep] has 3 tasks that were due yesterday and have not been completed
- **When** it is 8:00 AM in the organization's timezone on the day following the due dates
- **Then** the system sends a daily digest email to the rep listing all 3 overdue tasks with due dates, related entity names, and direct links; the in-app notification badge shows "3 overdue"; the tasks are visually flagged red in the global Task List view

**US-ACTIVITY-003 — Sales Manager Team Activity Digest**
- **Given** a [Sales Manager] manages a team of 5 reps and 2 of them have a combined 7 overdue tasks
- **When** the daily digest runs at 8:00 AM
- **Then** the Sales Manager receives a digest email listing all 7 overdue tasks broken down by rep, with links to each task; the manager's own overdue tasks (if any) are also included; the manager can click directly into any task record from the email without logging in first (magic link with short TTL)

---

### Module Boundaries

**This module owns:**
- Task entity lifecycle (create, update, complete, delete)
- Call log records
- Meeting log records
- Activity Timeline event feed (aggregation across entity types)
- Reminder and notification triggers for tasks
- Overdue task detection and digest delivery
- Quick Log workflow

**This module delegates to:**
- Module 2 (Contact & Account Management): renders Activity Timeline entries on Contact/Account pages — events are written here and read there
- Module 4 (Opportunity & Pipeline): renders Activity Timeline entries on Opportunity pages
- Module 3 (Lead Management): renders Activity Timeline entries on Lead pages
- Module 6 (Email & Communication History): Email records that appear in the Activity Timeline are owned by Module 6; this module renders them read-only
- Module 1 (Auth): authorization for task assignment across users

---

## Module 6: Email & Communication History

### Overview

This module owns the storage and display of email communication records linked to CRM entities (Contacts, Leads, Opportunities, Accounts). It supports SMTP outbound email logging, IMAP inbound email polling, manual email log entry, email templates (Should Have), and inbound email parsing (Should Have). Gmail/Outlook OAuth sync is a Could Have for Year 1, promoted to Must Have for Year 2. Email records form part of the Activity Timeline across all entity detail pages.

---

### Functional Requirements

#### Manual Email Logging

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-001 | The system shall allow users to manually log an email by entering: subject (required), direction (Inbound, Outbound), date/time (required), body/content (optional), related Contact or Lead, related Opportunity (optional), and sender/recipient name (free text). | [M] | [Sales Rep] [Account Manager] [Marketing] |
| FR-EMAIL-002 | The system shall display manually logged emails in the Activity Timeline of the related Contact, Lead, and Opportunity, clearly labeled as "Email — Manually Logged". | [M] | All |

#### SMTP Outbound Email Logging

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-003 | The system shall allow users to compose and send an email to a Contact's email address directly from within the CRM (Contact detail page or Opportunity detail page). The system sends the email via the organization's configured SMTP server. | [M] | [Sales Rep] [Account Manager] |
| FR-EMAIL-004 | The system shall automatically log every outbound email sent via the CRM as an Email record on the related Contact and Opportunity (if applicable), capturing: subject, body, sender, recipient(s), sent timestamp, and message ID. | [M] | All |
| FR-EMAIL-005 | The system shall allow [Admin] to configure the organization's SMTP settings: host, port, username, encrypted password (stored encrypted at rest using AES-256), TLS mode (STARTTLS or SSL/TLS), and from-name. | [M] | [Admin] |
| FR-EMAIL-006 | The system shall validate SMTP configuration on save by sending a test email to the admin's own address. Configuration is not saved if the test fails; the error message from the SMTP server is displayed. | [M] | [Admin] |
| FR-EMAIL-007 | The system shall allow individual users to optionally configure their own SMTP credentials to send emails from their personal work address. User-level SMTP credentials override organization-level SMTP for that user's outbound emails. | [S] | All |

#### IMAP Inbound Email Polling

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-008 | The system shall allow [Admin] to configure an IMAP account for inbound email polling: host, port, username, encrypted password, TLS mode, folder to monitor (default: INBOX), polling interval (5 minutes, 15 minutes, 30 minutes, 60 minutes). | [M] | [Admin] |
| FR-EMAIL-009 | The system shall poll the configured IMAP account at the configured interval. For each new email found, the system shall attempt to match the sender's email address against existing Contact and Lead records in the organization. If a match is found, the email is logged as an Email record on the matched entity. If no match is found, the email is stored in an "Unmatched Emails" queue for manual review. | [M] | [Admin] [Sales Rep] [Account Manager] |
| FR-EMAIL-010 | The system shall provide an "Unmatched Emails" inbox view where users can review inbound emails that did not auto-match a Contact or Lead, and manually associate them with an existing Contact/Lead or create a new Contact from the email. | [M] | [Sales Rep] [Account Manager] [Admin] |
| FR-EMAIL-011 | The system shall display inbound email records in the Activity Timeline of the matched Contact and/or Opportunity with direction labeled "Inbound", subject, snippet of body, and received timestamp. | [M] | All |

#### Email Templates

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-012 | The system shall allow [Admin] and [Sales Manager] to create, edit, and delete email templates. A template has: name, subject (with merge field support), body (HTML + plain text, with merge field support). | [S] | [Admin] [Sales Manager] |
| FR-EMAIL-013 | The system shall support merge fields in email templates that resolve at send time from the related Contact and Opportunity records: `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.company}}`, `{{opportunity.name}}`, `{{opportunity.amount}}`, `{{user.first_name}}`, `{{user.last_name}}`. | [S] | All |
| FR-EMAIL-014 | The system shall allow users to select an email template when composing an email from within the CRM. The template populates the subject and body fields; the user may edit the content before sending. | [S] | [Sales Rep] [Account Manager] |
| FR-EMAIL-015 | The system shall allow [Admin] to designate templates as organization-wide (visible to all users) or private (visible only to the creator). | [S] | [Admin] |

#### Inbound Email Parsing

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-016 | The system shall provide a unique inbound email parsing address per organization (format: `crm+<org-token>@inbound.opsnextcrm.com`). Any email forwarded or sent to this address is ingested, parsed, and matched against Contact/Lead records using the sender's From address. | [S] | [Admin] |
| FR-EMAIL-017 | The system shall handle inbound email parsing asynchronously via a queue (Redis). Failed parses are retried up to 3 times with exponential backoff. After 3 failures, the email is placed in the "Unmatched Emails" queue with a parsing error note. | [S] | [Admin] |

#### Gmail / Outlook OAuth Sync

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-018 | The system shall support Gmail OAuth 2.0 integration. Users may authorize the CRM to read their Gmail Sent and Inbox folders and automatically log matching emails against CRM Contact/Lead records. | [C] | All |
| FR-EMAIL-019 | The system shall support Microsoft Outlook OAuth 2.0 integration via Microsoft Graph API. Users may authorize the CRM to read their Outlook Sent and Inbox folders. | [C] | All |
| FR-EMAIL-020 | For Gmail/Outlook OAuth sync: the system shall only read and log emails; it shall never write to or delete emails in the user's mail account. Read permission scope is limited to email metadata and body content required for CRM logging. | [C] | [Admin] |

#### Email Record Display

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-021 | The system shall display email records in the Activity Timeline of Contact, Lead, Opportunity, and Account pages. Each email entry shows: direction badge (Inbound/Outbound), subject, sender, recipient, timestamp, and a collapsible body preview. | [M] | All |
| FR-EMAIL-022 | The system shall allow users to filter the Communication History view on a Contact or Opportunity to show emails only, hiding other activity types. | [M] | All |

#### IMAP Integration Health

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-EMAIL-023 | The system shall provide an integration health status panel (accessible to [Admin]) showing: last successful IMAP poll timestamp, emails ingested in last 24 hours, count of unmatched emails, and any recurring errors from the last 10 poll attempts. | [M] | [Admin] |
| FR-EMAIL-024 | The system shall send an alert notification to [Admin] if the IMAP polling job fails 3 consecutive times. The alert includes the error message and the timestamp of the first failure in the sequence. | [M] | [Admin] |
| FR-EMAIL-025 | The system shall allow [Admin] to pause and resume IMAP polling without removing the configuration. | [S] | [Admin] |

---

### Key User Stories

**US-EMAIL-001 — Outbound Email from Contact Record**
- **Given** a [Sales Rep] is viewing a Contact record for "Jane Doe, jane@example.com"
- **When** the rep clicks "Send Email", selects the "Post-Demo Follow-up" template, edits the body with a personal note, and clicks Send
- **Then** the system sends the email via the configured SMTP server, automatically logs the email as an Email record on Jane's Contact record and on any open Opportunity linked to Jane, the email appears in the Activity Timeline within 5 seconds of being sent, and the rep sees a success toast notification

**US-EMAIL-002 — IMAP Inbound Email Auto-Match**
- **Given** [Admin] has configured IMAP polling on support@company.com with a 15-minute interval
- **When** an email arrives from "jane@example.com" who is a Contact in the CRM
- **Then** within 15 minutes of the email arriving in the INBOX folder, the system logs the email as an inbound Email record on Jane's Contact record and on any open Opportunity linked to Jane; the email appears in Jane's Activity Timeline with direction label "Inbound"

**US-EMAIL-003 — Unmatched Email Manual Association**
- **Given** the IMAP poller ingested an email from "ceo@newprospect.com" who does not yet exist as a Contact or Lead
- **When** a [Sales Rep] reviews the Unmatched Emails queue and clicks "Associate with existing Contact" on that email
- **Then** the system presents a Contact search modal; the rep types "newprospect" and sees no results; the rep clicks "Create new Contact" and the Contact creation form pre-fills the email field from the unmatched email; upon saving, the email is linked to the new Contact and removed from the Unmatched Emails queue

---

### Module Boundaries

**This module owns:**
- Email record entity lifecycle (create, read — no update or delete except by Admin)
- SMTP configuration and outbound send
- IMAP configuration and inbound polling job
- Inbound email parsing address routing
- Email template creation and management
- Unmatched Emails queue and manual association workflow
- Gmail/Outlook OAuth configuration and sync jobs (when implemented)
- IMAP integration health monitoring

**This module delegates to:**
- Module 2 (Contact & Account Management): Contact and Account records to which emails are associated are owned by Module 2; this module stores foreign keys only
- Module 4 (Opportunity & Pipeline): Opportunity records to which emails are associated are owned by Module 4
- Module 5 (Activity & Task Management): renders Email records in the Activity Timeline alongside other activity types; email records are owned here

---

## Module 7: Reporting & Dashboards

### Overview

This module owns all pre-built analytics dashboards and reporting views within OpsNext CRM. It surfaces aggregated metrics from Modules 2–6 via read-optimized queries on the PostgreSQL database. No separate analytics database is required in Phase 1. All reports support custom date ranges and CSV export. The module delivers role-appropriate default dashboards for Executives, Sales Managers, and Sales Reps.

---

### Functional Requirements

#### Executive Dashboard

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-001 | The system shall provide an Executive Dashboard with the following widgets: (a) Total open pipeline value; (b) Weighted forecast value; (c) Pipeline-to-quota coverage ratio (requires quota to be set per rep — see FR-REPORT-020); (d) Deals closing this month (count + value); (e) Top 10 open deals by value (name, stage, amount, close date, owner); (f) At-risk deals (stale > 7 days or missing next step, count + list). | [M] | [Executive] [Admin] |
| FR-REPORT-002 | The system shall allow [Executive] to filter the Executive Dashboard by: team, close date range. | [M] | [Executive] |
| FR-REPORT-003 | The system shall allow [Executive] to export the Executive Dashboard summary as a PDF (formatted for presentation). | [S] | [Executive] |

#### Sales Manager Dashboard

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-004 | The system shall provide a Sales Manager Dashboard with: (a) Team pipeline by stage (bar chart); (b) Individual rep pipeline value vs. quota; (c) Activity counts per rep (calls, meetings, tasks completed) for the current period; (d) Lead-to-opportunity conversion rate per rep; (e) Stalled deals (no activity > configurable threshold); (f) Win rate by rep (current period vs. prior period). | [M] | [Sales Manager] [Admin] |
| FR-REPORT-005 | The system shall allow [Sales Manager] to filter the Sales Manager Dashboard by: individual rep, team, date range (default: current month). | [M] | [Sales Manager] |

#### Sales Rep Dashboard

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-006 | The system shall provide a Sales Rep Dashboard (the default landing view) with: (a) My open pipeline value and deal count; (b) Deals closing this month; (c) Tasks due today and overdue task count; (d) Recent activities (last 5 activities logged); (e) Leads in My queue by status. | [M] | [Sales Rep] [Account Manager] |

#### Lead Analytics Report

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-007 | The system shall provide a Lead Analytics report with: (a) Total leads created (by period); (b) Lead conversion rate (Qualified / Total); (c) Leads by source (pie or bar chart); (d) Leads by status distribution; (e) Average time from lead creation to Qualified status; (f) Disqualification reasons breakdown. | [M] | [Sales Manager] [Marketing] [Admin] |
| FR-REPORT-008 | The system shall allow filtering the Lead Analytics report by: date range, source, owner, campaign. | [M] | [Sales Manager] [Marketing] |

#### Opportunity Analytics Report

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-009 | The system shall provide an Opportunity Analytics report with: (a) Pipeline velocity (average days from creation to Closed Won); (b) Average deal size (all deals, by stage entered, by rep); (c) Stage-by-stage funnel (deals entering and exiting each stage per period); (d) Deals created vs. deals closed (by period); (e) Win/Loss ratio trend. | [M] | [Sales Manager] [Executive] [Admin] |
| FR-REPORT-010 | The system shall allow filtering the Opportunity Analytics report by: date range, pipeline, owner, opportunity type. | [M] | [Sales Manager] [Executive] |

#### Activity Analytics Report

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-011 | The system shall provide an Activity Analytics report with: (a) Total activities by type (call, meeting, task) per rep per period; (b) Activity trend over time (line chart); (c) Activity-to-opportunity correlation (activities logged per deal stage). | [S] | [Sales Manager] [Admin] |
| FR-REPORT-012 | The system shall allow filtering the Activity Analytics report by: date range, activity type, assignee, team. | [S] | [Sales Manager] |

#### Team Performance Report

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-013 | The system shall provide a Team Performance report with: (a) Quota attainment per rep (requires quota configuration — see FR-REPORT-020); (b) Pipeline coverage ratio per rep; (c) Average deal size per rep; (d) Number of deals closed (won + lost) per rep per period; (e) Win rate per rep. | [M] | [Sales Manager] [Executive] [Admin] |
| FR-REPORT-014 | The system shall allow filtering the Team Performance report by: date range, team, individual rep. | [M] | [Sales Manager] [Executive] |

#### Forecasting Report

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-015 | The system shall provide a Forecasting report (owned by Module 4 data, surfaced here) showing pipeline by close date (monthly/quarterly), weighted forecast by rep, and manager override values side-by-side with system-computed values. | [M] | [Sales Manager] [Executive] |

#### KPI Reporting

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-016 | The system shall support the following organization-level KPI summary (suitable for board reporting): (a) Total closed-won ARR/value YTD; (b) Pipeline value vs. same period last year; (c) Win rate YTD vs. prior year; (d) Average sales cycle length (days). | [M] | [Executive] [Admin] |
| FR-REPORT-017 | The system shall allow the above KPIs to be exported as CSV or included in a PDF export. | [S] | [Executive] |

#### Date Range Filters

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-018 | All reports and dashboards shall support the following date range presets: Today, This Week, This Month, Last Month, This Quarter, Last Quarter, This Year, Last Year, and Custom (start date + end date picker). | [M] | All |
| FR-REPORT-019 | Date range selections within a dashboard session shall persist across widget reloads during the same session (no re-selecting after each navigation). | [S] | All |

#### Quota Management

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-020 | The system shall allow [Admin] and [Sales Manager] to set a revenue quota per user per month and/or per quarter. Quotas are used to compute: quota attainment, pipeline coverage ratio, and rep performance dashboards. | [M] | [Admin] [Sales Manager] |
| FR-REPORT-021 | The system shall allow [Admin] to bulk-set quotas for multiple users via a table editor (edit all reps' quotas for a given period in one view). | [S] | [Admin] |

#### CSV Export

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-022 | All reports shall support CSV export. The exported file includes all rows matching the current filter state (not just the visible page). Maximum export: 100,000 rows. | [M] | [Admin] [Sales Manager] [Executive] |
| FR-REPORT-023 | CSV exports shall be generated asynchronously for result sets over 5,000 rows. The user receives an in-app and email notification with a download link when the export is ready. Download links expire after 24 hours. | [M] | All |

#### Report Permissions

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-024 | The system shall enforce the following report access by role: (a) Executive Dashboard — [Executive], [Admin]; (b) Sales Manager Dashboard — [Sales Manager], [Admin]; (c) Sales Rep Dashboard — [Sales Rep], [Account Manager], [Admin]; (d) Lead Analytics — [Sales Manager], [Marketing], [Admin]; (e) Opportunity Analytics — [Sales Manager], [Executive], [Admin]; (f) Team Performance — [Sales Manager], [Executive], [Admin]; (g) Activity Analytics — [Sales Manager], [Admin]. Read-Only role can view Rep Dashboard only. | [M] | [Admin] |
| FR-REPORT-025 | The system shall ensure that [Sales Rep] sees their own data only in report views. [Sales Manager] sees all reps on their team. [Executive] and [Admin] see all data organization-wide. | [M] | All |

#### Dashboard Refresh

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-026 | Dashboard widgets shall display a "Last refreshed" timestamp. Widgets are refreshed on page load and on demand (manual refresh button). Automatic background refresh occurs every 5 minutes for active sessions. | [S] | All |
| FR-REPORT-027 | Report queries that take longer than 10 seconds shall return an HTTP 408 with a message instructing the user to narrow their date range or use CSV export. | [M] | All |

#### Saved Reports

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-028 | The system shall allow users to save a report configuration (filter state + date range) as a named saved view. Saved views are per-user by default. [Admin] may designate a saved view as organization-wide. | [S] | All |
| FR-REPORT-029 | The system shall allow [Admin] and [Sales Manager] to share a report link (URL with encoded filter state) with other users in the organization. Clicking the link opens the report with the same filter state applied. | [S] | [Admin] [Sales Manager] |

#### Report Data Freshness

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-REPORT-030 | Report data shall reflect all committed transactions. There is no read replica in Phase 1; all report queries run against the primary PostgreSQL instance. Report queries must use appropriate indexing to remain within the 10-second query timeout for datasets up to 1M rows. | [M] | [Admin] (engineering responsibility) |

---

### Key User Stories

**US-REPORT-001 — Executive Monday Pipeline Review**
- **Given** a [VP of Sales] opens the Executive Dashboard on Monday morning
- **When** the dashboard loads (defaulting to "This Quarter" date range)
- **Then** within 3 seconds the dashboard displays: total open pipeline value, weighted forecast value, the top 10 open deals in a sortable table, and a distinct "At Risk" section listing deals with no activity in 7+ days; the VP can change the date range to "This Month" and all widgets update without a full page reload

**US-REPORT-002 — Sales Manager Weekly Rep Performance Review**
- **Given** a [Sales Manager] opens the Team Performance report filtered to "This Month"
- **When** the report loads
- **Then** the report displays each rep on the team in a table with columns: rep name, quota ($), pipeline value, quota attainment (%), closed-won deals (count + value), win rate, and activity count; the manager can click any rep's name to drill into a filtered view showing only that rep's Opportunities; the manager can export the full table to CSV in one click

**US-REPORT-003 — Lead Source Attribution Export**
- **Given** a [Marketing] user runs the Lead Analytics report filtered to "Last Quarter" and filtered by source "LinkedIn"
- **When** the user clicks "Export CSV"
- **Then** the system queues an async export; within 2 minutes (for up to 10,000 rows) a download link is delivered via in-app notification and email; the CSV includes all Lead records matching the filter with columns: lead name, email, source, UTM campaign, status, owner, created date, qualified date, conversion status; the file downloads correctly when the link is clicked within 24 hours

---

### Module Boundaries

**This module owns:**
- Dashboard layout and widget rendering
- Report query definitions and filter state management
- Quota configuration (storage and retrieval)
- CSV export job management for report data
- Saved report views
- Report access control enforcement

**This module delegates to:**
- Modules 2–6: all source data; Module 7 queries are read-only against those modules' tables
- Module 5 (Activity & Task Management): activity counts and task data for activity analytics
- Module 4 (Opportunity & Pipeline): stage history, deal value, win/loss data
- Module 3 (Lead Management): lead conversion and source data
- Module 1 (Auth): user and role data for rep-level scoping and team membership

---

## Integrations Inventory

### Overview

This section documents the complete integration surface for OpsNext CRM Year 1. It defines which integrations are built natively, which are available through the public API and webhooks, and which are deferred to Year 2.

---

### 1. Email Integration

#### 1a. SMTP — Outbound Email (Must Have)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Send emails from the CRM on behalf of users or the organization |
| **Config location** | Admin → Settings → Email → SMTP Configuration |
| **Scope** | Organization-level (one SMTP config per org) + optional per-user override |
| **Auth** | Username + encrypted password (AES-256 at rest). TLS: STARTTLS or SSL/TLS |
| **Validation** | Test email sent on save; error surfaced if connection or auth fails |
| **Volume limits** | Governed by the customer's own SMTP server; OpsNext applies no send limits |
| **Phase 1 status** | **Must Have** |

#### 1b. IMAP — Inbound Email Polling (Must Have)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Poll a configured mailbox and ingest incoming emails, matching them to CRM Contact/Lead records |
| **Config location** | Admin → Settings → Email → IMAP Configuration |
| **Polling mechanism** | Background job (Redis queue, BullMQ) on configurable interval (5–60 min) |
| **Matching logic** | Primary: exact From-address match against Contact.email and Lead.email; Secondary: user-initiated manual match via Unmatched Emails queue |
| **Data stored** | Subject, body (plain text + HTML), sender, recipients, received timestamp, message-id (dedup key) |
| **Deduplication** | message-id is stored and checked; duplicate ingestion is silently skipped |
| **Error handling** | Retry up to 3× with exponential backoff; alert to Admin after 3 consecutive poll failures |
| **Phase 1 status** | **Must Have** |

#### 1c. Inbound Email Parsing Address (Should Have)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Allow users to forward emails into the CRM by BCC/CC-ing a unique parsing address |
| **Address format** | `crm+<org-slug>@inbound.opsnextcrm.com` (one unique address per organization) |
| **Routing** | Inbound SMTP → parsing service → Redis queue → worker process |
| **Phase 1 status** | **Should Have** |

#### 1d. Gmail / Outlook OAuth Sync (Could Have — Year 1 / Must Have — Year 2)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Bidirectional sync of a user's Gmail/Outlook sent and inbox to CRM email records without manual IMAP configuration |
| **Auth** | OAuth 2.0 (Google Identity Platform for Gmail; Microsoft Identity Platform / Graph API for Outlook) |
| **Scope requested** | `gmail.readonly` (Gmail); `Mail.Read` (Outlook) — read-only, no write or delete permissions on user mailbox |
| **Matching logic** | Same as IMAP: From/To address matched against Contact.email / Lead.email |
| **Phase 1 status** | **Could Have** — architectural hooks must be in place in Phase 1 even if the UI is not shipped |
| **Year 2 status** | **Must Have** |

---

### 2. Calendar Integration

| Integration | Year 1 Status | Notes |
|-------------|--------------|-------|
| Google Calendar | Not in scope | Manual activity logging only; Calendar sync is a Year 2 milestone |
| Outlook Calendar | Not in scope | Same rationale |
| iCal / .ics | Not in scope | Meeting logs in the CRM do not produce .ics files in Phase 1 |

**Year 1 approach:** All meeting tracking is handled via manual Meeting log entries in Module 5. There is no native calendar sync, attendee management via calendar invite, or calendar-based availability checking.

---

### 3. Outbound Webhooks

#### 3a. Webhook Overview

OpsNext CRM fires outbound webhooks on all major entity lifecycle events. Webhooks enable third-party tools (Zapier, custom integrations, internal automation scripts) to react to CRM events in real time without polling the API.

| Attribute | Detail |
|-----------|--------|
| **Delivery mechanism** | HTTP POST to caller-supplied URL |
| **Payload format** | JSON — `{ "event": "contact.created", "timestamp": ISO8601, "organizationId": UUID, "data": { ...entity payload } }` |
| **Authentication** | HMAC-SHA256 signature header (`X-OpsNext-Signature`) — shared secret configured per webhook endpoint |
| **Retry policy** | Up to 5 retries with exponential backoff (1s, 2s, 4s, 8s, 16s). After 5 failures, the endpoint is marked as failing; Admin receives an alert |
| **Timeout** | 10 seconds per delivery attempt |
| **Order guarantee** | Best-effort ordering within an entity; no strict global ordering guarantee |
| **Phase 1 status** | **Must Have** |

#### 3b. Supported Webhook Events

| Entity | Events |
|--------|--------|
| Contact | `contact.created`, `contact.updated`, `contact.deleted` |
| Lead | `lead.created`, `lead.updated`, `lead.status_changed`, `lead.converted`, `lead.deleted` |
| Opportunity | `opportunity.created`, `opportunity.updated`, `opportunity.stage_changed`, `opportunity.won`, `opportunity.lost`, `opportunity.deleted` |
| Activity (Task/Call/Meeting) | `activity.created`, `activity.updated`, `activity.completed`, `activity.deleted` |
| Account | `account.created`, `account.updated`, `account.deleted` |

#### 3c. Webhook Configuration

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-INTEG-001 | The system shall allow [Admin] to create webhook endpoints by providing: a name, a target URL, a list of event types to subscribe to, and a shared secret (minimum 32 characters, generated automatically if not provided). | [M] | [Admin] |
| FR-INTEG-002 | The system shall allow [Admin] to enable, disable, and delete webhook endpoints. Disabled endpoints receive no deliveries but retain their configuration. | [M] | [Admin] |
| FR-INTEG-003 | The system shall provide a webhook delivery log showing the last 100 delivery attempts per endpoint: event type, timestamp, HTTP response code, response body (truncated to 500 chars), and delivery status (Success/Retry/Failed). | [M] | [Admin] |
| FR-INTEG-004 | The system shall allow [Admin] to manually trigger a re-delivery of a failed webhook event from the delivery log. | [S] | [Admin] |

---

### 4. Public REST API

#### 4a. Overview

The Public REST API is a first-class product, not a side effect of the UI. Every UI action maps to an API endpoint. The API is the recommended integration path for all non-webhook use cases.

| Attribute | Detail |
|-----------|--------|
| **Base URL** | `/api/v1/` |
| **Protocol** | HTTPS only (HTTP rejected at load balancer) |
| **Authentication** | API Key (Bearer token in `Authorization` header) — for machine-to-machine; JWT (cookie) — for browser sessions |
| **Authorization** | Same RBAC model as UI — API key is associated with a user and inherits that user's role |
| **Documentation** | OpenAPI 3.0 spec auto-generated from NestJS decorators; Swagger UI available at `/api/v1/docs` |
| **Rate limiting** | 1,000 requests per minute per organization (configurable by [Admin]). Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| **Versioning** | URL-based (`/api/v1/`, `/api/v2/` when introduced). v1 supported for minimum 12 months after v2 is released |
| **Pagination** | Cursor-based pagination on all list endpoints. Parameters: `limit` (max 100, default 20), `cursor` |
| **Error format** | RFC 7807 Problem Details JSON: `{ "type": URL, "title": string, "status": int, "detail": string, "errors": [...] }` |
| **Phase 1 status** | **Must Have** |

#### 4b. API Coverage by Entity

| Entity | Endpoints |
|--------|-----------|
| Organizations | GET (own org only) |
| Users | GET list, GET by ID, POST invite, PATCH update, DELETE deactivate |
| Contacts | GET list, GET by ID, POST create, PATCH update, DELETE soft-delete, POST import, GET export |
| Accounts | GET list, GET by ID, POST create, PATCH update, DELETE soft-delete, POST import, GET export |
| Leads | GET list, GET by ID, POST create, PATCH update, POST transition-status, POST convert, DELETE soft-delete, POST import, GET export |
| Opportunities | GET list, GET by ID, POST create, PATCH update, POST close-won, POST close-lost, POST reopen, DELETE soft-delete, GET export |
| Pipelines | GET list, GET by ID, POST create, PATCH update, DELETE |
| Activities (Tasks) | GET list, GET by ID, POST create, PATCH update, POST complete, DELETE |
| Activities (Calls) | GET list, GET by ID, POST log, PATCH update, DELETE |
| Activities (Meetings) | GET list, GET by ID, POST log, PATCH update, DELETE |
| Email Records | GET list, GET by ID, POST log (manual), DELETE |
| Email Templates | GET list, GET by ID, POST create, PATCH update, DELETE |
| Webhooks | GET list, GET by ID, POST create, PATCH update, DELETE, GET delivery-log |
| Reports (read-only) | GET executive-summary, GET sales-manager-summary, GET lead-analytics, GET opportunity-analytics, GET team-performance |
| Audit Log | GET list (Admin only) |

#### 4c. API Key Management

| ID | Requirement | MoSCoW | Actor |
|----|-------------|--------|-------|
| FR-INTEG-005 | The system shall allow [Admin] to generate API keys for the organization. A key is associated with a specific user account (determining RBAC scope). Key value is shown once on creation and cannot be retrieved again; if lost, a new key must be generated. | [M] | [Admin] |
| FR-INTEG-006 | The system shall allow [Admin] to name, deactivate, and delete API keys. Deactivating a key immediately rejects all subsequent requests authenticated with that key. | [M] | [Admin] |
| FR-INTEG-007 | The system shall log every API key usage (endpoint, timestamp, response code, IP address) accessible to [Admin] in the audit log. | [S] | [Admin] |

---

### 5. CSV Import / Export

| Entity | Import | Export | Notes |
|--------|--------|--------|-------|
| Contacts | Yes [M] | Yes [M] | See FR-CONTACT-024 through FR-CONTACT-028 |
| Accounts | Yes [S] | Yes [S] | See FR-CONTACT-033, FR-CONTACT-034 |
| Leads | Yes [M] | Yes [M] | See FR-LEAD-005, FR-LEAD-022 |
| Opportunities | No (manual create or API) | Yes [M] | See FR-OPP-028 |
| Activities | No | No | Activity data accessible via API; no bulk import use case |
| Email Records | No | No | IMAP handles inbound at volume; manual log for exceptions |
| Reports | N/A | Yes [M] | All reports support CSV export; see FR-REPORT-022 |

**Import behavior (universal):**
- Files up to 100 rows: synchronous processing, result returned in API response
- Files over 100 rows: asynchronous (BullMQ job), user notified on completion
- Pre-import validation report always presented before records are written
- Maximum import file size: 10 MB per upload

---

### 6. Deferred Integrations (Not Year 1)

| Integration | Deferred To | Rationale |
|-------------|------------|-----------|
| Zapier native connector | Year 2 | REST API + webhooks provide equivalent capability for Year 1; native connector adds discoverability in Year 2 |
| Make (Integromat) native connector | Year 2 | Same rationale as Zapier |
| Google Calendar sync | Year 2 | Manual activity logging covers Year 1 use case; calendar integration is a Year 2 growth feature |
| Slack notifications | Year 2 | Deal-win alerts and pipeline digests via Slack are high-value but deferred; webhook to Slack bot is available via the public webhook system in Year 1 |
| DocuSign / contract management | Year 2+ | Out of scope for Phase 1 |
| LinkedIn Sales Navigator | Year 2+ | Deep integration deferred; manual data entry in Year 1 |
| Billing / ERP integration | Out of scope | Per Product Vision — OpsNext CRM is not a billing system |

---

## Cross-Module Dependency Map

The following table summarizes how modules depend on each other for data, authorization, and shared services:

| Module | Depends On | For |
|--------|-----------|-----|
| Contact & Account (2) | Auth (1) | RBAC enforcement |
| Lead Management (3) | Auth (1), Contact & Account (2), Opportunity (4), Activity (5) | Authorization, conversion targets, activity timeline |
| Opportunity & Pipeline (4) | Auth (1), Contact & Account (2), Activity (5) | Authorization, linked entities, activity timeline |
| Activity & Task (5) | Auth (1) | Authorization, user assignment |
| Email & Communication (6) | Auth (1), Contact & Account (2), Lead (3), Opportunity (4) | Authorization, entity linking for email records |
| Reporting & Dashboards (7) | Auth (1), all data modules (2–6) | Source data for all metrics |

All modules depend on the following shared infrastructure services:
- **Redis**: session cache, permission cache, BullMQ job queues (async import, email polling, webhook delivery, export jobs)
- **PostgreSQL**: primary data store with row-level tenant isolation via `organizationId`
- **Notification Service**: shared email delivery service (Nodemailer + configured SMTP); all modules produce notification events and the service handles delivery
- **Audit Log Service**: shared write-only audit log; all modules write to it for sensitive mutations

---

## Non-Functional Requirements Summary

These are binding constraints on all Phase 1 modules. They are documented here for reference; detailed specifications belong in the separate Non-Functional Requirements document.

| Requirement | Target |
|-------------|--------|
| API response time (p95) | < 500ms for single-record read/write operations |
| Page load time (p95) | < 2 seconds for entity detail pages |
| Report query timeout | Hard limit 10 seconds; return HTTP 408 if exceeded |
| Multi-tenant data isolation | Zero cross-tenant data leakage — enforced at Prisma query middleware layer |
| Session security | JWT in httpOnly, SameSite=Strict cookies; no localStorage token storage |
| Password hashing | bcrypt, cost factor ≥ 12 |
| Data encryption at rest | AES-256 for stored SMTP/IMAP passwords and OAuth tokens |
| Soft-delete retention | 90 days before permanent purge |
| Audit log immutability | No update or delete operations permitted on audit log records |
| CSV export row limit | 100,000 rows maximum per export |
| Async import threshold | Files > 100 rows processed asynchronously via BullMQ |
| API rate limit | 1,000 requests/minute per organization (configurable) |
| Webhook retry policy | Up to 5 retries, exponential backoff; failure alert to Admin |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | FR-001 |
| Phase | Phase 1 Foundation |
| Owner | Product Management & Backend Lead |
| Reviewers | Engineering Lead, Security Lead, Design Lead |
| Status | Approved — Implementation Anchor |
| Next Review | End of Q3 2026 (Module 1 implementation complete) |
| Supersedes | None (inaugural functional requirements document) |

This document governs all Phase 1 feature scope decisions. New requirements must be added here with appropriate FR number, MoSCoW rating, and actor tag before being scheduled for implementation. Scope changes require Product Management sign-off and a version increment.
