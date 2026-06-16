# OpsNext CRM — Claude Code Project Guide

## Project Overview

OpsNext CRM is a production-ready multi-tenant SaaS CRM platform. It is being built from scratch using a structured 5-phase methodology: Product Discovery → Domain Modeling → Architecture Design → Delivery Planning → Implementation.

**Current phase:** Setup / Architecture Design

## Monorepo Structure

```
opsnext-crm/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared DTOs, types, constants
├── .metaswarm/       # Metaswarm config and knowledge base
├── .claude/          # Claude Code project settings
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, React Hook Form |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL (primary), Redis (cache/queue) |
| Testing | Jest (unit), Playwright (e2e) |
| CI/CD | GitHub Actions |
| Infra | Docker, Docker Compose |
| Package Manager | **pnpm** (workspaces) |

## Commands

```bash
# Install all dependencies
pnpm install

# Start all services (dev)
pnpm dev

# Run API only
pnpm --filter api dev

# Run web only
pnpm --filter web dev

# Run all tests
pnpm test

# Run tests with coverage (70% threshold)
pnpm test:cov

# Run e2e tests
pnpm test:e2e

# Lint
pnpm lint

# Type check
pnpm typecheck

# Build
pnpm build
```

## Development Rules

1. **No code before architecture approval** — follow the 5-phase process.
2. **Coverage threshold: 70%** — enforced in CI; don't merge below this.
3. **Every module must pass review gates**: Architect → Security Auditor → QA → Code Review.
4. **Multi-tenancy is non-negotiable** — every DB query must scope to `organizationId`.
5. **No direct DB access from frontend** — all data flows through the NestJS API.
6. **Use DTOs for all API input validation** — class-validator decorators on every DTO.
7. **JWT auth** — access tokens 15 min, refresh tokens 7 days, httpOnly cookies.
8. **TypeScript strict mode** — no `any`, no `@ts-ignore` without a comment explaining why.

## Module Build Order

1. User Roles & Permissions
2. Contact & Account Management
3. Lead Management
4. Opportunity & Pipeline Tracking
5. Activity & Task Management
6. Email & Communication History
7. Reporting & Dashboards

## Metaswarm Workflow

Use `/start-task` to begin any implementation task. Metaswarm will:
- Run Architect + Security + QA review gates before implementation
- Use the orchestrated execution loop (IMPLEMENT → VALIDATE → ADVERSARIAL REVIEW → COMMIT)
- Track progress via tasks

## Key Files

| File | Purpose |
|------|---------|
| `.metaswarm/project-profile.json` | Project configuration for metaswarm |
| `.metaswarm/knowledge-base/architecture.md` | Architecture decisions |
| `OpsNextCRM_PROMPT.MD` | Original build brief |
| `OpsNextCRM_Architecture.MD` | Architecture phase instructions |
| `OpsNextCRM_Module1.MD` | Module 1 implementation instructions |
