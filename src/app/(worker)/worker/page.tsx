"use client";

import React, { useEffect, useState } from "react";
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
  X,
  ExternalLink,
  Navigation,
  Camera,
  AlertTriangle,
  Radio,
  Sparkles,
  Layers,
  Wrench,
  RotateCcw,
  Compass,
  Check,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Wifi,
  Eye,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

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

const REPAIR_PROOF_SAMPLES = [
  {
    label: "Road Crater Repaved & Asphalt Sealed",
    category: "Pothole / Road Damage",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    tags: ["Hot-mix Asphalt Poured", "Vibratory Compacted", "Debris Cleared"],
  },
  {
    label: "High-Voltage Wire Re-sleeved & Elevated",
    category: "Electrical Hazard",
    url: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    tags: ["Insulated Sleeving Installed", "Weatherproof Bracket", "Circuit Tested"],
  },
  {
    label: "Reinforced Ductile Iron Manhole Lid Fitted",
    category: "Drainage & Sewerage",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    tags: ["Heavy-duty Lid Fitted", "Rim Mortar Re-sealed", "Flow Inspected"],
  },
];

const STANDARD_EQUIPMENT_CHECKLIST: Record<string, string[]> = {
  default: [
    "High-Visibility Safety Vests & Helmets",
    "Emergency Traffic Cones & Warning Signage",
    "Digital Caliper & Geotagged Camera Terminal",
    "Municipal Dispatch Radio & First Aid Kit",
  ],
  "Road Maintenance": [
    "Hot-mix Asphalt Bag / Cold Patch Polymer",
    "Mechanical Plate Compactor & Hand Tamper",
    "Bituminous Emulsion Tack Coat Sealant",
    "Asphalt Rake, Shovel & Broom",
  ],
  "Electrical & Lighting": [
    "1000V Insulated Hand Tools & Gloves",
    "Digital Multimeter & Non-Contact Voltage Tester",
    "Heavy-Duty Heat Shrink Sleeving",
    "Telescopic Fiberglass Insulated Pole",
  ],
};

export default function WorkerWorkspacePage() {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);

  // Mobile navigation tabs: "tasks" | "map" | "completed"
  const [activeTab, setActiveTab] = useState<"tasks" | "map" | "completed">("tasks");

  // Shift & duty status
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Modal / Bottom Sheet state for submitting after proof
  const [activeModalReport, setActiveModalReport] = useState<WorkerTask["report"] | null>(null);
  const [afterProofUrl, setAfterProofUrl] = useState(REPAIR_PROOF_SAMPLES[0].url);
  const [selectedProofIndex, setSelectedProofIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(REPAIR_PROOF_SAMPLES[0].tags);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Interactive Checklist states for active tasks
  const [checkedEquip, setCheckedEquip] = useState<Record<string, Record<string, boolean>>>({});

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
          text: "Work order started! Status set to IN PROGRESS. City dispatch notified.",
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

    const fullNotes = [
      notes.trim(),
      selectedTags.length > 0 ? `Work Completed: ${selectedTags.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const res = await fetch(`/api/worker/tasks/${activeModalReport.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          afterProofUrl,
          notes: fullNotes,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setActionFeedback({
          type: "success",
          text: "After-repair evidence submitted! Issue resolved & queued for citizen final sign-off.",
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

  const toggleEquipmentItem = (reportId: string, item: string) => {
    setCheckedEquip((prev) => {
      const reportItems = prev[reportId] || {};
      return {
        ...prev,
        [reportId]: {
          ...reportItems,
          [item]: !reportItems[item],
        },
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3 shadow-md" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
          INITIALIZING MOBILE FIELD TERMINAL...
        </span>
        <p className="text-[11px] text-slate-400 mt-1">Synchronizing municipal work orders &amp; GPS coordinates</p>
      </div>
    );
  }

  // Auth gate if user is not logged in as worker
  if (authError || !worker) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-slate-700/80 p-6 shadow-2xl space-y-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
            <HardHat className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Field Operations Terminal</h2>
            <p className="text-xs text-slate-400 mt-1">
              Field Worker credentials are required to inspect and execute municipal work orders.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 text-left space-y-1">
            <strong>Demonstration Access:</strong>
            <p>You can authenticate instantly as the Lead Field Operative with 1 click.</p>
          </div>

          <button
            type="button"
            onClick={handle1ClickWorkerDemo}
            disabled={isDemoLoggingIn}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isDemoLoggingIn ? (
              <span>Authenticating Terminal...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>1-Click Sign-in: Lead Field Operative</span>
              </>
            )}
          </button>

          <Link
            href="/login"
            className="block text-xs text-slate-400 hover:text-white font-mono underline pt-2"
          >
            Go to standard login screen
          </Link>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.completedAt === null);
  const completedTasks = tasks.filter((t) => t.completedAt !== null);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-24">
      {/* 1. MOBILE-FIRST TOP OPERATIONAL HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
          {/* Worker Info & Unit */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <HardHat className="h-5 w-5" />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F172A] ${
                  isOnDuty ? "bg-emerald-500" : "bg-slate-500"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-bold text-white text-sm truncate">{worker.name}</h1>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  Unit 04
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {worker.department} &bull; Mirpur Sector
              </p>
            </div>
          </div>

          {/* Duty Switcher & Workload Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsOnDuty(!isOnDuty)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-bold transition-colors flex items-center gap-1.5 ${
                isOnDuty
                  ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <Radio className={`h-3 w-3 ${isOnDuty ? "animate-pulse text-emerald-400" : ""}`} />
              <span>{isOnDuty ? "ON DUTY" : "OFF SHIFT"}</span>
            </button>
          </div>
        </div>

        {/* Capacity Progress Strip */}
        <div className="mx-auto max-w-2xl mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">Active Orders:</span>
            <span className="font-mono font-bold text-white">
              {activeTasks.length} / {worker.workerCapacity} max
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
            <Wifi className="h-3 w-3" />
            <span>GPS Connected (±3m)</span>
          </div>
        </div>
      </header>

      {/* 2. ACTION FEEDBACK TOAST */}
      {actionFeedback && (
        <div className="mx-auto max-w-2xl px-4 pt-3">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold ${
              actionFeedback.type === "success"
                ? "bg-emerald-950/90 border-emerald-600/80 text-emerald-200"
                : "bg-rose-950/90 border-rose-600/80 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="p-1 hover:bg-black/20 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. TACTICAL SUB-NAVIGATION BAR (MOBILE TABS) */}
      <div className="sticky top-[89px] z-30 bg-[#0A0F1D]/90 backdrop-blur-sm border-b border-slate-800/80 px-4 py-2">
        <div className="mx-auto max-w-2xl grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "tasks"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Active Queue</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "tasks" ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {activeTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "map"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Tactical Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Resolved</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "completed" ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {completedTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* TAB 1: ACTIVE FIELD WORK ORDERS */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-10 text-center space-y-3 shadow-lg">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">All Field Orders Cleared</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You have completed all assigned work orders for this shift. Stand by on radio frequency for incoming dispatch alerts.
                </p>
              </div>
            ) : (
              activeTasks.map(({ report, overrideReason }) => {
                const isAssigned = report.status === "ASSIGNED";
                const isInProgress = report.status === "IN_PROGRESS";
                const priorityNum = Math.round(report.priorityScore);
                const isUrgent = priorityNum >= 80;

                const equipment =
                  STANDARD_EQUIPMENT_CHECKLIST[worker.department] ||
                  STANDARD_EQUIPMENT_CHECKLIST["default"];

                const taskChecked = checkedEquip[report.id] || {};
                const checkedCount = Object.values(taskChecked).filter(Boolean).length;

                return (
                  <article
                    key={report.id}
                    className={`rounded-2xl border overflow-hidden shadow-xl transition-all ${
                      isUrgent
                        ? "border-rose-500/60 bg-[#16101F]"
                        : "border-slate-700/80 bg-[#0F172A]"
                    }`}
                  >
                    {/* Urgency & Category Header */}
                    <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded border shadow-xs ${
                            isUrgent
                              ? "bg-rose-950/90 text-rose-300 border-rose-700/80"
                              : "bg-blue-950/90 text-blue-300 border-blue-700/80"
                          }`}
                        >
                          P-{priorityNum}
                        </span>

                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          <DynamicCategoryIcon nameOrSlug={report.category?.name} size={14} />
                          <span>{report.category?.name}</span>
                        </span>
                      </div>

                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isInProgress
                            ? "bg-amber-950/80 border-amber-600 text-amber-300 animate-pulse"
                            : "bg-blue-950/80 border-blue-600 text-blue-300"
                        }`}
                      >
                        {isInProgress ? "● IN PROGRESS" : "ASSIGNED / READY"}
                      </span>
                    </div>

                    {/* Incident Summary & Photo Preview */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          <Image
                            src={
                              report.beforeProofUrl ||
                              report.imageUrl ||
                              "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&auto=format&fit=crop"
                            }
                            alt={report.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-white leading-snug line-clamp-1">
                            {report.title}
                          </h3>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 pt-0.5">
                            <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                            <span className="truncate">{report.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* GPS Distance & Navigation Bar */}
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Direct GPS Target
                          </span>
                          <span className="font-bold text-slate-200">
                            {report.wardZone} &bull; ~450m from your unit
                          </span>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            report.address || report.wardZone
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Navigate</span>
                        </a>
                      </div>

                      {/* Material & Equipment Checklist */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-300 text-[11px] uppercase flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-amber-400" />
                            <span>Crew Gear &amp; Material Checklist</span>
                          </span>
                          <span className="font-mono text-[10px] text-amber-400">
                            {checkedCount}/{equipment.length} Verified
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {equipment.map((item) => {
                            const isChecked = !!taskChecked[item];
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleEquipmentItem(report.id, item)}
                                className={`text-left p-2 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-2 ${
                                  isChecked
                                    ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
                                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <span
                                  className={`h-4 w-4 rounded flex items-center justify-center border text-[9px] shrink-0 ${
                                    isChecked
                                      ? "bg-emerald-600 border-emerald-500 text-white"
                                      : "border-slate-600 bg-slate-800"
                                  }`}
                                >
                                  {isChecked && "✓"}
                                </span>
                                <span className="truncate">{item}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* SLA Urgency Countdown Strip */}
                      <div className="flex items-center justify-between text-[11px] font-mono px-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>Service Target: 4h Resolution</span>
                        </span>
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                        >
                          <span>Full Dossier</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    {/* 5. PRIMARY LARGE TACTICAL ACTION BUTTON (>= 48px Height) */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800">
                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleStartWork(report.id)}
                          className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
                        >
                          <Play className="h-4 w-4 fill-current" />
                          <span>START ON-SITE PHYSICAL REPAIR</span>
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalReport(report);
                            setAfterProofUrl(REPAIR_PROOF_SAMPLES[0].url);
                            setSelectedProofIndex(0);
                            setSelectedTags(REPAIR_PROOF_SAMPLES[0].tags);
                          }}
                          className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
                        >
                          <Camera className="h-4 w-4" />
                          <span>CAPTURE AFTER-PROOF &amp; RESOLVE</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: TACTICAL MAP & ROUTE PREVIEW */}
        {activeTab === "map" && (
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-400" />
                <h3 className="font-mono font-bold text-xs text-white uppercase">
                  SECTOR ROUTE &amp; DISPATCH RADAR
                </h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                {activeTasks.length} Work Targets in Ward
              </span>
            </div>

            {/* Tactical Grid Visualization */}
            <div className="h-64 w-full rounded-xl bg-[#070B16] border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
              {/* Radar Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

              <div className="relative z-10 space-y-2">
                <div className="h-12 w-12 rounded-full border-2 border-amber-500/60 bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                  <Navigation className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-white block">
                    Mirpur Sector 10 Tactical Hub
                  </span>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Your unit is positioned within 1.2km of all {activeTasks.length} active assignments.
                  </p>
                </div>
              </div>
            </div>

            {/* List of target stops */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                Sequence of Work Stops:
              </span>
              {activeTasks.map(({ report }, idx) => (
                <div
                  key={report.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white line-clamp-1">{report.title}</h4>
                      <span className="text-[11px] text-slate-400">{report.address}</span>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      report.address || report.wardZone
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RESOLVED TASKS LOG */}
        {activeTab === "completed" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-mono font-bold text-xs text-white uppercase flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>RESOLVED WORK HISTORY ({completedTasks.length})</span>
              </h3>
              <span className="font-mono text-[10px] text-slate-400">Archived Sign-Offs</span>
            </div>

            {completedTasks.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-8 text-center text-xs text-slate-500 font-mono">
                No tickets resolved yet on this shift.
              </div>
            ) : (
              completedTasks.map(({ report, completedAt }) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-slate-800 bg-[#0F172A] p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{report.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {report.address} &bull; {report.wardZone}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                      RESOLVED
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Completed: {completedAt ? new Date(completedAt).toLocaleTimeString() : "Today"}
                    </span>
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View Sign-Off</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* 6. MOBILE BOTTOM RESOLUTION EVIDENCE SHEET (MODAL) */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#0F172A] border border-slate-700 p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  FIELD EVIDENCE SUBMISSION
                </span>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
                  <Camera className="h-4 w-4 text-emerald-400" />
                  <span>Submit After-Repair Evidence Proof</span>
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1">{activeModalReport.title}</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalReport(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Split Before/After Evidence Comparator */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-slate-300 font-bold block">
                Evidence Comparison (Before vs After):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {/* Before Citizen Photo */}
                <div className="space-y-1">
                  <div className="relative h-28 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                    <Image
                      src={
                        activeModalReport.beforeProofUrl ||
                        activeModalReport.imageUrl ||
                        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&auto=format&fit=crop"
                      }
                      alt="Before"
                      fill
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-white font-bold">
                      BEFORE
                    </span>
                  </div>
                  <span className="text-slate-400 truncate block">Reported State</span>
                </div>

                {/* After Repair Proof */}
                <div className="space-y-1">
                  <div className="relative h-28 rounded-lg overflow-hidden bg-slate-800 border border-emerald-500/80">
                    <Image src={afterProofUrl} alt="After Repair Proof" fill className="object-cover" />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                      AFTER
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold truncate block">Repair Verified</span>
                </div>
              </div>
            </div>

            {/* Sample Selector or Real Camera input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Select Geotagged After Proof:</span>
                <label className="cursor-pointer text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px]">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Device Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setAfterProofUrl(url);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {REPAIR_PROOF_SAMPLES.map((sample, idx) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setSelectedProofIndex(idx);
                      setAfterProofUrl(sample.url);
                      setSelectedTags(sample.tags);
                    }}
                    className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all text-left ${
                      selectedProofIndex === idx
                        ? "border-emerald-500 ring-2 ring-emerald-500/40"
                        : "border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={sample.url} alt={sample.label} fill className="object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1 text-[9px] text-white font-mono leading-none">
                      Proof #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Resolution Tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Work Performed Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 text-[11px] font-mono flex items-center gap-1"
                  >
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Operative Field Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-200 block">
                Operative Field Notes:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cleared asphalt edges, packed cold-mix polymer, tested load resistance..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Modal Submit & Cancel Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalReport(null)}
                className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResolveSubmit}
                disabled={submitting}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <span>Uploading Proof...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm &amp; Resolve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
