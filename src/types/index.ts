export type Role = "CITIZEN" | "AUTHORITY" | "FIELD_WORKER";

export type ReportStatus =
  | "REPORTED"
  | "AI_TRIAGED"
  | "COMMUNITY_VERIFIED"
  | "PRIORITY_SCORED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CITIZEN_VERIFIED"
  | "FAILED_RECOVERY"
  | "REJECTED";

export type VoteType = "CONFIRM" | "FLAG_FALSE";

export type WorkflowStepStatus =
  | "SUCCESS"
  | "FAILED"
  | "RETRIED"
  | "ROLLED_BACK"
  | "ESCALATED";

export interface PriorityBreakdown {
  severityWeight: number;
  locationRiskWeight: number;
  communityConsensusWeight: number;
  slaDecayWeight: number;
  capacityPenalty?: number;
  formula: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string | null;
  workerCapacity?: number;
  activeTaskCount?: number;
  trustScore: number;
}

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  wardZone: string;
  categoryId: string;
  category?: {
    name: string;
    slug: string;
    baseRiskWeight: number;
  };
  reporterId: string;
  reporter?: {
    name: string;
    email: string;
  };
  status: ReportStatus;
  severityScore: number;
  priorityScore: number;
  verificationCount: number;
  flagCount: number;
  isDuplicate: boolean;
  beforeProofUrl?: string | null;
  afterProofUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: {
    detectedCategory: string;
    confidenceScore: number;
    severityReasoning: string;
    priorityBreakdown: PriorityBreakdown;
    optimizationNote?: string | null;
  } | null;
}

export interface WorkflowLogEntry {
  id: string;
  stepName: string;
  status: WorkflowStepStatus;
  attemptCount: number;
  errorMessage?: string | null;
  recoveryAction?: string | null;
  executedAt: string;
}
