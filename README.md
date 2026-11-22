# 🏙️ StreetWatch — Autonomous Civic Issue Reporting & Explainable Resolution Platform

[![CodeArenaX](https://img.shields.io/badge/CodeArenaX-Hack%20the%20Vibe%202026-6366F1?style=for-the-badge&logo=codeforces&logoColor=white)](https://github.com/MdSadiarRahman/StreetWatch)
[![Track](https://img.shields.io/badge/Track-World%20Problem%20Solver-10B981?style=for-the-badge)](https://github.com/MdSadiarRahman/StreetWatch)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6%20Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4%20Bento%20Grid-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> **Championship Submission for CodeArenaX: Hack the Vibe 2026 (World Problem Solver Track)**  
> **Lead Architect & Developer:** Md Sadiar Rahman ([saiftkd3@gmail.com](mailto:saiftkd3@gmail.com))

---

## 🌟 Executive Summary

Urban municipalities worldwide lose millions annually due to fragmented civic management: complaints disappear into bureaucratic black boxes, dispatchers lack visibility into field crew capacity, and mid-workflow disruptions leave hazardous road and electrical defects unaddressed for weeks.

**StreetWatch** transforms municipal civic maintenance into an autonomous, transparent, and resilient digital pipeline. Featuring:
1. **Multimodal AI Auto-Triage & Geospatial Duplicate Prevention:** Instantly analyzes photo reports, estimates hazard severity, detects 50m spatial duplicates, and routes issues to the correct municipal department.
2. **Explainable AI Prioritization & Conflicting Constraint Optimizer (A02):** Replaces subjective urgency with a mathematical multi-factor formula and dynamically resolves 100% field crew saturation conflicts.
3. **Multi-Step State Machine with Autonomous Failure Recovery (A07):** Manages an 8-stage repair lifecycle, provides mid-workflow failure simulation, and automatically rolls back blocked tasks while escalating urgency (+10) to prevent SLA breach.
4. **Verifiable Citizen Sign-Off Loop:** The reporting citizen holds final authority to inspect before-and-after photographic evidence and verify repair quality before ticket closure.

---

## 🏗️ System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Module1["Module 1: Citizen Community"]
        A["Citizen Pinpoints Hazard on Map"] --> B["AI Auto-Triage & 50m Duplicate Check"]
        B --> C["Community Verification & Upvotes"]
    end

    subgraph Module2["Module 2: Authority Command Center"]
        C --> D["Explainable Priority Scoring Formula"]
        D --> E{"A02 Constraint Optimizer"}
        E -->|"Worker Available"| F["Direct Dispatch"]
        E -->|"Worker Saturated (3/3)"| G["Conflict Resolution Modal<br/>(Reassign / Cross-Dept / Overtime)"]
        G --> F
    end

    subgraph Module3["Module 3: Field Worker Terminal"]
        F --> H["Mobile-First Work Order"]
        H --> I["Start Task (IN_PROGRESS)"]
        I --> J{"A07 Mid-Workflow State"}
        J -->|"Field Hazard / Failure"| K["Atomic Isolation (NEEDS_REVISION)"]
        K --> L["Autonomous Self-Recovery<br/>(Unlock Worker & +10 Priority)"]
        L --> D
        J -->|"Work Completed"| M["Upload 'After' Photo Proof"]
    end

    subgraph ClosingLoop["Final Verification Loop"]
        M --> N["Citizen Reviews Resolution Proof"]
        N --> O["Official Citizen Sign-off & Ticket Closure"]
    end
```

---

## 🚀 Advanced Technical Challenges Implemented

### 1. Challenge A02: Intelligent Decisions & Conflicting Constraint Optimization (20 Marks)
- **Transparent Mathematical Priority Formula:**
  $$\text{Priority} = \text{Clamp}\Big(0.40 \cdot \text{Severity} + 0.25 \cdot (\text{VerificationRatio} \cdot \text{Votes}) + 0.20 \cdot \text{Aging} + 0.15 \cdot \text{HighRiskZone},\ 1,\ 100\Big)$$
- **Conflicting Constraint Optimizer:** When an emergency occurs and candidate department technicians are at **100% capacity (3/3 active work orders)**, the optimizer flags a saturation conflict and surfaces 3 actionable resolution strategies:
  1. *Immediate Urgent Reassignment:* Preempts the lowest-priority non-critical job.
  2. *Cross-Department Mutual Aid:* Dispatches certified crews from adjacent departments.
  3. *Overtime Shift Extension:* Authorizes immediate emergency overtime dispatch.

### 2. Challenge A07: Automated Multi-Step Workflow, Failure Simulation & Self-Recovery (20 Marks)
- **8-Stage Transactional State Machine:** Governs transitions from `SUBMITTED` $\rightarrow$ `AI_TRIAGED` $\rightarrow$ `COMMUNITY_VERIFIED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CITIZEN_VERIFIED` $\rightarrow$ `CLOSED`.
- **Interactive Failure Simulation:** Allows judges to simulate field blockers (`EQUIPMENT_FAILURE`, `MISSING_PARTS`, `HAZARDOUS_CONDITIONS`) from `/authority`, which transitions the step to `FAILED` and the report to `NEEDS_REVISION`.
- **Autonomous Self-Recovery:** The one-click recovery engine releases worker assignment locks, logs an incident in `AuditLog`, rolls back ticket status to `AI_TRIAGED`, and escalates priority by **`+10` points** for immediate queue prioritization.

---

## 🔑 Judge Demo Accounts (Instant 1-Click Login)

The `/login` page features **1-Click Quick Demo Login** buttons pre-configured for evaluators:

| Role | Email | Password | Primary Interface | Key Capabilities to Test |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | `citizen1@streetwatch.demo` | `P@ssw0rd2026!` | `/report` & `/dashboard` | Submit issue with Leaflet map pin, AI triage, upvote issues, verify repairs |
| **Authority Admin** | `authority@streetwatch.demo` | `P@ssw0rd2026!` | `/authority` | Bento Grid analytics, A02 saturation conflict modal, A07 failure & recovery |
| **Field Worker** | `worker1@streetwatch.demo` | `P@ssw0rd2026!` | `/worker` | Mobile field terminal, milestone transitions, attach photo proof of repair |

---

## 💻 Quick Start & Local Setup

### Prerequisites
- **Node.js:** v18.18+ or v20+
- **Database:** PostgreSQL (or Docker container)
- **Package Manager:** `npm`

### Step 1: Clone Repository
```bash
git clone -b streetwatch https://github.com/MdSadiarRahman/StreetWatch.git
cd StreetWatch
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your PostgreSQL connection string in `.env` is accurate:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streetwatch?schema=public"
JWT_SECRET="streetwatch-super-secure-jwt-secret-key-hack-the-vibe-2026"
GEMINI_API_KEY="your-gemini-api-key-here" # Optional: falls back to rule-based heuristic
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Database Migrations & Realistic Seed Data
```bash
npx prisma db push
npx prisma db seed
```
> *The seed script populates 4 civic categories, realistic field technicians (including a saturated 3/3 crew member for testing A02), and active community reports.*

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing & Verification Suite

To verify all 14 unit, validation, cryptographic, and state machine tests:
```bash
npx tsx scripts/verify-system.ts
```
Expected output:
```
=================================================================
📊 TEST EXECUTION SUMMARY
=================================================================
Total Test Cases Executed: 14
Passed:                   14
Failed:                   0
Success Rate:             100.0%

🎉 ALL TESTS PASSED WITH ZERO REGRESSIONS!
```

To run typecheck:
```bash
npx tsc --noEmit
```

To compile production build:
```bash
npm run build
```

---

## 📁 Repository Structure & Documentation

```
StreetWatch/
├── docs/                               # Comprehensive System Design Specs
│   ├── 01-requirements.md              # Requirements & Rubric Mapping (M01-M08, A02, A07)
│   ├── 02-architecture.md              # System Architecture & Flow Specifications
│   ├── 03-database.md                  # Relational Schema Design & ER Diagrams
│   ├── 04-api-contracts.md             # Complete RESTful API Specifications
│   ├── 05-ui-ux-blueprint.md           # Bento Grid Design System & Wireframes
│   ├── 06-tech-stack.md                # Approved Stack Justifications & Constraints
│   ├── 07-test-report.md               # QA Matrix, Bug Log & Rubric Evidence
│   ├── 08-security-audit.md            # OWASP Audit, RBAC & Credential Hygiene
│   └── 09-submission-checklist.md      # Hackathon Rubric & Judge Walkthrough Script
├── prisma/
│   ├── schema.prisma                   # Normalized PostgreSQL Schema (9 Models)
│   ├── seed.ts                         # Realistic Demographic & Scenario Seed Engine
│   └── migrations/                     # SQL Migration History
├── public/                             # Static Assets & Icons
├── scripts/
│   └── verify-system.ts                # 14-Step Automated QA & State Machine Verification
├── src/
│   ├── app/                            # Next.js 14 App Router
│   │   ├── (auth)/                     # Auth Pages (/login, /register)
│   │   ├── api/                        # RESTful Route Handlers
│   │   │   ├── admin/                  # Authority Optimizer & Recalculation
│   │   │   ├── analytics/              # Live Aggregated KPIs
│   │   │   ├── auth/                   # JWT Session Endpoints
│   │   │   ├── reports/                # Report CRUD, Duplicate & Verification
│   │   │   ├── worker/                 # Field Crew Task Workspace
│   │   │   └── workflow/               # A07 Simulation & Self-Recovery
│   │   ├── authority/                  # Authority Bento Grid Command Center
│   │   ├── dashboard/                  # Citizen Personal Report History
│   │   ├── report/                     # Interactive Issue Submission Form
│   │   ├── reports/[id]/               # Report Details, Map & Sign-off Banner
│   │   ├── worker/                     # Field Worker Mobile Terminal
│   │   ├── layout.tsx                  # Root Shell with Toast & Session Providers
│   │   └── page.tsx                    # Public City Map Explorer
│   ├── components/                     # Reusable UI & Leaflet Canvas Components
│   ├── lib/
│   │   ├── ai/                         # Gemini Triage & A02 Priority Engines
│   │   ├── auth/                       # JWT Sign/Verify & Session Cookie Utilities
│   │   ├── db.ts                       # Prisma Singleton Client
│   │   ├── validations/                # Zod Input Schemas
│   │   └── workflow/                   # A07 State Machine & Recovery Handlers
│   └── middleware.ts                   # Edge RBAC Guard
├── .env.example                        # Safe Environment Variable Template
├── next.config.mjs                     # Security Headers & Remote Patterns
├── package.json                        # Dependencies & Scripts
├── tailwind.config.ts                  # Bento Grid & Glassmorphism Design Tokens
└── tsconfig.json                       # Strict TypeScript Configuration
```

---

## 🏆 Hackathon Rubric Alignment

| Rubric Item | Mark Allocation | StreetWatch Implementation |
| :--- | :---: | :--- |
| **M01: End-to-End Workflow** | 25 | Seamless 3-module pipeline: Citizen $\rightarrow$ Authority $\rightarrow$ Field Worker $\rightarrow$ Citizen Sign-off. |
| **M02: Data Persistence** | 20 | 9 normalized Prisma models with foreign keys, compound indexes, and immutable audit logs. |
| **M03: Auth & Security** | 15 | Bcrypt hashing, signed JWT cookies, Edge RBAC, and strict resource-level ownership guards. |
| **M04: Business Logic** | 15 | Deterministic state machine, SLA escalation, and departmental worker capacity enforcement. |
| **M05: Dynamic Data** | 15 | Live analytical KPIs, dynamic priority re-scoring, and real-time community verification impact. |
| **M06: Input & Duplicates** | 10 | Bounded Zod validation, Haversine 50m spatial duplicate suppression, and anti-duplicate voting. |
| **A02: Decision Optimizer** | 20 | Multi-factor mathematical formula + 100% capacity conflict detector with 3 fallback strategies. |
| **A07: Multi-Step Recovery** | 20 | 8-step execution with interactive failure simulation and atomic self-recovery with priority boost. |

---

## 📄 License

This project is submitted for the **CodeArenaX Hack the Vibe 2026 Hackathon**. Open-source under the [MIT License](LICENSE).
