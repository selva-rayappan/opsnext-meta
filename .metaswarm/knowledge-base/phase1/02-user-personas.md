# OpsNext CRM — User Personas
## Phase 1 | Product Management & UX

**Document version:** 1.0  
**Date:** 2026-06-16  
**Author:** Product Management & UX Lead  
**Scope:** Phase 1 — SMB to mid-market companies (10–500 employees)

---

## Overview

This document defines the six primary user personas for OpsNext CRM. Each persona represents a distinct role with unique goals, workflows, and frustration thresholds. These profiles inform UI/UX decisions, feature prioritization, notification design, and role-based access control (RBAC) scoping across all seven modules.

**Modules in scope:** User Roles & Permissions, Contact & Account Management, Lead Management, Opportunity & Pipeline Tracking, Activity & Task Management, Email & Communication History, Reporting & Dashboards.

---

## Persona Index

| # | Persona | Primary Module Focus |
|---|---------|---------------------|
| 1 | Sales Representative | Leads, Opportunities, Activities |
| 2 | Sales Manager | Pipeline, Reporting, Team Activity |
| 3 | Account Manager | Contacts, Accounts, Activity History |
| 4 | Marketing / Lead Gen Specialist | Leads, Email History, Contacts |
| 5 | CRM Administrator / IT Admin | User Roles, Integrations, Configuration |
| 6 | Executive / VP of Sales | Dashboards, Reporting, Forecasting |

---

## Persona 1 — Sales Representative

### Profile

| Field | Detail |
|-------|--------|
| **Name** | Marcus Chen |
| **Title** | Sales Development Representative (SDR) / Account Executive |
| **Company type** | B2B SaaS or professional services firm |
| **Company size** | 25–150 employees |
| **Age** | 26–34 |
| **Tech comfort** | High — daily user of CRM, email, Slack, video conferencing tools |

### Primary Goals

1. Convert qualified leads into closed opportunities as fast as possible with minimal administrative overhead.
2. Maintain an accurate, up-to-date pipeline so nothing falls through the cracks between follow-up cycles.
3. Hit monthly/quarterly quota by prioritizing high-value activities rather than data entry.

### Key Pain Points with Current Tools

1. **Manual data entry tax** — Spends 20–30 minutes per day copying call notes, email threads, and meeting outcomes into the CRM. Time that should be spent selling.
2. **Stale lead information** — Leads assigned by marketing often have incomplete context: no source, no lead score, no prior email history. Has to reverse-engineer intent before the first call.
3. **Context switching** — Jumps between the CRM, inbox, calendar, and LinkedIn to get a full picture of a prospect. There is no single pane of glass.

### Key Workflows in OpsNext CRM

1. **Daily lead queue review** — Opens the Lead Management view filtered to "My Leads / Today's Follow-ups", reviews lead score and last activity, triages into call now / email now / nurture later buckets.
2. **Post-call activity logging** — After a discovery call, creates an Activity log linked to the Contact and Opportunity, adds next-step task with a due date, and updates the opportunity stage in one flow without leaving the record.
3. **Opportunity stage progression** — Drags an opportunity card from "Discovery" to "Proposal Sent" in the Kanban pipeline view, triggering an automatic task reminder for 3-day follow-up.
4. **Email send & track** — Composes and sends a follow-up email from within the Contact record; views open/click tracking inline on the Communication History tab.

### Success Looks Like (A Good Day)

Marcus starts with a prioritized lead queue. He makes 8 calls, logs 6 activity notes in under 2 minutes each using quick-log templates. He advances two opportunities to the next stage, emails three prospects from within the CRM, and ends the day with zero overdue tasks. His pipeline is accurate without feeling like a data-entry clerk.

### Frustration Triggers

- More than 3 clicks to log a call note or update an opportunity stage.
- Required fields on every save that block a quick activity log mid-call.
- Slow page loads (>2s) when switching between contact records.
- Notification noise — alerts for things that don't require his action.
- Pipeline view that doesn't reflect real-time stage changes made by teammates.

### Device / Access Patterns

| Context | Pattern |
|---------|---------|
| **Primary device** | Desktop (Chrome/Edge), 80% of work hours |
| **Mobile** | iOS Safari — quick task check, post-meeting note capture |
| **Integrations that matter** | Gmail / Outlook (email sync), Google Calendar, LinkedIn Sales Navigator |
| **Peak usage hours** | 8:00 AM – 12:00 PM (prospecting), 4:00 PM – 5:30 PM (pipeline updates) |

---

## Persona 2 — Sales Manager

### Profile

| Field | Detail |
|-------|--------|
| **Name** | Priya Nair |
| **Title** | Sales Manager / Director of Sales |
| **Company type** | Mid-market B2B — technology, manufacturing, or services |
| **Company size** | 50–300 employees |
| **Age** | 34–45 |
| **Tech comfort** | Medium-high — comfortable with CRM and BI tools, expects data to be clean and actionable |

### Primary Goals

1. Maintain a healthy, predictable pipeline that supports accurate revenue forecasting for the quarter.
2. Coach and develop team members by identifying activity gaps and deal-risk signals early.
3. Reduce time spent in status meetings by having real-time visibility into every rep's pipeline without asking them.

### Key Pain Points with Current Tools

1. **Unreliable pipeline data** — Reps update stages inconsistently; forecasts are built on stale snapshots. The number going into the board meeting often doesn't match what's in the system.
2. **Coaching blindspot** — No easy way to see which rep hasn't followed up on a hot lead in 5 days, or which deals have been sitting in "Proposal Sent" for 30+ days without any activity.
3. **Report generation lag** — Building a weekly team pipeline report means exporting to Excel, pivoting, and formatting manually. Takes 45 minutes every Monday.

### Key Workflows in OpsNext CRM

1. **Weekly pipeline review** — Opens the Team Pipeline dashboard, filters by rep, views deal-age heat-map and stage distribution. Flags stalled opportunities (no activity > 7 days) for 1:1 coaching conversations.
2. **Forecast roll-up** — Views the Forecasting report showing weighted pipeline by rep and by close date. Adjusts rep-submitted forecast values with manager override notes.
3. **Activity monitoring** — Reviews the Activity Feed filtered to team, sorted by date. Spots reps who haven't logged calls in 2+ days and sends an in-platform nudge or task assignment.
4. **Deal risk review** — Uses the opportunity risk flags (deal age, missing next step, no activity) to prioritize which deals need intervention before the quarter closes.

### Success Looks Like (A Good Day)

Priya opens the team dashboard at 8 AM and sees three stalled deals surfaced automatically. She reviews them, assigns coaching tasks to two reps, and updates the forecast in 20 minutes. She spends the rest of the morning on strategic work — not chasing data. Her Monday report runs itself. Her 1:1s are focused and data-driven rather than anecdotal.

### Frustration Triggers

- Dashboard widgets that can't be filtered by individual rep or date range.
- No audit trail when reps change opportunity amounts or close dates retroactively.
- Forecast numbers that don't roll up automatically from opportunity stages.
- Having to rebuild the same report every week because there are no saved views.
- Being unable to assign a task to a rep directly from within a deal record.

### Device / Access Patterns

| Context | Pattern |
|---------|---------|
| **Primary device** | Desktop (Chrome), heavy use of multi-tab workflow |
| **Mobile** | iOS — quick pipeline check before leadership calls |
| **Integrations that matter** | Outlook calendar (1:1 scheduling), Slack (team notifications), Excel (backup exports) |
| **Peak usage hours** | 7:30 AM – 9:00 AM (pipeline review), 3:00 PM – 5:00 PM (forecast updates) |

---

## Persona 3 — Account Manager

### Profile

| Field | Detail |
|-------|--------|
| **Name** | Sofia Andrade |
| **Title** | Account Manager / Customer Success Manager |
| **Company type** | B2B SaaS, managed services, or consulting |
| **Company size** | 30–200 employees |
| **Age** | 28–40 |
| **Tech comfort** | Medium-high — detail-oriented, relies heavily on organized records and follow-up reminders |

### Primary Goals

1. Maintain deep, trust-based relationships with a portfolio of 40–80 accounts by never missing a follow-up or renewal touchpoint.
2. Identify upsell and cross-sell signals within existing accounts before competitors do.
3. Keep a complete and accurate history of every interaction so that account handoffs or coverage gaps never result in lost context.

### Key Pain Points with Current Tools

1. **Fragmented contact history** — Emails live in Outlook, call notes live in the CRM, and meeting notes live in Notion. Pulling together a complete picture before an account review takes 20 minutes.
2. **Renewal blindspot** — No proactive alert when a contract renewal date is 90 days out. Renewals are tracked in a spreadsheet that no one fully trusts.
3. **Duplicate contacts** — The same contact appears multiple times under slightly different company names or email formats, making the account view messy and unreliable.

### Key Workflows in OpsNext CRM

1. **Account health review** — Opens the Account record, reviews the 360-degree view: all contacts, open opportunities, recent activity logs, and full communication history timeline — all from one screen.
2. **Contact interaction logging** — After a quarterly business review (QBR) call, logs a meeting activity note with attendees, key decisions, and follow-up tasks. Links the activity to both the Account and the primary Contact record.
3. **Renewal opportunity tracking** — Creates an Opportunity record with type "Renewal", links it to the Account, sets close date to the contract end date minus 60 days. Receives an automated reminder task at T-90, T-60, T-30.
4. **Upsell identification** — Reviews the activity and email history for buying signals (requests for new features, team growth mentions). Creates a linked upsell Opportunity and schedules an outreach task.

### Success Looks Like (A Good Day)

Sofia starts with her task list: three renewal follow-ups and two QBR prep items. She opens each account, sees the full interaction history in one timeline, makes her calls, logs notes in under 3 minutes each, and sets next steps before hanging up. She ends the day with zero overdue tasks and has proactively flagged one upsell opportunity that marketing didn't know about.

### Frustration Triggers

- Having to scroll through unrelated activities from other reps cluttering the account timeline.
- No way to set a recurring reminder (e.g., monthly check-in) on a contact.
- Activity log fields that reset to blank rather than pre-filling contact and account from context.
- Inability to bulk-update account ownership when territory reassignments happen.
- Contact deduplication that requires manual merging one-by-one across a 500-contact book of business.

### Device / Access Patterns

| Context | Pattern |
|---------|---------|
| **Primary device** | Desktop (Chrome/Edge), extended sessions during account reviews |
| **Mobile** | Android — logging quick activity notes immediately after on-site visits |
| **Integrations that matter** | Outlook (email sync + calendar), Zoom (meeting links on records), DocuSign (contract status visibility) |
| **Peak usage hours** | 9:00 AM – 11:00 AM (account reviews), 1:00 PM – 3:00 PM (calls + activity logging) |

---

## Persona 4 — Marketing / Lead Generation Specialist

### Profile

| Field | Detail |
|-------|--------|
| **Name** | Jordan Ellis |
| **Title** | Marketing Manager / Demand Generation Specialist |
| **Company type** | B2B SaaS, e-commerce enablement, or professional services |
| **Company size** | 20–150 employees |
| **Age** | 25–38 |
| **Tech comfort** | High — fluent with marketing automation platforms, CRMs, and analytics tools |

### Primary Goals

1. Deliver a consistent flow of high-quality, sales-ready leads that convert at a rate that justifies marketing spend.
2. Maintain full attribution visibility from first touch to closed-won so marketing ROI can be defended in budget conversations.
3. Ensure clean, enriched lead data is handed off to sales with enough context to make the first conversation productive.

### Key Pain Points with Current Tools

1. **Attribution black hole** — Leads enter the CRM without source tracking. Marketing cannot prove which campaigns drove revenue because UTM data and lead source fields are either missing or overwritten.
2. **No feedback loop from sales** — Marketing generates leads, but never hears back on quality. Reps disqualify leads without updating the reason, so campaigns can't be optimized.
3. **Delayed handoff process** — Lead qualification is a manual email chain between marketing and sales. Hot leads sit unassigned for 12–24 hours, and intent signals expire.

### Key Workflows in OpsNext CRM

1. **Lead intake and enrichment** — Incoming web form leads auto-create Contact records with source, campaign, and UTM fields populated. Jordan reviews the Lead queue daily, adds company firmographics, and adjusts lead scores based on campaign engagement data.
2. **Lead qualification and handoff** — Applies the ICP (Ideal Customer Profile) filter to identify MQLs. Changes the lead status to "Qualified – Pending Assignment", which triggers an automatic task assignment to the designated SDR with a 4-hour SLA notification.
3. **Disqualification feedback review** — Monitors the "Disqualified Leads" view daily. Reviews sales-provided disqualification reasons to identify campaign-level patterns. Exports data weekly to optimize ad targeting.
4. **Campaign attribution reporting** — Runs the Lead Source Attribution report to view lead volume, MQL rate, and closed-won revenue by campaign and channel. Shares the report link with the CMO.

### Success Looks Like (A Good Day)

Jordan's automated lead import runs overnight. She opens the Lead queue at 9 AM, reviews 15 new inbound leads, qualifies 8 as MQLs, and triggers assignments. By noon she has confirmed that all 8 were picked up by SDRs (SLA met). She pulls the attribution report and sees that the LinkedIn campaign delivered 3 of last month's 5 closed-won deals — data she can take to the next budget review with confidence.

### Frustration Triggers

- Lead source fields that sales reps overwrite without a history log.
- No way to build a saved filtered view for "Leads from Campaign X in the last 30 days."
- Mass import that creates duplicate records instead of merging on email address.
- Inability to add custom fields to the Lead record without involving the CRM admin.
- Reporting that doesn't connect lead source to revenue — MQL counts alone are not enough.

### Device / Access Patterns

| Context | Pattern |
|---------|---------|
| **Primary device** | Desktop (Chrome), primarily during business hours |
| **Mobile** | Minimal — occasional dashboard check |
| **Integrations that matter** | HubSpot / Mailchimp (email campaigns), Google Analytics (UTM tracking), Zapier (web form ingestion), LinkedIn Ads |
| **Peak usage hours** | 9:00 AM – 10:30 AM (lead review), 4:00 PM – 5:00 PM (reporting) |

---

## Persona 5 — CRM Administrator / IT Admin

### Profile

| Field | Detail |
|-------|--------|
| **Name** | Amir Hassan |
| **Title** | CRM Administrator / IT Systems Administrator |
| **Company type** | Any — typically a lean ops or IT team within the SMB |
| **Company size** | 20–500 employees |
| **Age** | 30–50 |
| **Tech comfort** | Very high — understands data models, API integrations, role hierarchies, and security policies |

### Primary Goals

1. Maintain a clean, reliable, and secure CRM platform that all users trust and actually use consistently.
2. Configure roles, permissions, and data access policies that enforce business rules without creating unnecessary friction for frontline users.
3. Enable integrations between OpsNext CRM and the broader tech stack (email, ERP, marketing automation) with minimal custom development.

### Key Pain Points with Current Tools

1. **Permission model rigidity** — Current CRM forces binary "admin vs. user" roles. Can't create a role like "Sales Manager who can see all deals but not change billing fields." Workarounds create data integrity risks.
2. **No audit trail for configuration changes** — When a pipeline stage gets renamed or a required field gets removed, there is no record of who changed it or when. Debugging data quality issues is a forensic exercise.
3. **Integration brittleness** — Webhook-based integrations to marketing tools fail silently. There is no built-in integration health dashboard; failures are discovered only when users complain.

### Key Workflows in OpsNext CRM

1. **User provisioning and role assignment** — Creates new user accounts, assigns role-based access control (RBAC) profiles (SDR, Account Executive, Sales Manager, Read-Only), sets team membership and territory, and sends the onboarding invite in a single user management flow.
2. **Custom field and pipeline configuration** — Adds custom fields to Lead, Contact, and Opportunity objects; configures pipeline stages with entry/exit criteria; sets required field rules per stage using the no-code admin interface.
3. **Integration management** — Connects OpsNext CRM to the company email server (OAuth), configures bi-directional sync rules, maps fields between systems, and monitors the integration health dashboard for sync errors.
4. **Data audit and cleanup** — Runs the duplicate detection report, reviews merge candidates, executes bulk merge operations. Exports the audit log of recent configuration changes for quarterly IT review.

### Success Looks Like (A Good Day)

Amir provisions three new sales reps in under 10 minutes — accounts created, roles assigned, territories set, welcome emails sent. He receives zero "I can't access X" tickets today. He checks the integration health dashboard, sees all syncs completed successfully, and reviews the audit log with no unexpected configuration changes. Users are self-sufficient; the platform runs quietly in the background.

### Frustration Triggers

- No granular field-level or record-level permissions — everything is role-wide or nothing.
- Admin UI that requires page reloads to see configuration changes take effect.
- No API documentation or sandbox environment to test integrations before pushing to production.
- Bulk user import that doesn't support CSV with role assignments — forces one-by-one provisioning.
- Audit log that expires after 30 days or cannot be exported.
- Having to contact vendor support to enable features that should be self-serve.

### Device / Access Patterns

| Context | Pattern |
|---------|---------|
| **Primary device** | Desktop (Chrome/Firefox), with multiple tabs across admin panels |
| **Mobile** | Rare — only for urgent access issues |
| **Integrations that matter** | Active Directory / SSO (SAML 2.0 / OAuth), REST API, Zapier, email server (SMTP/IMAP/OAuth), ERP (if applicable) |
| **Peak usage hours** | 8:00 AM – 9:30 AM (daily health check), reactive throughout the day for support tickets |

---

## Persona 6 — Executive / VP of Sales

### Profile

| Field | Detail |
|-------|--------|
| **Name** | Dana Whitfield |
| **Title** | VP of Sales / Chief Revenue Officer (CRO) |
| **Company type** | Growth-stage SaaS, professional services, or B2B technology |
| **Company size** | 50–500 employees |
| **Age** | 40–55 |
| **Tech comfort** | Medium — not a power-user of the CRM, but highly data-literate and expects accurate, visual summaries |

### Primary Goals

1. Accurately forecast revenue for the current quarter and next quarter with enough confidence to commit to the board and finance team.
2. Identify the top 3–5 revenue risks in the pipeline before they become misses, with enough lead time to intervene.
3. Monitor sales team performance at a high level — quota attainment, pipeline coverage ratio, win rate — without needing to dig into individual records.

### Key Pain Points with Current Tools

1. **Forecast confidence gap** — The number the CRM reports and the number the VP commits to the board diverge by 15–20% regularly. No way to apply judgment overrides or track commit vs. upside vs. best-case scenarios.
2. **Executive dashboard that requires a PhD** — Current dashboards are built for analysts, not executives. Too many filters, too much raw data, not enough signal. Takes 10 minutes to find the one number that matters.
3. **No historical trend context** — Can see the pipeline today but can't compare it to the same point last quarter. Pipeline velocity and win rate trend lines are entirely absent.

### Key Workflows in OpsNext CRM

1. **Weekly executive pipeline review** — Opens the Executive Dashboard — a single-screen view showing: total pipeline value, weighted forecast, pipeline-to-quota coverage ratio, deals at risk (stalled or missing next step), and top 10 open deals. Reviews in under 5 minutes.
2. **Quarterly forecast commit** — Views the Forecast Report broken down by rep, by stage, and by deal size. Applies three-scenario modeling (commit / upside / best-case). Exports or shares the forecast snapshot link with the CFO.
3. **Win/loss trend analysis** — Reviews the Win/Loss report filtered by quarter, by rep, and by competitor. Identifies patterns — e.g., 60% of losses in Q2 were to Competitor X on deals >$50K — to feed into go-to-market strategy.
4. **Board-ready reporting** — Generates a polished pipeline and revenue report on demand, formatted for executive presentation, with quarter-over-quarter trend lines and team-level quota attainment summary.

### Success Looks Like (A Good Day)

Dana opens the executive dashboard Monday morning. In 5 minutes she knows: pipeline coverage is 3.2x (healthy), two at-risk deals totaling $180K need her attention, and team quota attainment is tracking at 87% of plan with 6 weeks left in the quarter. She schedules a deal review for the two at-risk accounts, emails the forecast snapshot to the CFO, and moves on with her strategic agenda — no spreadsheet archaeology required.

### Frustration Triggers

- CRM session timeout that logs her out mid-presentation during a board meeting.
- Dashboards that require clicking into 4 different reports to assemble the one view she needs.
- Numbers that contradict what her managers told her in the morning standup — data trust is everything.
- No ability to annotate or comment on a forecast snapshot before sharing it with stakeholders.
- Mobile app that shows the same complex data-entry UI as desktop — she only needs read access and high-level KPIs on mobile.

### Device / Access Patterns

| Context | Pattern |
|---------|---------|
| **Primary device** | MacBook / Desktop (Chrome/Safari), primarily for Monday AM pipeline reviews and board prep |
| **Mobile** | iPhone — quick KPI glance, especially before leadership calls and investor meetings |
| **Integrations that matter** | Slack (deal win notifications, weekly pipeline digest), calendar (board meeting prep), Excel/Google Sheets (forecast model export) |
| **Peak usage hours** | Monday 7:30 AM – 9:00 AM (pipeline review), Thursday/Friday (forecast finalization) |

---

## Cross-Persona Design Principles

Derived from the patterns above, the following principles should inform all Phase 1 UX decisions:

### 1. Reduce Time-to-Log to Under 90 Seconds
Personas 1, 2, and 3 all cite data-entry overhead as a top frustration. Every activity logging flow must reach completion — with context pre-filled from the parent record — in three clicks or fewer.

### 2. Role-Aware Information Density
Personas 5 and 6 live at opposite ends of the complexity spectrum. The platform must surface the right depth per role by default: full configuration access for admins, single-screen KPI summaries for executives. Avoid one-size-fits-all dashboard defaults.

### 3. Pipeline Data Must Be Real-Time and Trustworthy
Personas 2 and 6 both explicitly cite forecast inaccuracy as a top pain point. Any time-delay in pipeline updates or inconsistent stage definitions erodes trust in the entire platform. Eventual consistency is not acceptable for pipeline stage changes.

### 4. Attribution and Audit Trails Are Non-Negotiable
Personas 4 and 5 both require complete historical records — lead source for marketing attribution, configuration change history for admin governance. Immutable logs with export capability are a baseline expectation, not a premium feature.

### 5. Mobile Must Be Read-Optimized, Not Write-Optimized
Personas 1 and 3 use mobile for quick capture after calls. Persona 6 uses mobile for read-only KPI checks. The mobile experience should prioritize: task list, quick activity log (3-field form), and top-level dashboard — not a full desktop feature port.

---

## Revision History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-06-16 | Product Management & UX Lead | Initial document — 6 personas, Phase 1 scope |
