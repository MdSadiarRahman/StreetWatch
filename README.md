# 🏙️ StreetWatch — Autonomous Civic Action, Spatial Intelligence & AI Auto-Triage Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Platform-street--watch--omega.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://street-watch-omega.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.23%20App%20Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%20Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4%20Light%20%26%20Dark-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Relational%20Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9%20GIS%20Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash%20Triage-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

🌐 **Live Hosted Platform:** **[https://street-watch-omega.vercel.app](https://street-watch-omega.vercel.app)**  
**Lead Architect & Developer:** [Md Sadiar Rahman](https://github.com/MdSadiarRahman)  
**Target Domain:** Municipal Infrastructure Governance & Urban Hazard Resolution (Dhaka North / South City Wards)

</div>

---

## 📖 Table of Contents

1. [Executive Overview & Problem Statement](#-executive-overview--problem-statement)
2. [How StreetWatch Works (System Architecture & Pipeline)](#-how-streetwatch-works-system-architecture--pipeline)
3. [Core Intelligence & Optimization Engines](#-core-intelligence--optimization-engines)
4. [Portal-by-Portal Feature Guide (Where Everything Lives)](#-portal-by-portal-feature-guide-where-everything-lives)
5. [Step-by-Step User Guides](#-step-by-step-user-guides)
6. [Technology Stack & Languages](#-technology-stack--languages)
7. [Frontend Architecture & Design System](#-frontend-architecture--design-system)
8. [Backend, Database & Security Architecture](#-backend-database--security-architecture)
9. [REST API Overview](#-rest-api-overview)
10. [Project File & Directory Structure](#-project-file--directory-structure)
11. [Developer Setup & Running Locally](#-developer-setup--running-locally)
12. [Automated Verification & QA Test Suites](#-automated-verification--qa-test-suites)

---

## 🌟 Executive Overview & Problem Statement

Traditional municipal complaint systems often fail both residents and city engineers in four common ways:

1. **Lack of Transparency:** Submitted complaints disappear into queues without explainable priority scores or clear progress tracking.
2. **Spatial Duplication:** Multiple residents report the exact same pothole or electrical hazard, cluttering dispatch boards with duplicate tickets.
3. **Blind Dispatch & Crew Saturation:** Dispatchers assign urgent issues to overloaded technicians without automated workload capacity checks or fallback options.
4. **Silent Mid-Workflow Failures:** Field blockers stall work orders without automatic recovery, SLA escalation, or citizen verification before closure.

**StreetWatch** addresses these challenges by unifying **four role-based civic portals** into one real-time spatial operations platform:

- **Public Civic Transparency Portal (`/`, `/reports/[id]`)** — Open citywide hazard explorer, interactive Leaflet GIS map, community attestation, explainable AI reasoning, and before/after repair proof.
- **Citizen Portal (`/report`, `/dashboard`)** — Guided issue reporting with map coordinate picking, 50m Haversine duplicate detection, automated AI triage, and personal report history tracking.
- **Authority Command Center (`/authority`)** — High-density operational desk for municipal engineers featuring **Challenge A02 Conflicting Constraint Optimization**, AI triage override controls, crew saturation conflict resolution, and **Challenge A07 Failure Simulation & Autonomous Self-Recovery**.
- **Field Worker Terminal (`/worker`)** — Mobile-first, one-handed work order execution terminal with rapid status transitions, repair checklists, and proof capture.
- **Unified Account, Preferences & Theme System (`/profile`, `/settings`, `/login`, `/register`, `/forgot-password`)** — Role-aware profile management, password strength enforcement, tokenized email verification and password recovery, plus synchronized **Light / Dark / System Mode** across every portal and map canvas.

---

## ⚙️ How StreetWatch Works (System Architecture & Pipeline)

Every civic issue in StreetWatch flows through an auditable **multi-stage operational pipeline** connecting citizens, AI triage engines, municipal dispatchers, and field crews:

```mermaid
flowchart TD
    subgraph Stage1["1. Citizen Submission & Spatial Guard"]
        A["Citizen opens /report & drops GPS pin"] --> B["Real-time Haversine 50m Duplicate Check\n(GET /api/reports/check-duplicate)"]
        B -->|"Duplicate within 50m"| B1["Prompts to verify existing report instead of creating duplicate"]
        B -->|"Unique hazard"| C["Input Validation & Report Creation\n(POST /api/reports)"]
    end

    subgraph Stage2["2. AI Auto-Triage & Scoring Engine"]
        C --> D["Gemini 2.5 Flash Triage\n(+ Deterministic Fallback Heuristic)"]
        D --> E["Explainable Priority Score (5-100)\nSeverity + Risk + Votes + Aging"]
        E --> F["Published to Public Map (/)\n& Authority Queue (/authority)"]
    end

    subgraph Stage3["3. Community Attestation & Authority Dispatch"]
        F --> G["Citizens confirm/flag on / & /reports/[id]\n(POST /api/reports/[id]/verify)"]
        G --> H{"A02 Constraint Optimizer\n(POST /api/admin/optimize-assign)"}
        H -->|"Crew capacity available"| I["Auto-Assign to Department Crew\n(Status -> ASSIGNED)"]
        H -->|"Crew saturated (100%)"| J["Conflict Modal: AI Fallback Strategies\nCROSS_ZONE_FALLBACK | PREEMPT_LOW_PRIORITY\n(or Manual Worker Assignment)"]
        J --> I
    end

    subgraph Stage4["4. Field Execution & A07 Self-Recovery"]
        I --> K["Operative accepts on /worker\n(ASSIGNED -> IN_PROGRESS)"]
        K -->|"Normal completion"| L["Uploads After-Repair Photo Proof\n(Status -> RESOLVED)"]
        K -->|"A07 Blocker / Failure Triggered"| M["State moved to FAILED_RECOVERY\nLogged in WorkflowStepLog + AuditLog"]
        M --> N{"A07 Recovery Engine\n(POST /api/workflow/[reportId]/recover)"}
        N -->|"Eligible for retry"| N1["Strategy 1: Auto-Retry Task"]
        N -->|"Escalation needed"| N2["Strategy 2: Revoke Stuck Lock,\nRollback to PRIORITY_SCORED & +10 Priority"]
        N1 --> I
        N2 --> H
    end

    subgraph Stage5["5. Citizen Final Sign-Off"]
        L --> O["Original Reporter compares\nBefore vs After Photo Proof"]
        O -->|"POST /api/reports/[id]/signoff"| P["Status -> CITIZEN_VERIFIED\nArchived in Public Transparency Ledger"]
    end
```

### Issue Status State Machine (`src/lib/workflow/rules.ts`)

Transitions between database `ReportStatus` states are validated by `VALID_TRANSITIONS`:

| Current State | Allowed Next States | Actor / Trigger |
| :--- | :--- | :--- |
| `REPORTED` | `AI_TRIAGED`, `REJECTED` | Automated AI triage pipeline / Moderator |
| `AI_TRIAGED` | `COMMUNITY_VERIFIED`, `PRIORITY_SCORED`, `REJECTED` | Community confirmations or priority engine |
| `COMMUNITY_VERIFIED` | `PRIORITY_SCORED`, `ASSIGNED`, `REJECTED` | Priority engine / Authority dispatch |
| `PRIORITY_SCORED` | `ASSIGNED`, `REJECTED` | A02 Constraint Optimizer / Authority admin |
| `ASSIGNED` | `IN_PROGRESS`, `FAILED_RECOVERY` | Field Worker starts job or A07 blocker trigger |
| `IN_PROGRESS` | `RESOLVED`, `FAILED_RECOVERY` | Field Worker submits proof or A07 blocker trigger |
| `FAILED_RECOVERY` | `ASSIGNED`, `IN_PROGRESS`, `PRIORITY_SCORED` | A07 Recovery (`AUTO_RETRY` or `ROLLBACK_AND_ESCALATE`) |
| `RESOLVED` | `CITIZEN_VERIFIED`, `IN_PROGRESS` | Original reporter signs off or requests rework |
| `CITIZEN_VERIFIED` | Terminal (Verified & Archived) | Closed in public transparency ledger |
| `REJECTED` | Terminal | Dismissed/invalid issue closed |

*(On the frontend UI, `IssueStatusTimeline` maps these states cleanly into a 7-stage public progress tracker: `Reported` -> `AI Triaged` -> `Verified` -> `Assigned` -> `In Progress` -> `Resolved` -> `Closed`.)*

---

## 🧠 Core Intelligence & Optimization Engines

### 1. Multimodal AI Auto-Triage (`src/lib/ai/triage-engine.ts`)
- **Primary Inference:** Uses Google **Gemini (`gemini-2.5-flash`)** with a bounded timeout to classify reports into 6 hazard categories (`exposed-live-wire`, `open-manhole`, `deep-pothole`, `severe-waterlogging`, `broken-streetlight`, `garbage-overflow`), score severity (`10–95`), explain public safety impact, and recommend one of **4 municipal departments**.
- **Deterministic Fallback Heuristic:** If `GEMINI_API_KEY` is omitted or unreachable, a rule-based classification engine guarantees zero downtime for local evaluations and demos.
- **50m Geospatial Duplicate Prevention:** `findNearbyDuplicate()` searches unresolved nearby reports and computes **Haversine surface distance (in meters)** so residents can confirm existing tickets instead of flooding the queue with duplicates.

### 2. Explainable Mathematical Priority Scoring (`src/lib/ai/priority-engine.ts`)
`calculateExplainablePriority()` computes a transparent **5–100 priority score** stored in `AIAnalysis.priorityBreakdown` across four weighted factors:

$$\text{Priority} = \text{Clamp}\Big(\underbrace{\frac{\text{Severity}}{100} \times 40}_{\text{Max 40 pts}} + \underbrace{\min(25,\ 15 \times \text{BaseRiskWeight})}_{\text{Max 25 pts}} + \underbrace{\text{Clamp}(4 \cdot \text{Confirms} - 6 \cdot \text{Flags},\ 0,\ 20)}_{\text{Max 20 pts}} + \underbrace{\min\big(15,\ \lfloor\frac{\text{AgeHours}}{6}\rfloor \times 1.5 + 2\big)}_{\text{Max 15 pts}},\ 5,\ 100\Big)$$

| Priority Tier | Score Band | Operational Target |
| :--- | :--- | :--- |
| **Critical Emergency** (Red) | `85 – 100` (Pin tier `80+`) | Immediate rapid crew dispatch |
| **High Priority** (Orange) | `70 – 84` (Pin tier `60–79`) | Elevated safety hazard within 24h |
| **Medium Priority** (Amber) | `50 – 69` (Pin tier `40–59`) | Standard maintenance SLA (48h) |
| **Scheduled / Low** (Blue) | `< 50` | Scheduled maintenance queue |

### 3. Conflicting Constraint Optimizer — A02 (`optimizeWorkerAssignment`)
Field crews carry a maximum concurrent workload limit (`workerCapacity`, default `3`). When `POST /api/admin/optimize-assign` is executed:
- **Standard Dispatch (`STRICT`):** Assigns the eligible department technician with the fewest active work orders.
- **Saturation Conflict Detection (`CONFLICT_DETECTED`):** When all technicians in a target department reach 100% capacity, the optimizer returns structured **AI fallback strategies** via a conflict resolution dialog:
  1. **`CROSS_ZONE_FALLBACK`:** Reallocates an available technician from another department with spare capacity.
  2. **`PREEMPT_LOW_PRIORITY`:** Pauses the lowest-priority active task in the saturated department to free an immediate slot for the critical emergency.
  3. **Manual Worker Assignment:** Allows an authorized dispatcher to pick a specific technician explicitly.

### 4. Mid-Workflow Failure & Self-Recovery — A07 (`src/lib/workflow/workflow-engine.ts`)
- **Failure Simulation:** Moves an active ticket into `FAILED_RECOVERY` and appends records to `WorkflowStepLog` and `AuditLog`.
- **Autonomous Recovery:**
  - **Strategy 1 (`AUTO_RETRY`):** Retries the failed step (`RETRIED`) when eligible and restores task flow.
  - **Strategy 2 (`ROLLBACK_AND_ESCALATE`):** Releases the stalled technician assignment lock, rolls the report safely back to `PRIORITY_SCORED`, boosts urgency by **`+10` points** (capped at `100`), and queues it for immediate re-dispatch.

---

## 🗺️ Portal-by-Portal Feature Guide (Where Everything Lives)

| Portal / Module | Routes | Intended Role | Features & UI Components |
| :--- | :--- | :--- | :--- |
| **Public Civic Portal** | `/`, `/reports/[id]` | Open Public Access | • `PublicHero`: Platform mission + live interactive Dhaka preview pins<br/>• `LiveCitySnapshot`: Live aggregate metrics from `/api/analytics/summary`<br/>• `HowStreetWatchWorks`: Visual 5-step Report -> Resolution explainer<br/>• `PublicMapSection` (`CityMapCanvas`): Spatial pin clustering, 5 GIS layers (Incidents, Hotspots, Crews, Corridors, Facilities), 4 basemaps (Positron Light, Dark GIS, Satellite, OSM)<br/>• `RecentCommunityReports`: Cross-filtered issue directory by Search, Category (`ROAD`, `DRAINAGE`, `WASTE`, `STREETLIGHT`, `ELECTRICAL`, `OTHER`), Status, Priority, Ward, and Date Range<br/>• `IssueDetailDrawer` & `/reports/[id]`: Focused `SingleIssueMap`, `AIAutoTriagePanel`, `IssueStatusTimeline`, `EvidenceGrid` (Before/After photos), Community Confirm/Flag voting, and Citizen Final Sign-Off banner |
| **Citizen Portal** | `/report`, `/dashboard` | Citizen / Authority | • `/report`: Interactive `LocationPickerMap`, category & severity selectors, live 50m duplicate detector, photo evidence URL input, submission tracking receipt<br/>• `/dashboard`: Personal report history overview, KPI summary cards, AI triage reasoning snapshots, status badges, and resolution proof links |
| **Authority Command Center** | `/authority` | Authority Admin | • Dedicated operations terminal (`.ops-theme-root`, supports both Dark Command Mode and Civic Swiss Light Mode)<br/>• Live Bento telemetry grid, search, ward/status queue filtering<br/>• Interactive `CityMapCanvas` (auto-syncs Light/Dark map tiles)<br/>• `AIAutoTriagePanel` with severity/priority override form<br/>• A02 Conflict Resolution modal & batch priority recalculation (`A02 Recalculate`)<br/>• A07 Failure Simulator & 1-Click Autonomous Recovery controls<br/>• Critical alert notification dropdown |
| **Field Worker Terminal** | `/worker` | Field Operative | • Mobile-first one-handed field execution HUD (`.ops-theme-root`)<br/>• Active work order switcher ordered by urgency + location context<br/>• Quick status buttons (`Start Task`: `ASSIGNED -> IN_PROGRESS`, `Complete`: `IN_PROGRESS -> RESOLVED`)<br/>• Standard repair checklist chips + field notes input<br/>• Proof photo selector + full-screen zoom preview modal |
| **Account, Preferences & Auth** | `/profile`, `/settings`, `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`, `/verify-email/[token]` | Public Auth / Signed-In Users | • `/profile`: Avatar uploader, editable Name, Phone, Ward (`DHAKA_WARDS`), Location, Address, email verification trigger<br/>• `/settings`: 5-tab workspace (`Account`, `Security`, `Notifications`, `Preferences`, `Sessions`) featuring 3-mode **Color Theme Selector** (`Light`, `Dark`, `System`) + `ChangePasswordForm` + `PasswordStrengthMeter`<br/>• `/login` & `/register`: Standard credential forms + **1-Click Demo Access** cards for quick local evaluation |

---

## 🧭 Step-by-Step User Guides

### A. Citizen Workflow (Public Discovery, Reporting & Sign-Off)
1. **Browse Live Issues (`/`):** Open the home portal to explore the **Live City Map** (`/#live-map`) and **Recent Community Reports** (`/#recent-reports`). Filter by ward, severity tier, status, or category, or click any card/pin to open its summary drawer.
2. **Sign In or Create an Account (`/login` or `/register`):** Click **Sign In** in the top navbar. For local testing, click any **1-Click Demo Pass** on `/login` or register a new Citizen account at `/register`.
3. **Report a Civic Hazard (`/report`):**
   - Click **Report an Issue** in the navbar.
   - Select the hazard category, add a concise title and description, and click on the **LocationPickerMap** to position the GPS pin.
   - If another unresolved hazard already exists within **50 meters**, StreetWatch alerts you immediately so you can confirm the existing report instead.
   - Submit the report to receive your tracking number and automated AI triage analysis.
4. **Community Attestation & Final Repair Verification (`/reports/[id]`):**
   - Any signed-in user can **Confirm Hazard** or **Flag False** on an active report, dynamically updating its priority score.
   - Once a Field Operative resolves a report you submitted (`RESOLVED`), open the report page via `/dashboard`, inspect the **Before vs After Evidence**, and click **Approve & Close Issue** to transition it to `CITIZEN_VERIFIED`.

### B. Authority Engineer Workflow (`/authority`)
1. **Access the Terminal:** Sign in via the **Authority Command Key** option on `/login` and open `/authority`.
2. **Review AI Decisions & Override:** Click any issue in the queue or map -> inspect its 4-factor score in `AIAutoTriagePanel` -> optionally submit an administrative triage override with written justification.
3. **Test A02 Capacity Conflict Resolution:** Select an unassigned emergency issue in a department whose field crew is at capacity -> click **Optimize & Assign Crew** -> review the AI Conflict Modal tradeoffs and dispatch via **Cross-Zone Mutual Aid** or **Priority Preemption**.
4. **Test A07 Failure & Recovery:** Trigger **Simulate Failure** on an assigned issue to inspect `FAILED_RECOVERY` telemetry, then execute **Run Autonomous Recovery** to release worker locks, roll back to `PRIORITY_SCORED`, and apply the **`+10`** urgency boost.

### C. Field Operative Workflow (`/worker`)
1. **Access the Terminal:** Sign in as a Field Worker from `/login` (or use the `/worker` terminal gate) to view active assignments.
2. **Complete a Work Order:** Select an assigned issue -> tap **Start Work** (`IN_PROGRESS`) -> toggle repair completion checklist chips, add notes, attach proof photography, and tap **Complete & Mark Resolved** (`RESOLVED`).

### D. Theme Switching & Account Settings (`/profile`, `/settings`)
- **Global Dark & Light Mode:** Click the **Sun / Moon** icon in the top header (`Navbar`, `/authority`, or `/worker`) at any time, or pick **Light Mode**, **Dark Mode**, or **System** under **`/settings` -> Preferences**. Your preference persists locally across reloads and updates UI surfaces plus interactive Leaflet basemaps simultaneously.
- **Profile & Password Management:** Use the top-right **Account Dropdown** to edit profile fields on `/profile`, manage notification/table defaults on `/settings`, or rotate passwords securely.

---

## 🛠️ Technology Stack & Languages

| Layer | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Languages** | **TypeScript**, **CSS3**, **SQL (PostgreSQL)** | End-to-end strict TypeScript across React UI, API routes, engines, and verification scripts |
| **Framework & Runtime** | **Next.js (`14.2.23`) App Router**, **React (`18.3`)** | Hybrid SSR/CSR portals, Edge Middleware, REST API route handlers |
| **Styling & Animation** | **Tailwind CSS (`3.4`)**, **PostCSS**, **Framer Motion (`14.14`)**, **Lucide React**, `clsx`, `tailwind-merge` | Civic Swiss grid system, Light/Dark class theming, accessible micro-interactions |
| **Mapping & GIS** | **Leaflet (`1.9`)**, **React-Leaflet (`4.2`)** | Interactive spatial clustering, multi-layer overlays, location picking, theme-aware tiles |
| **AI & Decision Engine** | **Google Generative AI (`@google/generative-ai`)** + Deterministic Fallback | Automated classification, severity analysis, reasoning, & explainable scoring |
| **Database & ORM** | **Prisma (`5.22`)**, **PostgreSQL** | Normalized relational schema, cascading relations, migrations, & transactional state |
| **Security & Validation** | **Jose** (JWT), **Bcrypt.js**, **Node Crypto**, **Zod (`3.23`)** | Signed HTTP-only sessions, password hashing, one-time token hashing, schema validation |

---

## 🎨 Frontend Architecture & Design System

1. **Design Philosophy (`70 / 20 / 10`):**
   - **70% Civic Swiss Utility:** Clean whitespace/slate hierarchy, hairline 1px borders (`#E4E7EC` light / `#1E293B` dark), monospace ticket IDs and GPS readouts.
   - **20% Spatial GIS UI:** Interactive Leaflet canvases synchronized with issue cards (`selectedReportId`, `hoveredReportId`) and filter state.
   - **10% Glassmorphism & AI Highlighting:** Translucent floating map controls (`.spatial-hud`, `.glass-panel`) and restrained violet indicators for AI triage components.

2. **StreetWatch Civic Interaction System (`src/components/ui/CivicInteraction.tsx` & `src/app/globals.css`):**
   - Centralized micro-interaction tokens (subtle lift `-1.5px` to `-3px`, bounded scale `1.01`, active press `0.985`, ease-out bezier timing `200ms–240ms`, semantic status shadows).
   - Built-in accessibility guards: `@media (prefers-reduced-motion: reduce)` disables transform animations, enforces minimum touch target sizing (`40px–48px`), visible keyboard focus rings, and text labels alongside color indicators.

3. **Unified Light & Dark Mode Architecture (`src/components/theme/`):**
   - **Tailwind Class Mode:** `darkMode: "class"` in `tailwind.config.ts` paired with `ThemeProvider` supporting `"light"`, `"dark"`, and `"system"` preferences.
   - **Pre-Hydration Paint Sync:** Inline theme initializer in `src/app/layout.tsx` prevents flash of unstyled/wrong theme on initial page load.
   - **Operations Terminal Adaptation (`.ops-theme-root`):** Allows dark-first operational workspaces (`/authority`, `/worker`, `AIAutoTriagePanel`) to preserve high-contrast dark command panels while cleanly adapting to Light Mode when toggled.
   - **Map Tile Synchronization:** `CityMapCanvas`, `SingleIssueMap`, and `LocationPickerMap` react to theme updates to switch between light (`positron`) and dark (`dark_all`) CARTO vector basemaps.

---

## 🔐 Backend, Database & Security Architecture

### Relational Database Schema (`prisma/schema.prisma`)
StreetWatch uses **11 normalized PostgreSQL models** with foreign-key constraints and composite indexes:

- **`User`** — Role (`CITIZEN | AUTHORITY | FIELD_WORKER`), profile contact/location fields, verification flags, security rotation metadata, notification/UI preferences, and crew load tracking (`departmentId`, `workerCapacity`, `activeTaskCount`).
- **`Department` & `Category`** — 4 municipal departments (*Roads & Highways*, *Electrical & Lighting*, *Water & Drainage*, *Waste & Sanitation*) mapped to 6 risk-weighted civic issue categories.
- **`Report` & `AIAnalysis`** — Hazard report records (geolocation, ward, status, scores, confirmation/flag totals, duplicate linkage `parentReportId`, proof image URLs) paired 1:1 with explainable `AIAnalysis` breakdowns.
- **`Verification`** — Composite unique constraint per `[reportId, userId]` preventing duplicate votes.
- **`Assignment`** — Work order allocation records linking reports, assigned operatives, and dispatching officers.
- **`WorkflowStepLog` & `AuditLog`** — Immutable workflow execution trace (`SUCCESS | FAILED | RETRIED | ROLLED_BACK | ESCALATED`) and administrative audit logs.
- **`PasswordResetToken` & `EmailVerificationToken`** — Cryptographically hashed, single-use, expiring verification & recovery records.

### Offline-Resilient Demo Data Mode
When no local PostgreSQL instance is active, StreetWatch seamlessly falls back to an isolated in-memory + temporary demo store preloaded with realistic civic hazard reports (`rep-001` through `rep-016` across Dhaka wards) and role-based demo accounts—allowing full UI, AI, dispatch, worker, and account flows to operate out of the box.

### Security Architecture Summary
- **Edge RBAC Middleware (`src/middleware.ts`):** Enforces route-level authentication and role isolation across `/dashboard`, `/report`, `/authority`, `/worker`, `/profile`, and `/settings`.
- **Credential & Session Hygiene:** Adaptive hashing via `bcryptjs`, strict complexity validation (`strongPasswordSchema`), HTTP-only signed JWT cookies, and automatic session invalidation across devices upon password updates.
- **Abuse & Request Hardening (`src/lib/auth/security.ts`, `next.config.mjs`):** Same-origin checks on state-changing requests, sliding-window rate limiting on auth recovery actions, strict Zod payload validation, and hardened HTTP response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).

---

## 📡 REST API Overview

StreetWatch exposes **24 Next.js App Router API endpoints** under `src/app/api/`:

| Domain | Endpoints | Methods | Responsibility |
| :--- | :--- | :--- | :--- |
| **Authentication & Account** | `/api/auth/register`, `/login`, `/logout`, `/me` | `POST`, `GET` | Account registration (enforces `CITIZEN` role), sign-in/out, sanitized session lookup |
| | `/api/auth/profile`, `/api/auth/preferences` | `PATCH` | Profile field updates (incl. avatar image/URL) and notification/UI defaults |
| | `/api/auth/change-password`, `/forgot-password`, `/reset-password`, `/verify-email` | `GET`, `POST`, `PATCH` | Password rotation, tokenized recovery, and email verification |
| **Reports & Spatial GIS** | `/api/categories` | `GET` | List municipal categories and department SLAs |
| | `/api/reports`, `/api/reports/[id]` | `GET`, `POST` | Query/filter reports, inspect timeline details, create AI-triaged reports |
| | `/api/reports/check-duplicate` | `GET` | Haversine 50m duplicate hazard check by coordinates and category |
| | `/api/reports/[id]/verify`, `/api/reports/[id]/signoff` | `POST` | Community confirmation/flag voting and citizen final repair sign-off |
| **Analytics & Authority (A02)** | `/api/analytics/summary` | `GET` | Aggregate municipal KPIs, resolution rate, category & ward metrics |
| | `/api/admin/optimize-assign`, `/override-triage`, `/recalculate-priorities` | `POST` | A02 capacity optimization & conflict resolution, triage override, batch rescoring |
| **Workflow Recovery (A07)** | `/api/workflow/[reportId]/simulate-failure`, `/recover` | `POST` | Simulate field workflow failures and trigger autonomous retry/rollback recovery |
| **Field Operative** | `/api/worker/tasks`, `/api/worker/tasks/[id]/status` | `GET`, `PATCH` | Fetch assigned tasks and update field progress (`IN_PROGRESS` / `RESOLVED`) with proof |

---

## 📁 Project File & Directory Structure

```text
StreetWatch/
├── prisma/
│   ├── schema.prisma                         # 11 normalized PostgreSQL models + 4 enums
│   ├── seed.ts                               # Seed script for departments, categories, users, & reports
│   └── migrations/                           # Prisma SQL migration history
├── scripts/
│   ├── verify-system.ts                      # Unit, validation & workflow state-machine tests
│   ├── verify-responsive-a11y.ts             # 28-point responsive breakpoint, ARIA & WCAG audit
│   ├── test-all-portals.ts                   # 15-step E2E flow test across all portals
│   └── test-account-security.ts              # 18-step security, RBAC, password & session suite
├── src/
│   ├── middleware.ts                         # Edge JWT verification & role-based route guards
│   ├── types/index.ts                        # Shared TypeScript interfaces & contracts
│   ├── app/
│   │   ├── globals.css                       # Global interaction tokens + html.dark & .ops-theme-root styles
│   │   ├── layout.tsx                        # Anti-FOUC theme initializer, ThemeProvider, AuthProvider, Navbar
│   │   ├── page.tsx                          # Public City Portal
│   │   ├── profile/page.tsx                  # Authenticated Profile workspace
│   │   ├── settings/page.tsx                 # Authenticated Settings & Theme Preferences workspace
│   │   ├── (auth)/                           # Login, Register, Forgot Password, Reset Password, Verify Email
│   │   ├── (public)/reports/[id]/page.tsx    # Detailed Issue Inspector, Timeline, Evidence & Sign-off
│   │   ├── (citizen)/dashboard & report/     # Citizen Dashboard & Hazard Submission Wizard
│   │   ├── (authority)/authority/page.tsx    # Authority Command Center (A02/A07 Operations)
│   │   ├── (worker)/worker/page.tsx          # Field Worker Mobile Execution Terminal
│   │   └── api/                              # 24 RESTful Next.js Route Handlers
│   ├── components/
│   │   ├── account/                          # AccountDropdown, UserAvatar, AvatarUploader, Profile/Settings workspaces, Password forms
│   │   ├── auth/AuthContext.tsx              # Client authentication state provider
│   │   ├── data/                             # DataTable, FilterBar, Pagination, SearchInput, SortControl
│   │   ├── forms/                            # ReportIssueForm, CategorySelector, LocationPicker, SeveritySelector, ImageUpload, ConfirmationStep
│   │   ├── layout/                           # AppShell, TopNavigation, Sidebar, MobileNavigation, PageHeader, PageTransition
│   │   ├── map/                              # CityMapCanvas, SingleIssueMap, LocationPickerMap, MapDrawer, spatial-cluster.ts, gis-data.ts
│   │   ├── public/                           # PublicHero, LiveCitySnapshot, HowStreetWatchWorks, PublicMapSection, RecentCommunityReports, PublicTransparencyAndImpact, IssueDetailDrawer, PublicFooter
│   │   ├── streetwatch/                      # AIAutoTriagePanel, AIExplanationPanel, IssueStatusTimeline, BeforeAfterComparison, SLAIndicator, CrewCapacityGauge, IssueCard, IssuePriorityIndicator
│   │   ├── theme/                            # ThemeContext.tsx (light/dark/system state), ThemeToggle.tsx
│   │   └── ui/                               # Navbar, BrandLogo, CivicInteraction, Button, Badge, Card, Modal, Drawer, Toast, WorkflowStepper, EvidenceGrid
│   └── lib/
│       ├── db.ts                             # Prisma Client singleton
│       ├── mock-data.ts                      # Demo categories, departments, showcase reports, & accounts
│       ├── ai/                               # Gemini + fallback triage-engine.ts & priority-engine.ts
│       ├── auth/                             # Session helpers, JWT utilities, password policy, security helpers, fallback store
│       ├── email/mailer.ts                   # Transactional email templates & SMTP helper
│       ├── validations/                      # Zod schemas for auth, profile, preferences, password, & reports
│       └── workflow/                         # State machine rules.ts & A07 recovery workflow-engine.ts
├── .env.example                              # Safe environment variable template
├── next.config.mjs                           # Remote image patterns & HTTP security headers
├── tailwind.config.ts                        # darkMode: "class" & Civic Swiss theme tokens
└── tsconfig.json                             # Strict TypeScript compiler configuration
```

---

## 💻 Developer Setup & Running Locally

### Prerequisites
- **Node.js:** `v18.18+` or `v20+` (`npm` included)
- **PostgreSQL (Optional):** Required only if connecting a live database server; demo fallback storage runs out of the box without Postgres.
- **Google Gemini API Key (Optional):** Enables live LLM triage; automatically falls back to deterministic heuristics if omitted.

### 1. Clone the Repository
```bash
git clone -b streetwatch https://github.com/MdSadiarRahman/StreetWatch.git
cd StreetWatch
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Populate `.env` with your local credentials (never commit `.env` to Git):
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/streetwatch?schema=public"
JWT_SECRET="replace-with-a-cryptographically-random-secret"
GEMINI_API_KEY="your-gemini-api-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. (Optional) Sync PostgreSQL Schema & Seed Data
```bash
npx prisma db push
npx prisma db seed
```

### 5. Start the Application
- **Development Mode:**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm run build
  npm run start
  ```
Open **[http://localhost:3000](http://localhost:3000)** in your browser, and use `/login` -> **1-Click Demo Access** to switch seamlessly across **Citizen**, **Authority**, and **Field Operative** portals.

> [!TIP]
> **Windows PowerShell Execution Policy Note:**  
> If `npm run dev` throws `npm.ps1 cannot be loaded because running scripts is disabled on this system`, run commands using **`npm.cmd`** / **`npx.cmd`** (`npm.cmd run dev`, `npm.cmd run build`, `npm.cmd run start`) or allow local user scripts once in PowerShell:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

---

## 🧪 Automated Verification & QA Test Suites

StreetWatch includes **4 automated QA & audit scripts** alongside strict TypeScript compilation:

```bash
# 1. Static TypeScript validation
npx tsc --noEmit

# 2. Core domain math, crypto & state-machine unit verification
npx tsx scripts/verify-system.ts

# 3. 28-point Responsive Breakpoint, ARIA & Contrast Accessibility Audit
npx tsx scripts/verify-responsive-a11y.ts

# 4. 15-step End-to-End Portal Workflow Suite (against running server)
npx tsx scripts/test-all-portals.ts

# 5. 18-step Account, Profile, Settings & Security Verification Suite
npx tsx scripts/test-account-security.ts
```

### Latest Verified Results
- **`npx tsc --noEmit`** — `0` compiler errors
- **`scripts/verify-responsive-a11y.ts`** — `28/28` checks passed (`100%`)
- **`npm run build`** — Production bundle compiled cleanly (`22` App Router pages)
- **`scripts/test-all-portals.ts`** — `15/15` end-to-end citizen -> authority -> worker -> sign-off flows passed
- **`scripts/test-account-security.ts`** — `18/18` account & security invariants passed

---

## 📄 License

Open-source under the **MIT License**. Built and maintained by **Md Sadiar Rahman**.
