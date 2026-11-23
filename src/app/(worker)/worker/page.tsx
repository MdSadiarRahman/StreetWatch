"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HardHat,
  CheckCircle,
  Clock,
  MapPin,
  Play,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface WorkerTask {
  assignmentId: string;
  assignedAt: string;
  completedAt: string | null;
  overrideReason: string | null;
  report: {
    id: string;
    title: string;
    description: string;
    address: string;
    wardZone: string;
    status: string;
    priorityScore: number;
    imageUrl: string;
    beforeProofUrl?: string | null;
    afterProofUrl?: string | null;
    category: {
      name: string;
    };
  };
}

interface WorkerProfile {
  id: string;
  name: string;
  department: string;
  activeTaskCount: number;
  workerCapacity: number;
}

const REPAIR_PROOF_SAMPLES = [
  {
    label: "Pothole Repaved & Asphalt Sealed",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Live Wire Insulated & Sleeved",
    url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Reinforced Iron Manhole Lid Replaced",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  },
];

export default function WorkerWorkspacePage() {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for submitting after proof
  const [activeModalReport, setActiveModalReport] = useState<WorkerTask["report"] | null>(null);
  const [afterProofUrl, setAfterProofUrl] = useState(REPAIR_PROOF_SAMPLES[0].url);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/worker/tasks");
      if (res.ok) {
        const json = await res.json();
        setWorker(json.data?.worker || null);
        setTasks(json.data?.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load worker tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartWork = async (reportId: string) => {
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/worker/tasks/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: "success",
          text: "Task marked In Progress! Municipal command center and city map updated.",
        });
        await fetchTasks();
      } else {
        setActionFeedback({
          type: "error",
          text: json.error?.message || "Failed to start work.",
        });
      }
    } catch {
      setActionFeedback({ type: "error", text: "Network error occurred." });
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalReport) return;
    setSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/worker/tasks/${activeModalReport.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          afterProofUrl,
          notes,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setActionFeedback({
          type: "success",
          text: "Repair proof submitted! Incident is now awaiting Citizen Final Sign-Off.",
        });
        setActiveModalReport(null);
        setNotes("");
        await fetchTasks();
      } else {
        setActionFeedback({
          type: "error",
          text: json.error?.message || "Failed to submit repair proof.",
        });
      }
    } catch {
      setActionFeedback({ type: "error", text: "Network error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-xs text-slate-500 font-medium">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-civic border-t-transparent mb-2" />
        <p>Loading Municipal Field Operations Roster...</p>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.completedAt === null);
  const completedTasks = tasks.filter((t) => t.completedAt !== null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* 70% Civic Swiss Field Worker Header */}
      <div className="civic-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {worker?.name}
              </h1>
              <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
                {worker?.department}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Mobile Field Operations Terminal &bull; On-Site Municipal Dispatch
            </p>
          </div>
        </div>

        {/* Capacity Meter */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
              Workload Capacity
            </span>
            <div className="font-mono text-sm font-extrabold text-slate-900">
              {worker?.activeTaskCount} / {worker?.workerCapacity} Active Work Orders
            </div>
          </div>
          <span
            className={`rounded px-2 py-1 text-[11px] font-bold border ${
              (worker?.activeTaskCount || 0) >= (worker?.workerCapacity || 3)
                ? "bg-rose-50 text-rose-800 border-rose-300"
                : "bg-emerald-50 text-emerald-800 border-emerald-300"
            }`}
          >
            {(worker?.activeTaskCount || 0) >= (worker?.workerCapacity || 3)
              ? "Max Capacity (3/3)"
              : "Slots Available"}
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`rounded-lg p-3.5 text-xs font-bold border flex items-center justify-between ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <span>{actionFeedback.text}</span>
          <button onClick={() => setActionFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Active Work Orders Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-civic" />
            <span>Assigned Field Work Orders ({activeTasks.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Prioritized by Urgency Score
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="civic-card p-12 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No pending work orders assigned</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              You are currently ready for dispatch. Incoming assignments from the Authority Command Center will appear here.
            </p>
          </div>
        ) : (
          activeTasks.map(({ report, overrideReason }) => {
            const isAssigned = report.status === "ASSIGNED";
            const isInProgress = report.status === "IN_PROGRESS";

            return (
              <div
                key={report.id}
                className="civic-card p-5 space-y-4"
              >
                {/* Header Information */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                        report.priorityScore >= 80
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-blue-50 text-civic border-blue-300"
                      }`}
                    >
                      P-{Math.round(report.priorityScore)}/100
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {report.category?.name}
                    </span>
                    {overrideReason && (
                      <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold border border-amber-300">
                        ⚡ AI Fallback Dispatched
                      </span>
                    )}
                  </div>

                  <span
                    className={`rounded px-2.5 py-0.5 text-xs font-bold border ${
                      isInProgress
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-blue-50 text-blue-800 border-blue-300"
                    }`}
                  >
                    {isInProgress ? "In Progress" : "Assigned — Ready to Start"}
                  </span>
                </div>

                {/* Body Details */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    <Image
                      src={report.beforeProofUrl || report.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&auto=format&fit=crop"}
                      alt={report.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {report.description}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {report.address} &bull; {report.wardZone}
                    </p>
                  </div>
                </div>

                {/* Worker Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    href={`/reports/${report.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-civic hover:underline"
                  >
                    <span>Inspect Ticket</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <button
                        onClick={() => handleStartWork(report.id)}
                        className="btn-tactile flex items-center gap-1.5 rounded-md bg-civic hover:bg-civic-hover px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Start On-Site Work</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => setActiveModalReport(report)}
                        className="btn-tactile flex items-center gap-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Submit Repair Proof &amp; Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Tasks History */}
      {completedTasks.length > 0 && (
        <div className="civic-card p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span>Recently Completed Field Repairs ({completedTasks.length})</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {completedTasks.map(({ report, completedAt }) => (
              <div
                key={report.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800">{report.title}</h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {report.address} &bull; Completed {completedAt ? new Date(completedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold text-[10px]">
                  {report.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Proof Upload Modal */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="civic-card w-full max-w-lg bg-white p-6 shadow-overlay border border-slate-300 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span>Submit Repair Proof &amp; Resolve Incident</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Ticket: &ldquo;{activeModalReport.title}&rdquo;
                </p>
              </div>
              <button
                onClick={() => setActiveModalReport(null)}
                aria-label="Close modal"
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  &ldquo;After&rdquo; Repair Photographic Proof URL *
                </label>
                <input
                  type="url"
                  required
                  value={afterProofUrl}
                  onChange={(e) => setAfterProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
                />
              </div>

              {/* Quick Sample Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">
                  Standard Verified Field Repair Proofs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REPAIR_PROOF_SAMPLES.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => setAfterProofUrl(sample.url)}
                      className={`btn-tactile rounded border px-2 py-0.5 text-[11px] font-bold transition ${
                        afterProofUrl === sample.url
                          ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Field Worker Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Materials applied, compaction tests conducted, safety perimeter removed..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalReport(null)}
                  className="btn-tactile rounded-md px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tactile rounded-md bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-2xs transition disabled:opacity-50"
                >
                  {submitting ? "Submitting Proof..." : "Confirm & Resolve Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
