---
name: architecture-overview
description: High-level architecture decisions for OpsNext CRM
metadata:
  type: project
---

# OpsNext CRM — Architecture

## Structure
Pnpm monorepo with:
- `apps/web` — Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, React Hook Form
- `apps/api` — NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis
- `packages/shared` — shared DTOs, types, constants

## Multi-Tenancy
Row-level tenancy via `organization_id` on every table. Middleware extracts tenant from JWT and sets Prisma query context. No cross-tenant data leakage.

## Auth
JWT access tokens (15 min) + refresh tokens (7 days) stored in httpOnly cookies. RBAC via roles table with permission bitmask. Audit log on every sensitive mutation.

## Database
PostgreSQL with Prisma. Migrations in `apps/api/prisma/migrations/`. One schema, tenant isolation via `organizationId` FK. Redis for session cache and queue.

## API
REST via NestJS controllers + OpenAPI (Swagger). Versioned at `/api/v1/`. Rate limiting per tenant. Input validation via class-validator DTOs.

## Testing
- Unit: Jest (70% coverage minimum enforced in CI)
- E2E: Playwright against running stack via Docker Compose
- CI: GitHub Actions runs lint + type-check + unit tests + e2e on every PR

## Module Build Order
1. User Roles & Permissions (auth foundation)
2. Contact & Account Management
3. Lead Management
4. Opportunity & Pipeline Tracking
5. Activity & Task Management
6. Email & Communication History
7. Reporting & Dashboards

## Review Gates
Every module goes through: Architect → Security → QA → Code Review → Approval before merge.
