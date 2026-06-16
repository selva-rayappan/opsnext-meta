# OpsNext CRM — Entity Relationships
## Phase 2: Domain Modeling

**Document ID:** DM-003  
**Version:** 1.0  
**Date:** 2026-06-16  
**Status:** Approved — Implementation Anchor  
**Input documents:** DM-001, DM-002

---

## Overview

This document defines all relationships between entities: cardinality, direction of ownership, cascade rules, and cross-context reference patterns.

**Notation:**
- `1` = exactly one
- `0..1` = zero or one (optional FK)
- `1..*` = one or more
- `*` = zero or more
- `→` = FK direction (child points to parent)
- `↔` = join table (many-to-many)

---

## Relationship Map by Context

### Context 1: Identity & Access

```
Organization (1) ──────────────────── (*) User
    │                                       │
    │                                    (0..*) TeamMember ──── Team (1)
    │                                       │
    │                               (0..*) UserInvite
    │                               (0..*) RefreshToken
    │                               (0..*) PasswordReset
    │
    └──── (0..*) AuditLog (immutable)
```

| Relationship | Cardinality | Cascade | Notes |
|---|---|---|---|
| Organization → User | 1:* | Restrict delete | Org cannot be deleted while active users exist |
| Organization → Team | 1:* | Cascade delete | Teams deleted with org |
| User ↔ Team | *:* via TeamMember | Cascade delete | Membership records deleted with user or team |
| User → UserInvite (invitedBy) | 1:* | Set null | Invites persist if inviter is deleted |
| Organization → UserInvite | 1:* | Cascade delete | |
| User → RefreshToken | 1:* | Cascade delete | All tokens gone when user deleted |
| User → PasswordReset | 1:* | Cascade delete | |
| Organization → AuditLog | 1:* | Retain | Audit logs are never deleted |

---

### Context 2: Contact Management

```
Contact (0..*) ──── (0..1) User [owner]

Account (0..*) ──── (0..1) User [owner]

Contact (*) ──────── (*) Account
         via ContactAccountLink
                (1 isPrimary per Contact)

Contact ──── (*) ContactTag ──── (*) Tag
Account ──── (*) AccountTag ──── (*) Tag

Contact (*) ─────── CustomFieldValue (*) ──── CustomField (1)
Account (*) ─────── CustomFieldValue (*) ──── CustomField (1)
```

| Relationship | Cardinality | Cascade | Notes |
|---|---|---|---|
| User → Contact (owner) | 1:* | Set null | Contact becomes unowned if owner deleted |
| User → Account (owner) | 1:* | Set null | |
| Contact ↔ Account | *:* via ContactAccountLink | Cascade delete | Link removed if either entity deleted |
| Contact ↔ Tag | *:* via ContactTag | Cascade delete | |
| Account ↔ Tag | *:* via AccountTag | Cascade delete | |
| CustomField → CustomFieldValue | 1:* | Cascade delete | Values removed when field deleted |
| Contact → Contact (mergedInto) | Self-referential | Restrict | Merged contacts form a chain |

**Cross-context references (read-only from outside):**
- Sales.Lead → Contact (via `convertedContactId`) — after conversion only
- Sales.Opportunity → Contact (`contactId`) — optional FK, no cascade
- Sales.Opportunity → Account (`accountId`) — optional FK, no cascade
- Activity.Activity → Contact, Account — optional FKs
- Communication.EmailThread → Contact — optional FK

---

### Context 3: Sales

```
Pipeline (1) ──── (1..*) Stage
    │
    └────── (*) Opportunity
                  │
                  ├──── (1) Stage [current]
                  ├──── (0..1) Contact [primary]
                  ├──── (0..1) Account
                  ├──── (0..1) User [owner]
                  └──── (*) StageHistory

Lead (0..1) ──── User [owner]
Lead (0..1) ──── Contact [convertedContactId, post-conversion]
Lead (0..1) ──── Opportunity [convertedOpportunityId, post-conversion]
```

| Relationship | Cardinality | Cascade | Notes |
|---|---|---|---|
| Pipeline → Stage | 1:* | Cascade delete | Cannot delete pipeline with active opps |
| Pipeline → Opportunity | 1:* | Restrict | Pipeline cannot be deleted with open opps |
| Stage → Opportunity (current) | 1:* | Restrict | Stage cannot be deleted while used |
| Opportunity → StageHistory | 1:* | Cascade delete | History deleted with opportunity |
| User → Opportunity (owner) | 1:* | Set null | |
| User → Lead (owner) | 1:* | Set null | |

---

### Context 4: Activity

```
Activity (0..*) ──── Contact (0..1)
         │  ──── Account (0..1)
         │  ──── Lead (0..1)
         │  ──── Opportunity (0..1)
         └──── User [logged by] (1)

Task (0..*) ──── User [assignee] (1)
     │  ──── Contact (0..1)
     │  ──── Account (0..1)
     │  ──── Lead (0..1)
     └──── Opportunity (0..1)
```

**Constraint:** Activity must link to at least one CRM record (enforced in application layer).

| Relationship | Cardinality | Cascade | Notes |
|---|---|---|---|
| Contact → Activity | 1:* | Set null | Activity persists if contact deleted |
| Opportunity → Activity | 1:* | Cascade delete | Opps own their activity timeline |
| User → Activity (userId) | 1:* | Set null | |
| User → Task (assignee) | 1:* | Reassign or set null | |
| Opportunity → Task | 1:* | Cascade delete | |

---

### Context 5: Communication

```
EmailThread (0..*) ──── Contact (0..1)
            │  ──── Opportunity (0..1)
            └──── (1..*) EmailMessage
```

| Relationship | Cardinality | Cascade | Notes |
|---|---|---|---|
| EmailThread → EmailMessage | 1:* | Cascade delete | |
| Contact → EmailThread | 1:* | Set null | |
| Opportunity → EmailThread | 1:* | Set null | |

---

### Context 6: Analytics (read-only)

Analytics entities reference User as creator but do not own CRM domain records.

```
User → SavedReport (createdBy)
User → Dashboard (createdBy)
```

---

### Context 7: Platform

```
Organization → Integration (1:*)
Organization → Webhook (1:*)
Organization → ApiKey (1:*)
User → ApiKey (createdBy, 1:*)
```

---

## Cross-Context Relationship Rules

The following rules govern how cross-context references work. These are architectural constraints, not just documentation.

### Rule 1: Reference by ID only
A bounded context stores the ID of an entity from another context. It never joins to another context's tables. If it needs data from another context, it uses the API (sync) or event projections (async).

### Rule 2: No cascade across context boundaries
If a Contact is deleted in the Contact Management context:
- The Contact's ID is set to null on Activity.contactId, Task.contactId, etc. (no cascade delete across contexts).
- The receiving contexts receive a `ContactDeleted` domain event and decide independently how to handle orphaned references.

### Rule 3: SUPER_ADMIN organization scoping exception
`SUPER_ADMIN` users have `organizationId = NULL`. They are excluded from all tenant-scoped queries and are never returned in per-org user lists. All cross-context references from SUPER_ADMIN records use explicit `orgId` parameters rather than context-derived values.

### Rule 4: Soft delete propagation
When a Contact, Account, Lead, or Opportunity is soft-deleted (`isActive = false`):
- Existing links to other entities are retained (for historical accuracy).
- API queries exclude soft-deleted records from default list results (unless `?includeInactive=true` is passed by ADMIN).
- Hard deletes cascade within the owning context only.

---

## ERD Summary (Prisma notation)

```prisma
// Key relationships only — see full schema for complete definitions

Organization {
  users User[]
  teams Team[]
  auditLogs AuditLog[]
  contacts Contact[]
  accounts Account[]
  pipelines Pipeline[]
  leads Lead[]
  opportunities Opportunity[]
  activities Activity[]
  tasks Task[]
  emailThreads EmailThread[]
  integrations Integration[]
  webhooks Webhook[]
  apiKeys ApiKey[]
}

User {
  organization Organization @relation(fields: [organizationId])
  teams TeamMember[]
  ownedContacts Contact[] @relation("ContactOwner")
  ownedOpportunities Opportunity[] @relation("OpportunityOwner")
  assignedTasks Task[] @relation("TaskAssignee")
  activities Activity[]
  refreshTokens RefreshToken[]
}

Contact {
  organization Organization @relation(...)
  owner User? @relation("ContactOwner")
  accounts ContactAccountLink[]
  tags ContactTag[]
  customFieldValues CustomFieldValue[]
  activities Activity[]
  opportunities Opportunity[]
  emailThreads EmailThread[]
  mergedInto Contact? @relation("ContactMerge")
}

Opportunity {
  organization Organization @relation(...)
  pipeline Pipeline @relation(...)
  stage Stage @relation(...)
  contact Contact? @relation(...)
  account Account? @relation(...)
  owner User? @relation("OpportunityOwner")
  stageHistory StageHistory[]
  activities Activity[]
  tasks Task[]
  emailThreads EmailThread[]
}
```
