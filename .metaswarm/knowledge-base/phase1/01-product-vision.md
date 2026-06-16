# OpsNext CRM — Product Vision Document
## Phase 1 Foundation

**Version:** 1.0
**Date:** 2026-06-16
**Author:** Product Management
**Status:** Approved — Anchoring Document

---

## 1. Vision Statement

OpsNext CRM exists so that every sales team — from a 5-person startup to a 500-person enterprise — can own their customer relationships completely, without renting them from a vendor who charges more for every seat, every API call, and every workflow.

We are building the CRM that developers are proud to deploy and salespeople actually use.

---

## 2. Mission Statement

OpsNext CRM delivers a modern, self-hostable sales CRM for B2B companies that need professional-grade pipeline and contact management without the cost, lock-in, or complexity of legacy enterprise platforms.

We do this by combining a developer-first architecture (open stack, clean APIs, self-host or cloud) with a polished, opinionated UI that keeps salespeople focused on selling — not navigating menus.

**For whom:** Revenue-generating teams at product-led and sales-led B2B companies, typically 10–500 employees, who have outgrown spreadsheets and simple contact tools but refuse to pay Salesforce prices or surrender their data.

**How:** A TypeScript-native, Prisma-backed, multi-tenant SaaS platform built on Next.js 14 and NestJS — deployable on your own infrastructure, extensible via API, and priced transparently.

---

## 3. Strategic Positioning

### The Current Landscape

| Platform       | Strength                        | Weakness                                         |
|----------------|---------------------------------|--------------------------------------------------|
| Salesforce     | Feature completeness, ecosystem | Cost ($150+/user/mo), complexity, 6-month onboarding |
| HubSpot        | Marketing integration, UX       | Free tier is a trap; paid tiers escalate fast    |
| Pipedrive      | Pipeline simplicity             | Weak reporting, no self-host, limited roles/perms |
| Monday/Notion  | Flexibility                     | Not a CRM — no opinionated sales workflow        |

### Where OpsNext CRM Sits

OpsNext CRM is **more powerful than Pipedrive** (multi-role permissions, structured activity tracking, reporting dashboards), **simpler to deploy than Salesforce** (no consultants required, no Apex, no org setup), and **more developer-friendly than HubSpot** (open source stack, self-hostable, REST + webhook-native from day one).

The differentiating axis is **ownership and openness**. We do not monetize seat count against you. We do not hide your data behind export fees. We do not build integrations you must pay to unlock.

OpsNext CRM targets the gap between "simple pipeline tool" and "enterprise CRM suite" — the territory where most $5M–$100M ARR B2B companies actually live.

---

## 4. Core Value Proposition

### Differentiator 1: True Self-Hosting Without Compromise
Deploy on your own VPS, Kubernetes cluster, or managed cloud with a single Docker Compose file. All features are available on self-hosted. No "cloud-only" capabilities. Your data stays in your database — Postgres, your schema, your backups.

### Differentiator 2: Developer-First Architecture
Built on a stack developers already know and trust: Next.js 14, NestJS, TypeScript, Prisma, PostgreSQL, Redis. Clean REST API from day one. Webhooks on all major entity events. No proprietary query language. No vendor SDK required to integrate.

### Differentiator 3: Multi-Tenant from the Ground Up
Role-based access control, tenant isolation, and audit trails are architectural primitives — not bolt-ons. OpsNext CRM can be white-labeled and resold. Agencies and MSPs can run one instance serving multiple client organizations.

### Differentiator 4: Opinionated Sales Workflow, Not a Blank Canvas
We ship a real sales workflow out of the box: Contacts → Accounts → Leads → Opportunities → Activities → Close. Teams should not need a consultant to configure basic CRM stages. Sensible defaults exist and are documented.

### Differentiator 5: Transparent, Predictable Pricing
Flat per-seat pricing with no feature tiers. Every user on every plan gets every feature. Enterprises pay for seats, not for permissions or API access. Self-hosted users pay nothing to Anthropic (or us) to run the platform.

---

## 5. Target Market

### Primary Segment
- **Company size:** 10–200 employees
- **Revenue stage:** Post-product-market-fit, $1M–$50M ARR
- **Industry:** B2B SaaS, professional services, technology consulting, agency, fintech
- **Geography:** English-speaking markets first — US, UK, Canada, Australia — expanding to Western Europe in Year 2
- **Buyer persona:** Founder/CEO, VP of Sales, Head of Revenue Operations, or Engineering Lead evaluating CRM infrastructure

### Secondary Segment
- **Agencies and MSPs** who need a multi-tenant CRM to manage client accounts or resell under their brand
- **Developer teams** building internal sales tooling who want a deployable, extensible base rather than a greenfield build

### Anti-Target (who we are NOT building for right now)
- Enterprise orgs with 500+ users requiring custom objects, Salesforce-style Flows, or SOC 2 Type II (Year 3 scope)
- Pure marketing teams needing email campaign automation, A/B testing, or lead scoring models (out of scope, see Section 8)
- SMBs who need a free tool and have no technical operator on staff

---

## 6. Product Pillars

### Pillar 1: Clarity Over Customization
Every screen should have one primary action. No configuration required to see value. Reduce cognitive load: hide power features behind progressive disclosure, not behind settings menus.

*Design implication:* Default views are intentional. Dashboards are pre-built, not blank. Role configuration is wizard-driven, not JSON.

### Pillar 2: Data Integrity Over Feature Velocity
We ship fewer features but ship them correctly. Relationships between entities (Contact → Account → Opportunity → Activity) are enforced at the database layer, not in application code. No orphan records. No silent data loss on delete.

*Engineering implication:* Prisma schema is the source of truth. Cascade rules are explicit. Audit logs are written before mutations are committed.

### Pillar 3: API Parity with UI
Every action a user can perform in the UI must be performable via the REST API. No UI-only workflows. Webhooks fire on all create/update/delete events across all entities. The API is the product, the UI is one client of it.

*Engineering implication:* NestJS controllers map 1:1 with UI operations. No API shortcuts for the UI layer.

### Pillar 4: Operator Experience is a First-Class Concern
Deployment, upgrade, monitoring, and backup are documented and scriptable. Health endpoints, structured logs (JSON), and Prometheus metrics are standard. No operational surprises post-deploy.

*Infrastructure implication:* Docker Compose and Helm chart ship with the product. Database migrations are automated via Prisma Migrate and are always backward-compatible within a minor version.

---

## 7. Three-Year Product Horizon

### Year 1 (2026): Foundation — Ship a Complete, Correct Core
The goal of Year 1 is to deliver a fully functional, production-hardened CRM that covers the complete sales lifecycle with zero critical gaps.

**Milestones:**
- All 7 Phase 1 modules live and stable: User Roles & Permissions, Contact & Account Management, Lead Management, Opportunity & Pipeline, Activity & Task Management, Email & Communication History, Reporting & Dashboards
- Multi-tenant architecture with tenant isolation enforced at row level
- REST API with full CRUD coverage and OpenAPI spec published
- Webhooks on Contact, Lead, Opportunity, and Activity events
- Self-hosted Docker Compose deployment documented and tested
- Role-based access: Admin, Sales Manager, Sales Rep, Read-Only
- Basic reporting: pipeline by stage, activity by rep, lead conversion rate
- Email integration: log inbound/outbound email to Contact and Opportunity records (IMAP/SMTP)

**Success metric:** 10 paying teams running OpsNext CRM in production by end of Year 1.

---

### Year 2 (2027): Scale — Expand Reach and Deepen Workflow
The goal of Year 2 is to make OpsNext CRM the obvious choice for teams scaling their sales motion and to open the platform to the broader ecosystem.

**Milestones:**
- Public API v2 with rate limiting, API key management, and developer portal
- Native integrations: Slack (deal alerts), Google Calendar (activity sync), Zapier/Make connector
- Advanced pipeline: weighted forecasting, deal health scoring (rule-based, not ML), multiple pipeline support
- Custom fields on Contact, Account, Opportunity (text, number, date, dropdown)
- Bulk operations: import/export CSV, bulk assign, bulk stage move
- White-label support: custom subdomain, logo, color palette per tenant
- Mobile-responsive web UI (no native app yet)
- GDPR compliance: right to erasure, data export per contact, consent logging
- SOC 2 Type I audit initiated

**Success metric:** 100 paying teams, $500K ARR, developer community with 3+ published integrations.

---

### Year 3 (2028): Intelligence — AI-Augmented Selling
The goal of Year 3 is to bring contextual AI into the sales workflow without making it gimmicky — AI that saves time on real tasks, not AI for the pitch deck.

**Milestones:**
- AI-generated call and meeting summaries logged to Activity records (via transcript processing)
- Next-action suggestions on stalled Opportunities (rule + ML hybrid)
- Email drafting assistant on Communication History (context-aware, using deal and contact data)
- Lead qualification scoring model trained on historical conversion data (tenant-specific)
- Automated workflow engine: trigger → condition → action (e.g., "when Lead score > 70, assign to rep and create follow-up task")
- Native iOS app (read + create + update, no full feature parity)
- SOC 2 Type II certification
- Enterprise tier: SSO (SAML/OIDC), custom roles, audit log export, dedicated support SLA

**Success metric:** $3M ARR, 500+ active teams, enterprise contracts in pipeline.

---

## 8. Out of Scope

The following capabilities are explicitly out of scope for Phase 1 and will not be designed for, built toward, or architecturally accommodated as first-class features.

### Marketing Automation
OpsNext CRM does not send marketing email campaigns, manage subscriber lists, run A/B tests on email content, or score leads based on marketing engagement. This is HubSpot territory. Teams needing this should integrate with Mailchimp, Customer.io, or similar via webhook.

### Billing and Invoicing
OpsNext CRM has no concept of invoice, subscription, payment term, or revenue recognition. It tracks Opportunity value as a sales metric only. Billing belongs in Stripe, QuickBooks, or an ERP.

### ERP / Inventory / Procurement
No purchase orders, inventory tracking, vendor management, or supply chain. OpsNext CRM is a revenue-facing tool, not an operational backbone.

### Product / Project Delivery Tracking
Post-sale delivery tracking, project milestones, ticketing, and customer success workflows are out of scope. These belong in Jira, Linear, or a dedicated CSP tool.

### Native Mobile App (Year 1)
A native iOS or Android application is a Year 3 objective. The web application will be mobile-responsive, but there is no plan for App Store submission in Phase 1.

### AI / Machine Learning Features (Year 1)
No LLM-powered features, scoring models, or automation engines in Phase 1. The data model and API surface are being built to accommodate these in Year 3, but shipping them in Phase 1 would compromise core correctness.

### Marketplace / Plugin Ecosystem
Third-party plugin installation, a public app marketplace, or a plugin SDK are Year 2+ concerns. Phase 1 ships a clean API and webhooks. Builders integrate via those primitives.

---

## Document Control

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Document ID    | PV-001                                                                |
| Phase          | Phase 1 Foundation                                                    |
| Owner          | Product Management                                                    |
| Reviewers      | Engineering Lead, Design Lead, Founding Commercial Team               |
| Next Review    | End of Q3 2026 (after first 10 customers are live)                    |
| Supersedes     | None (inaugural document)                                             |

This document anchors all Phase 1 architectural, design, and scope decisions. Changes require Product Management sign-off and a version increment. Disagreements about scope should be resolved by reference to this document before escalating.
