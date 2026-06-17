# OpsNext CRM — Domain Events Catalog
## Phase 2: Domain Modeling

**Document ID:** DM-005  
**Version:** 1.0  
**Date:** 2026-06-16  
**Status:** Approved — Implementation Anchor  
**Input documents:** DM-001, DM-002, DM-004

---

## Overview

Domain events are facts about things that happened in the domain. They are named in the past tense, carry the minimal payload needed for consumers, and are immutable once emitted.

**Event naming convention:** `<aggregate>.<past_tense_verb>` (lowercase, dot-separated)  
**Payload pattern:** Always includes `organizationId`, event timestamp, and the aggregate root ID.

**Delivery mechanism (Phase 1):** In-process event bus (`EventEmitter2` via NestJS CQRS module) with synchronous listeners. Redis Streams for cross-service async delivery (Phase 2+).

**Phase 1 scope:** Events marked **[P1]** are required for Module 1 launch. Events marked **[P2+]** are deferred until their owning module is implemented.

---

## Event Catalog

### Context: Identity & Access

---

#### `user.registered` [P1]
**Trigger:** `AuthService.register()` completes successfully  
**Emitter:** AuthService  

```typescript
interface UserRegisteredEvent {
  organizationId: string;
  userId: string;
  email: string;
  role: Role;
  organizationName: string;
  occurredAt: Date;
}
```

**Consumers:**
- `MailService` → sends welcome email with onboarding guide link
- `AuditService` → writes `USER_REGISTERED` audit log entry

---

#### `user.invited` [P1]
**Trigger:** `UsersService.invite()` creates a UserInvite  
**Emitter:** UsersService  

```typescript
interface UserInvitedEvent {
  organizationId: string;
  inviteId: string;
  email: string;
  role: Role;
  invitedById: string;
  expiresAt: Date;
  occurredAt: Date;
}
```

**Consumers:**
- `MailService` → sends invitation email with accept link
- `AuditService` → writes `USER_INVITED` audit log entry

---

#### `user.invite_accepted` [P1]
**Trigger:** `UsersService.acceptInvite()` creates a User  
**Emitter:** UsersService  

```typescript
interface UserInviteAcceptedEvent {
  organizationId: string;
  userId: string;
  email: string;
  role: Role;
  occurredAt: Date;
}
```

**Consumers:**
- `MailService` → sends welcome email
- `AuditService` → writes `USER_INVITE_ACCEPTED` audit log

---

#### `user.deactivated` [P1]
**Trigger:** `UsersService.deactivate()` sets `isActive = false`  
**Emitter:** UsersService  

```typescript
interface UserDeactivatedEvent {
  organizationId: string;
  userId: string;
  deactivatedById: string;
  occurredAt: Date;
}
```

**Consumers:**
- `AuthService` → revokes all RefreshTokens for userId
- `AuditService` → writes `USER_DEACTIVATED` audit log
- **[P2+]** `SalesService` → re-assigns open Leads/Opportunities to null or to manager

---

#### `user.reactivated` [P1]
**Trigger:** `UsersService.reactivate()` sets `isActive = true`  

```typescript
interface UserReactivatedEvent {
  organizationId: string;
  userId: string;
  reactivatedById: string;
  occurredAt: Date;
}
```

**Consumers:**
- `AuditService` → writes `USER_REACTIVATED` audit log

---

#### `user.role_changed` [P1]
**Trigger:** `UsersService.updateRole()` completes  
**Emitter:** UsersService  

```typescript
interface UserRoleChangedEvent {
  organizationId: string;
  userId: string;
  fromRole: Role;
  toRole: Role;
  changedById: string;
  occurredAt: Date;
}
```

**Consumers:**
- `AuditService` → writes `USER_ROLE_UPDATED` audit log
- **[P2+]** `CacheService` → invalidates permission cache entry for userId (TTL ≤ 30s)

---

#### `user.password_reset_requested` [P1]
**Trigger:** `AuthService.requestPasswordReset()` creates a PasswordReset record  

```typescript
interface PasswordResetRequestedEvent {
  organizationId: string;
  userId: string;
  email: string;
  resetUrl: string;
  occurredAt: Date;
}
```

**Consumers:**
- `MailService` → sends password reset email

---

#### `user.password_reset` [P1]
**Trigger:** `AuthService.resetPassword()` completes  

```typescript
interface PasswordResetEvent {
  organizationId: string;
  userId: string;
  occurredAt: Date;
}
```

**Consumers:**
- `AuthService` → revokes all RefreshTokens (sessions invalidated)
- `AuditService` → writes `USER_PASSWORD_RESET` audit log

---

#### `user.password_changed` [P1]
**Trigger:** `UsersService.changePassword()` completes  

```typescript
interface PasswordChangedEvent {
  organizationId: string;
  userId: string;
  occurredAt: Date;
}
```

**Consumers:**
- `AuthService` → revokes all RefreshTokens
- `AuditService` → writes `USER_PASSWORD_CHANGED` audit log

---

#### `user.login_failed` [P1]
**Trigger:** `AuthService.login()` throws UnauthorizedException  

```typescript
interface UserLoginFailedEvent {
  organizationId: string | null; // null if user not found
  email: string;
  failureReason: 'INVALID_CREDENTIALS' | 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_LOCKED';
  ipAddress: string | null;
  occurredAt: Date;
}
```

**Consumers:**
- `AuditService` → writes `USER_LOGIN_FAILED` audit log
- **[P2+]** `LockoutService` → increments failure counter, applies lockout if threshold reached

---

#### `user.login_succeeded` [P1]
**Trigger:** `AuthService.login()` returns successfully  

```typescript
interface UserLoginSucceededEvent {
  organizationId: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: Date;
}
```

**Consumers:**
- `AuditService` → writes `USER_LOGIN_SUCCEEDED` audit log
- Resets `failedLoginCount` (done inline in AuthService, no separate listener needed for P1)

---

#### `org.suspended` [P1]
**Trigger:** `OrganizationsService.suspend()` sets `status = SUSPENDED`  

```typescript
interface OrgSuspendedEvent {
  organizationId: string;
  suspendedById: string; // SUPER_ADMIN actor
  occurredAt: Date;
}
```

**Consumers:**
- `AuditService` → writes `ORG_SUSPENDED` audit log
- **[P2+]** `NotificationService` → notifies org ADMIN users via email

---

#### `org.deletion_scheduled` [P1]
**Trigger:** `OrganizationsService.scheduleDelete()` sets `deletionScheduledAt`  

```typescript
interface OrgDeletionScheduledEvent {
  organizationId: string;
  scheduledDeletionAt: Date;
  scheduledById: string;
  occurredAt: Date;
}
```

**Consumers:**
- `AuditService` → writes `ORG_DELETION_SCHEDULED` audit log
- **[P2+]** `NotificationService` → sends data export reminder to org ADMINs

---

### Context: Contact Management [P2+]

---

#### `contact.created` [P2+]
```typescript
interface ContactCreatedEvent {
  organizationId: string;
  contactId: string;
  email: string | null;
  ownerId: string | null;
  source: string | null;
  createdById: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (increment contact count)

---

#### `contact.updated` [P2+]
```typescript
interface ContactUpdatedEvent {
  organizationId: string;
  contactId: string;
  changedFields: string[];
  changedById: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService

---

#### `contact.deleted` [P2+]
```typescript
interface ContactDeletedEvent {
  organizationId: string;
  contactId: string;
  deletedById: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Activity (null-out contactId refs), Communication (null-out contactId refs)

---

#### `contact.merged` [P2+]
```typescript
interface ContactMergedEvent {
  organizationId: string;
  survivorContactId: string;
  tombstonedContactId: string;
  mergedById: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Sales (update Opportunity.contactId from tombstoned → survivor), Activity (same), Communication (same)

---

#### `account.created` / `account.updated` / `account.deleted` [P2+]
Similar structure to Contact events. Consumers: AuditService, Analytics.

---

### Context: Sales [P2+]

---

#### `lead.created` [P2+]
```typescript
interface LeadCreatedEvent {
  organizationId: string;
  leadId: string;
  email: string | null;
  source: string | null;
  ownerId: string | null;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (lead funnel counter)

---

#### `lead.converted` [P2+]
```typescript
interface LeadConvertedEvent {
  organizationId: string;
  leadId: string;
  convertedContactId: string;
  convertedOpportunityId: string | null;
  convertedById: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (conversion rate calculation)

---

#### `opportunity.created` [P2+]
```typescript
interface OpportunityCreatedEvent {
  organizationId: string;
  opportunityId: string;
  pipelineId: string;
  stageId: string;
  amount: number | null;
  ownerId: string | null;
  closeDate: Date;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (pipeline value counter)

---

#### `opportunity.stage_changed` [P2+]
```typescript
interface OpportunityStageChangedEvent {
  organizationId: string;
  opportunityId: string;
  fromStageId: string | null;
  toStageId: string;
  changedById: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (stage velocity calculation), Forecast recalculation

---

#### `opportunity.won` [P2+]
```typescript
interface OpportunityWonEvent {
  organizationId: string;
  opportunityId: string;
  amount: number | null;
  currency: string;
  ownerId: string | null;
  wonAt: Date;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (won revenue, win rate), Notifications (congrats to owner + manager)

---

#### `opportunity.lost` [P2+]
```typescript
interface OpportunityLostEvent {
  organizationId: string;
  opportunityId: string;
  lostReason: string;
  amount: number | null;
  ownerId: string | null;
  lostAt: Date;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (lost reason distribution, loss rate)

---

### Context: Activity [P2+]

---

#### `activity.logged` [P2+]
```typescript
interface ActivityLoggedEvent {
  organizationId: string;
  activityId: string;
  type: ActivityType;
  userId: string;
  contactId?: string;
  opportunityId?: string;
  occurredAt: Date;
}
```
**Consumers:** AuditService, Analytics (activity volume per rep/type)

---

#### `task.overdue` [P2+]
```typescript
interface TaskOverdueEvent {
  organizationId: string;
  taskId: string;
  assigneeId: string;
  dueAt: Date;
  occurredAt: Date;
}
```
**Consumers:** NotificationService (email/in-app alert to assignee), AuditService

---

### Context: Communication [P2+]

---

#### `email.sent` [P2+]
```typescript
interface EmailSentEvent {
  organizationId: string;
  messageId: string;
  threadId: string;
  toAddress: string;
  contactId: string | null;
  opportunityId: string | null;
  sentById: string;
  occurredAt: Date;
}
```
**Consumers:** Activity (creates EMAIL_LOG activity)

---

#### `email.received` [P2+]
```typescript
interface EmailReceivedEvent {
  organizationId: string;
  messageId: string;
  threadId: string;
  fromAddress: string;
  contactId: string | null;
  occurredAt: Date;
}
```
**Consumers:** Activity (creates EMAIL_LOG activity), Notifications (if unread threshold)

---

#### `email.opened` / `email.clicked` [P2+]
```typescript
interface EmailEngagementEvent {
  organizationId: string;
  messageId: string;
  contactId: string | null;
  occurredAt: Date;
}
```
**Consumers:** Analytics (email engagement rates), Scoring (lead score update on email open)

---

## Event Bus Architecture

### Phase 1: In-Process (NestJS EventEmitter2)

```typescript
// Emit pattern (inside any service):
this.eventEmitter.emit('user.deactivated', {
  organizationId,
  userId,
  deactivatedById: actorId,
  occurredAt: new Date(),
} satisfies UserDeactivatedEvent);

// Handler pattern:
@OnEvent('user.deactivated')
async handleUserDeactivated(event: UserDeactivatedEvent) {
  await this.prisma.refreshToken.deleteMany({
    where: { userId: event.userId, revokedAt: null },
    data: { revokedAt: event.occurredAt },
  });
}
```

Events are synchronous in Phase 1. If a listener throws, the original transaction is not rolled back (listeners run after the transaction commits). Errors in listeners are caught and logged to stderr — they do not propagate to the API caller.

### Phase 2: Redis Streams (cross-service)

When the monolith is split into microservices, events transition to Redis Streams:
- Producer: NestJS service writes to `opsnext:{eventName}` stream
- Consumer groups per service: one consumer group per subscriber
- Message format: JSON with `eventId` (UUID), `occurredAt`, `organizationId`, and payload
- At-least-once delivery; consumers must be idempotent

---

## Event Sourcing Readiness

The domain event catalog above is designed to be compatible with an event-sourcing migration in Year 2. Key design choices that support this:
1. Events carry the full payload needed to reconstruct state — no "diff only" events.
2. Events include `occurredAt` (event time, not system time).
3. `AuditLog` is append-only and directly mirrors the event stream for IAM events.
4. Aggregate roots are identified and their invariants are documented — these become stream partition keys.

The current implementation (NestJS EventEmitter2 + audit log) is the read model; the event log is the audit table. In Year 2, this flips: the event stream becomes the source of truth and the relational tables become read-model projections.
