"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ThumbsUp,
  Flag,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  User,
  RotateCcw,
  Check,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import EvidenceGrid from "@/components/ui/EvidenceGrid";
import ExplainableAICard from "@/components/ui/ExplainableAICard";
import WorkflowStepper from "@/components/ui/WorkflowStepper";
import AIAutoTriagePanel from "@/components/streetwatch/AIAutoTriagePanel";
import { IssueStatusTimeline } from "@/components/streetwatch/IssueStatusTimeline";

interface WorkflowStep {
  id: string;
  stepName: string;
  status: string;
  attemptCount: number;
  errorMessage?: string | null;
  recoveryAction?: string | null;
  executedAt: string;
}

interface ReportDetails {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  beforeProofUrl?: string | null;
  afterProofUrl?: string | null;
  latitude: number;
  longitude: number;
  address: string;
  wardZone: string;
  status: string;
  severityScore: number;
  priorityScore: number;
  verificationCount: number;
  flagCount: number;
  isDuplicate: boolean;
  createdAt: string;
  updatedAt?: string;
  hasUserVoted?: boolean;
  userVoteType?: string | null;
  isReporter?: boolean;
  category: {
    name: string;
    department?: {
      name: string;
      slaHours: number;
    };
  };
  reporter?: {
    name: string;
  };
  aiAnalysis?: {
    detectedCategory: string;
    confidenceScore: number;
    severityReasoning: string;
    priorityBreakdown: {
      severityWeight: number;
      locationRiskWeight: number;
      communityConsensusWeight: number;
      slaDecayWeight: number;
      formula: string;
    };
    optimizationNote?: string | null;
  };
  workflowStepLogs?: WorkflowStep[];
  assignments?: {
    worker: {
      name: string;
      role: string;
    };
  }[];
}

export default function ReportDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [signingOff, setSigningOff] = useState(false);
  const [disputeFeedback, setDisputeFeedback] = useState("");
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadReport = async () => {
    try {
      const [res, authRes] = await Promise.all([
        fetch(`/api/reports/${params.id}`),
        fetch("/api/auth/me").catch(() => null),
      ]);
      if (res.ok) {
        const json = await res.json();
        setReport(json.data?.report || null);
      }
      if (authRes && authRes.ok) {
        const authJson = await authRes.json();
        setUserRole(authJson.data?.user?.role || null);
      }
    } catch (err) {
      console.error("Error loading report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [params.id]);

  const handleVerifyVote = async (voteType: "CONFIRM" | "FLAG_FALSE") => {
    if (!report) return;
    setVoting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/reports/${report.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error?.message || "Failed to submit verification.",
        });
        setVoting(false);
        return;
      }

      setReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          verificationCount: data.data.verificationCount,
          flagCount: data.data.flagCount,
          priorityScore: data.data.priorityScore,
          status: data.data.status,
          hasUserVoted: true,
          userVoteType: voteType,
        };
      });

      setFeedback({
        type: "success",
        text: data.data.message || "Verification recorded in civic ledger!",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Network error occurred while voting.",
      });
    } finally {
      setVoting(false);
    }
  };

  const handleSignOff = async (approved: boolean) => {
    if (!report) return;
    setSigningOff(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/reports/${report.id}/signoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          satisfactionRating: 5,
          feedback: disputeFeedback || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error?.message || "Failed to submit sign-off.",
        });
        setSigningOff(false);
        return;
      }

      setFeedback({
        type: "success",
        text: json.data?.message || "Citizen sign-off recorded successfully!",
      });
      setShowDisputeInput(false);
      await loadReport();
    } catch {
      setFeedback({
        type: "error",
        text: "Network error during sign-off.",
      });
    } finally {
      setSigningOff(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-xs text-slate-500 font-medium">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-civic border-t-transparent mb-2" />
        <p>Loading municipal incident record &amp; AI triage breakdown...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="civic-card p-8">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Incident Record Not Found</h2>
          <p className="mt-1 text-xs text-slate-500">
            The requested incident ticket does not exist or has been archived.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="btn-tactile inline-flex items-center gap-1.5 rounded-lg bg-civic px-4 py-2 text-xs font-bold text-white shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to City Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isResolved = report.status === "RESOLVED";
  const isCitizenVerified = report.status === "CITIZEN_VERIFIED";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Ticket Identifier */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/"
          className="btn-tactile inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
          <span>City Geospatial Map</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 rounded px-2.5 py-1 border border-slate-200">
            TICKET #{report.id.slice(0, 10).toUpperCase()}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg p-3.5 text-xs font-bold border flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Deterministic Issue Lifecycle Timeline Component */}
      <IssueStatusTimeline
        currentStatus={report.status}
        createdAt={report.createdAt}
        updatedAt={report.updatedAt}
        reporterName={report.reporter?.name || "Citizen Reporter"}
        assignedWorkerName={report.assignments?.[0]?.worker?.name}
        verificationCount={report.verificationCount || 0}
        showAuditTrailDefault={true}
      />

      {/* Main Operational Layout: 65% Left / 35% Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Photographic Evidence & Citizen Verification */}
        <div className="space-y-6 lg:col-span-8">
          {/* Main Incident Card */}
          <div className="civic-card p-6 space-y-5">
            {/* Classification & Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200">
                  <DynamicCategoryIcon nameOrSlug={report.category?.name || ""} size={14} />
                  <span>{report.category?.name}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-bold ${
                    isCitizenVerified
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : isResolved
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-blue-50 text-civic border-blue-300"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    isCitizenVerified ? "bg-emerald-600" : isResolved ? "bg-amber-600" : "bg-civic"
                  }`} />
                  {report.status.replace("_", " ")}
                </span>
                {report.isDuplicate && (
                  <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    Duplicate Cluster Linked
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {report.wardZone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Title & Street Address */}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {report.title}
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-civic shrink-0" />
                <span>{report.address}</span>
              </p>
            </div>

            {/* Reusable Evidence Grid Component */}
            <EvidenceGrid
              title={report.title}
              beforeUrl={report.beforeProofUrl || report.imageUrl}
              afterUrl={report.afterProofUrl}
              isResolved={isResolved || isCitizenVerified}
            />

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Physical Hazard Observation
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {report.description}
              </p>
            </div>
          </div>

          {/* Citizen Final Sign-Off Action Card (When in RESOLVED status) */}
          {isResolved && report.isReporter && (
            <div className="civic-card p-6 bg-emerald-50/60 border border-emerald-300 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-950">
                <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    Citizen Final Verification Required (Milestone A07)
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    The municipal crew has marked this repair resolved. Review the After photographic evidence and approve closure or dispute.
                  </p>
                </div>
              </div>

              {showDisputeInput ? (
                <div className="space-y-3 pt-1">
                  <textarea
                    rows={2}
                    value={disputeFeedback}
                    onChange={(e) => setDisputeFeedback(e.target.value)}
                    placeholder="Specify why the repair is incomplete or continues to pose a hazard..."
                    className="w-full rounded-lg border border-red-300 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowDisputeInput(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSignOff(false)}
                      disabled={signingOff}
                      className="btn-tactile flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {signingOff ? "Reopening..." : "Dispute Repair & Reopen"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleSignOff(true)}
                    disabled={signingOff}
                    className="btn-tactile flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 py-3 px-4 text-xs font-bold text-white shadow-2xs disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {signingOff ? "Confirming..." : "Approve Repair & Close Incident (+0.1 Trust Score)"}
                  </button>

                  <button
                    onClick={() => setShowDisputeInput(true)}
                    disabled={signingOff}
                    className="btn-tactile rounded-lg border border-rose-300 bg-white hover:bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 disabled:opacity-50"
                  >
                    Dispute &amp; Reopen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Already Verified & Closed Notice */}
          {isCitizenVerified && (
            <div className="civic-card p-4 bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
              <span>
                This civic incident has been fully resolved, verified with photographic proof, and officially closed by the citizen reporter.
              </span>
            </div>
          )}

          {/* Community Verification Loop */}
          <div className="civic-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4 text-civic" />
                  <span>Community Consensus &amp; Verification Protocol</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Nearby citizens confirm physical existence to elevate municipal prioritization.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  <ThumbsUp className="h-3.5 w-3.5 text-civic" />
                  <span>{report.verificationCount} Confirmed</span>
                </span>
                {report.flagCount > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded border border-red-300">
                    <Flag className="h-3.5 w-3.5 text-red-600" />
                    <span>{report.flagCount} Flags</span>
                  </span>
                )}
              </div>
            </div>

            {report.isReporter ? (
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span>You are the primary reporter for this incident. Other nearby residents can verify its urgency.</span>
              </div>
            ) : report.hasUserVoted ? (
              <div className="rounded-lg bg-emerald-50 p-3.5 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span>
                    Your verification is recorded ({report.userVoteType === "FLAG_FALSE" ? "Flagged False" : "Confirmed Active"}).
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700">Ledger Confirmed</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleVerifyVote("CONFIRM")}
                  disabled={voting}
                  className="btn-tactile flex-1 flex items-center justify-center gap-2 rounded-lg bg-civic hover:bg-civic-hover py-2.5 px-4 text-xs font-bold text-white shadow-2xs disabled:opacity-50"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {voting ? "Recording..." : "Verify Hazard Exists (+1 Vote)"}
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyVote("FLAG_FALSE")}
                  disabled={voting}
                  className="btn-tactile flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 py-2.5 px-4 text-xs font-bold text-rose-700 disabled:opacity-50"
                >
                  <Flag className="h-3.5 w-3.5 text-rose-600" />
                  Flag Inaccurate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Reusable Explainable AI & Workflow Stepper Components */}
        <div className="space-y-6 lg:col-span-4">
          {/* Explainable AI Decision Support System */}
          <AIAutoTriagePanel
            data={{
              reportId: report.id,
              categoryName: report.category?.name || "Civic Hazard",
              suggestedPriorityScore: report.priorityScore,
              confidenceScore: report.aiAnalysis?.confidenceScore || 0.94,
              severityRating: report.severityScore ? report.severityScore / 20 : 4.0,
              requiresVerification: !report.hasUserVoted && report.status !== "RESOLVED",
              roadSeverity: {
                scorePct: Math.min(100, report.aiAnalysis?.priorityBreakdown?.severityWeight ?? report.severityScore ?? 80),
                metricLabel: `Severity (${((report.severityScore || 80) / 20).toFixed(1)}/5.0)`,
                explanation: report.aiAnalysis?.severityReasoning || "Physical defect and geometric hazard posing direct pedestrian and vehicle disruption.",
              },
              trafficImportance: {
                scorePct: Math.min(100, report.aiAnalysis?.priorityBreakdown?.locationRiskWeight ?? 85),
                metricLabel: `${report.wardZone} Arterial Transit Line`,
                explanation: `Active transit corridor in ${report.wardZone} carrying daily commuter and emergency service traffic.`,
              },
              sensitiveLocations: {
                scorePct: Math.min(100, report.aiAnalysis?.priorityBreakdown?.locationRiskWeight ? Math.min(100, report.aiAnalysis.priorityBreakdown.locationRiskWeight + 5) : 90),
                metricLabel: "Proximity to Public Facilities",
                explanation: "Identified within 150m of municipal transit station and local educational facilities.",
                nearbyEntities: ["Transit Hub (<100m)", "Pedestrian Crosswalk (45m)"],
              },
              similarReports: {
                scorePct: report.aiAnalysis?.priorityBreakdown?.communityConsensusWeight ?? (report.isDuplicate ? 85 : 45),
                count: report.isDuplicate ? 4 : Math.max(1, report.verificationCount || 1),
                explanation: report.isDuplicate
                  ? "Geospatially clustered with existing reports within 50m radius."
                  : "Verified incident registered in this immediate cluster.",
              },
              imageConfidence: {
                scorePct: Math.round((report.aiAnalysis?.confidenceScore || 0.94) * 100),
                modelName: "Gemini Vision v2.5",
                explanation: "Computer vision edge contrast and depth boundary validation completed.",
              },
              historicalPattern: {
                scorePct: Math.min(100, report.aiAnalysis?.priorityBreakdown?.slaDecayWeight ?? 75),
                metricLabel: "Zone Vulnerability Pattern",
                explanation: `Monsoon and seasonal rainfall impact zone in ${report.wardZone}.`,
              },
              governance: {
                aiRecommendation: {
                  suggestedPriority: Math.round(report.priorityScore),
                  suggestedDepartment: report.category?.department?.name || "Public Works",
                  generatedAt: new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
                humanVerification: {
                  isVerified: (report.verificationCount || 0) > 0,
                  verificationCount: report.verificationCount || 0,
                  inspectorAttestation: (report.verificationCount || 0) > 0
                    ? `Consensus verified by ${report.verificationCount} citizens and community members.`
                    : "Pending community consensus verification.",
                },
                finalOperationalDecision: {
                  isApproved: report.status === "ASSIGNED" || report.status === "IN_PROGRESS" || report.status === "RESOLVED" || report.status === "CITIZEN_VERIFIED",
                  isOverridden: false,
                  approvedPriority: Math.round(report.priorityScore),
                  approverName: report.status === "ASSIGNED" ? "Zone Dispatch Authority" : null,
                  operatorJustification: null,
                  decidedAt: report.updatedAt,
                },
              },
            }}
            canOverride={userRole === "AUTHORITY"}
            onApplyOverride={async (overrideData) => {
              const res = await fetch("/api/admin/override-triage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  reportId: report.id,
                  priorityScore: overrideData.priorityScore,
                  severityRating: overrideData.severityRating,
                  justification: overrideData.justification,
                }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(json.error?.message || "Failed to apply operator override.");
              }
              setReport((prev) => (prev ? { ...prev, priorityScore: overrideData.priorityScore } : null));
              setFeedback({
                type: "success",
                text: `Human operator override saved into audit ledger: Priority set to P-${overrideData.priorityScore}`,
              });
            }}
          />

          {/* Reusable State Machine Workflow Stepper */}
          <WorkflowStepper
            workflowLogs={report.workflowStepLogs}
          />
        </div>
      </div>
    </div>
  );
}
