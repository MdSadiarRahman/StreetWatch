# StreetWatch — Final Hackathon Rubric & Submission Verification

**Project:** StreetWatch — Autonomous Civic Issue Reporting & Explainable Resolution Platform  
**Competition:** CodeArenaX: Hack the Vibe 2026  
**Track:** World Problem Solver Track  
**Document:** `docs/09-submission-checklist.md`  
**Author & Lead Engineer:** Md Sadiar Rahman  

---

## 1. Executive Scoring Summary

StreetWatch targets a **100/100 score** across all evaluated areas defined in the CodeArenaX Hack the Vibe 2026 rubric:

| Category | Component | Available Marks | Target Marks | Evidence Status |
| :--- | :--- | :---: | :---: | :--- |
| **Mandatory Core** | Requirements M01–M08 | **60** | **60** | **100% Implemented & Verified** |
| **Advanced Track** | A02: Intelligent Decisions & Optimization | **20** | **20** | **100% Implemented & Verified** |
| **Advanced Track** | A07: Multi-Step Workflow & Failure Recovery | **20** | **20** | **100% Implemented & Verified** |
| **Submission Quality** | S01: Video Demo & S02: Documentation | **Pass** | **Pass** | **Full Walkthrough & README Prepared** |
| **TOTAL** | | **100** | **100** | **CHAMPIONSHIP READY** |

---

## 2. Mandatory Requirements Evidence Map (M01–M08 — 60 Marks)

| Requirement ID | Description & Rubric Criteria | Source Code Files | UI Screens / Routes | Live Verification Steps |
| :--- | :--- | :--- | :--- | :--- |
| **M01** (25 Marks) | **Complete 3-Module End-to-End Workflow:** Citizen reports issue $\rightarrow$ Authority triage & assignment $\rightarrow$ Field Worker execution $\rightarrow$ Citizen sign-off. | `src/app/api/reports/route.ts`<br>`src/lib/workflow/workflow-engine.ts`<br>`src/app/api/reports/[id]/signoff/route.ts` | `/report`<br>`/authority`<br>`/worker`<br>`/reports/[id]` | 1. Submit issue at `/report`.<br>2. Assign in `/authority`.<br>3. Worker starts & resolves in `/worker`.<br>4. Citizen approves sign-off on `/reports/[id]`. |
| **M02** (20 Marks) | **Persistence & Relational Integrity:** PostgreSQL schema with 9 normalized relational models, foreign keys, cascade rules, and audit history. | `prisma/schema.prisma`<br>`src/lib/db.ts`<br>`prisma/seed.ts` | Database Schema & Seed Engine | Inspect `schema.prisma` showing models: `User`, `Category`, `Report`, `Verification`, `Assignment`, `WorkflowStepLog`, `AuditLog`. |
| **M03** (15 Marks) | **Authentication, Security & RBAC:** Cryptographic password hashing (bcrypt), stateless JWT cookies (jose HS256), and 4 discrete roles (`CITIZEN`, `AUTHORITY`, `FIELD_WORKER`, `ADMIN`). | `src/lib/auth/jwt.ts`<br>`src/lib/auth/session.ts`<br>`src/middleware.ts` | `/login`<br>`/register`<br>Role-Aware Navbar | 1. Click "Citizen Demo", "Authority Demo", or "Worker Demo" on `/login`.<br>2. Middleware guards access to `/authority` and `/worker`. |
| **M04** (15 Marks) | **Complex Business Logic:** Strict state machine transitions, SLA tracking, departmental matching, and capacity checking. | `src/lib/workflow/workflow-engine.ts`<br>`src/lib/ai/priority-engine.ts` | `/authority`<br>`/worker` | Non-sequential transitions (e.g., `SUBMITTED -> RESOLVED`) are rejected with 400. Worker capacity ceiling (max 3 tasks) strictly enforced. |
| **M05** (15 Marks) | **Dynamic Data Processing & Analytics:** Real-time metrics calculation, priority score recalculation, and workload aggregations. | `src/app/api/analytics/summary/route.ts`<br>`src/app/api/admin/recalculate-priorities/route.ts` | `/authority` Bento Grid Dashboard | Dynamic KPI cards update live: Resolution Rate %, Avg Turnaround Hours, Departmental Load, and Active Bottlenecks. |
| **M06** (10 Marks) | **Input Validation, Duplicate-Action Prevention & Edge Cases:** Zod bounding box checks, 50m Haversine duplicate prevention, anti-duplicate voting compound indexes. | `src/lib/validations/report.ts`<br>`src/lib/ai/triage-engine.ts`<br>`src/app/api/reports/[id]/verify/route.ts` | `/report`<br>`/reports/[id]` | 1. Submitting within 50m of an open issue warns citizen of duplicate.<br>2. Attempting to upvote twice or upvote one's own report is rejected. |
| **M07** (UI/UX) | **Responsive UI & Consistent Styling:** Minimalist Bento Grid design system, Glassmorphism map overlays, mobile-first field worker terminal. | `src/app/globals.css`<br>`src/components/map/CityMapCanvas.tsx`<br>`src/app/worker/page.tsx` | All application pages | Responsive on Mobile (`375px`), Tablet (`768px`), and Desktop (`1280px+`). |
| **M08** (DevOps) | **Environment Configuration & Seed Engine:** Zero friction onboarding with `.env.example`, automated seed scripts, and clean production build. | `.env.example`<br>`prisma/seed.ts`<br>`package.json` | Terminal CLI | `npx prisma db seed` populates realistic civic reports, categories, and saturated worker scenarios. |

---

## 3. Advanced Technical Challenges Evidence Map (A02 & A07 — 40 Marks)

### 3.1 Challenge A02: Intelligent Decisions & Conflicting Constraint Optimization (20 Marks)
**Core Innovation:** StreetWatch replaces arbitrary urgency tagging with a mathematically explainable priority formula and an algorithmic constraint optimizer for municipal resource dispatch.

1. **Explainable Formula Breakdown:**
   $$\text{Priority Score} = \text{Clamp}\Big(0.40 \cdot S + 0.25 \cdot (V \cdot U) + 0.20 \cdot A + 0.15 \cdot Z,\ 1,\ 100\Big)$$
   - $S$: AI Base Severity (1–100) estimated via Gemini / heuristic triage.
   - $V$: Community Verification Ratio ($V_{confirm} / (V_{confirm} + V_{flag})$).
   - $U$: Normalized Upvote Volume ($clamp(votes \cdot 10, 0, 100)$).
   - $A$: SLA Aging Factor ($clamp(hours / 72 \cdot 100, 0, 100)$).
   - $Z$: High-Risk Zone Multiplier (Hospital/School zones = 100, standard = 25).
2. **Conflicting Constraint Scenario:**
   - In urban civic management, high-priority emergencies frequently strike when all departmental field workers are already operating at 100% capacity (3/3 active assignments).
3. **Reproduction Steps for Judges:**
   - Log in as **Authority Admin** (`authority@streetwatch.demo`).
   - Navigate to `/authority`.
   - Locate the high-priority unassigned Electrical report (*"Dangerous Hanging Electric Wire"*).
   - Click **"Optimize & Assign Crew"**.
   - The engine analyzes candidate worker `worker1@streetwatch.demo` (Electrical Lead) and detects **100% Saturation (3/3 active work orders)**.
   - The UI surfaces the **A02 Saturation Conflict Modal**, offering 3 actionable fallback strategies:
     - **Strategy 1: Immediate Urgent Reassignment** (Preempts lowest-priority non-critical task).
     - **Strategy 2: Cross-Department Mutual Aid** (Delegates to adjacent certified crew).
     - **Strategy 3: Overtime Shift Extension** (Authorizes emergency overtime).
   - Select a strategy and click **"Confirm Assignment"**; the assignment executes transactionally and logs the override reason into `AuditLog`.

---

### 3.2 Challenge A07: Automated Multi-Step Workflow, Failure Simulation & Self-Recovery (20 Marks)
**Core Innovation:** Real-world civic repairs frequently suffer from mid-workflow disruptions (e.g., equipment failures, missing parts, hostile site conditions). Rather than leaving tickets stuck in limbo, StreetWatch implements a multi-step transactional state machine with automated failure recovery.

1. **Structured Multi-Step Lifecycle:**
   - `STEP_1_SUBMITTED` $\rightarrow$ `STEP_2_AI_TRIAGED` $\rightarrow$ `STEP_3_COMMUNITY_VERIFIED` $\rightarrow$ `STEP_4_CREW_ASSIGNED` $\rightarrow$ `STEP_5_MATERIALS_STAGED` $\rightarrow$ `STEP_6_FIELD_IN_PROGRESS` $\rightarrow$ `STEP_7_WORKER_RESOLVED` $\rightarrow$ `STEP_8_CITIZEN_SIGNOFF`.
2. **Failure Simulation Engine:**
   - Built directly into the Authority Command Center (`/api/workflow/[reportId]/simulate-failure`).
3. **Reproduction Steps for Judges:**
   - From `/authority`, click on any assigned or in-progress ticket.
   - Click the **"Simulate Field Failure (A07)"** button.
   - Select failure mode: `EQUIPMENT_FAILURE` (*"Hydraulic boom lift failed safety check"*).
   - Click **"Trigger Simulation"**.
   - Observe immediate atomic isolation:
     - Step `STEP_5_MATERIALS_STAGED` status transitions to `FAILED`.
     - Report status automatically transitions to `NEEDS_REVISION`.
     - Incident metadata is recorded in `WorkflowStepLog` and `AuditLog`.
4. **Autonomous Self-Recovery Execution:**
   - The ticket now displays a pulsing orange banner: *"Workflow Failure Detected"*.
   - Click **"Execute Autonomous Recovery"** (`/api/workflow/[reportId]/recover`).
   - The recovery engine executes:
     1. Releases the locked worker task assignment.
     2. Reverts the report status to `AI_TRIAGED`.
     3. Automatically escalates the report priority score by **`+10` points** to prevent SLA breach.
     4. Records `RECOVERY_ACTION_COMPLETED` in the audit timeline.
   - The ticket returns to the dispatch queue with elevated urgency for priority reallocation!

---

## 4. 5-Minute YouTube Demo & Judging Walkthrough Script (S01)

| Time | Segment | Screen / Action | Talking Points & What to Demonstrate |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:45** | **The Civic Crisis & Vision** | Presentation / Landing Page (`/`) | *"Municipal issue management is broken. Cities suffer from delayed triage, lost citizen trust, and field dispatch bottlenecks. Welcome to StreetWatch — the autonomous civic issue reporting and explainable resolution platform."* |
| **0:45 - 1:30** | **Citizen Reporting & AI Triage (M01, M06)** | `/report` Form | - Log in as Citizen (`citizen1@streetwatch.demo`).<br>- Show interactive Leaflet map pin selector with reverse geocoding.<br>- Enter: *"Live exposed electric wire sparking near school"*. Click Submit.<br>- Point out AI Auto-Triage: Automatically categorized as `STREETLIGHT`, assigned Priority `95/100`, and flagged as `CRITICAL EMERGENCY`. |
| **1:30 - 2:00** | **Duplicate Detection & Community Trust (M05, M06)** | `/report` & `/` Map Explorer | - Attempt to report another hazard within 30 meters.<br>- Show real-time 50m Haversine duplicate warning.<br>- Navigate to `/reports/[id]`; show Community Verification voting and anti-duplicate vote prevention. |
| **2:00 - 3:00** | **Authority Bento Center & A02 Conflict Optimization** | `/authority` Bento Dashboard | - Log in as Authority (`authority@streetwatch.demo`).<br>- Highlight live Bento Grid KPIs (resolution rate, department workloads).<br>- Demonstrate **Challenge A02**: Click "Optimize & Assign Crew" on the Electrical issue.<br>- Show the **A02 Saturation Conflict Modal** (worker at 3/3 capacity).<br>- Explain the mathematical priority breakdown and select "Immediate Urgent Reassignment". |
| **3:00 - 4:00** | **A07 Workflow Failure Simulation & Auto-Recovery** | `/authority` & Workflow Controls | - Demonstrate **Challenge A07**: Click "Simulate Field Failure (A07)".<br>- Select `EQUIPMENT_FAILURE`; witness the step mark `FAILED` and status shift to `NEEDS_REVISION`.<br>- Click "Execute Autonomous Recovery".<br>- Show worker unlock, state rollback to `AI_TRIAGED`, and automatic `+10` priority escalation. |
| **4:00 - 4:45** | **Field Worker Terminal & Proof of Repair (M01, M07)** | `/worker` Mobile Workspace | - Switch to Field Worker (`worker1@streetwatch.demo`).<br>- Show mobile-first task list with navigation badges.<br>- Tap "Start Work" (`IN_PROGRESS`).<br>- Tap "Resolve Issue" and attach photo proof of completed repair. |
| **4:45 - 5:00** | **Citizen Sign-Off Loop & Closing (M01)** | `/reports/[id]` Details Page | - Return to Citizen view; observe status is `RESOLVED`.<br>- Citizen clicks "Verify & Accept Resolution".<br>- Final sign-off is logged, citizen trust score increments, and ticket officially closes.<br>- Concluding wrap-up highlighting 100% full-stack implementation. |

---

## 5. Pre-Filled Hackathon Submission Form Fields

### PROJECT TITLE
`StreetWatch`

### SELECTED TRACK
`World Problem Solver Track`

### PROBLEM STATEMENT
Urban municipalities worldwide lose millions in inefficient civic maintenance and public distrust. Citizen complaints frequently disappear into unmonitored queues, field dispatchers lack real-time visibility into crew saturation, and mid-workflow field disruptions leave critical road and electrical hazards unresolved for weeks. StreetWatch provides an autonomous civic governance engine featuring multimodal AI triage, geospatial duplicate detection, explainable constraint-based worker dispatch (A02), and self-recovering multi-step workflows (A07) with verifiable citizen repair sign-off.

### ADVANCED CHALLENGES COMPLETED
1. **A02: Intelligent Decisions & Optimization (20 Marks):** Implemented an explainable multi-factor priority algorithm ($0.40 \cdot \text{Severity} + 0.25 \cdot \text{Community} + 0.20 \cdot \text{Aging} + 0.15 \cdot \text{Zone}$) coupled with a constraint optimization engine that dynamically detects worker saturation conflicts and generates 3 actionable resolution strategies (Preemptive Reassignment, Cross-Department Mutual Aid, Overtime Shift Extension).
2. **A07: Automated Multi-Step Workflow, Failure Simulation & Self-Recovery (20 Marks):** Built an 8-stage transactional state machine with isolated workflow step logging. Includes an interactive field failure simulator (`EQUIPMENT_FAILURE`, `MISSING_PARTS`, `HAZARDS`) and an automated self-recovery engine that releases worker locks, rolls back state safely, and escalates ticket urgency score ($+10$) to prevent SLA violations.

### DEMO CREDENTIALS FOR JUDGES
| Role | Email | Password | Quick Login |
| :--- | :--- | :--- | :--- |
| **Citizen (Reporter & Sign-off)** | `citizen1@streetwatch.demo` | `P@ssw0rd2026!` | 1-Click Button on `/login` |
| **Authority Admin (Command Center & A02/A07)** | `authority@streetwatch.demo` | `P@ssw0rd2026!` | 1-Click Button on `/login` |
| **Field Worker (Lead Technician)** | `worker1@streetwatch.demo` | `P@ssw0rd2026!` | 1-Click Button on `/login` |

---

## 6. Submission Verification Checklist

- [x] All 8 Mandatory Requirements (`M01` to `M08`) implemented and verified.
- [x] Advanced Challenge `A02` implemented with reproducible conflict demonstration.
- [x] Advanced Challenge `A07` implemented with interactive failure simulation and self-recovery.
- [x] Zero hardcoded secrets or API keys in Git version control.
- [x] `.env.example` verified with safe placeholders.
- [x] Full automated test suite passes with 100% success rate (`scripts/verify-system.ts`).
- [x] Next.js production build (`next build`) compiles cleanly with zero errors.
- [x] Demo walkthrough script (S01) and production `README.md` (S02) fully documented.
