# OpsNext CRM — ERD & Database Schema Design
## Phase 3: Architecture Design

**Document ID:** ARCH-002  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Implementation Anchor  
**Input documents:** DM-002, DM-003, ARCH-001

---

## 1. Design Principles

1. **Every table carries `organizationId`** — enforced at application layer (TenantPrismaService) and database layer (RLS policies as defence-in-depth).
2. **UUIDs for all primary keys** — globally unique, safe to expose in URLs, avoids sequential ID enumeration.
3. **Soft deletes via `isActive`** — no hard deletes on core business records (Contacts, Accounts, Leads, Opportunities, Users) to preserve audit trail and FK integrity.
4. **Timestamps on all tables** — `createdAt` (immutable) and `updatedAt` (auto-updated via Prisma `@updatedAt`).
5. **Money as integer cents** — `amount BIGINT` to avoid floating point rounding errors in financial calculations.
6. **JSON for flexible fields** — `settings JSON` on Organization, `customFieldValues`, widget layouts, filter configs.
7. **Immutable audit log** — `AuditLog` has no `UPDATE` or `DELETE` grants in RLS (append-only).

---

## 2. Naming Conventions

| Object | Convention | Example |
|---|---|---|
| Tables | PascalCase (Prisma default → snake_case in PostgreSQL) | `Organization`, maps to `"Organization"` |
| Columns | camelCase in Prisma, snake_case in DB | `organizationId` → `organization_id` |
| Foreign keys | `<entityName>Id` | `organizationId`, `stageId` |
| Indexes | `<table>_<col>_idx` | `User_organizationId_idx` |
| Enums | PascalCase in Prisma, SCREAMING_SNAKE in values | `Role.SALES_MANAGER` |
| Join tables | `<EntityA><EntityB>` alphabetical | `ContactTag`, `TeamMember` |

---

## 3. Full ERD (Prisma Schema Notation)

### IAM Context

```prisma
model Organization {
  id                   String             @id @default(uuid())
  name                 String
  slug                 String             @unique
  status               OrganizationStatus @default(ACTIVE)
  plan                 String             @default("starter")
  settings             Json               @default("{}")
  deletionScheduledAt  DateTime?

  users                User[]
  teams                Team[]
  userInvites          UserInvite[]
  auditLogs            AuditLog[]
  refreshTokens        RefreshToken[]
  // ... (all other org-scoped entities)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
}

model User {
  id               String    @id @default(uuid())
  organizationId   String
  email            String
  passwordHash     String
  firstName        String
  lastName         String
  role             Role
  isActive         Boolean   @default(true)
  title            String?
  phone            String?
  timezone         String    @default("UTC")
  avatarUrl        String?
  failedLoginCount Int       @default(0)
  lockedUntil      DateTime?
  lastLoginAt      DateTime?

  organization     Organization  @relation(fields: [organizationId], references: [id])
  refreshTokens    RefreshToken[]
  passwordResets   PasswordReset[]
  teamMemberships  TeamMember[]
  invitesSent      UserInvite[]   @relation("InvitedBy")
  auditLogs        AuditLog[]     @relation("AuditActor")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([organizationId, isActive])
  @@index([email])
}

model Team {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  description    String?
  createdById    String

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy      User         @relation(fields: [createdById], references: [id])
  members        TeamMember[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}

model TeamMember {
  teamId String
  userId String

  team   Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([teamId, userId])
}

model RefreshToken {
  id             String    @id @default(uuid())
  userId         String
  organizationId String
  tokenHash      String    @unique
  familyId       String
  expiresAt      DateTime
  revokedAt      DateTime?
  ipAddress      String?
  userAgent      String?

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([familyId])
  @@index([organizationId])
}

model UserInvite {
  id             String    @id @default(uuid())
  organizationId String
  email          String
  role           Role
  tokenHash      String    @unique
  invitedById    String
  expiresAt      DateTime
  acceptedAt     DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedBy      User         @relation("InvitedBy", fields: [invitedById], references: [id])

  createdAt DateTime @default(now())

  @@index([organizationId])
  @@index([tokenHash])
}

model PasswordReset {
  id             String    @id @default(uuid())
  userId         String
  organizationId String
  tokenHash      String    @unique
  expiresAt      DateTime
  usedAt         DateTime?

  user           User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([userId])
}

model AuditLog {
  id             String   @id @default(uuid())
  organizationId String
  actorId        String?
  action         String
  entityType     String
  entityId       String?
  before         Json?
  after          Json?
  ipAddress      String?
  userAgent      String?
  timestamp      DateTime @default(now())

  @@index([organizationId, timestamp])
  @@index([entityType, entityId])
  @@index([actorId])
}
```

### Contact Management Context (Phase 2 Implementation)

```prisma
model Contact {
  id             String   @id @default(uuid())
  organizationId String
  firstName      String
  lastName       String
  email          String?
  phone          String?
  title          String?
  source         String?
  ownerId        String?
  isActive       Boolean  @default(true)
  mergedIntoId   String?

  organization   Organization         @relation(...)
  owner          User?                @relation("ContactOwner", ...)
  accounts       ContactAccountLink[]
  tags           ContactTag[]
  customFields   CustomFieldValue[]   @relation("ContactCustomFields")
  activities     Activity[]
  opportunities  Opportunity[]
  emailThreads   EmailThread[]
  mergedInto     Contact?             @relation("ContactMerge", ...)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([organizationId, isActive])
  @@index([organizationId, ownerId])
  @@index([email])
}

model Account {
  id              String  @id @default(uuid())
  organizationId  String
  name            String
  domain          String?
  industry        String?
  employeeCount   Int?
  annualRevenue   BigInt?
  website         String?
  phone           String?
  billingAddress  Json?
  ownerId         String?
  isActive        Boolean @default(true)

  // relations omitted for brevity

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([organizationId, isActive])
}

model ContactAccountLink {
  id        String  @id @default(uuid())
  contactId String
  accountId String
  title     String?
  isPrimary Boolean @default(false)

  contact   Contact @relation(...)
  account   Account @relation(...)

  @@unique([contactId, accountId])
  @@index([accountId])
}

model Tag {
  id             String @id @default(uuid())
  organizationId String
  name           String
  color          String @default("#6B7280")

  contactTags    ContactTag[]
  accountTags    AccountTag[]

  createdAt DateTime @default(now())

  @@unique([organizationId, name])
}

model CustomField {
  id             String  @id @default(uuid())
  organizationId String
  entityType     String  // 'Contact' | 'Account' | 'Lead' | 'Opportunity'
  name           String
  fieldType      String  // 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
  isRequired     Boolean @default(false)
  options        Json?
  order          Int     @default(0)

  values         CustomFieldValue[]

  createdAt DateTime @default(now())

  @@unique([organizationId, entityType, name])
  @@index([organizationId, entityType])
}

model CustomFieldValue {
  id         String   @id @default(uuid())
  fieldId    String
  entityType String
  entityId   String
  value      Json

  field      CustomField @relation(...)

  updatedAt DateTime @updatedAt

  @@unique([fieldId, entityId])
  @@index([entityType, entityId])
}
```

### Sales Context (Phase 3 Implementation)

```prisma
model Pipeline {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  isDefault      Boolean  @default(false)

  stages         Stage[]
  opportunities  Opportunity[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}

model Stage {
  id             String    @id @default(uuid())
  organizationId String
  pipelineId     String
  name           String
  probability    Int       // 0-100
  order          Int
  stageType      StageType // OPEN | WON | LOST

  pipeline       Pipeline      @relation(...)
  opportunities  Opportunity[]
  stageHistory   StageHistory[]

  createdAt DateTime @default(now())

  @@unique([pipelineId, name])
  @@index([pipelineId])
}

model Lead {
  id                      String     @id @default(uuid())
  organizationId          String
  firstName               String
  lastName                String
  email                   String?
  phone                   String?
  company                 String?
  source                  String?
  status                  LeadStatus @default(NEW)
  score                   Int        @default(0)
  ownerId                 String?
  convertedAt             DateTime?
  convertedContactId      String?
  convertedOpportunityId  String?
  notes                   String?

  owner       User?        @relation(...)
  activities  Activity[]
  tasks       Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, ownerId])
}

model Opportunity {
  id             String             @id @default(uuid())
  organizationId String
  name           String
  amount         BigInt?            // cents
  currency       String             @default("USD")
  closeDate      DateTime
  stageId        String
  pipelineId     String
  contactId      String?
  accountId      String?
  ownerId        String?
  probability    Int                // 0-100
  status         OpportunityStatus  @default(OPEN)
  lostReason     String?
  wonAt          DateTime?
  lostAt         DateTime?

  stage          Stage         @relation(...)
  pipeline       Pipeline      @relation(...)
  contact        Contact?      @relation(...)
  account        Account?      @relation(...)
  owner          User?         @relation(...)
  stageHistory   StageHistory[]
  activities     Activity[]
  tasks          Task[]
  emailThreads   EmailThread[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, ownerId])
  @@index([organizationId, stageId])
  @@index([organizationId, closeDate])
}

model StageHistory {
  id             String   @id @default(uuid())
  organizationId String
  opportunityId  String
  fromStageId    String?
  toStageId      String
  changedById    String
  changedAt      DateTime @default(now())

  opportunity    Opportunity @relation(...)
  fromStage      Stage?      @relation("FromStage", ...)
  toStage        Stage       @relation("ToStage", ...)
  changedBy      User        @relation(...)

  @@index([opportunityId])
}
```

---

## 4. Index Strategy

### Primary query patterns and their indexes:

| Query Pattern | Index |
|---|---|
| All entities by org | `@@index([organizationId])` on every table |
| Active users in org | `@@index([organizationId, isActive])` |
| User login | `@@index([email])` on User |
| Token lookup | `@@unique([tokenHash])` on RefreshToken, PasswordReset |
| Token family invalidation | `@@index([familyId])` on RefreshToken |
| Audit log by org + time | `@@index([organizationId, timestamp])` on AuditLog |
| Audit log by entity | `@@index([entityType, entityId])` on AuditLog |
| Open opportunities by owner | `@@index([organizationId, ownerId])` on Opportunity |
| Open opportunities by close date | `@@index([organizationId, closeDate])` on Opportunity |
| Opportunities in stage | `@@index([organizationId, stageId])` on Opportunity |
| Leads by status | `@@index([organizationId, status])` on Lead |
| Custom field values | `@@index([entityType, entityId])` on CustomFieldValue |

### Index principles:
- Always include `organizationId` as the **first** column in composite indexes (tenant isolation = always the dominant filter).
- Never index `passwordHash` or `tokenHash` values beyond the unique constraint (hash collisions would be a security concern with a partial index scan).
- JSONB columns (`settings`, `customFieldValues`) use GIN indexes only if full-text search is required (Phase 2+).

---

## 5. Migrations Strategy

**Tool:** Prisma Migrate (schema-first, SQL migrations generated and committed)

```
apps/api/prisma/
├── schema.prisma        # Source of truth
└── migrations/
    ├── 20260616_000001_init/
    │   └── migration.sql
    ├── 20260616_000002_contacts/
    │   └── migration.sql
    └── ...
```

**Rules:**
1. **Never edit a committed migration** — create a new one instead.
2. **Additive migrations in production** — adding columns with defaults or nullable columns is safe; removing columns requires a two-phase deploy (deprecate → remove).
3. **Shadow database for CI** — `prisma migrate dev --create-only` in CI to verify migrations without applying.
4. **Seed data** — `apps/api/prisma/seed.ts` creates a SUPER_ADMIN organization + user for local dev.

---

## 6. PostgreSQL RLS (Defence-in-Depth)

RLS policies are applied as a secondary safeguard. The application layer (TenantPrismaService) is the primary isolation mechanism.

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
-- ... (all tables with organizationId)

-- Create a Postgres role for the app
-- The app connects as 'opsnext_app'
-- Superadmin operations use 'opsnext_admin' role

-- Set tenant context via session variable
CREATE POLICY tenant_isolation ON "User"
  USING (
    "organizationId" = current_setting('app.current_org_id', true)
    OR current_setting('app.current_org_id', true) IS NULL  -- SUPER_ADMIN bypass
  );
```

**Note:** RLS is applied via a migration in Phase 2. Phase 1 uses application-layer isolation only (TenantPrismaService). The schema is designed to accept RLS without modification.

---

## 7. Data Types — Decision Log

| Data | Type | Reason |
|---|---|---|
| IDs | `String @default(uuid())` | UUID v4 — no enumeration, safe to expose |
| Money | `BigInt` (cents) | Exact integer arithmetic; avoids IEEE 754 rounding |
| Timestamps | `DateTime` (maps to `TIMESTAMPTZ`) | UTC storage, timezone-aware |
| JSON blobs | `Json` (maps to `JSONB`) | Binary JSON in PG — indexed, faster than TEXT |
| Passwords | bcrypt hash (String) | Opaque to DB layer |
| Tokens | SHA-256 hex (String, unique) | 64-char, constant-time compare |
| Booleans | `Boolean` | Native PG bool |
| Enums | Prisma native enums | DB-level CHECK constraint + type safety |
| Arrays | `String[]` | Native PG ARRAY — used for scopes, email addresses |
