# OpsNext CRM — Core Entity Catalog
## Phase 2: Domain Modeling

**Document ID:** DM-002  
**Version:** 1.0  
**Date:** 2026-06-16  
**Status:** Approved — Implementation Anchor  
**Input documents:** FR-001, DM-001 (Bounded Contexts)

---

## Overview

This document is the authoritative entity catalog for all 7 bounded contexts. Each entity entry specifies:
- **Fields** with types and constraints
- **Business rules** enforced by the domain (not the database)
- **Ownership context** (which bounded context owns this entity)
- **Prisma model name** for implementation reference

All entities carry `organizationId: UUID NOT NULL` (row-level multi-tenancy). This field is omitted from individual field lists below for brevity but is present on every entity.

---

## Context 1: Identity & Access (IAM)

### Organization
**Prisma model:** `Organization`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, generated | |
| name | String | NOT NULL, 2–200 chars | Display name |
| slug | String | UNIQUE, 2–63 chars | URL-safe, auto-generated, immutable |
| status | OrganizationStatus | NOT NULL, DEFAULT ACTIVE | ACTIVE \| SUSPENDED \| PENDING_DELETION |
| plan | String | NOT NULL, DEFAULT 'starter' | Billing plan identifier |
| settings | JSON | NOT NULL, DEFAULT {} | Org-wide config (MFA enforcement, idle timeout, etc.) |
| deletionScheduledAt | DateTime? | nullable | Set when status = PENDING_DELETION |
| createdAt | DateTime | NOT NULL, DEFAULT now() | |
| updatedAt | DateTime | NOT NULL, auto-updated | |

**Business rules:**
- Slug is derived from name at creation time and never changes (changing it would break URLs).
- Transitioning to PENDING_DELETION sets `deletionScheduledAt = now() + 30 days`; actual deletion is a scheduled job.
- SUSPENDED organizations block all logins; API returns 403 with `ERR_ORG_SUSPENDED`.

---

### User
**Prisma model:** `User`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, generated | |
| email | String | NOT NULL, @@unique([orgId, email]) | Lowercased on write |
| passwordHash | String | NOT NULL | bcrypt, cost=12 |
| firstName | String | NOT NULL, 1–100 chars | |
| lastName | String | NOT NULL, 1–100 chars | |
| role | Role | NOT NULL | ADMIN on registration, set by invite |
| isActive | Boolean | NOT NULL, DEFAULT true | Soft delete flag |
| title | String? | nullable, max 200 chars | Job title |
| phone | String? | nullable, max 50 chars | |
| timezone | String | NOT NULL, DEFAULT 'UTC' | IANA timezone string |
| avatarUrl | String? | nullable | Stored in object storage |
| failedLoginCount | Int | NOT NULL, DEFAULT 0 | Reset on successful login |
| lockedUntil | DateTime? | nullable | Account lockout (FR-AUTH-005) |
| lastLoginAt | DateTime? | nullable | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

**Business rules:**
- Email uniqueness is scoped to `organizationId` — the same email may exist in different orgs (for self-hosted deployments sharing user bases).
- SUPER_ADMIN users have `organizationId = NULL` and bypass all tenant scoping.
- Account locks after 5 failed logins within 15 min; locked for 30 min.
- `isActive = false` immediately revokes all RefreshTokens.

---

### Team
**Prisma model:** `Team`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, 2–100 chars, @@unique([orgId, name]) | |
| description | String? | nullable, max 500 chars | |
| createdById | UUID | NOT NULL, FK → User | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

### TeamMember
**Prisma model:** `TeamMember`  
**Join table** for User ↔ Team (a User may belong to multiple Teams).  

| Field | Type | Constraints |
|-------|------|-------------|
| teamId | UUID | FK → Team |
| userId | UUID | FK → User |
| @@unique([teamId, userId]) | | Composite PK |

---

### UserInvite
**Prisma model:** `UserInvite`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| email | String | NOT NULL | Lowercased |
| role | Role | NOT NULL | Cannot be SUPER_ADMIN |
| tokenHash | String | UNIQUE, NOT NULL | SHA-256 of raw token |
| invitedById | UUID | NOT NULL, FK → User | |
| expiresAt | DateTime | NOT NULL | +72h from creation |
| acceptedAt | DateTime? | nullable | Set on acceptance |
| createdAt | DateTime | NOT NULL | |

**Business rules:**
- Only one pending (non-expired, non-accepted) invite per email per org.
- Accepting an invite is a one-time operation — reusing the token returns 400.

---

### RefreshToken
**Prisma model:** `RefreshToken`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | NOT NULL, FK → User | |
| tokenHash | String | UNIQUE, NOT NULL | SHA-256 of raw token |
| familyId | UUID | NOT NULL | Groups tokens for family invalidation |
| expiresAt | DateTime | NOT NULL | +7 days |
| revokedAt | DateTime? | nullable | Set on revocation |
| ipAddress | String? | nullable | For session display |
| userAgent | String? | nullable | For session display |
| createdAt | DateTime | NOT NULL | |

**Business rules:**
- Token rotation: each use creates a new token in the same `familyId` and revokes the old one.
- **Family invalidation:** if a revoked token is presented again, ALL tokens with the same `familyId` are revoked immediately (replay attack).

---

### PasswordReset
**Prisma model:** `PasswordReset`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | NOT NULL, FK → User | |
| tokenHash | String | UNIQUE, NOT NULL | SHA-256 of raw token |
| expiresAt | DateTime | NOT NULL | +1 hour |
| usedAt | DateTime? | nullable | Set on use (single-use) |
| createdAt | DateTime | NOT NULL | |

---

### AuditLog
**Prisma model:** `AuditLog`  
**Immutable** — never updated or deleted.  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| actorId | UUID? | nullable | null = system action |
| action | String | NOT NULL | e.g. `USER_DEACTIVATED` |
| entityType | String | NOT NULL | e.g. `User`, `Opportunity` |
| entityId | String? | nullable | PK of affected entity |
| before | JSON? | nullable | State before mutation |
| after | JSON? | nullable | State after mutation |
| ipAddress | String? | nullable | |
| userAgent | String? | nullable | |
| timestamp | DateTime | NOT NULL, DEFAULT now() | Indexed |

---

## Context 2: Contact Management

### Contact
**Prisma model:** `Contact`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| firstName | String | NOT NULL, 1–100 | |
| lastName | String | NOT NULL, 1–100 | |
| email | String? | nullable, @@unique([orgId, email]) | Lowercased |
| phone | String? | nullable | |
| title | String? | nullable, max 200 | |
| source | String? | nullable | Lead source (web, import, referral…) |
| ownerId | UUID? | nullable, FK → User | Assigned sales rep |
| isActive | Boolean | NOT NULL, DEFAULT true | Soft delete |
| mergedIntoId | UUID? | nullable, FK → Contact | Set on merge (canonical record pointer) |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

**Business rules:**
- Email uniqueness scoped to `organizationId`.
- A merged Contact is tombstoned: `isActive = false`, `mergedIntoId = <canonical>`.
- Owner must belong to the same org.

---

### Account
**Prisma model:** `Account`  
**Aggregate root:** Yes  
(Named "Account" in the domain — maps to "Company" in UI)  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, 2–200 | |
| domain | String? | nullable | e.g. `acme.com` (no protocol) |
| industry | String? | nullable | |
| employeeCount | Int? | nullable | |
| annualRevenue | BigInt? | nullable | In cents |
| website | String? | nullable | |
| phone | String? | nullable | |
| billingAddress | JSON? | nullable | {line1, line2, city, state, country, zip} |
| ownerId | UUID? | nullable, FK → User | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

### ContactAccountLink
**Prisma model:** `ContactAccountLink`  
Links Contacts to Accounts (many-to-many). A Contact can work at multiple companies; one is flagged as primary.  

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| contactId | UUID | FK → Contact |
| accountId | UUID | FK → Account |
| title | String? | Contact's role at this Account |
| isPrimary | Boolean | DEFAULT false |
| @@unique([contactId, accountId]) | | |

---

### Tag
**Prisma model:** `Tag`  

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| name | String | NOT NULL, @@unique([orgId, name]) |
| color | String | NOT NULL, DEFAULT '#6B7280' |
| createdAt | DateTime | NOT NULL |

---

### ContactTag / AccountTag
**Prisma models:** `ContactTag`, `AccountTag`  
Join tables for Tag ↔ Contact and Tag ↔ Account.

| Field | Type |
|-------|------|
| tagId | UUID FK |
| entityId | UUID FK |
| @@unique([tagId, entityId]) | |

---

### CustomField
**Prisma model:** `CustomField`  
Defines an org-level custom field that can be attached to a specific entity type.  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| entityType | String | NOT NULL | 'Contact' \| 'Account' \| 'Lead' \| 'Opportunity' |
| name | String | NOT NULL, @@unique([orgId, entityType, name]) | |
| fieldType | String | NOT NULL | 'text' \| 'number' \| 'date' \| 'boolean' \| 'select' \| 'multiselect' |
| isRequired | Boolean | NOT NULL, DEFAULT false | |
| options | JSON? | nullable | For select/multiselect field types |
| order | Int | NOT NULL, DEFAULT 0 | Display order |
| createdAt | DateTime | NOT NULL | |

---

### CustomFieldValue
**Prisma model:** `CustomFieldValue`  

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| fieldId | UUID | FK → CustomField |
| entityType | String | NOT NULL |
| entityId | String | NOT NULL |
| value | JSON | NOT NULL |
| updatedAt | DateTime | NOT NULL |
| @@unique([fieldId, entityId]) | | |

---

## Context 3: Sales

### Pipeline
**Prisma model:** `Pipeline`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, @@unique([orgId, name]) | |
| isDefault | Boolean | NOT NULL, DEFAULT false | Only one default per org |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

**Business rules:**
- Each org has exactly one default pipeline. Setting a new default clears the old one.
- Deleting a pipeline with active Opportunities is blocked.

---

### Stage
**Prisma model:** `Stage`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| pipelineId | UUID | NOT NULL, FK → Pipeline | |
| name | String | NOT NULL, @@unique([pipelineId, name]) | |
| probability | Int | NOT NULL, 0–100 | Default win probability % |
| order | Int | NOT NULL | Display order (1-based) |
| stageType | StageType | NOT NULL | OPEN \| WON \| LOST |
| createdAt | DateTime | NOT NULL | |

**Business rules:**
- Each pipeline has exactly one WON stage and one LOST stage.
- Stages of type WON/LOST cannot be reordered (they are always terminal).

---

### Lead
**Prisma model:** `Lead`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| firstName | String | NOT NULL | |
| lastName | String | NOT NULL | |
| email | String? | nullable | |
| phone | String? | nullable | |
| company | String? | nullable | Company name (not linked until converted) |
| source | String? | nullable | web, referral, cold-call, etc. |
| status | LeadStatus | NOT NULL | NEW \| CONTACTED \| QUALIFIED \| UNQUALIFIED \| CONVERTED |
| score | Int | NOT NULL, DEFAULT 0 | 0–100 scoring model |
| ownerId | UUID? | nullable, FK → User | |
| convertedAt | DateTime? | nullable | Set on conversion |
| convertedContactId | UUID? | nullable, FK → Contact | Created on conversion |
| convertedOpportunityId | UUID? | nullable, FK → Opportunity | Optional on conversion |
| notes | String? | nullable | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

**Business rules:**
- Conversion is one-way: `status = CONVERTED` is final.
- On conversion: a Contact is created (required) and an Opportunity may optionally be created.

---

### Opportunity
**Prisma model:** `Opportunity`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, max 200 | |
| amount | BigInt? | nullable | In smallest currency unit (cents) |
| currency | String | NOT NULL, DEFAULT 'USD' | ISO 4217 |
| closeDate | DateTime | NOT NULL | Required for forecasting |
| stageId | UUID | NOT NULL, FK → Stage | Current stage |
| pipelineId | UUID | NOT NULL, FK → Pipeline | |
| contactId | UUID? | nullable, FK → Contact | Primary contact |
| accountId | UUID? | nullable, FK → Account | |
| ownerId | UUID? | nullable, FK → User | |
| probability | Int | NOT NULL, 0–100 | Overridable; defaults from Stage |
| status | OpportunityStatus | NOT NULL | OPEN \| WON \| LOST |
| lostReason | String? | nullable | Required when status = LOST |
| wonAt | DateTime? | nullable | |
| lostAt | DateTime? | nullable | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

**Business rules:**
- Moving to a WON/LOST stage sets `status` accordingly and requires `wonAt`/`lostAt` timestamp.
- `lostReason` is required when marking LOST.
- All stage transitions are recorded in StageHistory.

---

### StageHistory
**Prisma model:** `StageHistory`  
Immutable record of every Opportunity stage transition.  

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK |
| opportunityId | UUID | FK → Opportunity |
| fromStageId | UUID? | nullable FK → Stage |
| toStageId | UUID | FK → Stage |
| changedById | UUID | FK → User |
| changedAt | DateTime | NOT NULL, DEFAULT now() |

---

## Context 4: Activity

### Activity
**Prisma model:** `Activity`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| type | ActivityType | NOT NULL | CALL \| MEETING \| EMAIL_LOG \| NOTE \| TASK_COMPLETED |
| subject | String | NOT NULL, max 200 | |
| body | String? | nullable | Notes, call summary, etc. |
| dueAt | DateTime? | nullable | For scheduled activities |
| completedAt | DateTime? | nullable | |
| duration | Int? | nullable | Minutes (for calls/meetings) |
| outcome | String? | nullable | Required for CALL type on completion |
| contactId | UUID? | nullable, FK → Contact | |
| accountId | UUID? | nullable, FK → Account | |
| leadId | UUID? | nullable, FK → Lead | |
| opportunityId | UUID? | nullable, FK → Opportunity | |
| userId | UUID | NOT NULL, FK → User | Who logged / is responsible |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

**Business rules:**
- Must reference at least one of: contactId, accountId, leadId, opportunityId (DB check constraint).
- EMAIL_LOG activities are created by the Communication context — they are not created directly by users.

---

### Task
**Prisma model:** `Task`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| title | String | NOT NULL, max 200 | |
| description | String? | nullable | |
| dueAt | DateTime? | nullable | |
| priority | TaskPriority | NOT NULL, DEFAULT MEDIUM | LOW \| MEDIUM \| HIGH \| URGENT |
| status | TaskStatus | NOT NULL, DEFAULT OPEN | OPEN \| IN_PROGRESS \| COMPLETED \| CANCELLED |
| assigneeId | UUID | NOT NULL, FK → User | Must be in same org |
| contactId | UUID? | nullable, FK → Contact | |
| accountId | UUID? | nullable, FK → Account | |
| leadId | UUID? | nullable, FK → Lead | |
| opportunityId | UUID? | nullable, FK → Opportunity | |
| completedAt | DateTime? | nullable | |
| createdById | UUID | NOT NULL, FK → User | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

## Context 5: Communication

### EmailThread
**Prisma model:** `EmailThread`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| subject | String | NOT NULL | |
| contactId | UUID? | nullable, FK → Contact | |
| opportunityId | UUID? | nullable, FK → Opportunity | |
| lastMessageAt | DateTime | NOT NULL | Denormalized for sorting |
| messageCount | Int | NOT NULL, DEFAULT 0 | Denormalized |
| createdAt | DateTime | NOT NULL | |

---

### EmailMessage
**Prisma model:** `EmailMessage`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| threadId | UUID | NOT NULL, FK → EmailThread | |
| messageId | String | UNIQUE, NOT NULL | SMTP Message-ID header |
| direction | EmailDirection | NOT NULL | SENT \| RECEIVED |
| fromAddress | String | NOT NULL | |
| toAddresses | String[] | NOT NULL | |
| ccAddresses | String[] | NOT NULL, DEFAULT [] | |
| bodyHtml | String? | nullable | |
| bodyText | String | NOT NULL | |
| sentAt | DateTime | NOT NULL | |
| openedAt | DateTime? | nullable | First open timestamp |
| clickedAt | DateTime? | nullable | First click timestamp |
| bouncedAt | DateTime? | nullable | |
| createdAt | DateTime | NOT NULL | |

---

### EmailTemplate
**Prisma model:** `EmailTemplate`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, @@unique([orgId, name]) | |
| subject | String | NOT NULL | May contain {{variables}} |
| bodyHtml | String | NOT NULL | |
| bodyText | String | NOT NULL | |
| createdById | UUID | NOT NULL, FK → User | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

## Context 6: Analytics

### SavedReport
**Prisma model:** `SavedReport`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, max 200 | |
| type | ReportType | NOT NULL | PIPELINE \| ACTIVITY \| LEAD \| REVENUE \| CONTACT_GROWTH |
| filters | JSON | NOT NULL, DEFAULT {} | Date range, owners, stages, etc. |
| isShared | Boolean | NOT NULL, DEFAULT false | true = visible to all org members |
| createdById | UUID | NOT NULL, FK → User | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

### Dashboard
**Prisma model:** `Dashboard`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL, max 200 | |
| isDefault | Boolean | NOT NULL, DEFAULT false | One default per user |
| widgets | JSON | NOT NULL, DEFAULT [] | [{type, reportId, position, size}] |
| createdById | UUID | NOT NULL, FK → User | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

## Context 7: Platform

### Integration
**Prisma model:** `Integration`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| type | IntegrationType | NOT NULL | SMTP \| IMAP \| GOOGLE_WORKSPACE \| SLACK \| ZAPIER |
| config | JSON | NOT NULL | Encrypted at rest |
| isEnabled | Boolean | NOT NULL, DEFAULT false | |
| lastSyncAt | DateTime? | nullable | |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

### Webhook
**Prisma model:** `Webhook`  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| url | String | NOT NULL | Target endpoint |
| events | String[] | NOT NULL | e.g. ['opportunity.won', 'contact.created'] |
| secret | String | NOT NULL | HMAC signing secret (stored hashed) |
| isEnabled | Boolean | NOT NULL, DEFAULT true | |
| failureCount | Int | NOT NULL, DEFAULT 0 | Consecutive delivery failures |
| disabledAt | DateTime? | nullable | Auto-disabled at 5 consecutive failures |
| createdAt | DateTime | NOT NULL | |
| updatedAt | DateTime | NOT NULL | |

---

### ApiKey
**Prisma model:** `ApiKey`  
**Aggregate root:** Yes  

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | String | NOT NULL | Human-readable label |
| keyHash | String | UNIQUE, NOT NULL | SHA-256 of raw key |
| keyPrefix | String | NOT NULL | First 8 chars for display |
| scopes | String[] | NOT NULL | e.g. ['contacts:read', 'opportunities:write'] |
| expiresAt | DateTime? | nullable | null = never expires |
| lastUsedAt | DateTime? | nullable | |
| revokedAt | DateTime? | nullable | |
| createdById | UUID | NOT NULL, FK → User | |
| createdAt | DateTime | NOT NULL | |

---

## Enum Reference

```typescript
enum OrganizationStatus { ACTIVE, SUSPENDED, PENDING_DELETION }
enum Role { SUPER_ADMIN, ADMIN, SALES_MANAGER, SALES_REP, READ_ONLY }
enum LeadStatus { NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED }
enum OpportunityStatus { OPEN, WON, LOST }
enum StageType { OPEN, WON, LOST }
enum ActivityType { CALL, MEETING, EMAIL_LOG, NOTE, TASK_COMPLETED }
enum TaskPriority { LOW, MEDIUM, HIGH, URGENT }
enum TaskStatus { OPEN, IN_PROGRESS, COMPLETED, CANCELLED }
enum EmailDirection { SENT, RECEIVED }
enum ReportType { PIPELINE, ACTIVITY, LEAD, REVENUE, CONTACT_GROWTH }
enum IntegrationType { SMTP, IMAP, GOOGLE_WORKSPACE, SLACK, ZAPIER }
```
