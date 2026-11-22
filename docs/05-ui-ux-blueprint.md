# StreetWatch — UI/UX Design System & Page Blueprint

> **Project:** StreetWatch  
> **Track:** World Problem Solver Track  
> **Competition:** Code-ArenaX Hack the Vibe 2026  
> **Document Stage:** Step 2C — UI/UX Design System & Page Blueprint  
> **Document Path:** `docs/05-ui-ux-blueprint.md`  
> **Status:** Approved Baseline  

---

## 1. Design Tokens & Visual Foundation

StreetWatch adheres to a **Minimalism + Bento Grid** aesthetic engineered for clarity, public trust, and high cognitive speed. Subtle **Glassmorphism** is applied selectively to floating map overlays and quick-action drawers.

### 1.1 Color Palette (Exact Hex & CSS Variable Tokens)

| Token Name | Hex Code | Tailwind Equivalent | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `--canvas-bg` | `#F8FAFC` | `bg-slate-50` | Primary application canvas background |
| `--card-bg` | `#FFFFFF` | `bg-white` | Elevated surface for Bento cards, modals, and sheets |
| `--card-border` | `#E2E8F0` | `border-slate-200` | 1px clean card boundary |
| `--text-primary` | `#0F172A` | `text-slate-900` | High-contrast headings and primary labels |
| `--text-secondary` | `#475569` | `text-slate-600` | Body text, descriptions, and metadata |
| `--text-muted` | `#94A3B8` | `text-slate-400` | Form placeholders, timestamps, and borders |
| `--primary-brand` | `#2563EB` | `bg-blue-600` | Primary action buttons, active navigation states |
| `--primary-hover` | `#1D4ED8` | `bg-blue-700` | Interactive hover state for primary elements |
| **Status: Critical / Emergency** | Text `#991B1B`<br>Bg `#FEF2F2`<br>Border `#FECACA`<br>Pin `#DC2626` | `text-red-800`<br>`bg-red-50`<br>`border-red-200`<br>`accent-red-600` | Exposed electrical wires, open manholes, collapsed roads, `FAILED_RECOVERY` |
| **Status: In-Progress / Warning** | Text `#92400E`<br>Bg `#FFFBEB`<br>Border `#FDE68A`<br>Pin `#D97706` | `text-amber-800`<br>`bg-amber-50`<br>`border-amber-200`<br>`accent-amber-600` | Worker dispatched, active repair in transit, workflow retrying |
| **Status: Verified / Community** | Text `#1E40AF`<br>Bg `#EFF6FF`<br>Border `#BFDBFE`<br>Pin `#2563EB` | `text-blue-800`<br>`bg-blue-50`<br>`border-blue-200`<br>`accent-blue-600` | Upvoted by nearby citizens, AI triage verified |
| **Status: Resolved / Success** | Text `#065F46`<br>Bg `#ECFDF5`<br>Border `#A7F3D0`<br>Pin `#059669` | `text-emerald-800`<br>`bg-emerald-50`<br>`border-emerald-200`<br>`accent-emerald-600` | Citizen verified, resolution proof approved |

### 1.2 Glassmorphism Elevation Tokens
- **Class:** `backdrop-blur-md bg-white/85 border border-slate-200/80 shadow-lg shadow-slate-900/5`
- **Application:** Floating map legend, map zoom controls, top sticky navigation bar, and slide-up mobile inspection drawers.

### 1.3 Typography & Sizing Scale
- **Headings & Interface:** `Inter` or `Plus Jakarta Sans` (`font-sans`)
- **Metric Numbers & Scores:** `JetBrains Mono` (`font-mono`) — used for priority scores (`94/100`), coordinates (`23.7808, 90.3802`), and step IDs (`STEP_4_PRIORITY_OPTIMIZE`).
- **Corner Radii:**
  - Bento Container Cards: `rounded-2xl` (16px)
  - Inputs & Action Buttons: `rounded-xl` (12px)
  - Pills & Status Badges: `rounded-full` (9999px)

---

## 2. Shared Navigation & Role-Aware Shell

### 2.1 Top Sticky Navigation Header (`h-16 / 64px`)

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [🛡️ StreetWatch] [Badge: Citizen/Authority/Worker]    |    [Map] [Report] [Dashboard]    |  [+ Report Issue]  [User ▾ (Demo)] |
+-------------------------------------------------------------------------------------------------------------------------+
```

- **Brand Landmark (Left):** Minimalist geometric shield logo with an integrated map pin glyph in `#2563EB` + Role Badge pill (`bg-slate-100 text-slate-700`).
- **Role-Aware Navigation Links (Center):**
  - **Citizen View:** `Public Map` (`/`), `Report Issue` (`/report`), `My Reports` (`/dashboard`).
  - **Authority View:** `Command Center` (`/authority`), `Live Map` (`/`), `Priority Queue` (`/authority/queue`), `Analytics` (`/authority/analytics`).
  - **Field Worker View:** `My Assigned Tasks` (`/worker`), `Resolved History` (`/worker/history`).
- **Quick Action & Demo Switcher (Right):**
  - High-visibility primary CTA: `+ Report Issue` (Royal Blue button).
  - Quick Demo Profile Switcher Dropdown: Allows judges and testers to switch active roles (`Citizen`, `Authority Admin`, `Field Worker`) with a single click.

---

## 3. Page-by-Page Wireframe & Layout Blueprint

### 3.1 Screen 1: Landing & Public City Map (`/`) — Split-Screen Layout

```text
+-------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR (64px, Sticky Glassmorphic)                                                                          |
+-----------------------------------------------------------+-------------------------------------------------------------+
| LEFT PANEL (420px, Fixed, Scrollable Feed)                | RIGHT PANEL (calc(100vw - 420px), Full-Height Leaflet Map)  |
|                                                           |                                                             |
| [🔍 Search issues by title, street, ward...             ] |  +-------------------------------------------------------+  |
|                                                           |  | [Leaflet Map Canvas - OSM Clean Carto Tile Layer]     |  |
| Filter Chips:                                             |  |                                                       |  |
| [All (142)] [Critical (12)] [In Progress] [Resolved]      |  |           🔴 (Critical Pin #992)                      |  |
| Category: [All Categories ▾]   Ward: [Ward 4 ▾]           |  |                                                       |  |
| Sort By:  [Highest AI Priority ▾]                         |  |                   🟡 (In-Progress Pin #891)           |  |
|                                                           |  |                                                       |  |
| +-------------------------------------------------------+ |  |         🟢 (Resolved Pin #410)                        |  |
| | Report Card #992                   [🔴 Critical 94/100]| |  |                                                       |  |
| | Exposed Live Wire Near School                         | |  |                                                       |  |
| | 📍 Road 12, Ward 4  •  ⏱️ 25 mins ago                  | |  |  +--------------------------------------------------+  |  |
| | 👍 15 Verifications  •  Status: Assigned              | |  |  | FLOATING GLASSMORPHIC MAP LEGEND & STATS PILL      |  |  |
| +-------------------------------------------------------+ |  |  | 🔴 Critical (12)  🟡 In-Progress (34)  🟢 Fixed (96) |  |  |
|                                                           |  |  | Live City Resolution Rate: 78.4%                  |  |  |
| +-------------------------------------------------------+ |  |  +--------------------------------------------------+  |  |
| | Report Card #891                [🟡 In-Progress 86/100]| |  +-------------------------------------------------------+  |
| | Severe Pothole on Mirpur Road                         | |                                                             |
| | 📍 Ward 4  •  ⏱️ 2 hours ago                          | |                                                             |
| +-------------------------------------------------------+ |                                                             |
+-----------------------------------------------------------+-------------------------------------------------------------+
```

---

### 3.2 Screen 2: Report Issue Creation Page (`/report`) — 2-Column Minimalist Form

```text
+-------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR                                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+
|                                    SUBMIT A CIVIC ISSUE REPORT                                                          |
|                                                                                                                         |
| +-------------------------------------------------------+ +-----------------------------------------------------------+ |
| | COLUMN 1: ISSUE DETAILS & EVIDENCE                    | | COLUMN 2: GEOLOCATION & LIVE AI DUPLICATE PREVIEW         | |
| |                                                       | |                                                           | |
| | Issue Title *                                         | | Pin Exact Location on Map *                               | |
| | [ e.g., Large open manhole on pedestrian path       ] | | +-------------------------------------------------------+ | |
| |                                                       | | | [Mini Map Canvas with Draggable Red Target Pin]       | | |
| | Category *                                            | | | Lat: 23.7812  Lng: 90.3814  (Auto-reverse geocoded)   | | |
| | [ Select Category (or AI Auto-Detect)              ▾] | | +-------------------------------------------------------+ | |
| |                                                       | | Detected Ward / District: [Ward 4, Mirpur Sector 10     ] | |
| | Photographic Evidence (Drag & Drop or Camera) *       | |                                                           | |
| | +---------------------------------------------------+ | | +-------------------------------------------------------+ | |
| | | 📷 Drop photo here (EXIF GPS auto-extracted)      | | | | 🤖 LIVE AI DUPLICATE & SEVERITY PREVIEW               | | |
| | | [ Upload File ] Supported: JPG, PNG, WebP         | | | | "Photo analyzed: High-confidence Pothole / Road Void. | | |
| | +---------------------------------------------------+ | | |  No duplicate reports within 50m radius. Clean!"      | | |
| |                                                       | | +-------------------------------------------------------+ | |
| | Detailed Description                                  | |                                                           | |
| | [ Explain the issue severity and immediate hazard...] | | [ SUBMIT CITIZEN REPORT (Trigger AI Triage) ]             | |
| +-------------------------------------------------------+ +-----------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

### 3.3 Screen 3: Issue Details & Live Lifecycle Page (`/reports/[id]`)

```text
+-------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR                                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+
| [← Back to Map]  Issue #992: Exposed Live Wire Near School                       [Badge: ASSIGNED]  [Priority: 94/100]  |
|                                                                                                                         |
| +-------------------------------------------------------+ +-----------------------------------------------------------+ |
| | LEFT SECTION (65%): EVIDENCE & COMMUNITY VERIFICATION | | RIGHT SECTION (35%): EXPLAINABLE AI & WORKFLOW TIMELINE   | |
| |                                                       | |                                                           | |
| | +---------------------------------------------------+ | | +-------------------------------------------------------+ | |
| | | Before Repair Photo (High Resolution)             | | | | 🧠 EXPLAINABLE AI PRIORITY CARD (Challenge A02)       | | |
| | | [ Image: Sparking wire on wet pavement ]          | | | | Overall Score: [ 94 / 100 ] (Critical Urgency)        | | |
| | +---------------------------------------------------+ | | | Factor Breakdown:                                     | | |
| | 📍 Location: Road 12, Ward 4 (Near Primary School)   | | | | • Hazard Severity: [████████████████████] 40/40       | | |
| | Reported by: Tanvir Ahmed • 25 mins ago              | | | | • Location Risk:   [████████████████░░░░] 20/25       | | |
| |                                                       | | | • Community Trust: [█████████████░░░░░░░] 19/20       | | |
| | +---------------------------------------------------+ | | | • SLA Aging Decay: [███████████████░░░░░] 15/15       | | |
| | | 👥 COMMUNITY CONSENSUS BAR (M06)                  | | | | Plain-Language Rationale:                             | | |
| | | 15 Citizens have confirmed this issue exists      | | | | "High-voltage exposed cable located <50m from school | | |
| | | [ 👍 I Confirm This Hazard (+1) ]  [ ⚠️ Flag Fake ]| | | | with rain forecast. Dynamic priority auto-escalated."| | |
| | +---------------------------------------------------+ | | +-------------------------------------------------------+ | |
| |                                                       | |                                                           | |
| | +---------------------------------------------------+ | | +-------------------------------------------------------+ | |
| | | ✅ CITIZEN RESOLUTION SIGN-OFF (When Fixed)       | | | | 🔄 LIVE AUTOMATED WORKFLOW STEPPER (Challenge A07)   | | |
| | | "Field Worker uploaded After Repair Photo:"       | | | | [✓] STEP 1: REPORT_INGESTED        (00:00:01)         | | |
| | | [ After Photo Thumbnail: Insulated Wire ]         | | | | [✓] STEP 2: AI_VISION_TRIAGED      (00:00:04)         | | |
| | | [ Confirm Fixed & Close ]  [ Dispute Resolution ] | | | | [✓] STEP 3: COMMUNITY_VERIFIED     (00:12:30)         | | |
| | +---------------------------------------------------+ | | | [✓] STEP 4: PRIORITY_CALCULATED    (00:12:32)         | | |
| |                                                       | | | [●] STEP 5: WORKER_ASSIGNED        (00:15:10 - Active)| | |
| |                                                       | | | [○] STEP 6: FIELD_IN_PROGRESS      (Pending)          | | |
| |                                                       | | | [○] STEP 7: WORKER_RESOLVED        (Pending)          | | |
| |                                                       | | | [○] STEP 8: CITIZEN_SIGN_OFF       (Pending)          | | |
| |                                                       | | +-------------------------------------------------------+ | |
+-----------------------------------------------------------+-------------------------------------------------------------+
```

---

### 3.4 Screen 4: Citizen Personal Dashboard (`/dashboard`)

```text
+-------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR                                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+
| CITIZEN DASHBOARD — Welcome back, Tanvir Ahmed                                                                          |
|                                                                                                                         |
| +---------------------------+ +---------------------------+ +---------------------------------------------------------+ |
| | 📋 MY SUBMISSIONS         | | 🤝 CIVIC TRUST IMPACT     | | 🏆 RESOLVED ISSUES                                      | |
| | [ 7 Reports Filed ]       | | [ Level 3 — 94% Accuracy] | | [ 5 Civic Repairs Confirmed ]                           | |
| +---------------------------+ +---------------------------+ +---------------------------------------------------------+ |
|                                                                                                                         |
| +---------------------------------------------------------+ +---------------------------------------------------------+ |
| | ACTIVE REPORTS TRACKER                                  | | NEARBY ISSUES NEEDING YOUR VERIFICATION (Within 2.5km)  | |
| | • #992 Live Wire — [Assigned] — Priority 94/100         | | • Open Manhole on 5th Ave (450m away)                   | |
| | • #841 Waterlogging — [In-Progress] — Priority 72/100   | |   [ 👍 Confirm (+1) ]  [ Inspect on Map ]               | |
| | • #712 Broken Light — [Resolved] — [ Sign-off Now ]     | | • Streetlight Failure at Crossroad (800m away)          | |
| +---------------------------------------------------------+ +---------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

### 3.5 Screen 5: Authority Command Center (`/authority`) — Signature Bento Grid

```text
+-------------------------------------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR                                                                                                      |
+-------------------------------------------------------------------------------------------------------------------------+
| MUNICIPAL COMMAND CENTER — Real-Time District Overview                                                                  |
|                                                                                                                         |
| +----------------------+ +----------------------+ +-------------------------+ +---------------------------------------+ |
| | 🚨 CRITICAL ISSUES   | | ⏱️ AVG RESOLUTION    | | 👷 FIELD WORKER LOAD    | | ⚡ WORKFLOW RESILIENCE (A07)            | |
| | [ 12 Open Hazards ]  | | [ 14.2 Hours MTTR ]  | | [ 9 / 12 Crews Active ] | | [ 99.4% Automated Success Rate ]      | |
| +----------------------+ +----------------------+ +-------------------------+ +---------------------------------------+ |
|                                                                                                                         |
| +-----------------------------------------------------------------------+ +-------------------------------------------+ |
| | BENTO SECTION 1: AI PRIORITY & CONSTRAINT QUEUE (8 COLS)              | | BENTO SECTION 2: WORKFLOW MONITOR (4 COLS)| |
| |                                                                       | |                                           | |
| | [ ⚠️ CONSTRAINT CONFLICT ALERT: Electrical crew at 100% capacity! ]   | | [🤖 Workflow Automation Live Feed]        | |
| | Recommended Action: "Preempt 1 cosmetic task or trigger backup crew"  | | • 00:02:10 — Auto-dispatched #992 to Rafiq| |
| | [ Auto-Execute AI Recommendation ]  [ View Details ]                  | | • 00:04:15 — Inactivity check passed      | |
| |                                                                       | | • 00:05:00 — SLA aging score updated      | |
| | Queue Table:                                                          | |                                           | |
| | Report ID | Title                 | Ward   | Score  | Auto-Assign     | | 🧪 HACKATHON LIVE JUDGING CONTROLS:       | |
| | #992      | Exposed Live Wire     | Ward 4 | 94/100 | [ Assign (A02) ]| | [ Simulate Step 5 Timeout Failure ]       | |
| | #891      | Road Cave-in          | Ward 9 | 88/100 | [ Assign (A02) ]| | [ Trigger Instant Workflow Recovery ]    | |
| | #780      | Waterlogging Main St  | Ward 4 | 76/100 | [ Assign (A02) ]| |                                           | |
| +-----------------------------------------------------------------------+ +-------------------------------------------+ |
|                                                                                                                         |
| +---------------------------------------------------+ +-----------------------------------------------------------------+ |
| | CATEGORY INCIDENT DISTRIBUTION                    | | HIGH-RISK WARD HOTSPOTS                                         | |
| | [ Donut/Bar Chart: Roads 42%, Electric 24%... ]   | | Ward 4: 24 active • Ward 9: 18 active • Ward 2: 7 active        | |
| +---------------------------------------------------+ +-----------------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

### 3.6 Screen 6: Field Worker Mobile Operations Portal (`/worker`)

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [👷 Worker Portal] Rafiqul Islam (Roads Maintenance)                  [Active Tasks: 2 / 3]  [Logout]                    |
+-------------------------------------------------------------------------------------------------------------------------+
| TODAY'S DISPATCHED TASKS (Sorted by Proximity & Priority)                                                               |
|                                                                                                                         |
| +---------------------------------------------------------------------------------------------------------------------+ |
| | 🔴 TASK #992 — EXPOSED LIVE WIRE NEAR SCHOOL                                              [Priority: 94/100]        |
| | 📍 Road 12, Ward 4 (1.2 km away)  •  ⏱️ SLA Remaining: 2h 45m                                                         |
| | Citizen Note: "Sparking cable across pedestrian sidewalk"                                                            |
| | [ 🗺️ Open Navigation Route (GPS) ]                                                                                  |
| |                                                                                                                     |
| | Actions:                                                                                                            |
| | [ 🚀 Start Work (Mark In-Progress) ]   [ ✅ Complete & Upload After-Proof Photo ]   [ ⚠️ Report Site Blocker ]        |
| +---------------------------------------------------------------------------------------------------------------------+ |
|                                                                                                                         |
| +---------------------------------------------------------------------------------------------------------------------+ |
| | 🟡 TASK #841 — SEVERE POTHOLE PATCHING                                                    [Priority: 82/100]        |
| | 📍 Sector 10 Road 5 (2.8 km away)  •  Status: In-Progress                                                            |
| | [ 🗺️ Open Navigation Route ]          [ ✅ Upload Repair Proof ]                                                     |
| +---------------------------------------------------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

### 3.7 Screen 7: Authentication & Quick Demo Login (`/login`, `/register`)

```text
+-------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         |
|                                                [🛡️ StreetWatch]                                                         |
|                                         Autonomous Civic Action Platform                                                |
|                                                                                                                         |
|                                    +-----------------------------------------+                                          |
|                                    | Sign in to your account                 |                                          |
|                                    |                                         |                                          |
|                                    | Email Address                           |                                          |
|                                    | [ user@example.com                    ] |                                          |
|                                    | Password                                |                                          |
|                                    | [ •••••••••••••                       ] |                                          |
|                                    |                                         |                                          |
|                                    | [ Sign In to StreetWatch ]              |                                          |
|                                    |                                         |                                          |
|                                    | ──────────────── OR ─────────────────── |                                          |
|                                    | ⚡ ONE-CLICK DEMO LOGIN (FOR JUDGES):   |                                          |
|                                    | [ 👤 Login as Citizen (Tanvir)        ] |                                          |
|                                    | [ 🏛️ Login as Authority Admin (Farhana)] |                                          |
|                                    | [ 👷 Login as Field Worker (Rafiqul)  ] |                                          |
|                                    +-----------------------------------------+                                          |
|                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

## 4. Reusable Component Specifications

| Component | Props Interface | Visual States |
| :--- | :--- | :--- |
| **`BentoCard`** | `title`, `badge`, `icon`, `children`, `className`, `glassmorphic?: boolean` | Default, Hover elevation, Loading skeleton |
| **`PriorityScoreMeter`** | `score` (0-100), `breakdown` (object with severity, location, community, SLA weights), `showFormula?: boolean` | Normal, Critical (>85 Crimson), Hover breakdown tooltip |
| **`WorkflowStepper`** | `currentStep`, `stepsHistory` (array of stepName, status, executedAt, retries), `onSimulateFailure?` | Success (Green check), Active (Blue pulse), Failed/Recovered (Amber/Red with rollback badge) |
| **`ReportCard`** | `report` (object with title, category, status, priorityScore, coords, photoUrl), `compact?: boolean` | Default, Active Selected (Blue ring), Hover thumbnail zoom |
| **`StatusBadge`** | `status` (Enum: `REPORTED` through `CITIZEN_VERIFIED`) | Correct semantic background, text, and border token |
| **`CityMapCanvas`** | `reports` (array), `selectedReportId`, `onPinClick`, `userLocation?` | Loading tiles, Clustered pins, Active popup card |

---

## 5. UX Micro-Interactions & Feedback Rules (M06 & M07)

1. **Optimistic Community Verification:**
   - Clicking `Confirm Issue (+1)` updates the vote counter instantly on the UI while sending the API mutation in the background.
   - If the user already voted, button displays a disabled state with a clean tooltip: *"You have already verified this report."*
2. **Duplicate Detection Warning:**
   - In the `/report` form, dropping a pin within 50 meters of an active open issue displays an inline amber warning card with the existing issue's photo and a one-click button: *"Upvote existing report instead."*
3. **Toast Notifications:**
   - Sonner toast feedback for all actions: `Report submitted successfully (AI analyzing...)`, `Work status updated to In-Progress`, `Resolution approved`.
4. **Keyboard Accessibility:**
   - All interactive pins, cards, buttons, and form controls are fully navigable via `Tab` and toggleable via `Enter`/`Space` with high-visibility `ring-2 ring-blue-500` outlines.
