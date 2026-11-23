"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  HardHat,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowRight,
  MapPin,
  X,
  TrendingUp,
  Layers,
  Bug,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

interface WorkflowLogEvent {
  id: string;
  stepName: string;
  status: string;
  attemptCount: number;
  errorMessage?: string | null;
  recoveryAction?: string | null;
  executedAt: string;
  report?: {
    id: string;
    title: string;
    status: string;
  };
}

interface AnalyticsData {
  totalReports: number;
  criticalUnassignedCount: number;
  resolvedCount: number;
  resolutionRatePercent: number;
  avgPriorityScore: number;
  workforceCapacity: {
    totalSlots: number;
    activeSlots: number;
    utilizationPercent: number;
  };
  departmentStats: {
    id: string;
    name: string;
    slaHours: number;
    workerCount: number;
    totalCapacity: number;
    activeLoad: number;
    isSaturated: boolean;
    openReports: number;
    workers: {
      id: string;
      name: string;
      activeTaskCount: number;
      workerCapacity: number;
    }[];
  }[];
  wardHotspots: {
    wardZone: string;
    openCount: number;
    criticalCount: number;
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM";
  }[];
  recentWorkflowLogs?: WorkflowLogEvent[];
}

interface QueueReport {
  id: string;
  title: string;
  address: string;
  wardZone: string;
  status: string;
  priorityScore: number;
  severityScore: number;
  verificationCount: number;
  category: {
    name: string;
    departmentId: string;
  };
  aiAnalysis?: {
    severityReasoning: string;
    recommendedDepartment?: string;
  };
}

interface ConflictModalData {
  reportId: string;
  reportTitle: string;
  conflictReason: string;
  fallbackOptions: {
    strategy: "CROSS_ZONE_FALLBACK" | "PREEMPT_LOW_PRIORITY";
    label: string;
    tradeoffExplanation: string;
  }[];
}

export default function AuthorityCommandCenter() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [queue, setQueue] = useState<QueueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const [conflictModal, setConflictModal] = useState<ConflictModalData | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch live dashboard analytics and queue
  const fetchData = async () => {
    try {
      const [analyticsRes, queueRes] = await Promise.all([
        fetch("/api/analytics/summary"),
        fetch("/api/reports?sortBy=priority&limit=30"),
      ]);

      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        setAnalytics(json.data);
      }
      if (queueRes.ok) {
        const json = await queueRes.json();
        setQueue(json.data?.items || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger A02 Auto-Assign
  const handleAutoAssign = async (
    reportId: string,
    reportTitle: string,
    strategy: "STRICT" | "CROSS_ZONE_FALLBACK" | "PREEMPT_LOW_PRIORITY" = "STRICT"
  ) => {
    setAssigningId(reportId);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/optimize-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, resolutionStrategy: strategy }),
      });

      const json = await res.json();

      if (!res.ok) {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Assignment failed.",
        });
        setAssigningId(null);
        return;
      }

      // Check if A02 detected a constraint conflict!
      if (json.data?.status === "CONFLICT_DETECTED") {
        setConflictModal({
          reportId,
          reportTitle,
          conflictReason: json.data.conflictReason,
          fallbackOptions: json.data.fallbackOptions || [],
        });
        setAssigningId(null);
        return;
      }

      // Successful assignment
      setConflictModal(null);
      setActionMessage({
        type: "success",
        text: json.data?.message || "Worker dispatched successfully via AI Optimizer!",
      });

      await fetchData();
    } catch {
      setActionMessage({
        type: "error",
        text: "Network error during optimization.",
      });
    } finally {
      setAssigningId(null);
    }
  };

  // A07: Simulate Intermediate Step Failure
  const handleSimulateFailure = async (reportId: string) => {
    setSimulatingId(reportId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/workflow/${reportId}/simulate-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepName: "STEP_5_DISPATCH",
          reason: "Simulated worker drop/timeout: Field worker unacknowledged after 45 mins.",
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: "Step failure simulated (A07 test). Report is now in FAILED_RECOVERY state with previous successes intact.",
        });
        await fetchData();
      } else {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Failed to simulate failure.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setSimulatingId(null);
    }
  };

  // A07: Trigger Automated Workflow Recovery
  const handleRecoverWorkflow = async (reportId: string) => {
    setRecoveringId(reportId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/workflow/${reportId}/recover`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: json.data?.message || "Workflow recovered successfully via A07 Engine!",
        });
        await fetchData();
      } else {
        setActionMessage({
          type: "error",
          text: json.error?.message || "Recovery execution failed.",
        });
      }
    } catch {
      setActionMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setRecoveringId(null);
    }
  };

  // Trigger Batch Priority Recalculation
  const handleRecalculatePriorities = async () => {
    setRecalculating(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/recalculate-priorities", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: json.data?.message || "Priorities dynamically updated!",
        });
        await fetchData();
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Failed to recalculate priorities.",
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-3">Loading Authority Command Center &amp; A02/A07 Engines...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Municipal Command Center
            </h1>
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
              Authority View
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Real-time urban hazard triage, workforce capacity monitoring, and explainable AI optimization (A02 &amp; A07).
          </p>
        </div>

        <button
          onClick={handleRecalculatePriorities}
          disabled={recalculating}
          className="btn-tactile btn-glossy inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-black shadow-sm border border-slate-700/80 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-blue-300 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalculating AI Priorities..." : "Recalculate Dynamic Priorities (A02)"}
        </button>
      </div>

      {actionMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold border flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Row 1: 4 KPI Bento Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bento-card p-5 bg-gradient-to-br from-white via-white to-rose-50/40 border border-slate-200/90 shadow-subtle hover:shadow-float space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Critical Unassigned</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          </div>
          <div className="font-mono text-3xl font-black text-rose-600">
            {analytics?.criticalUnassignedCount || 0}
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Hazards requiring immediate crew assignment
          </span>
        </div>

        <div className="bento-card p-5 bg-gradient-to-br from-white via-white to-emerald-50/40 border border-slate-200/90 shadow-subtle hover:shadow-float space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Resolution Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="font-mono text-3xl font-black text-emerald-600">
            {analytics?.resolutionRatePercent || 0}%
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {analytics?.resolvedCount || 0} of {analytics?.totalReports || 0} total tickets resolved
          </span>
        </div>

        <div className="bento-card p-5 bg-gradient-to-br from-white via-white to-blue-50/40 border border-slate-200/90 shadow-subtle hover:shadow-float space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Workforce Load</span>
            <HardHat className="h-4 w-4 text-brand" />
          </div>
          <div className="font-mono text-3xl font-black text-slate-900">
            {analytics?.workforceCapacity.activeSlots} / {analytics?.workforceCapacity.totalSlots}
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (analytics?.workforceCapacity.utilizationPercent || 0) > 85
                  ? "bg-rose-500"
                  : "bg-brand"
              }`}
              style={{ width: `${analytics?.workforceCapacity.utilizationPercent || 0}%` }}
            />
          </div>
        </div>

        <div className="bento-card p-5 bg-gradient-to-br from-white via-white to-amber-50/40 border border-slate-200/90 shadow-subtle hover:shadow-float space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>City Avg AI Priority</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-mono text-3xl font-black text-slate-900">
            {analytics?.avgPriorityScore || 0}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Dynamic score factoring severity &amp; community consensus
          </span>
        </div>
      </div>

      {/* Row 2: 12-Col Bento Split (8 cols Left Queue + 4 cols Right Workforce) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): AI Priority & Constraint Queue */}
        <div className="space-y-4 lg:col-span-8">
          <div className="bento-card bg-white border border-slate-200 shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-brand" />
                  AI Priority Queue &amp; Resilience Controls (A02 &amp; A07)
                </h2>
                <p className="text-xs text-slate-500">
                  Sorted by priority. Use &ldquo;Auto-Assign (A02)&rdquo; or test A07 failure recovery directly.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-brand font-mono">
                {queue.length} Total
              </span>
            </div>

            {/* Reports Queue */}
            <div className="divide-y divide-slate-100">
              {queue.map((report) => {
                const isUnassigned =
                  report.status === "REPORTED" ||
                  report.status === "AI_TRIAGED" ||
                  report.status === "COMMUNITY_VERIFIED" ||
                  report.status === "PRIORITY_SCORED";
                const isDispatched =
                  report.status === "ASSIGNED" || report.status === "IN_PROGRESS";
                const isFailedRecovery = report.status === "FAILED_RECOVERY";

                return (
                  <div
                    key={report.id}
                    className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${
                            report.priorityScore >= 85
                              ? "bg-red-50 text-status-critical border-red-200"
                              : "bg-blue-50 text-brand border-blue-200"
                          }`}
                        >
                          Score: {Math.round(report.priorityScore)}/100
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {report.category.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isFailedRecovery
                              ? "bg-red-100 text-red-800 border-red-300 font-extrabold"
                              : isDispatched
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {report.status.replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {report.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {report.address} &bull; {report.wardZone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                      <Link
                        href={`/reports/${report.id}`}
                        className="btn-tactile rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                      >
                        Inspect
                      </Link>

                      {/* A02 Auto-Assign */}
                      {isUnassigned && (
                        <button
                          onClick={() => handleAutoAssign(report.id, report.title, "STRICT")}
                          disabled={assigningId === report.id}
                          className="btn-tactile btn-glossy flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-1.5 text-xs font-black text-white shadow-sm hover:shadow-glow border border-blue-500/40 disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {assigningId === report.id ? "Optimizing..." : "Auto-Assign (A02)"}
                        </button>
                      )}

                      {/* A07: Simulate Step Failure */}
                      {isDispatched && (
                        <button
                          onClick={() => handleSimulateFailure(report.id)}
                          disabled={simulatingId === report.id}
                          className="btn-tactile flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50/80 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-2xs disabled:opacity-50"
                          title="Simulate intermediate worker drop/failure (A07 Test)"
                        >
                          <Bug className="h-3.5 w-3.5 text-rose-600" />
                          {simulatingId === report.id ? "Failing..." : "Simulate Fail (A07)"}
                        </button>
                      )}

                      {/* A07: Run Automated Recovery */}
                      {isFailedRecovery && (
                        <button
                          onClick={() => handleRecoverWorkflow(report.id)}
                          disabled={recoveringId === report.id}
                          className="btn-tactile btn-glossy flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3.5 py-1.5 text-xs font-black text-white shadow-sm hover:shadow-glowEmerald border border-emerald-500/40 disabled:opacity-50 animate-bounce"
                          title="Trigger automated multi-step recovery & rollback (A07 Test)"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {recoveringId === report.id ? "Recovering..." : "Auto-Recover (A07)"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Department Capacity & Workload Bento Card */}
        <div className="space-y-4 lg:col-span-4">
          <div className="bento-card p-5 bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardHat className="h-4 w-4 text-brand" />
                Department Workforce Roster
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Active Slots
              </span>
            </div>

            <div className="space-y-4">
              {analytics?.departmentStats.map((dept) => (
                <div key={dept.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{dept.name}</span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        dept.isSaturated
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {dept.activeLoad} / {dept.totalCapacity} {dept.isSaturated ? "(100% Full)" : "Busy"}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {dept.workers.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between text-[11px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-100"
                      >
                        <span className="font-medium truncate max-w-[140px]">{w.name}</span>
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            w.activeTaskCount >= w.workerCapacity ? "text-red-600 font-extrabold" : "text-slate-700"
                          }`}
                        >
                          {w.activeTaskCount} / {w.workerCapacity} tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: City Analytics Bento Row & A07 Live Event Stream */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: A07 Automated Workflow Event Monitor */}
        <div className="bento-card p-5 bg-white border border-slate-200 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand" />
              A07 Live Workflow State Machine Stream
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live ACID Logs
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto space-y-1">
            {analytics?.recentWorkflowLogs && analytics.recentWorkflowLogs.length > 0 ? (
              analytics.recentWorkflowLogs.map((log) => (
                <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">
                      {log.stepName}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {log.report?.title ? `Report: ${log.report.title.slice(0, 28)}...` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : log.status === "FAILED"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {new Date(log.executedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-400 text-center">No recent workflow events.</div>
            )}
          </div>
        </div>

        {/* Right: Ward Hotspots */}
        <div className="bento-card p-5 bg-white border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            Top District Ward Hotspots (M05 Analytics)
          </h3>

          <div className="space-y-3">
            {analytics?.wardHotspots.map((ward) => (
              <div key={ward.wardZone} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{ward.wardZone}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ward.riskLevel === "CRITICAL"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {ward.riskLevel}
                    </span>
                    <span className="font-mono text-slate-600 font-bold">{ward.openCount} open</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      ward.riskLevel === "CRITICAL" ? "bg-red-500" : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (ward.openCount / 10) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Conflict Resolution Modal (Challenge A02 Key Test Case) */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bento-card w-full max-w-xl bg-white p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    A02 Capacity Constraint Conflict Detected
                  </h3>
                  <span className="text-xs text-red-700 font-semibold">
                    Infeasible Request Handling Triggered
                  </span>
                </div>
              </div>
              <button
                onClick={() => setConflictModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-red-50/80 p-3.5 border border-red-200 text-xs text-red-900 space-y-1">
              <p className="font-bold">{conflictModal.conflictReason}</p>
              <p className="text-[11px] text-red-700">
                Target issue: &ldquo;{conflictModal.reportTitle}&rdquo;. All departmental crew slots are booked.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Choose an AI-Recommended Fallback Protocol:
              </span>

              {conflictModal.fallbackOptions.map((opt) => (
                <div
                  key={opt.strategy}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {opt.label}
                    </span>
                    <button
                      onClick={() =>
                        handleAutoAssign(
                          conflictModal.reportId,
                          conflictModal.reportTitle,
                          opt.strategy
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-hover shadow-sm transition"
                    >
                      Execute <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {opt.tradeoffExplanation}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setConflictModal(null)}
                className="text-xs font-semibold text-slate-500 hover:underline"
              >
                Cancel and keep unassigned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
