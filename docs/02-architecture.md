# StreetWatch — System Architecture & Design Specification

> **Project:** StreetWatch  
> **Track:** World Problem Solver Track  
> **Competition:** Code-ArenaX Hack the Vibe 2026  
> **Document Stage:** Step 2A — System Design & Architecture Blueprint  
> **Document Path:** `docs/02-architecture.md`  
> **Status:** Approved Baseline  

---

## 1. High-Level System Architecture

StreetWatch is architected as a modular, layered full-stack application built on **Next.js (App Router)** with **TypeScript**, **PostgreSQL (Prisma ORM)**, and **Tailwind CSS**. It combines real-time geographic visualization, explainable AI decision optimization, and an event-driven state machine for civic problem resolution.

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Presentation & Client Layer (Next.js App Router)"]
        PublicUI["Public City Map & Details\n(Leaflet + Bento Overlays)"]
        CitizenUI["Citizen Portal\n(Report Wizard, Feed, Upvoting)"]
        AuthorityUI["Authority Command Center\n(Bento Grid, Analytics, Dispatch)"]
        WorkerUI["Field Worker Terminal\n(Mobile Feed, Proof Upload)"]
    end

    subgraph ApiLayer["⚡ API & Gateway Layer (Next.js Route Handlers + Actions)"]
        AuthMiddleware["RBAC & Session Guards\n(JWT / Auth Cookies)"]
        ZodValidator["Input Validation & Sanitization\n(Shared Zod Schemas - M06)"]
        ReportHandler["Reports & Community API"]
        WorkflowHandler["Workflow State Machine API"]
        AnalyticsHandler["Geospatial & KPI Aggregator"]
    end

    subgraph DomainLayer["🧠 Domain & Engine Layer"]
        AIEngine["Gemini AI Classifier\n(Category, Severity & Vision Triage)"]
        PriorityOptimizer["Explainable AI & Constraint Optimizer (A02)\n(Multi-Factor Scoring & Crew Optimization)"]
        WorkflowEngine["Automated Workflow Engine (A07)\n(8-Stage State Machine, Timeout Recovery)"]
    end

    subgraph PersistenceLayer["💾 Data & Storage Layer"]
        PrismaORM["Prisma Client ORM\n(Schema Validation & Transactions)"]
        PostgresDB[("PostgreSQL Database\n(Relational ACID Storage)")]
        AuditStore[("WorkflowStepLog & Audit Trail")]
        ObjectStorage[("Image & Proof Media Storage")]
    end

    PublicUI --> AuthMiddleware
    CitizenUI --> AuthMiddleware
    AuthorityUI --> AuthMiddleware
    WorkerUI --> AuthMiddleware

    AuthMiddleware --> ZodValidator
    ZodValidator --> ReportHandler
    ZodValidator --> WorkflowHandler
    ZodValidator --> AnalyticsHandler

    ReportHandler --> AIEngine
    ReportHandler --> PriorityOptimizer
    WorkflowHandler --> WorkflowEngine

    PriorityOptimizer --> PrismaORM
    WorkflowEngine --> PrismaORM
    AnalyticsHandler --> PrismaORM

    PrismaORM --> PostgresDB
    PrismaORM --> AuditStore
    ReportHandler --> ObjectStorage
```

---

## 2. Layered Component Architecture

| Layer | Technologies & Location | Primary Responsibilities |
| :--- | :--- | :--- |
| **Presentation Layer** | Next.js App Router, Tailwind CSS, Lucide Icons (`src/app/`, `src/components/`) | Renders mobile/desktop responsive interfaces following the Minimalist + Bento Grid design language (`#F8FAFC` canvas, `#FFFFFF` cards, `#0F172A` text, `#2563EB` primary). Interactive Leaflet mapping with glassmorphic cards. |
| **Validation & Security Layer** | Zod, Jose/Bcrypt, Middleware (`src/lib/auth/`, `src/lib/validations/`) | Enforces role-based route guards (`CITIZEN`, `AUTHORITY_ADMIN`, `FIELD_WORKER`). Validates coordinate bounds, MIME types, text limits, and idempotency keys to prevent duplicate actions. |
| **Domain Logic Engines** | TypeScript, Gemini API (`src/lib/ai/`, `src/lib/workflow/`) | **A02:** Computes explainable priority metrics, detects spatial duplicates, and resolves worker allocation conflicts under 100% capacity bottlenecks.<br>**A07:** Orchestrates the 8-stage state machine with automatic rollbacks and worker inactivity escalation. |
| **Data Persistence Layer** | Prisma ORM, PostgreSQL (`prisma/`, `src/lib/prisma.ts`) | Executes transactional ACID mutations, maintains relational integrity across reports, assignments, and audit logs. |

---

## 3. UML Use Case Architecture

```mermaid
flowchart LR
    Citizen["👤 Citizen"]
    Authority["🏛️ Authority / Admin"]
    Worker["👷 Field Worker"]

    subgraph UseCases["StreetWatch System Boundary"]
        UC1["Submit Geo-Report with Photo"]
        UC2["Browse Public Map & Filter Issues"]
        UC3["Verify / Upvote Nearby Issue"]
        UC4["Verify & Sign-off Resolution"]
        
        UC5["View District Bento Dashboard & KPIs"]
        UC6["Inspect Explainable AI Priority Scores"]
        UC7["Manage Worker Capacity & Overrides"]
        UC8["Inspect Audit Logs & SLA Breaches"]

        UC9["View Prioritized Route & Task Feed"]
        UC10["Acknowledge & Mark In-Progress"]
        UC11["Upload 'After' Photo & Materials Note"]
        UC12["Escalate On-Site Roadblocks"]
    end

    Citizen --> UC1
    Citizen --> UC2
    Citizen --> UC3
    Citizen --> UC4

    Authority --> UC5
    Authority --> UC6
    Authority --> UC7
    Authority --> UC8

    Worker --> UC9
    Worker --> UC10
    Worker --> UC11
    Worker --> UC12
```

---

## 4. End-to-End Dataflow & Sequence Diagrams

### 4.1 Sequence 1: Complete 8-Stage Civic Issue Lifecycle (M01, M04)

```mermaid
sequenceDiagram
    autonumber
    actor C as Citizen
    participant FE as Frontend Portal
    participant API as API Handler
    participant AI as Gemini & Priority Engine (A02)
    participant WF as Workflow Engine (A07)
    participant DB as PostgreSQL (Prisma)
    actor W as Field Worker
    actor A as Authority Admin

    C->>FE: Fill report + drop photo + GPS pin
    FE->>API: POST /api/reports (with Idempotency-Key)
    API->>DB: Check spatial duplicate within 25m radius
    alt Duplicate Found
        API-->>FE: Return 409 Conflict (Offer to upvote existing ticket)
    else Unique Issue
        API->>AI: Classify image, infer severity & base hazard score
        AI-->>API: Category: Road Hazard, Severity: 35/40
        API->>WF: Transition to STATE: REPORTED
        WF->>DB: Insert Report & WorkflowStepLog (REPORTED)
        API-->>FE: Return 201 Created (Report ID, Live Tracking URL)
    end

    Note over C,FE: Community Verification Phase
    actor C2 as Nearby Citizen
    C2->>FE: Verify issue ("I confirm this exists")
    FE->>API: POST /api/reports/:id/verify
    API->>DB: Record vote & recalculate Community Trust Score
    API->>AI: Trigger dynamic priority recalculation
    AI->>DB: Update Priority Score (e.g., 84/100)

    Note over WF,A: Dispatch & Execution Phase
    WF->>AI: Query Worker Allocation Optimizer
    AI-->>WF: Recommended: Worker #12 (Proximity 1.2km, Cap: 1/3)
    WF->>DB: Assign Worker & Transition to DISPATCHED
    W->>FE: Open Worker Terminal -> Accept Task
    FE->>API: POST /api/workflow/:id/transition (IN_PROGRESS)
    API->>WF: Validate transition rules
    WF->>DB: Update state to IN_PROGRESS & log timestamp

    Note over W,C: Resolution & Verification Phase
    W->>FE: Capture "After" repair photo + notes
    FE->>API: POST /api/workflow/:id/resolve
    API->>WF: Validate mandatory evidence criteria
    WF->>DB: Transition to WORKER_RESOLVED
    API-->>C: Notify Citizen: "Repair finished, please inspect"
    C->>FE: Review evidence & click "Confirm Fixed"
    FE->>API: POST /api/workflow/:id/verify-resolution
    API->>WF: Transition to CITIZEN_VERIFIED / CLOSED
    WF->>DB: Finalize ticket, archive SLA metrics
```

---

### 4.2 Sequence 2: Explainable AI Priority & Constraint Optimization under Contention (**Challenge A02**)

```mermaid
sequenceDiagram
    autonumber
    actor A as Authority Admin
    participant Engine as Priority & Constraint Engine (A02)
    participant DB as Database (Worker Roster & Tasks)

    Note over Engine,DB: Conflicting Constraint Scenario: 10 Critical Issues Arrive, All Workers at 100% Capacity
    Engine->>DB: Fetch active worker workloads for Roads Department
    DB-->>Engine: 5 Workers active, all 3/3 tasks booked (15/15 slots saturated)
    
    Engine->>Engine: Run Conflict Evaluation Algorithm
    Engine->>Engine: 1. Evaluate preemption criteria (Can Low/Medium tasks be paused?)
    alt Preemptible Low/Medium Tasks Found
        Engine->>Engine: Identify 3 lowest-score active tasks
        Engine->>DB: Mark preempted tasks as 'PAUSED_PREEMPTED' with restoration token
        Engine->>DB: Allocate freed worker slots to incoming Critical Emergencies
        Engine->>DB: Generate Explainable Recommendation Log
    else All Active Tasks are Also Critical (Infeasible Request)
        Engine->>Engine: 2. Activate Secondary Emergency Contingency
        Engine->>DB: Request Cross-Departmental Triage (General Safety Team)
        Engine->>DB: Flag Critical Queue Alert on Authority Bento Dashboard
        Engine->>DB: Log transparent bottleneck explanation: "Capacity exhausted (15/15 Critical). Secondary perimeter containment crew requested."
    end
    Engine-->>A: Return real-time conflict summary & recommended action plan
```

---

### 4.3 Sequence 3: Event-Driven Workflow Recovery & Rollback (**Challenge A07**)

```mermaid
sequenceDiagram
    autonumber
    participant Worker as Field Worker
    participant WF as Workflow State Machine (A07)
    participant Cron as Inactivity Monitor / Watchdog
    participant DB as PostgreSQL Database

    Note over Worker,DB: Worker Dispatched but Drops Offline / Abandons Task
    WF->>DB: Transition to DISPATCHED (Timestamp: T0, Timeout: T0 + 45m)
    
    Cron->>WF: Periodic check: Any DISPATCHED tickets where (Now - T0) > 45 mins?
    WF->>DB: Query overdue unacknowledged tickets
    DB-->>WF: Ticket #482 exceeds 45 min threshold without ACK
    
    Note over WF,DB: Automatic Failure Recovery & Rollback Execution
    WF->>DB: Begin Atomic Transaction
    WF->>DB: Unassign unresponsive Worker #08
    WF->>DB: Revert state from DISPATCHED to PRIORITY_SCORED
    WF->>DB: Insert WorkflowStepLog:\n- Trigger: TIMEOUT_AUTO_RECOVERY\n- Previous Worker: #08\n- Reason: 'Inactivity threshold (45m) breached without acceptance'\n- Status: READY_FOR_REDISPATCH
    WF->>DB: Commit Transaction
    WF->>WF: Re-enqueue into dispatch queue with elevated priority
```

---

## 5. Folder Structure & Architectural Blueprint

```text
streetwatch/
├── docs/
│   ├── 01-requirements.md        # Step 1: Requirements, Personas, Acceptance Criteria
│   ├── 02-architecture.md        # Step 2A: System Architecture & Mermaid Dataflows
│   ├── 03-database.md            # Step 2B: Database Schema, Relations & Data Dictionaries
│   ├── 04-api-contracts.md       # Step 2B: OpenAPI / REST API Contracts & Payload Schemas
│   └── 05-ui-ux-blueprint.md     # Step 2C: Bento Grid Layouts & Component Tree
├── prisma/
│   └── schema.prisma             # Relational Database Schema & Migrations
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login & Register views (M03)
│   │   ├── (public)/             # Public City Map, Issue Detail, Transparency Feed (M01, M05)
│   │   ├── (citizen)/            # Citizen Dashboard, Report Wizard, My Submissions
│   │   ├── (authority)/          # Command Center, Bento Analytics, Worker Dispatch (M01, A02)
│   │   ├── (worker)/             # Mobile Worker Terminal, Active Tasks, Proof Upload (M01)
│   │   └── api/                  # REST API Route Handlers (auth, reports, verify, workflow, admin)
│   ├── components/
│   │   ├── ui/                   # Button, Card, Badge, Modal, Input, Bento primitives
│   │   ├── map/                  # Leaflet Map Canvas, Pin Clusters, Glassmorphic Filter Overlay
│   │   ├── dashboard/            # Bento Metric Cards, Explainable AI Meter, Step-by-Step Tracker
│   │   └── forms/                # Report Creation Wizard, Photographic Proof Uploader
│   ├── lib/
│   │   ├── ai/                   # Gemini Vision Triage & A02 Explainable Priority Optimizer
│   │   ├── workflow/             # A07 Event-Driven State Machine & Inactivity Recovery
│   │   ├── auth/                 # RBAC Guards, JWT Session Token verification
│   │   └── validations/          # Shared Zod Schemas for payload validation (M06)
│   └── types/                    # Shared TypeScript interfaces, enums, API responses
```
