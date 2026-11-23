"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ThumbsUp,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  ShieldCheck,
  User,
  RotateCcw,
  Check,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

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
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [signingOff, setSigningOff] = useState(false);
  const [disputeFeedback, setDisputeFeedback] = useState("");
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadReport = async () => {
    try {
      const res = await fetch(`/api/reports/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setReport(json.data?.report || null);
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

  const breakdown = report.aiAnalysis?.priorityBreakdown;
  const isResolved = report.status === "RESOLVED";
  const isCitizenVerified = report.status === "CITIZEN_VERIFIED";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
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
              <p className="mt-1 text-xs font-medium text-slate-600 flex items-center gap-1">
                📍 {report.address}
              </p>
            </div>

            {/* Photographic Verification Grid (Before vs After) */}
            {report.afterProofUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Photographic Proof Comparison (Before vs After)
                  </span>
                  <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold">
                    Repair Evidence Attached
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block">
                      Before Repair (Citizen Evidence)
                    </span>
                    <div className="relative h-60 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
                      <Image
                        src={report.beforeProofUrl || report.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"}
                        alt={report.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 35vw"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                        Initial Defect
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-800 block">
                      After Repair (Field Worker Evidence)
                    </span>
                    <div className="relative h-60 w-full overflow-hidden rounded-lg border-2 border-emerald-400 bg-emerald-50/50">
                      <Image
                        src={report.afterProofUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
                        alt="Repaired proof"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 35vw"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                        Completed Repair
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
                <Image
                  src={report.beforeProofUrl || report.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"}
                  alt={report.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 px-2.5 py-1 rounded text-[11px] font-bold text-white">
                  Citizen Photographic Record
                </div>
              </div>
            )}

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
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  👍 {report.verificationCount} Confirmed
                </span>
                {report.flagCount > 0 && (
                  <span className="font-mono text-xs font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded border border-red-300">
                    🚩 {report.flagCount} Flags
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

        {/* Right Column (4 cols): Explainable AI (A02) & State Machine (A07) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card A: Explainable AI Priority Card */}
          <div className="civic-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-civic" />
                Explainable AI Priority (A02)
              </span>
              <span
                className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded border ${
                  report.priorityScore >= 80
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : "bg-blue-50 text-civic border-blue-300"
                }`}
              >
                {Math.round(report.priorityScore)}/100
              </span>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Physical Hazard Severity</span>
                  <span className="font-mono">{breakdown?.severityWeight || 35} / 40</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full"
                    style={{ width: `${((breakdown?.severityWeight || 35) / 40) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Spatial Location Risk</span>
                  <span className="font-mono">{breakdown?.locationRiskWeight || 20} / 25</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full"
                    style={{ width: `${((breakdown?.locationRiskWeight || 20) / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Community Consensus</span>
                  <span className="font-mono">{breakdown?.communityConsensusWeight || 10} / 20</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-civic rounded-full"
                    style={{ width: `${((breakdown?.communityConsensusWeight || 10) / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>SLA Decay Accrual</span>
                  <span className="font-mono">{breakdown?.slaDecayWeight || 10} / 15</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-700 rounded-full"
                    style={{ width: `${((breakdown?.slaDecayWeight || 10) / 15) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 block mb-1">Algorithmic Reasoning:</strong>
              {report.aiAnalysis?.severityReasoning ||
                "Evaluated using Gemini multimodal vision and municipal risk weight matrices."}
            </div>

            {report.aiAnalysis?.optimizationNote && (
              <div className="text-[11px] text-slate-600 font-mono bg-blue-50/70 p-2.5 rounded border border-blue-200">
                ℹ️ {report.aiAnalysis.optimizationNote}
              </div>
            )}
          </div>

          {/* Card B: Deterministic State Machine Lifecycle (A07) */}
          <div className="civic-card p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Layers className="h-4 w-4 text-civic" />
              State Machine Progression (A07)
            </span>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {[
                { name: "STEP_1_INGEST", title: "Incident Ingested & GPS Verified" },
                { name: "STEP_2_AI_TRIAGE", title: "Gemini AI Triaged & Scored" },
                { name: "STEP_3_COMMUNITY_GATE", title: "Community Consensus Gate" },
                { name: "STEP_4_PRIORITY_OPTIMIZE", title: "A02 Constraint Engine Evaluated" },
                { name: "STEP_5_DISPATCH", title: "Municipal Crew Dispatched" },
                { name: "STEP_6_FIELD_START", title: "Repair In Progress" },
                { name: "STEP_6_FIELD_RESOLVE", title: "Repair Proof Submitted" },
                { name: "STEP_7_CITIZEN_SIGNOFF", title: "Citizen Final Verification & Closed" },
              ].map((step, idx) => {
                const stepLog = report.workflowStepLogs?.find((l) => l.stepName === step.name);
                const isCompleted = stepLog?.status === "SUCCESS";
                const isFailed = stepLog?.status === "FAILED";
                const isRetried = stepLog?.status === "RETRIED";
                const isRolledBack = stepLog?.status === "ROLLED_BACK";
                const isCurrent = !isCompleted && !isFailed && !isRolledBack && idx === (report.workflowStepLogs?.length || 0);

                return (
                  <div key={step.name} className="relative text-xs">
                    <span
                      className={`absolute -left-6 top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold border transition ${
                        isCompleted
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : isRetried
                          ? "bg-amber-600 text-white border-amber-700"
                          : isRolledBack
                          ? "bg-purple-600 text-white border-purple-700"
                          : isFailed
                          ? "bg-rose-600 text-white border-rose-700"
                          : isCurrent
                          ? "bg-civic text-white border-blue-800 ring-2 ring-blue-100"
                          : "bg-white text-slate-400 border-slate-300"
                      }`}
                    >
                      {isCompleted ? "✓" : isRolledBack ? "↺" : isFailed ? "✕" : idx + 1}
                    </span>

                    <div className="font-bold text-slate-800">
                      {step.title}
                    </div>

                    {stepLog ? (
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                        <span>{new Date(stepLog.executedAt).toLocaleTimeString()}</span>
                        {stepLog.attemptCount > 1 && (
                          <span className="rounded bg-amber-100 text-amber-900 px-1 font-bold">
                            Attempt #{stepLog.attemptCount}
                          </span>
                        )}
                        {stepLog.recoveryAction && (
                          <span className="rounded bg-blue-50 text-blue-900 border border-blue-200 px-1 font-mono text-[9px]">
                            {stepLog.recoveryAction}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Pending progression</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
