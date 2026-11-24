import { ReportStatus } from "@/types";

export type IssueLifecycleState =
  | "REPORTED"
  | "AI_TRIAGED"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export interface LifecycleStepMeta {
  state: IssueLifecycleState;
  label: string;
  shortLabel: string;
  defaultActor: string;
  defaultAction: string;
  nextAllowedState: IssueLifecycleState | null;
  nextAllowedAction: string;
  nextAllowedActor: string;
  badgeColor: "blue" | "purple" | "amber" | "indigo" | "emerald" | "slate";
}

export const LIFECYCLE_STEPS: LifecycleStepMeta[] = [
  {
    state: "REPORTED",
    label: "Reported",
    shortLabel: "Reported",
    defaultActor: "Citizen Reporter",
    defaultAction: "Logged hazard with geolocated photo & initial description",
    nextAllowedState: "AI_TRIAGED",
    nextAllowedAction: "Execute AI Multi-Modal Computer Vision & Spatial Triage",
    nextAllowedActor: "Gemini Vision AI Engine",
    badgeColor: "blue",
  },
  {
    state: "AI_TRIAGED",
    label: "AI Triaged",
    shortLabel: "AI Triage",
    defaultActor: "Gemini Vision AI Engine (v2.5)",
    defaultAction: "Assessed severity, edge contrast, and computed priority score",
    nextAllowedState: "VERIFIED",
    nextAllowedAction: "Gather Citizen Consensus Votes & Zone Field Inspector Attestation",
    nextAllowedActor: "Citizens & Municipal Inspector",
    badgeColor: "purple",
  },
  {
    state: "VERIFIED",
    label: "Verified",
    shortLabel: "Verified",
    defaultActor: "Community Consensus & Field Inspector",
    defaultAction: "Cross-verified hazard authenticity with community votes",
    nextAllowedState: "ASSIGNED",
    nextAllowedAction: "Dispatch Work Order to Optimal Municipal Response Crew",
    nextAllowedActor: "Municipal Dispatch Authority",
    badgeColor: "amber",
  },
  {
    state: "ASSIGNED",
    label: "Assigned",
    shortLabel: "Assigned",
    defaultActor: "Municipal Dispatch Authority",
    defaultAction: "Dispatched ticket to specialized department crew with SLA timer",
    nextAllowedState: "IN_PROGRESS",
    nextAllowedAction: "Crew Accepts Work Order & Commences On-Site Repair",
    nextAllowedActor: "Assigned Field Crew",
    badgeColor: "indigo",
  },
  {
    state: "IN_PROGRESS",
    label: "In Progress",
    shortLabel: "In Progress",
    defaultActor: "Field Response Crew",
    defaultAction: "On-site active restoration, materials deployment, and remediation",
    nextAllowedState: "RESOLVED",
    nextAllowedAction: "Submit Geolocated After-Repair Photographic Evidence",
    nextAllowedActor: "Field Crew Supervisor",
    badgeColor: "amber",
  },
  {
    state: "RESOLVED",
    label: "Resolved",
    shortLabel: "Resolved",
    defaultActor: "Field Response Crew",
    defaultAction: "Completed physical repair and uploaded timestamped after-proof",
    nextAllowedState: "CLOSED",
    nextAllowedAction: "Citizen Inspection, Satisfaction Rating & Final Sign-Off",
    nextAllowedActor: "Original Citizen Reporter",
    badgeColor: "emerald",
  },
  {
    state: "CLOSED",
    label: "Closed",
    shortLabel: "Closed",
    defaultActor: "Original Citizen Reporter & Ledger",
    defaultAction: "Citizen confirmed repair quality; archived into transparency ledger",
    nextAllowedState: null,
    nextAllowedAction: "Issue Lifecycle Complete — Archived in Public Transparency Ledger",
    nextAllowedActor: "Municipal Civic Ledger",
    badgeColor: "slate",
  },
];

export function mapReportStatusToLifecycle(status: ReportStatus | string): IssueLifecycleState {
  switch (status) {
    case "REPORTED":
      return "REPORTED";
    case "AI_TRIAGED":
      return "AI_TRIAGED";
    case "COMMUNITY_VERIFIED":
    case "PRIORITY_SCORED":
      return "VERIFIED";
    case "ASSIGNED":
      return "ASSIGNED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "RESOLVED":
      return "RESOLVED";
    case "CITIZEN_VERIFIED":
    case "CLOSED":
      return "CLOSED";
    default:
      return "REPORTED";
  }
}

export function getLifecycleStepIndex(state: IssueLifecycleState): number {
  return LIFECYCLE_STEPS.findIndex((s) => s.state === state);
}
