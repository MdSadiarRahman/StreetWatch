"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HardHat,
  MapPin,
  Navigation,
  Play,
  CheckCircle2,
  Camera,
  FileText,
  Clock,
  Sparkles,
  Check,
  AlertTriangle,
  Plus,
  Wifi,
  Eye,
  CheckCheck,
  X,
  Settings,
  User,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { AccountDropdown } from "@/components/account/AccountDropdown";
import { UserAvatar } from "@/components/account/UserAvatar";

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
    latitude?: number;
    longitude?: number;
    status: string;
    priorityScore: number;
    severityScore?: number;
    imageUrl: string;
    beforeProofUrl?: string | null;
    afterProofUrl?: string | null;
    createdAt?: string;
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

// Curated high-res municipal repair evidence proofs for instant 1-tap capture
const REPAIR_PROOF_SAMPLES = [
  {
    id: "proof-1",
    label: "Asphalt Repaved & Sealed",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    tags: ["Hot-mix asphalt poured", "Vibratory compacted", "Debris cleared"],
  },
  {
    id: "proof-2",
    label: "Live Electrical Wire Sleeved",
    url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    tags: ["Insulated sleeve fitted", "Weatherproof bracket", "Circuit verified"],
  },
  {
    id: "proof-3",
    label: "Manhole Cast Iron Lid Replaced",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    tags: ["Heavy-duty lid installed", "Rim mortar sealed", "Flow inspected"],
  },
];

// Minimal typing preset chips for one-handed operation
const QUICK_RESOLUTION_CHIPS = [
  "Hot-mix asphalt poured & leveled",
  "Mechanically compacted",
  "Edge joint sealed with bitumen",
  "Safety cones & barricades removed",
  "Full traffic corridor reopened",
  "Hazard eliminated per city code",
];

export default function WorkerWorkspacePage() {
  const { user: authUser, signingOut, logout } = useAuth();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);

  // Active Task Index (One-handed task focus)
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);

  // Form & Evidence States
  const [selectedProofUrl, setSelectedProofUrl] = useState<string>(REPAIR_PROOF_SAMPLES[0].url);
  const [activeChips, setActiveChips] = useState<string[]>(["Hot-mix asphalt poured & leveled", "Safety cones & barricades removed"]);
  const [customNote, setCustomNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Full-screen image zoom modal
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/worker/tasks");
      if (res.ok) {
        const json = await res.json();
        setWorker(json.data?.worker || null);
        setTasks(json.data?.tasks || []);
        setAuthError(false);
      } else if (res.status === 403 || res.status === 401) {
        setAuthError(true);
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

  const handle1ClickWorkerDemo = async () => {
    setIsDemoLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "worker1@streetwatch.demo",
          password: "Demo@1234",
        }),
      });
      if (res.ok) {
        setAuthError(false);
        await fetchTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  // Toggle quick chip for minimal typing
  const toggleChip = (chip: string) => {
    setActiveChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  // Start Work Handler (Transitions ASSIGNED -> IN_PROGRESS)
  const handleStartWork = async (reportId: string) => {
    setSubmittingAction(true);
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
          text: "WORK STARTED! Ticket status set to IN PROGRESS.",
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
    } finally {
      setSubmittingAction(false);
    }
  };

  // Mark Resolved Handler (Transitions IN_PROGRESS -> RESOLVED)
  const handleMarkResolved = async (reportId: string) => {
    setSubmittingAction(true);
    setActionFeedback(null);

    const fullNotes = [
      activeChips.length > 0 ? `Tags: ${activeChips.join(", ")}` : "",
      customNote.trim(),
    ]
      .filter(Boolean)
      .join(" | ") || "Physical remediation completed and verified by lead crew.";

    try {
      const res = await fetch(`/api/worker/tasks/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          afterProofUrl: selectedProofUrl,
          notes: fullNotes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: "success",
          text: "ISSUE MARKED RESOLVED! Photographic proof archived for citizen sign-off.",
        });
        setCustomNote("");
        setShowNoteInput(false);
        await fetchTasks();
      } else {
        setActionFeedback({
          type: "error",
          text: json.error?.message || "Failed to resolve issue.",
        });
      }
    } catch {
      setActionFeedback({ type: "error", text: "Network error occurred." });
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080D1A] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs font-black tracking-widest text-amber-400 uppercase">
          CONNECTING FIELD TERMINAL...
        </span>
        <p className="text-xs text-slate-400 mt-1">Acquiring municipal work orders and GPS coordinates</p>
      </div>
    );
  }

  // 1-Click Authentication Gate if not logged in
  if (authError || !worker) {
    return (
      <div className="min-h-screen bg-[#080D1A] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-slate-700 p-6 shadow-2xl space-y-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
            <HardHat className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              Field Operations Terminal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dedicated high-contrast task interface for on-site municipal response operatives.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 text-left space-y-1">
            <strong>Outdoor Task Mode:</strong>
            <p>One-handed navigation, large touch targets, minimal typing, and instant proof capture.</p>
          </div>

          <button
            type="button"
            onClick={handle1ClickWorkerDemo}
            disabled={isDemoLoggingIn}
            className="civic-btn-primary hover:shadow-civic-warning w-full min-h-[52px] py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {isDemoLoggingIn ? (
              <span>Activating Field Session...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>1-Click Sign-in: Lead Field Operative</span>
              </>
            )}
          </button>

          <Link href="/login" className="block text-xs text-slate-400 hover:text-white font-mono underline pt-2">
            Standard Login Credentials
          </Link>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.completedAt === null);
  const currentTask = activeTasks[activeTaskIndex] || activeTasks[0];
  const isAssigned = currentTask?.report.status === "ASSIGNED";
  const isInProgress = currentTask?.report.status === "IN_PROGRESS";
  const isResolved = currentTask?.report.status === "RESOLVED";

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between pb-32">
      {/* 1. TOP MOBILE TERMINAL COMPACT STATUS BAR (One-Handed Visibility) */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-2">
          {/* Operative Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              name={authUser?.name || worker.name}
              avatarUrl={authUser?.avatarUrl}
              role="FIELD_WORKER"
              size="sm"
              theme="dark"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white truncate">{authUser?.name || worker.name}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate block">
                {worker.department}
              </span>
            </div>
          </div>

          {/* GPS Accuracy Status & Account Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden xs:flex sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400">
              <Wifi className="h-3 w-3" />
              <span>GPS</span>
            </div>
            {authUser ? (
              <AccountDropdown user={authUser} onLogout={logout} signingOut={signingOut} theme="dark" compact />
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/profile"
                  aria-label="My Profile"
                  className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  <User className="h-4 w-4" />
                </Link>
                <Link
                  href="/settings"
                  aria-label="Account Settings"
                  className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2. ONE-HANDED TASK SELECTOR TABS (If multiple active tasks) */}
        {activeTasks.length > 1 && (
          <div className="mx-auto max-w-lg mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0 mr-1">
              Orders:
            </span>
            {activeTasks.map((t, idx) => {
              const isActive = idx === activeTaskIndex;
              const pScore = Math.round(t.report.priorityScore);
              return (
                <button
                  key={t.report.id}
                  type="button"
                  onClick={() => {
                    setActiveTaskIndex(idx);
                    setActionFeedback(null);
                  }}
                  className={`civic-badge-interactive min-h-[36px] px-3 rounded-lg font-mono text-xs font-bold shrink-0 flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span
                    className={`px-1 rounded text-[10px] ${
                      isActive ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    P-{pScore}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ACTION FEEDBACK ALERT */}
      {actionFeedback && (
        <div className="mx-auto max-w-lg w-full px-4 pt-3">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold ${
              actionFeedback.type === "success"
                ? "bg-emerald-950 border-emerald-600 text-emerald-200"
                : "bg-rose-950 border-rose-600 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded hover:bg-black/20 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN TASK RUNNER (TASK APPLICATION VIEW) */}
      <div role="region" aria-label="Active Field Task Workspace" className="mx-auto max-w-lg w-full px-4 py-4 space-y-4">
        {!currentTask ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-10 text-center space-y-3">
            <CheckCheck className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">All Field Orders Completed</h2>
            <p className="text-xs text-slate-400">
              No active tasks assigned in your sector. Awaiting dispatch orders from municipal command.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* A. WORKFLOW PROGRESS STEPPER (Assigned -> Navigate -> Start -> Resolve) */}
            <div className="civic-interactive-card-dark p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono font-bold">
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>ASSIGNED</span>
              </div>

              <span className="text-slate-600">&rarr;</span>

              <div
                className={`flex items-center gap-1.5 ${
                  isInProgress || isResolved ? "text-amber-400 font-black" : "text-slate-500"
                }`}
              >
                <span
                  className={`civic-timeline-dot h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                    isInProgress
                      ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400/50"
                      : isResolved
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isResolved ? "✓" : "2"}
                </span>
                <span>IN PROGRESS</span>
              </div>

              <span className="text-slate-600">&rarr;</span>

              <div
                className={`flex items-center gap-1.5 ${
                  isResolved ? "text-emerald-400 font-black" : "text-slate-500"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                    isResolved ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isResolved ? "✓" : "3"}
                </span>
                <span>RESOLVED</span>
              </div>
            </div>

            {/* B. LARGE PRIORITY & LOCATION CARD */}
            <section className="civic-interactive-card-dark rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-black px-2.5 py-1 rounded border ${
                      currentTask.report.priorityScore >= 80
                        ? "bg-rose-950 text-rose-300 border-rose-700"
                        : "bg-blue-950 text-blue-300 border-blue-700"
                    }`}
                  >
                    PRIORITY {Math.round(currentTask.report.priorityScore)}/100
                  </span>
                  <span className="font-bold text-xs text-white">
                    {currentTask.report.category?.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{currentTask.report.priorityScore >= 80 ? "Critical SLA Active" : "Standard SLA Active"}</span>
                </div>
              </div>

              {/* Huge Street Address */}
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                  Incident Site Address:
                </span>
                <h2 className="text-base font-bold text-white mt-0.5 leading-snug">
                  {currentTask.report.address}
                </h2>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  {currentTask.report.wardZone} &bull; Active Field Work Order
                </span>
              </div>

              {/* C. MASSIVE PRIMARY NAVIGATION BUTTON (>= 50px Touch Target) */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  currentTask.report.address || currentTask.report.wardZone
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="civic-btn-primary w-full min-h-[50px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Navigation className="h-4 w-4" />
                <span>NAVIGATE TO SITE (GOOGLE MAPS)</span>
              </a>
            </section>

            {/* D. BEFORE & AFTER EVIDENCE COMPARISON (The Core Worker Evidence Surface) */}
            <section className="civic-interactive-card-dark rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-400" />
                  <span>BEFORE / AFTER EVIDENCE COMPARISON</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Dual Proof Audit</span>
              </div>

              {/* Side-by-Side 2-Up Evidence Viewer */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* BEFORE (Citizen Photo) */}
                <div className="space-y-1.5">
                  <div
                    onClick={() =>
                      setZoomedImageUrl(
                        currentTask.report.beforeProofUrl ||
                          currentTask.report.imageUrl ||
                          "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop"
                      )
                    }
                    className="civic-interactive-card-dark relative h-36 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700 cursor-pointer group"
                  >
                    <Image
                      src={
                        currentTask.report.beforeProofUrl ||
                        currentTask.report.imageUrl ||
                        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop"
                      }
                      alt="Before Repair"
                      fill
                      className="object-cover civic-card-image"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-black">
                      BEFORE
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/70 text-slate-200">
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 block truncate">
                    Citizen Observation
                  </span>
                </div>

                {/* AFTER (Repair Proof) */}
                <div className="space-y-1.5">
                  <div
                    onClick={() => setZoomedImageUrl(selectedProofUrl)}
                    className="civic-interactive-card-dark hover:shadow-civic-success relative h-36 rounded-xl overflow-hidden bg-slate-800 border-2 border-emerald-500/80 cursor-pointer group"
                  >
                    <Image
                      src={selectedProofUrl}
                      alt="After Repair Proof"
                      fill
                      className="object-cover civic-card-image"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[9px] font-black">
                      AFTER
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/70 text-emerald-300">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 block truncate">
                    Repair Evidence Proof
                  </span>
                </div>
              </div>

              {/* Instant Camera Capture or Proof Picker */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Capture After Evidence:</span>
                  <label className="cursor-pointer text-amber-400 hover:text-amber-300 font-mono text-xs font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Open Device Camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const localUrl = URL.createObjectURL(e.target.files[0]);
                          setSelectedProofUrl(localUrl);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* 1-Tap Municipal Proof Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {REPAIR_PROOF_SAMPLES.map((sample, sIdx) => {
                    const isSelected = selectedProofUrl === sample.url;
                    return (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => setSelectedProofUrl(sample.url)}
                        className={`civic-interactive-card-dark group p-1.5 rounded-xl border-2 text-left relative overflow-hidden ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/30"
                            : "border-slate-800 bg-slate-900 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="relative h-12 w-full rounded-lg overflow-hidden bg-slate-800">
                          <Image src={sample.url} alt={sample.label} fill className="object-cover civic-card-image" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white block truncate mt-1">
                          Proof #{sIdx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* E. MINIMAL TYPING (1-Tap Work Completed Quick Chips) */}
            <section className="civic-interactive-card-dark rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCheck className="h-4 w-4 text-blue-400" />
                  <span>ONE-TAP RESOLUTION TAGS</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Zero Typing Needed</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_RESOLUTION_CHIPS.map((chip) => {
                  const isChecked = activeChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`civic-badge-interactive min-h-[36px] py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-emerald-950/70 border-emerald-600 text-emerald-200 font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded flex items-center justify-center text-[10px] border ${
                          isChecked
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : "border-slate-700 bg-slate-800"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom Note expansion */}
              {showNoteInput ? (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Custom Operative Note:</label>
                    <button
                      type="button"
                      onClick={() => setShowNoteInput(false)}
                      className="text-slate-400 hover:text-white text-[11px]"
                    >
                      Hide Note
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Substrate reinforced with 100mm gravel bed..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono pt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Custom Field Note</span>
                </button>
              )}
            </section>
          </div>
        )}
      </div>

      {/* 4. LARGE PRIMARY STICKY BOTTOM ACTION BAR (Anchored for One-Handed Thumb Reach) */}
      {currentTask && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-lg border-t border-slate-700 p-3 sm:p-4 shadow-2xl">
          <div className="mx-auto max-w-lg space-y-2">
            {/* Secondary Action Toolbar: ADD PHOTO | ADD NOTE */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold font-mono">
              <label className="civic-btn-secondary min-h-[42px] cursor-pointer py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>ADD PHOTO</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const localUrl = URL.createObjectURL(e.target.files[0]);
                      setSelectedProofUrl(localUrl);
                      setActionFeedback({
                        type: "success",
                        text: "New device photo captured and attached to repair proof!",
                      });
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="civic-btn-secondary min-h-[42px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5"
              >
                <FileText className="h-4 w-4 text-blue-400" />
                <span>{showNoteInput ? "HIDE NOTE" : "ADD NOTE"}</span>
              </button>
            </div>

            {/* MASSIVE PRIMARY ACTION BUTTON (>= 56px Touch Target) */}
            {isAssigned && (
              <button
                type="button"
                onClick={() => handleStartWork(currentTask.report.id)}
                disabled={submittingAction}
                className="civic-btn-primary w-full min-h-[56px] py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {submittingAction ? (
                  <span>COMMITTING TRANSITION...</span>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" />
                    <span>START WORK</span>
                  </>
                )}
              </button>
            )}

            {isInProgress && (
              <button
                type="button"
                onClick={() => handleMarkResolved(currentTask.report.id)}
                disabled={submittingAction}
                className="civic-btn-primary hover:shadow-civic-success w-full min-h-[56px] py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {submittingAction ? (
                  <span>SUBMITTING EVIDENCE...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>MARK RESOLVED</span>
                  </>
                )}
              </button>
            )}

            {isResolved && (
              <div className="w-full min-h-[52px] py-3 px-4 rounded-xl bg-slate-900 border border-emerald-500/60 text-emerald-300 font-bold text-xs uppercase font-mono flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>WORK COMPLETED &bull; AWAITING CITIZEN SIGN-OFF</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE ZOOM MODAL */}
      {zoomedImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged Evidence Photo"
          onClick={() => setZoomedImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full h-[70vh] rounded-2xl overflow-hidden border border-slate-700"
          >
            <Image src={zoomedImageUrl} alt="Zoomed Evidence Proof" fill className="object-contain" />
            <button
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              aria-label="Close enlarged evidence photo"
              className="absolute top-3 right-3 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/80 text-white hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
