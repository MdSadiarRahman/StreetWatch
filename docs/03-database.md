# StreetWatch — Database Design & Entity Relationship Model

> **Project:** StreetWatch  
> **Track:** World Problem Solver Track  
> **Competition:** Code-ArenaX Hack the Vibe 2026  
> **Document Stage:** Step 2B — Database ER Model & Schema Architecture  
> **Document Path:** `docs/03-database.md`  
> **Status:** Approved Baseline  

---

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : employs
    DEPARTMENT ||--o{ CATEGORY : manages
    CATEGORY ||--o{ REPORT : classifies
    USER ||--o{ REPORT : submits
    USER ||--o{ VERIFICATION : casts
    USER ||--o{ ASSIGNMENT : "assigned as worker"
    USER ||--o{ ASSIGNMENT : "dispatches as admin"
    USER ||--o{ AUDIT_LOG : initiates

    REPORT ||--o| AI_ANALYSIS : explains
    REPORT ||--o{ VERIFICATION : receives
    REPORT ||--o{ ASSIGNMENT : dispatches
    REPORT ||--o{ WORKFLOW_STEP_LOG : tracks
    REPORT ||--o{ REPORT : "parent duplicate of"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "CITIZEN | AUTHORITY | FIELD_WORKER"
        string departmentId FK "nullable"
        int workerCapacity "default: 3"
        int activeTaskCount "default: 0"
        float trustScore "default: 1.0"
        datetime createdAt
        datetime updatedAt
    }

    DEPARTMENT {
        string id PK
        string name UK
        int slaHours "default: 48"
        boolean isActive "default: true"
        datetime createdAt
        datetime updatedAt
    }

    CATEGORY {
        string id PK
        string name
        string slug UK
        string departmentId FK
        float baseRiskWeight "default: 1.0"
        datetime createdAt
        datetime updatedAt
    }

    REPORT {
        string id PK
        string title
        string description
        string imageUrl
        float latitude
        float longitude
        string address
        string wardZone
        string categoryId FK
        string reporterId FK
        enum status "REPORTED | AI_TRIAGED | COMMUNITY_VERIFIED | PRIORITY_SCORED | ASSIGNED | IN_PROGRESS | RESOLVED | CITIZEN_VERIFIED | FAILED_RECOVERY | REJECTED"
        float severityScore "0-100"
        float priorityScore "0-100"
        int verificationCount "default: 0"
        int flagCount "default: 0"
        boolean isDuplicate "default: false"
        string parentReportId FK "nullable self-ref"
        string beforeProofUrl "nullable"
        string afterProofUrl "nullable"
        datetime createdAt
        datetime updatedAt
    }

    AI_ANALYSIS {
        string id PK
        string reportId FK, UK
        string detectedCategory
        float confidenceScore
        string severityReasoning
        json priorityBreakdown "A02 explainable weights"
        string recommendedDepartment "nullable"
        string optimizationNote "nullable: conflict explanations"
        datetime createdAt
    }

    VERIFICATION {
        string id PK
        string reportId FK
        string userId FK
        enum voteType "CONFIRM | FLAG_FALSE"
        string comment "nullable"
        datetime createdAt
    }

    ASSIGNMENT {
        string id PK
        string reportId FK
        string workerId FK
        string assignedById FK
        boolean isAutoAssigned "default: true"
        string overrideReason "nullable"
        datetime assignedAt
        datetime completedAt "nullable"
    }

    WORKFLOW_STEP_LOG {
        string id PK
        string reportId FK
        string stepName
        enum status "SUCCESS | FAILED | RETRIED | ROLLED_BACK | ESCALATED"
        int attemptCount "default: 1"
        string errorMessage "nullable"
        string recoveryAction "nullable"
        datetime executedAt
    }

    AUDIT_LOG {
        string id PK
        string actorId FK "nullable"
        string action
        string entityType
        string entityId
        json metadata "nullable"
        datetime createdAt
    }
```

---

## 2. Model Specifications & Design Objectives

### 2.1 User & Access Control (M03)
- Stores identity and credentials for all three personas (`CITIZEN`, `AUTHORITY`, `FIELD_WORKER`).
- `workerCapacity` (default: 3) and `activeTaskCount` enable deterministic, real-time worker load tracking for the **A02 Constraint Optimizer**.
- `trustScore` enables weighted community verification calculations so verified citizens have proportional voting influence.

### 2.2 Department & Category Taxonomy
- Maps urban problem categories (e.g., `Roads & Potholes`, `Live Electric Cables`, `Open Manholes`, `Waterlogging`) directly to responsible municipal departments.
- `baseRiskWeight` provides a static baseline danger multiplier used in the A02 mathematical priority formula.

### 2.3 Report (Core Civic Entity — M01, M02, M05)
- Captures geospatial coordinates (`latitude`, `longitude`, `wardZone`) indexed for low-latency spatial clustering and map queries.
- `parentReportId` and `isDuplicate` enable spatial duplicate clustering: when duplicate issues are identified within a 25-meter radius, new submissions are linked to the primary parent ticket rather than polluting the municipal queue.
- Dual proof URLs (`beforeProofUrl` and `afterProofUrl`) enforce visual accountability before a ticket can transition to resolution.

### 2.4 AIAnalysis (Explainable AI — Advanced Challenge A02)
- Stores transparent machine reasoning:
  - `priorityBreakdown`: JSON object storing individual factor contributions:
    ```json
    {
      "severityWeight": 35.0,
      "locationRiskWeight": 20.0,
      "communityConsensusWeight": 14.2,
      "slaDecayWeight": 12.0,
      "capacityPenalty": 0.0,
      "formula": "Score = 35.0 + 20.0 + 14.2 + 12.0 - 0.0 = 81.2"
    }
    ```
  - `optimizationNote`: Records conflict resolution rationales when worker capacity saturation triggers automated preemption or secondary dispatch.

### 2.5 Verification (Fraud & Duplicate Vote Prevention — M06)
- **Hard Database Constraint:** `@@unique([reportId, userId])` guarantees that no citizen can cast multiple confirmation votes or spam flags on a single report.
- Dynamic aggregation updates `verificationCount` and `flagCount` on the parent report in an ACID transaction.

### 2.6 Assignment (Work Order Dispatch & Conflict Logging)
- Records worker dispatch events with timestamps and assignment origins (`isAutoAssigned: true/false`).
- `overrideReason` persists human supervisor justifications or automated fallback reasons when capacity limits require re-allocation.

### 2.7 WorkflowStepLog (Step Tracking & Inactivity Recovery — Advanced Challenge A07)
- Provides granular lifecycle traceability for all transitions.
- Records step attempts, error stack traces, and automatic rollback actions (e.g., worker timeout $\to$ state rolled back to `PRIORITY_SCORED` with unassign action).

### 2.8 AuditLog (System Security & Accountability)
- Immutable event logging of administrative actions, role modifications, manual priority overrides, and state transitions for compliance review.
