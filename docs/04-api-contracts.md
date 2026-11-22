# StreetWatch — REST API Specification & Contracts

> **Project:** StreetWatch  
> **Track:** World Problem Solver Track  
> **Competition:** Code-ArenaX Hack the Vibe 2026  
> **Document Stage:** Step 2B — API Contracts & Payload Schemas  
> **Document Path:** `docs/04-api-contracts.md`  
> **Status:** Approved Baseline  

---

## 1. Global Standards & Conventions

- **Base URL:** `/api`
- **Content-Type:** `application/json`
- **Authentication:** Bearer JWT in `Authorization` header or HTTP-only `session_token` cookie.
- **Standard Error Envelope:**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid coordinates supplied.",
      "details": [
        { "field": "latitude", "issue": "Latitude must be within valid range [-90, 90]" }
      ]
    }
  }
  ```
- **Standard Success Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "metadata": { "timestamp": "2026-11-23T00:00:00.000Z" }
  }
  ```

---

## 2. Authentication & Session Endpoints (`/api/auth`)

### 2.1 Register New User
- **Endpoint:** `POST /api/auth/register`
- **Role Required:** `Public`
- **Request Body:**
  ```json
  {
    "name": "Tanvir Ahmed",
    "email": "tanvir@example.com",
    "password": "Password123!",
    "role": "CITIZEN"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid_usr_123",
        "name": "Tanvir Ahmed",
        "email": "tanvir@example.com",
        "role": "CITIZEN",
        "trustScore": 1.0
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Error Responses:** `400 Bad Request` (Zod schema fail), `409 Conflict` (Email already registered).

### 2.2 Login User
- **Endpoint:** `POST /api/auth/login`
- **Role Required:** `Public`
- **Request Body:**
  ```json
  {
    "email": "tanvir@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "cuid_usr_123",
        "name": "Tanvir Ahmed",
        "email": "tanvir@example.com",
        "role": "CITIZEN"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Error Responses:** `401 Unauthorized` (Invalid email or password).

### 2.3 Current Session Profile
- **Endpoint:** `GET /api/auth/me`
- **Role Required:** Authenticated (`CITIZEN`, `AUTHORITY`, `FIELD_WORKER`)
- **Success Response (200 OK):** Returns current user record, role, and active task count.

---

## 3. Reports & Public Map Endpoints (`/api/reports`)

### 3.1 Query Reports (Public Map & Filterable Feed — M05)
- **Endpoint:** `GET /api/reports`
- **Role Required:** `Public`
- **Query Parameters:**
  - `search` (string, optional): search title, address, description.
  - `status` (string, optional): `REPORTED,IN_PROGRESS,RESOLVED`
  - `categoryId` (string, optional)
  - `wardZone` (string, optional): e.g., `Ward 4`
  - `minPriority` (number, optional): e.g., `50`
  - `page` (number, default: 1), `limit` (number, default: 20)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "cuid_rep_891",
          "title": "Severe Pothole on Mirpur Road",
          "description": "Deep road crater causing vehicle swerving",
          "imageUrl": "https://storage.streetwatch.city/reports/img_891.jpg",
          "latitude": 23.7808,
          "longitude": 90.3802,
          "address": "Road 12, Mirpur 10",
          "wardZone": "Ward 4",
          "status": "IN_PROGRESS",
          "priorityScore": 86.5,
          "severityScore": 38.0,
          "verificationCount": 14,
          "category": { "name": "Roads & Potholes", "slug": "roads-potholes" },
          "createdAt": "2026-11-23T00:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 142 }
    }
  }
  ```

### 3.2 Create Geo-Report (Ingestion, AI Triage & Duplicate Prevention — M01, M06)
- **Endpoint:** `POST /api/reports`
- **Role Required:** `CITIZEN`
- **Request Headers:** `Idempotency-Key: <unique-uuid>` (prevents duplicate submission on network double-clicks)
- **Request Body:**
  ```json
  {
    "title": "Exposed Live Wire Near Primary School",
    "description": "Downed electrical cable sparking after rain",
    "imageUrl": "https://storage.streetwatch.city/temp/wire_1.jpg",
    "latitude": 23.7812,
    "longitude": 90.3814,
    "address": "Opposite St. Peter School, Ward 4",
    "wardZone": "Ward 4",
    "categoryId": "cuid_cat_elec"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "cuid_rep_992",
      "status": "AI_TRIAGED",
      "aiAnalysis": {
        "detectedCategory": "Electrical Hazard",
        "confidenceScore": 0.96,
        "severityScore": 40.0,
        "reasoning": "High-risk exposed electrical wire in pedestrian zone adjacent to school."
      },
      "priorityScore": 92.4,
      "isDuplicate": false
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Spatial duplicate detected within 25m radius; returns primary existing report ID to encourage upvoting instead of duplicate creation.

### 3.3 Get Single Report Details (With AI Explainability & Audit Timeline)
- **Endpoint:** `GET /api/reports/:id`
- **Role Required:** `Public`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "report": {
        "id": "cuid_rep_992",
        "title": "Exposed Live Wire Near Primary School",
        "status": "ASSIGNED",
        "priorityScore": 92.4,
        "beforeProofUrl": "https://storage.streetwatch.city/reports/before_992.jpg",
        "afterProofUrl": null,
        "aiAnalysis": {
          "severityReasoning": "Critical live hazard",
          "priorityBreakdown": {
            "severityWeight": 40.0,
            "locationRiskWeight": 25.0,
            "communityConsensusWeight": 12.4,
            "slaDecayWeight": 15.0,
            "capacityPenalty": 0.0,
            "formula": "Score = 40.0 + 25.0 + 12.4 + 15.0 = 92.4"
          }
        },
        "workflowHistory": [
          { "stepName": "STEP_1_INGEST", "status": "SUCCESS", "executedAt": "..." },
          { "stepName": "STEP_2_AI_TRIAGE", "status": "SUCCESS", "executedAt": "..." },
          { "stepName": "STEP_5_DISPATCH", "status": "SUCCESS", "executedAt": "..." }
        ]
      }
    }
  }
  ```

---

## 4. Community Verification Endpoints (`/api/reports/:id/verify` — M06)

### 4.1 Cast Verification Vote (Anti-Duplicate Vote Enforcement)
- **Endpoint:** `POST /api/reports/:id/verify`
- **Role Required:** `CITIZEN`
- **Request Body:**
  ```json
  {
    "voteType": "CONFIRM",
    "comment": "Confirmed in person this morning, hazardous condition."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "cuid_rep_992",
      "newVerificationCount": 15,
      "updatedPriorityScore": 94.1,
      "message": "Community verification recorded successfully."
    }
  }
  ```
- **Error Responses:**
  - `409 Conflict`: `"User has already cast a verification vote on this report."` (Enforced via `@@unique([reportId, userId])`).

---

## 5. Explainable AI & Constraint Optimization (`/api/admin/optimize-assign` — **Challenge A02**)

### 5.1 Run Constraint-Based Worker Assignment
- **Endpoint:** `POST /api/admin/optimize-assign`
- **Role Required:** `AUTHORITY`
- **Request Body:**
  ```json
  {
    "departmentId": "cuid_dept_roads",
    "autoPreempt": true
  }
  ```
- **Success Response (200 OK — Normal Allocation):**
  ```json
  {
    "success": true,
    "data": {
      "assignedCount": 4,
      "assignments": [
        {
          "reportId": "cuid_rep_101",
          "workerId": "cuid_worker_03",
          "workerName": "Rafiqul Islam",
          "distanceKm": 1.4,
          "capacityRemaining": 1
        }
      ]
    }
  }
  ```
- **Boundary Response (200 OK with Conflicting Constraints / 100% Capacity Saturation):**
  ```json
  {
    "success": true,
    "data": {
      "status": "CONFLICT_RESOLVED_WITH_FALLBACK",
      "isCapacityExhausted": true,
      "conflictDetails": {
        "totalWorkers": 5,
        "maxCapacity": 15,
        "activeAssignedTasks": 15,
        "incomingCriticalCount": 3
      },
      "fallbackActionTaken": "PREEMPTION_AND_SECONDARY_DISPATCH",
      "optimizationNote": "Paused 2 low-priority cosmetic tasks to reassign primary crew to Critical Electrical Hazards. Dispatched secondary municipal containment crew for site perimeter.",
      "preemptedTasks": ["cuid_rep_044", "cuid_rep_052"],
      "unassignedHighUrgencyQueue": []
    }
  }
  ```

---

## 6. Automated Workflow & Recovery Endpoints (`/api/workflow` — **Challenge A07**)

### 6.1 Simulate Intermediate Step Failure (Hackathon Testing Hook)
- **Endpoint:** `POST /api/workflow/:reportId/simulate-failure`
- **Role Required:** `AUTHORITY`
- **Request Body:**
  ```json
  {
    "targetStep": "STEP_5_DISPATCH",
    "failureType": "WORKER_INACTIVITY_TIMEOUT"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "cuid_rep_992",
      "simulatedStep": "STEP_5_DISPATCH",
      "action": "WORKER_TIMEOUT_TRIGGERED",
      "workflowStateBefore": "ASSIGNED",
      "workflowStateAfter": "FAILED_RECOVERY",
      "stepLogId": "cuid_step_fail_771"
    }
  }
  ```

### 6.2 Trigger Automated Workflow Rollback & Recovery
- **Endpoint:** `POST /api/workflow/:reportId/recover`
- **Role Required:** `AUTHORITY`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "cuid_rep_992",
      "recoveryAction": "ROLLED_BACK_AND_RE_ENQUEUED",
      "restoredState": "PRIORITY_SCORED",
      "unassignedWorkerId": "cuid_worker_08",
      "auditLogId": "cuid_audit_901",
      "message": "Worker lock revoked. Ticket returned to priority dispatch pool."
    }
  }
  ```

---

## 7. Field Worker Actions (`/api/worker/tasks`)

### 7.1 Update Task Execution State
- **Endpoint:** `POST /api/worker/tasks/:reportId/status`
- **Role Required:** `FIELD_WORKER`
- **Request Body:**
  ```json
  {
    "status": "RESOLVED",
    "afterProofUrl": "https://storage.streetwatch.city/proof/repaired_992.jpg",
    "notes": "Hazardous wire safely disconnected, re-sleeved, and secured above ground level."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "cuid_rep_992",
      "status": "RESOLVED",
      "workerActiveTaskCount": 1
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `"afterProofUrl is mandatory when transitioning to RESOLVED."`

---

## 8. Citizen Sign-off & Closing (`/api/reports/:id/signoff`)

### 8.1 Confirm or Reopen Resolution
- **Endpoint:** `POST /api/reports/:id/signoff`
- **Role Required:** `CITIZEN` (Reporter of the issue)
- **Request Body:**
  ```json
  {
    "decision": "ACCEPT",
    "satisfactionRating": 5,
    "feedback": "Fixed cleanly within 12 hours. Great job!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "cuid_rep_992",
      "status": "CITIZEN_VERIFIED",
      "closedAt": "2026-11-23T08:00:00.000Z"
    }
  }
  ```

---

## 9. Analytics & KPI Aggregates (`/api/analytics/summary`)

### 9.1 District Bento Analytics Summary (M05)
- **Endpoint:** `GET /api/analytics/summary`
- **Role Required:** `Public` / `AUTHORITY`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalReports": 382,
        "resolvedReports": 294,
        "activeEmergencyCount": 12,
        "averageResolutionHours": 18.4,
        "resolutionRatePercentage": 76.9
      },
      "categoryBreakdown": [
        { "category": "Roads & Potholes", "count": 142 },
        { "category": "Electrical", "count": 68 },
        { "category": "Drainage & Sewer", "count": 94 },
        { "category": "Waste & Sanitation", "count": 78 }
      ],
      "hotspotWards": [
        { "wardZone": "Ward 4", "openCount": 24, "riskLevel": "CRITICAL" },
        { "wardZone": "Ward 9", "openCount": 18, "riskLevel": "HIGH" }
      ]
    }
  }
  ```
