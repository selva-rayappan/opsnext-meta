# OpsNext CRM — Bounded Contexts
## Phase 2: Domain Modeling

**Document ID:** DM-001  
**Version:** 1.0  
**Date:** 2026-06-16  
**Status:** Approved — Implementation Anchor  
**Input documents:** FR-001, BRD-001, UP-001

---

## Overview

OpsNext CRM is partitioned into **7 bounded contexts**. Each context owns its data, its language, and its rules. Cross-context communication happens exclusively through domain events (async) or ACL translation layers (sync). No context reaches into another's database tables directly.

All contexts share one hard constraint: **every record carries `organizationId`** (row-level multi-tenancy). The Identity & Access context enforces this constraint; all other contexts rely on it.

---

## Context Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OpsNext CRM Platform                           │
│                                                                          │
│  ┌─────────────────┐   events    ┌──────────────────────────────────┐   │
│  │  Identity &     │────────────▶│         Contact Management        │   │
│  │  Access (IAM)   │             │  Contact · Account · Tag          │   │
│  │                 │◀────────────│  CustomField · Merge              │   │
│  │  Org · User     │  auth check │                                    │   │
│  │  Team · Role    │             └──────────┬───────────────────────┘   │
│  │  Session · Invite│                        │ ContactCreated            │
│  └────────┬────────┘                        ▼                           │
│           │ UserRoleChanged      ┌──────────────────────────────────┐   │
│           │                      │           Sales                   │   │
│           │                      │  Lead · Opportunity · Stage       │   │
│           │                      │  Pipeline · Forecast              │   │
│           │                      │                                    │   │
│           │                      └──────────┬───────────────────────┘   │
│           │                                 │ OpportunityStageChanged    │
│           │                                 ▼                            │
│           │                      ┌──────────────────────────────────┐   │
│           │                      │           Activity                │   │
│           │                      │  Activity · Task                  │   │
│           │                      │  (Call / Meeting / Note / Email)  │   │
│           │                      └──────────┬───────────────────────┘   │
│           │                                 │ EmailLogged               │
│           │                                 ▼                            │
│           │                      ┌──────────────────────────────────┐   │
│           │                      │        Communication              │   │
│           │                      │  EmailThread · EmailMessage       │   │
│           │                      │  EmailTemplate · TrackingEvent    │   │
│           │                      └──────────┬───────────────────────┘   │
│           │                                 │                            │
│           │         ┌───────────────────────┘                           │
│           │         │                                                    │
│           │         ▼                                                    │
│           │  ┌──────────────────────────────────┐                       │
│           │  │         Analytics                 │                       │
│           │  │  SavedReport · Dashboard          │                       │
│           │  │  ExportJob · Metric               │                       │
│           │  └──────────────────────────────────┘                       │
│           │                                                               │
│           ▼                                                               │
│  ┌──────────────────────────────────┐                                    │
│  │           Platform               │                                    │
│  │  Integration · Webhook · ApiKey  │                                    │
│  │  Notification · OrgSettings      │                                    │
│  └──────────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Context Descriptions

### 1. Identity & Access (IAM)

**Ubiquitous Language:** Organization, User, Role, Team, Session, Invitation, Permission, Audit  
**Aggregate Roots:** Organization, User  
**Owns:** authentication, authorization, session lifecycle, user management, audit logging  
**Does NOT own:** the business objects that users interact with  

**Key invariants:**
- A User always belongs to exactly one Organization.
- A User has exactly one Role at all times (no composite roles).
- SUPER_ADMIN spans organizations; all other roles are org-scoped.
- Every mutation to an IAM aggregate writes an AuditLog entry atomically.

**Cross-context contracts:**
- Emits `UserDeactivated` → Sales, Activity, Communication must treat deactivated user's owned records as unassigned.
- Emits `UserRoleChanged` → Platform (permission cache) must be invalidated within 30 seconds.
- Exposes `UserPayload` JWT claim (`sub`, `orgId`, `role`, `email`) consumed by all other contexts for authorization.

---

### 2. Contact Management

**Ubiquitous Language:** Contact, Account (Company), Owner, Tag, CustomField, Merge, Import  
**Aggregate Roots:** Contact, Account  
**Owns:** person/company master data, custom fields, tagging, deduplication, bulk import  
**Does NOT own:** sales pipeline state, activities, email communication  

**Key invariants:**
- A Contact's email is unique within an Organization.
- An Account's domain is unique within an Organization (soft constraint — duplicates flagged, not blocked).
- Merging two Contacts produces one canonical Contact and tombstones the other (retains all linked records).
- Custom fields are defined at org level; values are stored per entity instance.

**Cross-context contracts:**
- Emits `ContactCreated`, `ContactMerged`, `ContactDeleted`.
- Sales reads Contact/Account via Contact ACL (read-only projection).
- Activity references ContactId (foreign key — no ownership).

---

### 3. Sales

**Ubiquitous Language:** Lead, Opportunity, Stage, Pipeline, Win, Loss, Forecast, Conversion  
**Aggregate Roots:** Lead, Opportunity, Pipeline  
**Owns:** lead lifecycle, opportunity lifecycle, stage definitions, win/loss recording, forecast data  
**Does NOT own:** contact master data, activity records, email history  

**Key invariants:**
- A Lead belongs to one Owner (Sales Rep or Manager).
- A Lead can be converted to an Opportunity; conversion is one-way and creates linked Contact + Account records in Contact Management.
- An Opportunity always sits in exactly one Stage of one Pipeline.
- Stage transitions are ordered and logged (StageHistory on Opportunity).
- `closeDate` is required for open Opportunities.
- `lostReason` is required when recording a loss.

**Cross-context contracts:**
- Emits `LeadConverted`, `OpportunityWon`, `OpportunityLost`, `OpportunityStageChanged`.
- Analytics reads denormalized pipeline snapshots (event-sourced projection).
- Activity receives `opportunityId` as a context reference (not ownership).

---

### 4. Activity

**Ubiquitous Language:** Activity, Task, Call, Meeting, Note, EmailLog, Due Date, Assignee, Completion  
**Aggregate Roots:** Activity, Task  
**Owns:** all logged interactions and to-do items linked to CRM records  
**Does NOT own:** email delivery or IMAP sync (that belongs to Communication)  

**Key invariants:**
- An Activity must be linked to at least one CRM record (Contact, Account, Lead, or Opportunity).
- A completed Activity has both `completedAt` timestamp and `outcome` summary.
- A Task has exactly one Assignee (a User in the same org).
- Activities of type `EMAIL_LOG` are created by Communication context when an email is sent/received.

**Cross-context contracts:**
- Emits `TaskOverdue` (scheduled job trigger).
- Emits `ActivityLogged` → Analytics increments activity counters.
- Communication emits `EmailSent`/`EmailReceived` → Activity creates `EMAIL_LOG` activity.

---

### 5. Communication

**Ubiquitous Language:** Thread, Message, Template, Tracking, Open, Click, Bounce, IMAP, SMTP  
**Aggregate Roots:** EmailThread, EmailTemplate  
**Owns:** email threads (sent + received), templates, delivery tracking, IMAP sync state  
**Does NOT own:** the Activity record it triggers (that belongs to Activity context)  

**Key invariants:**
- Every sent email is linked to a Contact (required) and optionally to an Opportunity.
- EmailMessage.messageId is globally unique (from SMTP Message-ID header).
- Tracking events (opens, clicks) are idempotent — duplicate webhook events are discarded.
- IMAP sync is append-only for received messages.

**Cross-context contracts:**
- Emits `EmailSent` → Activity creates `EMAIL_LOG` activity.
- Emits `EmailReceived` → Activity creates `EMAIL_LOG` activity.
- Emits `EmailOpened`, `EmailClicked` → Analytics updates engagement metrics.

---

### 6. Analytics

**Ubiquitous Language:** Report, Dashboard, Widget, Metric, Filter, Period, Export, Segment  
**Aggregate Roots:** SavedReport, Dashboard  
**Owns:** report definitions, dashboard layouts, export jobs, aggregated metrics  
**Does NOT own:** source data (reads cross-context event projections)  

**Key invariants:**
- Analytics is **read-only** — it never writes to other contexts.
- All metrics are computed from event projections (materialized in a read model, not live queries against source tables).
- Export jobs are async; results are stored in object storage with a time-limited signed URL.
- Saved Reports are scoped to the creating user or shared org-wide.

**Cross-context contracts:**
- Consumes events from all other contexts to maintain read-model projections.
- Exposes query API to Dashboard widgets.

---

### 7. Platform

**Ubiquitous Language:** Integration, Webhook, ApiKey, Notification, OrgSettings, Subscription  
**Aggregate Roots:** Integration, ApiKey  
**Owns:** third-party integrations, outbound webhooks, API key management, org configuration, notification delivery  
**Does NOT own:** any business domain data  

**Key invariants:**
- An ApiKey has scopes that map to specific resource/action permissions (e.g., `contacts:read`, `opportunities:write`).
- Webhooks have a signed secret; all deliveries include an HMAC-SHA256 signature header.
- Webhook delivery is at-least-once; consumer must be idempotent.
- OrgSettings are versioned — changes create a new version record (audit trail without AuditLog dependency).

**Cross-context contracts:**
- Consumes domain events from all contexts to trigger webhook deliveries.
- Emits `WebhookDeliveryFailed` for retry queue management.
- Platform reads IAM for API key authentication and scope checking.

---

## Context Boundaries — What Each Context Does NOT Do

| Context | Does NOT |
|---------|----------|
| IAM | Store business CRM data; make sales decisions |
| Contact Management | Track sales pipeline state; log activities |
| Sales | Store contact master data; send emails; own activity logs |
| Activity | Send emails; own contact/company master data |
| Communication | Own lead/opportunity records; create pipeline stages |
| Analytics | Mutate source data; own definitions of entities |
| Platform | Own any CRM domain data; make business logic decisions |

---

## Shared Kernel

These types are shared across all contexts and must remain stable:

```typescript
// shared kernel types — packages/shared/src/types/
type OrganizationId = string; // UUID
type UserId = string;         // UUID
type EntityId = string;       // UUID

enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SALES_MANAGER = 'SALES_MANAGER',
  SALES_REP = 'SALES_REP',
  READ_ONLY = 'READ_ONLY',
}

interface UserPayload {
  sub: UserId;
  orgId: OrganizationId;
  role: Role;
  email: string;
}

enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_DELETION = 'PENDING_DELETION',
}
```

Changes to the shared kernel require a cross-context compatibility review before merging.
