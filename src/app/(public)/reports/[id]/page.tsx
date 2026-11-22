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
  Star,
} from "lucide-react";

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
        text: data.data.message || "Verification recorded!",
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
        text: json.data?.message || "Sign-off recorded successfully!",
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
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-3">Loading report details &amp; AI decision state...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Report Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The requested civic issue report does not exist or was removed.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public Map
        </Link>
      </div>
    );
  }

  const breakdown = report.aiAnalysis?.priorityBreakdown;
  const isResolved = report.status === "RESOLVED";
  const isCitizenVerified = report.status === "CITIZEN_VERIFIED";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Public City Map
        </Link>

        <span className="font-mono text-xs text-slate-400">
          Ticket #{report.id.slice(0, 10)}
        </span>
      </div>

      {feedback && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold border flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Asymmetric Grid: 65% Left / 35% Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols / 65%): Evidence, Description & Community Verification */}
        <div className="space-y-6 lg:col-span-8">
          {/* Main Issue Card */}
          <div className="bento-card overflow-hidden bg-white border border-slate-200 shadow-subtle p-6 space-y-5">
            {/* Category, Status & Ward Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {report.category?.name}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isCitizenVerified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isResolved
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-brand border-blue-200"
                  }`}
                >
                  {report.status.replace("_", " ")}
                </span>
                {report.isDuplicate && (
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    Duplicate Cluster Linked
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
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

            {/* Title & Address */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {report.title}
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 flex items-center gap-1">
                📍 {report.address}
              </p>
            </div>

            {/* Before vs After Photo Display */}
            {report.afterProofUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Photographic Proof Verification (Before vs After)
                  </span>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                    Repair Complete
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600 block">
                      Before Repair (Citizen Evidence)
                    </span>
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm group">
                      <Image
                        src={report.beforeProofUrl || report.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"}
                        alt={report.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, 35vw"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                        Initial Hazard
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-700 block">
                      After Repair (Field Worker Evidence)
                    </span>
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 shadow-sm group">
                      <Image
                        src={report.afterProofUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
                        alt="Repaired proof"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, 35vw"
                      />
                      <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                        Repaired &amp; Cleared
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm group">
                <Image
                  src={report.beforeProofUrl || report.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"}
                  alt={report.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-102 transition-transform duration-300"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
                <div className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                  Citizen Photo Evidence
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Citizen Observation &amp; Hazard Impact
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                {report.description}
              </p>
            </div>
          </div>

          {/* Citizen Final Sign-Off Banner (When report is in RESOLVED status) */}
          {isResolved && report.isReporter && (
            <div className="bento-card p-6 bg-emerald-50/70 border border-emerald-300 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-base font-bold">
                    Citizen Final Sign-Off Required (End-to-End Workflow Milestone)
                  </h3>
                  <p className="text-xs text-emerald-700">
                    The municipal field worker has uploaded repair proof. Inspect the photos above and confirm resolution or reopen.
                  </p>
                </div>
              </div>

              {showDisputeInput ? (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={2}
                    value={disputeFeedback}
                    onChange={(e) => setDisputeFeedback(e.target.value)}
                    placeholder="Describe what is still hazardous or why you are disputing the repair..."
                    className="w-full rounded-xl border border-red-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-red-400"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowDisputeInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:underline"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleSignOff(false)}
                      disabled={signingOff}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {signingOff ? "Reopening..." : "Confirm Dispute & Reopen"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleSignOff(true)}
                    disabled={signingOff}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {signingOff ? "Confirming..." : "Confirm Issue Resolved & Close Ticket (+0.1 Trust)"}
                  </button>

                  <button
                    onClick={() => setShowDisputeInput(true)}
                    disabled={signingOff}
                    className="rounded-xl border border-red-300 bg-white px-4 py-3 text-xs font-bold text-red-700 hover:bg-red-50 transition"
                  >
                    Dispute &amp; Reopen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Already Verified & Closed Notice */}
          {isCitizenVerified && (
            <div className="bento-card p-5 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                This civic issue has been officially repaired, verified by the citizen reporter, and closed in the municipal system.
              </span>
            </div>
          )}

          {/* Community Verification Action Card (M06) */}
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-brand" />
                  Community Consensus &amp; Verification Loop
                </h3>
                <p className="text-xs text-slate-500">
                  Citizens nearby confirm physical existence to elevate municipal priority.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  👍 {report.verificationCount} Confirmed
                </span>
                {report.flagCount > 0 && (
                  <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                    🚩 {report.flagCount} Flags
                  </span>
                )}
              </div>
            </div>

            {report.isReporter ? (
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span>You reported this issue. Other nearby residents can verify its urgency.</span>
              </div>
            ) : report.hasUserVoted ? (
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    You have verified this report ({report.userVoteType === "FLAG_FALSE" ? "Flagged False" : "Confirmed Active"}).
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-normal">Vote Recorded</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyVote("CONFIRM")}
                  disabled={voting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                >
                  <ThumbsUp className="h-4 w-4" />
                  {voting ? "Submitting..." : "Confirm Hazard Exists (+1)"}
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyVote("FLAG_FALSE")}
                  disabled={voting}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 py-2.5 px-4 text-xs font-bold text-red-700 hover:bg-red-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                >
                  <Flag className="h-3.5 w-3.5 text-red-600" />
                  Flag Fake
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols / 35%): Explainable AI (A02) & Workflow Stepper (A07) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card A: Explainable AI Priority Card (A02) */}
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Explainable AI Priority (A02)
              </span>
              <span
                className={`font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-full border ${
                  report.priorityScore >= 85
                    ? "bg-red-50 text-status-critical border-red-200"
                    : "bg-blue-50 text-brand border-blue-200"
                }`}
              >
                {Math.round(report.priorityScore)}/100
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Hazard Severity</span>
                  <span className="font-mono">{breakdown?.severityWeight || 35} / 40</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${((breakdown?.severityWeight || 35) / 40) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Spatial Location Risk</span>
                  <span className="font-mono">{breakdown?.locationRiskWeight || 20} / 25</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${((breakdown?.locationRiskWeight || 20) / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Community Consensus</span>
                  <span className="font-mono">{breakdown?.communityConsensusWeight || 10} / 20</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${((breakdown?.communityConsensusWeight || 10) / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>SLA Aging Decay</span>
                  <span className="font-mono">{breakdown?.slaDecayWeight || 10} / 15</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${((breakdown?.slaDecayWeight || 10) / 15) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800 block mb-1">AI Reasoning:</strong>
              {report.aiAnalysis?.severityReasoning ||
                "Evaluated based on hazard category danger and public pedestrian vulnerability."}
            </div>

            {report.aiAnalysis?.optimizationNote && (
              <div className="text-[11px] text-slate-500 font-mono bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                ℹ️ {report.aiAnalysis.optimizationNote}
              </div>
            )}
          </div>

          {/* Card B: Live Automated Workflow Stepper (A07) */}
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-brand" />
              Automated Workflow Lifecycle (A07)
            </span>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {[
                { name: "STEP_1_INGEST", title: "Report Ingested & EXIF Validated" },
                { name: "STEP_2_AI_TRIAGE", title: "Gemini AI Triaged & Scored" },
                { name: "STEP_3_COMMUNITY_GATE", title: "Community Consensus Verified" },
                { name: "STEP_4_PRIORITY_OPTIMIZE", title: "A02 Constraint Engine Evaluated" },
                { name: "STEP_5_DISPATCH", title: "Field Worker Dispatched" },
                { name: "STEP_6_FIELD_START", title: "Field Work In Progress" },
                { name: "STEP_6_FIELD_RESOLVE", title: "Field Repair Proof Submitted" },
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
                      className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                        isCompleted
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                          : isRetried
                          ? "bg-amber-500 text-white border-amber-600"
                          : isRolledBack
                          ? "bg-purple-500 text-white border-purple-600"
                          : isFailed
                          ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                          : isCurrent
                          ? "bg-blue-600 text-white border-blue-700 ring-4 ring-blue-100 shadow-sm"
                          : "bg-white text-slate-400 border-slate-300"
                      }`}
                    >
                      {isCompleted ? "✓" : isRolledBack ? "↺" : isFailed ? "✕" : idx + 1}
                    </span>

                    <div className="font-semibold text-slate-800">
                      {step.title}
                    </div>

                    {stepLog ? (
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                        <span>{new Date(stepLog.executedAt).toLocaleTimeString()}</span>
                        {stepLog.attemptCount > 1 && (
                          <span className="rounded bg-amber-100 text-amber-800 px-1 font-semibold">
                            Attempt #{stepLog.attemptCount}
                          </span>
                        )}
                        {stepLog.recoveryAction && (
                          <span className="rounded bg-blue-50 text-blue-800 border border-blue-200 px-1 font-mono text-[9px]">
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
