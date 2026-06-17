# OpsNext CRM — Definition of Done
## Phase 4: Delivery Planning

**Document ID:** DP-004  
**Version:** 1.0  
**Date:** 2026-06-17  
**Status:** Approved — Delivery Anchor  
**Input documents:** FR-001 (NFR), ARCH-001, ARCH-006

---

## Overview

This document defines what "Done" means at three levels:
1. **Story DoD** — every user story must meet these criteria before being considered complete
2. **Sprint DoD** — every sprint must meet these criteria before the increment is considered shippable
3. **Module DoD** — every module must meet these criteria before being merged to `main`

---

## Level 1: Story Definition of Done

Every user story is Done when ALL of the following are true:

### Code Quality
- [ ] TypeScript strict mode — zero `any` without an explanatory comment
- [ ] No `@ts-ignore` without a comment explaining the technical reason
- [ ] `pnpm lint` passes with zero errors or warnings
- [ ] `pnpm typecheck` passes with zero errors

### Multi-Tenancy
- [ ] Every DB query in the feature goes through `TenantPrismaService` (or explicitly uses `PrismaService.raw` with documented justification)
- [ ] No request handler reads `organizationId` from the request body — only from `req.user.orgId` (JWT payload)
- [ ] Manual cross-tenant test: create two orgs, verify data from Org A is not accessible from Org B

### API Contract
- [ ] All input is validated by a DTO with `class-validator` decorators
- [ ] Unknown fields in request body are rejected (whitelist: true)
- [ ] All controller actions have `@ApiOperation`, `@ApiOkResponse` (or 201/204), and at least one `@ApiResponse({ status: 4xx })` decorator
- [ ] Error responses conform to RFC 7807 Problem Details format
- [ ] New endpoints documented in Swagger — run `GET /api/docs` and verify

### Security
- [ ] No secrets or credentials in code or committed `.env` files
- [ ] All new `:id` route params use `ParseUUIDPipe` to prevent injection
- [ ] File uploads validated by MIME type and size before storage
- [ ] SQL injection impossible (Prisma parameterises all queries; no raw SQL with user input unless reviewed)

### Tests
- [ ] Unit tests cover the happy path AND the following failure cases: not found, duplicate, forbidden (wrong role), cross-tenant isolation
- [ ] `pnpm test` passes
- [ ] Coverage for the changed files does not drop below 70% (checked via `pnpm test:cov`)

### Frontend (when applicable)
- [ ] Page loads with a skeleton/loading state before data arrives
- [ ] Empty state shown when list is empty (not a blank page)
- [ ] Form validation shows inline errors before API call
- [ ] API error messages are surfaced to the user (not silently swallowed)
- [ ] All interactive elements are keyboard-accessible (Tab, Enter, Escape)
- [ ] No console errors in the browser DevTools for the happy path

---

## Level 2: Sprint Definition of Done

A sprint increment is Done when ALL stories are Done AND:

### Integration
- [ ] All sprint features work end-to-end in the development environment (`docker-compose up`)
- [ ] No regressions in previously completed modules (run full test suite)
- [ ] `pnpm build` passes (both `apps/api` and `apps/web`)

### Database
- [ ] Migration files committed with the feature code (`prisma/migrations/`)
- [ ] `prisma migrate deploy` succeeds on a fresh database
- [ ] No data-destroying migrations without explicit sign-off

### Coverage Gate
- [ ] `pnpm test:cov` reports ≥ 70% lines covered across the entire `apps/api/src` directory
- [ ] Coverage report attached to the PR

### PR / Git
- [ ] PR description links to the relevant sprint stories
- [ ] PR is reviewed (or self-reviewed with checklist) before merge
- [ ] No force-push to `main`
- [ ] Commit messages are descriptive and reference the story ID

---

## Level 3: Module Definition of Done

A module is Done for the purposes of future sprint planning when:

### Functional
- [ ] All [M] (Must Have) features from FR-001 for this module are implemented
- [ ] All [S] (Should Have) features are implemented OR explicitly deferred with a ticket in the backlog
- [ ] The module's domain events (DM-005) are emitted and consumed correctly

### Testing
- [ ] Unit tests: ≥ 70% coverage for the module's service layer
- [ ] Integration tests: cross-tenant isolation tested for every write operation (create, update, delete)
- [ ] Integration tests: RBAC matrix tested — each role can do what FR-AUTH-011 says and cannot do what it prohibits
- [ ] E2E tests: at least one Playwright test covering the golden path for the module's primary user story

### Documentation
- [ ] OpenAPI docs complete for all endpoints (via Swagger decorators)
- [ ] Module boundaries documented and not violated (check: no circular imports, no cross-module direct service injection except the explicit AuthModule ↔ UsersModule dependency)

### Performance
- [ ] All new list endpoints tested with 1,000+ records per tenant; p95 < 300ms
- [ ] New DB indexes added for all query patterns in the module (see ARCH-002 for index strategy)

---

## RBAC Acceptance Matrix

For every new protected endpoint, verify this matrix. A ✅ means the request returns 2xx. A ❌ means 403.

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MANAGER | SALES_REP | READ_ONLY |
|---|---|---|---|---|---|
| GET /users | ✅ | ✅ | ✅ (own org) | ❌ | ❌ |
| POST /users/invite | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /users/:id/role | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /users/:id/deactivate | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /contacts | ✅ | ✅ | ✅ | ✅ (own) | ✅ |
| POST /contacts | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /contacts/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /leads | ✅ | ✅ | ✅ | ✅ (own) | ✅ |
| POST /leads/:id/convert | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /opportunities | ✅ | ✅ | ✅ | ✅ (own) | ✅ |
| POST /opportunities/:id/won | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| DELETE /opportunities/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /reports/* | ✅ | ✅ | ✅ | ❌ | ❌ |

*This matrix is a sample. The full matrix for each module is documented in the module's integration test file.*

---

## Anti-Patterns — Never Acceptable

These are hard fails that will block a PR from merging regardless of other DoD criteria:

| Anti-Pattern | Why it's rejected |
|---|---|
| `organizationId` read from request body | Allows tenant spoofing — always derive from JWT |
| `prisma.user.findMany()` without `where: { organizationId }` | Cross-tenant data leak |
| `bcrypt.hashSync()` in a hot path | Blocks event loop; always use `bcrypt.hash()` |
| Storing access tokens in `localStorage` | XSS exfiltration; use in-memory only |
| `console.log` in production code paths | Use structured logger (pino) |
| `catch(e) {}` swallowing all errors silently | Masks failures; at minimum log to stderr |
| Any | Disables TypeScript safety; requires explanatory comment + reviewer approval |
| Circular module imports | NestJS will throw at startup; resolve with shared module |
| Skipping `ParseUUIDPipe` on `:id` params | Allows non-UUID injection into Prisma `where` clauses |
| `--no-verify` on commits | Bypasses hooks; never acceptable without explicit user request |

---

## QA Checklist (Pre-Sprint Merge)

Run through this checklist manually on the sprint branch before creating the merge PR:

```
□ docker-compose up starts all services without errors
□ prisma migrate dev applies all new migrations cleanly
□ pnpm dev starts without TypeScript errors
□ Login flow works end-to-end (register → login → access dashboard → logout)
□ New feature golden path works as described in the user story
□ New feature respects RBAC (test with a lower-privilege token)
□ New feature is tenant-isolated (create same-named record in two orgs; verify no bleed)
□ pnpm test passes (all tests green)
□ pnpm test:cov shows ≥ 70% for changed modules
□ pnpm lint passes
□ pnpm typecheck passes
□ pnpm build produces no errors
□ GET /api/docs shows new endpoints with correct request/response shapes
```
