# OpsNext CRM — Aggregate Roots & Invariants
## Phase 2: Domain Modeling

**Document ID:** DM-004  
**Version:** 1.0  
**Date:** 2026-06-16  
**Status:** Approved — Implementation Anchor  
**Input documents:** DM-001, DM-002, DM-003

---

## Overview

An **aggregate** is a cluster of domain objects treated as a single unit for data changes. The **aggregate root** is the only member accessible from outside the aggregate. All mutations enter through the root; invariants are enforced within the root's transaction boundary.

This document defines:
1. Each aggregate root and its boundary
2. Invariants the root must enforce
3. What operations are allowed from outside (via root only)
4. What objects live inside (accessed only via the root)
5. How the aggregate emits domain events

---

## Aggregate Catalog

### 1. Organization
**Context:** Identity & Access  
**Root entity:** `Organization`  

**Boundary members:**
- Organization (root)
- OrgSettings (embedded JSON on Organization)

**Invariants:**
- `slug` is immutable after creation.
- Exactly one Organization per `slug` globally.
- Transitioning to `PENDING_DELETION` requires no active subscriptions (Phase 2 check).
- `SUSPENDED` orgs block all logins; `ACTIVE` required for any data mutation.
- `deletionScheduledAt` must be set when `status = PENDING_DELETION` and vice versa.

**External access patterns:**
- `OrganizationsService.findBySlug(slug)` — read
- `OrganizationsService.suspend(id)` — mutation via root
- `OrganizationsService.scheduleDelete(id)` — mutation via root

**Events emitted:**
- `org.suspended` → Platform disables webhooks, notifies billing
- `org.deletion_scheduled` → Platform sends data export notice, sets cleanup job

---

### 2. User
**Context:** Identity & Access  
**Root entity:** `User`  

**Boundary members:**
- User (root)
- RefreshToken[] (owned by User, not externally addressable)
- PasswordReset[] (owned by User, not externally addressable)

**Invariants:**
- `email` is unique within `organizationId` (not globally).
- `passwordHash` is never returned in API responses.
- `role` can only be changed by an actor with a higher role level (enforced by `UsersService.updateRole`).
- `SUPER_ADMIN` role cannot be assigned via the public API.
- A deactivated User (`isActive = false`) has all RefreshTokens immediately revoked.
- Failed login count resets on first successful login.
- Account locks (`lockedUntil`) after 5 failed logins in 15 min.

**External access patterns:**
- `AuthService.login(email, password)` — entry point; validates and calls `issueTokens`
- `AuthService.refresh(token)` — rotates within User's token family
- `AuthService.logout(token)` — revokes token via User root
- `UsersService.deactivate(userId)` — mutates `isActive`, cascades RefreshToken revocation
- `UsersService.updateRole(userId, role, actorId)` — enforces role hierarchy

**Events emitted:**
- `user.registered` → Welcome email, audit log
- `user.invited` → Invitation email
- `user.deactivated` → Session revocation, audit log, downstream `UserDeactivated`
- `user.role_changed` → Permission cache invalidation (TTL ≤ 30s via Redis)
- `user.password_reset` → All sessions revoked

---

### 3. Contact
**Context:** Contact Management  
**Root entity:** `Contact`  

**Boundary members:**
- Contact (root)
- ContactAccountLink[] (linking — accessed via Contact)
- ContactTag[] (accessed via Contact)
- CustomFieldValue[] (accessed via Contact)

**Activities, Tasks, EmailThreads referencing a Contact are NOT part of this aggregate.** They are separate aggregates that reference the Contact by ID.

**Invariants:**
- `email` is unique within `organizationId` (nullable — Contacts without email are valid).
- Merging is one-way: a merged Contact (`mergedIntoId != null`) cannot itself be the target of another merge.
- A Contact cannot be hard-deleted while it is the primary contact on an open Opportunity.
- `isActive = false` (soft delete) is the default deletion mechanism.

**External access patterns:**
- `ContactsService.create(dto, orgId)`
- `ContactsService.merge(sourceId, targetId, orgId)` — tombstones source
- `ContactsService.delete(id, orgId)` — soft delete by default, hard delete requires confirmation

**Events emitted:**
- `contact.created`
- `contact.updated`
- `contact.deleted` (soft)
- `contact.merged` → downstream contexts nullify the tombstoned ID

---

### 4. Account
**Context:** Contact Management  
**Root entity:** `Account`  

**Boundary members:**
- Account (root)
- ContactAccountLink[] (linking records — accessed via Account)
- AccountTag[] (accessed via Account)
- CustomFieldValue[] (accessed via Account)

**Invariants:**
- An Account's `domain` (if provided) should be unique within the org (soft constraint — flagged, not blocked).
- Cannot be hard-deleted while it has open Opportunities.

**Events emitted:**
- `account.created`, `account.updated`, `account.deleted`

---

### 5. Lead
**Context:** Sales  
**Root entity:** `Lead`  

**Boundary members:**
- Lead (root)
- CustomFieldValue[] (via Lead)

**Invariants:**
- `status = CONVERTED` is a terminal state — no transitions out of CONVERTED.
- Conversion atomically creates a Contact (required) and optionally an Opportunity; both operations or neither.
- `score` must be 0–100.

**External access patterns:**
- `LeadsService.convert(leadId, dto, actorId, orgId)` — atomic conversion

**Events emitted:**
- `lead.created`, `lead.updated`, `lead.scored`
- `lead.converted` → triggers Contact creation in Contact Management context

---

### 6. Opportunity
**Context:** Sales  
**Root entity:** `Opportunity`  

**Boundary members:**
- Opportunity (root)
- StageHistory[] (immutable append-only log; accessed only via Opportunity)

**Note:** Activities, Tasks, EmailThreads that reference an Opportunity carry its ID but are NOT inside this aggregate. They own themselves.

**Invariants:**
- `closeDate` is always required (open Opportunities without a close date are invalid).
- Moving to a WON/LOST stage:
  - Sets `status = WON | LOST` and `wonAt | lostAt` timestamp.
  - `lostReason` is required for LOST.
  - This transition is terminal — WON/LOST Opportunities cannot be reopened without explicit admin override.
- Stage must belong to the Opportunity's Pipeline.
- `probability` overrides Stage default; must be 0–100.
- `amount` is in smallest currency unit (cents). Null is valid (amount TBD).

**External access patterns:**
- `OpportunitiesService.create(dto, actorId, orgId)`
- `OpportunitiesService.changeStage(id, stageId, actorId, orgId)` — records StageHistory
- `OpportunitiesService.markWon(id, dto, actorId, orgId)`
- `OpportunitiesService.markLost(id, dto, actorId, orgId)`

**Events emitted:**
- `opportunity.created`
- `opportunity.stage_changed` → Forecast recalculates
- `opportunity.won` → Commission calc, notification to owner and manager
- `opportunity.lost` → Loss reason analytics

---

### 7. Pipeline
**Context:** Sales  
**Root entity:** `Pipeline`  

**Boundary members:**
- Pipeline (root)
- Stage[] (owned by Pipeline; Stages cannot exist outside a Pipeline)

**Invariants:**
- Each Pipeline has exactly one Stage with `stageType = WON` and exactly one with `stageType = LOST`.
- `isDefault = true` on exactly one Pipeline per org (setting a new default clears the previous one atomically).
- A Stage cannot be deleted while any Opportunity references it as current stage.
- A Pipeline cannot be deleted while it has open (OPEN status) Opportunities.
- Stage `order` values are unique within a Pipeline.

**External access patterns:**
- `PipelinesService.create(dto, orgId)`
- `PipelinesService.addStage(pipelineId, dto, orgId)`
- `PipelinesService.reorderStages(pipelineId, orderedIds, orgId)`

**Events emitted:**
- `pipeline.created`, `pipeline.stage_added`, `pipeline.stage_removed`

---

### 8. Activity
**Context:** Activity  
**Root entity:** `Activity`  

**Boundary members:**
- Activity (root only — no child entities)

**Invariants:**
- Must reference at least one CRM record (Contact, Account, Lead, or Opportunity).
- `EMAIL_LOG` type activities are system-generated only (Communication context); user-created activities may not use this type directly.
- A completed Activity (`completedAt != null`) cannot be un-completed.
- CALL type activities require `outcome` when marked complete.

---

### 9. Task
**Context:** Activity  
**Root entity:** `Task`  

**Boundary members:**
- Task (root only)

**Invariants:**
- `assigneeId` must belong to the same `organizationId`.
- `COMPLETED` and `CANCELLED` are terminal statuses.
- A completed Task records `completedAt` timestamp.

**Events emitted:**
- `task.created`, `task.completed`, `task.overdue` (scheduled check)

---

### 10. EmailThread
**Context:** Communication  
**Root entity:** `EmailThread`  

**Boundary members:**
- EmailThread (root)
- EmailMessage[] (owned by thread)

**Invariants:**
- A Thread has at least one Message (created atomically with thread).
- `messageId` (SMTP header) is globally unique — duplicate messageId is silently discarded.
- `lastMessageAt` and `messageCount` are denormalized; updated on every message append.

---

### 11. EmailTemplate
**Context:** Communication  
**Root entity:** `EmailTemplate`  

**Boundary members:**
- EmailTemplate (root only)

**Invariants:**
- Template name unique within org.
- `bodyHtml` and `bodyText` are required (both formats must be provided).

---

### 12. ApiKey
**Context:** Platform  
**Root entity:** `ApiKey`  

**Boundary members:**
- ApiKey (root only)

**Invariants:**
- Raw key is shown exactly once at creation; only `keyHash` is stored.
- `keyPrefix` (first 8 chars) is stored for identification in UI.
- A revoked key (`revokedAt != null`) cannot be un-revoked.
- Scopes are a subset of the defined scope registry.

---

## Aggregate Design Principles Applied

### Principle 1: Small aggregates
Each aggregate root owns only the objects that cannot be in a consistent state without the root. `StageHistory` is inside `Opportunity` because a history record without its Opportunity makes no sense. But `Activity` is its own aggregate even when linked to an Opportunity — Activities have independent lifecycle.

### Principle 2: Reference by ID across aggregates
`Opportunity.contactId` stores a UUID, not a `Contact` object. If `ContactsService` needs the Contact name for an API response, it fetches it separately — or the query layer joins at read time without crossing domain boundaries.

### Principle 3: Transactional consistency boundary = aggregate
The invariants listed above are enforced within a single database transaction scoped to the aggregate. Multi-aggregate operations (e.g., Lead conversion that touches both Lead and Contact) use application-layer orchestration with compensating transactions on failure.

### Principle 4: Domain events are the integration contract
When a mutation inside one aggregate affects another aggregate's state, it happens via a domain event — never a direct method call into the other aggregate's service. This keeps bounded contexts decoupled.
