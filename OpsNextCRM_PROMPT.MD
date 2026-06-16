# Build OpsNext CRM from Scratch

You are MetaSwarm operating as a complete product engineering organization.

Act as:

* Product Manager
* Solution Architect
* Technical Architect
* Backend Lead
* Frontend Lead
* QA Lead
* Security Lead
* DevOps Lead

Your mission is to design and build a production-ready SaaS CRM platform called OpsNext CRM.

Do not assume any existing specifications, plans, tasks, or architecture.

Start from first principles.

---

## Business Goal

OpsNext CRM is a modern CRM platform for managing customer acquisition, sales execution, customer relationships, and team productivity.

The platform must support:

* Multiple organizations (multi-tenant)
* Teams and users
* Customer lifecycle management
* Sales pipeline management
* Communication tracking
* Activity management
* Reporting and analytics

The system must be scalable, secure, modular, and cloud-ready.

---

# Core CRM Modules

## 1. User Roles & Permissions

Capabilities:

* Authentication
* Authorization
* RBAC
* User Management
* Team Management
* Permission Management
* Audit Logs
* Session Management

---

## 2. Contact & Account Management

Capabilities:

* Organizations
* Accounts
* Contacts
* Contact Relationships
* Notes
* Attachments
* Activity Timeline

---

## 3. Lead Management

Capabilities:

* Lead Capture
* Lead Assignment
* Lead Qualification
* Lead Status Tracking
* Lead Conversion
* Lead Ownership

---

## 4. Opportunity & Pipeline Tracking

Capabilities:

* Opportunity Management
* Pipeline Stages
* Deal Tracking
* Revenue Tracking
* Forecasting
* Win/Loss Analysis

---

## 5. Activity & Task Management

Capabilities:

* Tasks
* Calls
* Meetings
* Follow-Ups
* Reminders
* Notifications
* Activity Timeline

---

## 6. Email & Communication History

Capabilities:

* Email Logging
* Email Synchronization
* Communication Timeline
* Attachments
* Email Templates
* Message Tracking

---

## 7. Reporting & Dashboards

Capabilities:

* Executive Dashboard
* Sales Dashboard
* Lead Analytics
* Opportunity Analytics
* Activity Analytics
* Team Performance Analytics
* KPI Reporting

---

# Technology Decisions

Frontend

* Next.js
* TypeScript
* Tailwind CSS
* TanStack Query
* React Hook Form

Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* Redis

Infrastructure

* Docker
* Docker Compose
* GitHub Actions

Testing

* Jest
* Playwright

---

# Phase 1: Product Discovery

Generate:

1. Product Vision
2. User Personas
3. Business Requirements
4. Functional Requirements
5. Non-Functional Requirements
6. Success Metrics

Review all outputs before proceeding.

---

# Phase 2: Domain Modeling

Generate:

1. Domain Model
2. Business Entities
3. Entity Relationships
4. Bounded Contexts
5. Domain Events

Review before proceeding.

---

# Phase 3: Architecture Design

Generate:

1. High-Level Architecture
2. Module Architecture
3. Multi-Tenant Architecture
4. Security Architecture
5. Database Architecture
6. Integration Architecture
7. Deployment Architecture

Review before proceeding.

---

# Phase 4: Delivery Planning

Generate:

1. Epics
2. Features
3. User Stories
4. Technical Tasks
5. Sprint Plan
6. Module Dependencies

Review before proceeding.

---

# Phase 5: Implementation

Build modules in the following order:

1. User Roles & Permissions
2. Contact & Account Management
3. Lead Management
4. Opportunity & Pipeline Tracking
5. Activity & Task Management
6. Email & Communication History
7. Reporting & Dashboards

For each module:

* Design
* Backend
* Frontend
* Security Review
* QA Review
* Refactoring Review
* Approval

No code generation until architecture and planning are approved.

Begin with Product Discovery and Domain Modeling only.