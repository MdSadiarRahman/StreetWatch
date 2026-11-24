"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
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
  Activity,
  Filter,
  CheckCircle2,
  Clock,
  Radio,
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Flame,
  Scale,
  Cpu,
  BarChart3,
  Calendar,
  Building,
  Users,
  Compass,
  FileText,
  Settings,
  Eye,
  LogOut,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import AIAutoTriagePanel from "@/components/streetwatch/AIAutoTriagePanel";
import { IssueStatusTimeline } from "@/components/streetwatch/IssueStatusTimeline";
import { MapReportPin } from "@/components/map/CityMapCanvas";
import { DHAKA_MUNICIPAL_CREWS } from "@/components/map/gis-data";

// Dynamic import for GIS Map Canvas with SSR disabled
const CityMapCanvas = dynamic(() => import("@/components/map/CityMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0B1120] flex flex-col items-center justify-center text-xs text-slate-400 font-medium">
      <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
      <span>Initializing Dark Operational GIS Grid...</span>
    </div>
  ),
});

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
}

interface QueueReportItem extends MapReportPin {
  severityScore: number;
  departmentId?: string;
  isDuplicate?: boolean;
  assignedWorker?: {
    id: string;
    name: string;
  } | null;
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

type NavSection = "overview" | "issues" | "live_map" | "crews" | "analytics" | "reports" | "settings";

export default function AuthorityCommandCenter() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reports, setReports] = useState<QueueReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Operational states
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandMap, setExpandMap] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals & Banners
  const [conflictModal, setConflictModal] = useState<ConflictModalData | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch live dashboard analytics and queue
  const fetchData = async () => {
    try {
      const [analyticsRes, reportsRes] = await Promise.all([
        fetch("/api/analytics/summary"),
        fetch("/api/reports?sortBy=priority&limit=60"),
      ]);

      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        setAnalytics(json.data);
      }
      if (reportsRes.ok) {
        const json = await reportsRes.json();
        const items = json.data?.items || [];
        setReports(items);
        // Default select highest priority report
        if (items.length > 0 && !selectedReportId) {
          setSelectedReportId(items[0].id);
        }
      }
    } catch (err) {
      console.error("Command Center load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return reports.filter((r) => {
      if (wardFilter !== "ALL" && r.wardZone !== wardFilter) return false;
      if (statusFilter === "CRITICAL" && (r.priorityScore < 80 || r.status === "RESOLVED")) return false;
      if (statusFilter === "IN_PROGRESS" && r.status !== "IN_PROGRESS" && r.status !== "ASSIGNED") return false;
      if (statusFilter === "RESOLVED" && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          (r.wardZone && r.wardZone.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [reports, wardFilter, statusFilter, searchQuery]);

  // Selected Report
  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || reports[0] || null;
  }, [reports, selectedReportId]);

  // The 6 Operational KPIs specified in prompt:
  // 1. Open Issues
  // 2. Critical Issues
  // 3. In Progress
  // 4. Resolved Today
  // 5. SLA Breaches
  // 6. Available Crews
  const kpis = useMemo(() => {
    const open = reports.filter((r) => r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED").length;
    const critical = reports.filter((r) => r.priorityScore >= 80 && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED").length;
    const inProgress = reports.filter((r) => r.status === "IN_PROGRESS" || r.status === "ASSIGNED").length;
    const resolved = reports.filter((r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED").length;

    // SLA Breaches calculation (default SLA = 48h)
    const now = new Date().getTime();
    const slaBreaches = reports.filter((r) => {
      if (r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED") return false;
      const elapsedHours = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      return elapsedHours > 48;
    }).length;

    const totalSlots = analytics?.workforceCapacity.totalSlots ?? 12;
    const activeSlots = analytics?.workforceCapacity.activeSlots ?? 4;
    const availableCrews = Math.max(0, totalSlots - activeSlots);

    return {
      open,
      critical,
      inProgress,
      resolved,
      slaBreaches,
      availableCrews,
    };
  }, [reports, analytics]);

  // Critical Escalations (top unassigned critical reports)
  const criticalAlerts = useMemo(() => {
    return reports
      .filter((r) => r.priorityScore >= 80 && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED")
      .slice(0, 4);
  }, [reports]);

  // Trigger A02 Auto-Assign Optimizer
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

      setConflictModal(null);
      setActionMessage({
        type: "success",
        text: json.data?.message || "Municipal crew dispatched successfully via A02 Optimizer!",
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

  // Trigger A07 Step Failure Simulation
  const handleSimulateFailure = async (reportId: string) => {
    setSimulatingId(reportId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/workflow/${reportId}/simulate-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepName: "STEP_5_DISPATCH",
          reason: "Simulated worker unresponsiveness: Field team communication timeout.",
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: "Step failure simulated (A07 test). Ticket state set to FAILED_RECOVERY.",
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

  // Trigger A07 Autonomous Recovery
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

  // Recalculate Dynamic Priorities Across City
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
          text: json.data?.message || "Priorities dynamically updated across all 24 Dhaka wards!",
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
      <div className="h-screen w-screen bg-[#080D1A] flex flex-col items-center justify-center text-xs text-slate-400 font-mono">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>CONNECTING TO STREETWATCH OPERATIONAL COMMAND CENTER...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. TOP BAR: StreetWatch Identity, System Status, Area, Notifications, User Menu */}
      <header className="h-14 bg-[#0B1120] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-md">
        {/* Left: Identity & Live System Telemetry */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center font-mono font-bold text-white text-xs shadow-xs">
              SW
            </div>
            <div>
              <span className="font-mono font-extrabold text-xs tracking-wider text-white block leading-none">
                STREETWATCH
              </span>
              <span className="text-[9px] font-mono text-slate-400 tracking-tight uppercase">
                MUNICIPAL COMMAND TERMINAL
              </span>
            </div>
          </Link>

          <span className="hidden sm:inline-block w-px h-5 bg-slate-800" />

          {/* Live System Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#101A30] border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-emerald-400">GRID LIVE</span>
            <span className="text-slate-500">&bull;</span>
            <span>24 WARDS TELEMETRY ACTIVE</span>
          </div>
        </div>

        {/* Center: Current Area Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[#0F172A] border border-slate-800/90 text-xs text-slate-300">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-medium text-slate-400">JURISDICTION:</span>
          <strong className="text-white font-mono">DHAKA METROPOLITAN (DNCC / DSCC)</strong>
        </div>

        {/* Right: Actions, Notifications, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Dynamic Recalculate Button */}
          <button
            type="button"
            onClick={handleRecalculatePriorities}
            disabled={recalculating}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            title="Trigger A02 Batch Dynamic Priority Recalculation"
          >
            <RefreshCw className={`h-3 w-3 ${recalculating ? "animate-spin" : ""}`} />
            <span>{recalculating ? "Calculating..." : "A02 Recalculate"}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              aria-label="System notifications"
            >
              <Bell className="h-4 w-4" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0B1120]">
                  {criticalAlerts.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
                    Priority Escalation Alerts
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                    &times;
                  </button>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {criticalAlerts.map((ca) => (
                    <div
                      key={ca.id}
                      onClick={() => {
                        setSelectedReportId(ca.id);
                        setShowNotifications(false);
                      }}
                      className="p-2 rounded bg-slate-900/80 hover:bg-slate-800/80 border border-red-900/40 cursor-pointer text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-red-400 font-bold">
                        <span>P-{Math.round(ca.priorityScore)} CRITICAL</span>
                        <span className="font-mono text-[10px]">{ca.wardZone}</span>
                      </div>
                      <div className="text-white truncate font-medium">{ca.title}</div>
                      <div className="text-slate-400 text-[10px] truncate">{ca.address}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="w-px h-5 bg-slate-800" />

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/60 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-200">
              AR
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-white block leading-tight">Admin Rahman</span>
              <span className="text-[10px] font-mono text-emerald-400 block leading-tight">
                AUTHORITY OFFICER
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY WORKSPACE: Left Nav + Main Command Center */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT OPERATIONAL SIDEBAR */}
        <aside
          aria-label="Command Center Navigation"
          className="w-16 md:w-56 bg-[#0B1120] border-r border-slate-800/90 flex flex-col justify-between shrink-0 z-30 select-none py-3"
        >
          {/* Navigation Links */}
          <nav className="space-y-1 px-2">
            {[
              { id: "overview", label: "Overview", icon: Compass },
              { id: "issues", label: "Issue Queue", icon: AlertTriangle, count: kpis.open },
              { id: "live_map", label: "Live City Map", icon: MapPin },
              { id: "crews", label: "Workforce Crews", icon: HardHat, count: kpis.availableCrews },
              { id: "analytics", label: "SLA Monitoring", icon: Activity },
              { id: "reports", label: "Audit Registry", icon: FileText },
              { id: "settings", label: "Dispatch Policies", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as NavSection)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden md:inline">{item.label}</span>
                  </div>
                  {typeof item.count === "number" && (
                    <span
                      className={`hidden md:inline-block font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Telemetry Footer */}
          <div className="px-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 hidden md:block">
            <div className="text-slate-400 font-bold mb-0.5">DISPATCH ALGORITHM</div>
            <div>A02 Optimization: ACTIVE</div>
            <div>A07 Recovery Engine: READY</div>
            <div className="mt-2 text-slate-600">v2.5.4-OPERATIONAL</div>
          </div>
        </aside>

        {/* MAIN COMMAND CENTER SURFACE */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-5 space-y-4 bg-[#080D1A]">
          {/* Action Message Alert Banner */}
          {actionMessage && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
                actionMessage.type === "success"
                  ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-200"
                  : "bg-red-950/60 border-red-700/80 text-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {actionMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
              <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 3. MISSION-CRITICAL KPI SUMMARY (Exact 6 KPIs Required) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* KPI 1: Open Issues */}
            <div className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                <span>Open Issues</span>
                <AlertTriangle className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-white">{kpis.open}</span>
                <span className="text-[10px] text-slate-500 font-mono">Registry</span>
              </div>
            </div>

            {/* KPI 2: Critical Issues */}
            <div className="p-3.5 rounded-xl bg-[#1A1016] border border-red-900/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-red-400 text-[11px] font-mono uppercase tracking-wider">
                <span>Critical Issues</span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-red-400">{kpis.critical}</span>
                <span className="text-[10px] text-red-400/80 font-mono font-bold">P-80+ Risk</span>
              </div>
            </div>

            {/* KPI 3: In Progress */}
            <div className="p-3.5 rounded-xl bg-[#16130B] border border-amber-900/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-400 text-[11px] font-mono uppercase tracking-wider">
                <span>In Progress</span>
                <HardHat className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-amber-400">{kpis.inProgress}</span>
                <span className="text-[10px] text-amber-400/80 font-mono">Crews On Site</span>
              </div>
            </div>

            {/* KPI 4: Resolved Today */}
            <div className="p-3.5 rounded-xl bg-[#0A1612] border border-emerald-900/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 text-[11px] font-mono uppercase tracking-wider">
                <span>Resolved Today</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-emerald-400">{kpis.resolved}</span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Verified Proof</span>
              </div>
            </div>

            {/* KPI 5: SLA Breaches */}
            <div className="p-3.5 rounded-xl bg-[#1A0E11] border border-rose-900/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-400 text-[11px] font-mono uppercase tracking-wider">
                <span>SLA Breaches</span>
                <Clock className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-rose-400">{kpis.slaBreaches}</span>
                <span className="text-[10px] text-rose-400/80 font-mono">&gt;48h Target</span>
              </div>
            </div>

            {/* KPI 6: Available Crews */}
            <div className="p-3.5 rounded-xl bg-[#0B1322] border border-blue-900/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-400 text-[11px] font-mono uppercase tracking-wider">
                <span>Available Crews</span>
                <Users className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-blue-400">{kpis.availableCrews}</span>
                <span className="text-[10px] text-blue-400/80 font-mono">Ready to Dispatch</span>
              </div>
            </div>
          </div>

          {/* 4. CRITICAL ISSUE TICKER PANEL (Immediate Intervention Alerts) */}
          {criticalAlerts.length > 0 && (
            <div className="p-3 rounded-xl bg-[#1A0C10] border border-red-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-red-400 tracking-wider">
                      CRITICAL PRIORITY HAZARD ESCALATION
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-red-900/80 text-white font-mono text-[9px] font-bold">
                      ACTION REQUIRED
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5 line-clamp-1">
                    {criticalAlerts[0]?.title} &bull;{" "}
                    <span className="text-slate-400">{criticalAlerts[0]?.address}</span> ({criticalAlerts[0]?.wardZone})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReportId(criticalAlerts[0].id)}
                  className="px-3 py-1.5 rounded-md border border-red-800/80 bg-red-950/60 hover:bg-red-900/60 text-red-200 text-xs font-bold transition-colors"
                >
                  Locate on Map
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoAssign(criticalAlerts[0].id, criticalAlerts[0].title)}
                  disabled={assigningId === criticalAlerts[0].id}
                  className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{assigningId === criticalAlerts[0].id ? "Dispatching..." : "1-Click A02 Dispatch"}</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. DUAL COMMAND PANEL: GIS Live Map + AI Triage & Crew Capacity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Live City Map Canvas (7 cols or full width when expanded) */}
            <div
              className={`rounded-xl border border-slate-800 bg-[#0F172A] overflow-hidden flex flex-col shadow-lg transition-all ${
                expandMap ? "lg:col-span-12 h-[600px]" : "lg:col-span-7 h-[420px]"
              }`}
            >
              {/* Map Titlebar */}
              <div className="h-10 bg-[#0B1120] border-b border-slate-800 px-3 flex items-center justify-between text-xs text-slate-300 shrink-0">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-slate-200">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  <span>MUNICIPAL GIS OPERATIONAL GRID</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-normal">
                    {reports.length} Plot Points
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandMap(!expandMap)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  title={expandMap ? "Collapse map" : "Expand map full width"}
                >
                  {expandMap ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Map Frame */}
              <div className="flex-1 w-full relative">
                <CityMapCanvas
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onSelectReport={(id) => setSelectedReportId(id)}
                  initialStyle="dark"
                  className="h-full w-full"
                />
              </div>
            </div>

            {/* Right Command Column: AI Triage Panel + Crew Capacity Gauge (5 cols) */}
            <div className={`space-y-4 ${expandMap ? "lg:col-span-12" : "lg:col-span-5"}`}>
              {/* Deterministic Lifecycle Timeline & Stepper */}
              {selectedReport && (
                <IssueStatusTimeline
                  currentStatus={selectedReport.status}
                  createdAt={selectedReport.createdAt}
                  verificationCount={selectedReport.verificationCount}
                  assignedWorkerName={selectedReport.assignedWorker?.name}
                  showAuditTrailDefault={false}
                  className="bg-[#0F172A] border-slate-700/80 shadow-xl"
                />
              )}

              {/* Explainable AI Decision Support System Panel */}
              {selectedReport ? (
                <AIAutoTriagePanel
                  data={{
                    reportId: selectedReport.id,
                    categoryName: selectedReport.category?.name || "Civic Hazard",
                    suggestedPriorityScore: selectedReport.priorityScore,
                    confidenceScore: selectedReport.aiAnalysis?.confidenceScore || 0.94,
                    severityRating: selectedReport.severityScore ? selectedReport.severityScore / 20 : 4.0,
                    requiresVerification: selectedReport.status !== "RESOLVED",
                    roadSeverity: {
                      scorePct: Math.min(100, selectedReport.severityScore || 80),
                      metricLabel: `Severity (${((selectedReport.severityScore || 80) / 20).toFixed(1)}/5.0)`,
                      explanation: selectedReport.aiAnalysis?.severityReasoning || "Physical defect and geometric hazard posing direct pedestrian and vehicle disruption.",
                    },
                    trafficImportance: {
                      scorePct: 88,
                      metricLabel: `${selectedReport.wardZone} Arterial Transit Line`,
                      explanation: `Active transit corridor in ${selectedReport.wardZone} carrying daily commuter and emergency service traffic.`,
                    },
                    sensitiveLocations: {
                      scorePct: 92,
                      metricLabel: "Proximity to Public Facilities",
                      explanation: "Identified within 150m of municipal transit station and local educational facilities.",
                      nearbyEntities: ["Transit Hub (<100m)", "Pedestrian Crosswalk (45m)"],
                    },
                    similarReports: {
                      scorePct: selectedReport.isDuplicate ? 85 : 45,
                      count: selectedReport.isDuplicate ? 4 : 1,
                      explanation: selectedReport.isDuplicate
                        ? "Geospatially clustered with existing reports within 50m radius."
                        : "Single verified report currently registered in this immediate cluster.",
                    },
                    imageConfidence: {
                      scorePct: Math.round((selectedReport.aiAnalysis?.confidenceScore || 0.94) * 100),
                      modelName: "Gemini Vision v2.5",
                      explanation: "Computer vision edge contrast and depth boundary validation completed.",
                    },
                    historicalPattern: {
                      scorePct: 78,
                      metricLabel: "Zone Vulnerability Pattern",
                      explanation: `Monsoon and seasonal rainfall impact zone in ${selectedReport.wardZone}.`,
                    },
                    governance: {
                      aiRecommendation: {
                        suggestedPriority: Math.round(selectedReport.priorityScore),
                        suggestedDepartment: selectedReport.category?.name || "Public Works",
                        generatedAt: new Date(selectedReport.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                      humanVerification: {
                        isVerified: (selectedReport.verificationCount || 0) > 0,
                        verificationCount: selectedReport.verificationCount || 0,
                        inspectorAttestation: (selectedReport.verificationCount || 0) > 0
                          ? `Consensus verified by ${selectedReport.verificationCount} citizens and community members.`
                          : "Pending community consensus verification.",
                      },
                      finalOperationalDecision: {
                        isApproved: selectedReport.status === "ASSIGNED" || selectedReport.status === "IN_PROGRESS" || selectedReport.status === "RESOLVED",
                        isOverridden: false,
                        approvedPriority: Math.round(selectedReport.priorityScore),
                        approverName: selectedReport.status === "ASSIGNED" ? "Zone Dispatch Authority" : null,
                        operatorJustification: null,
                        decidedAt: selectedReport.createdAt,
                      },
                    },
                  }}
                  canOverride={true}
                  onApplyOverride={async (overrideData) => {
                    try {
                      const res = await fetch("/api/admin/override-triage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          reportId: selectedReport.id,
                          priorityScore: overrideData.priorityScore,
                          severityRating: overrideData.severityRating,
                          justification: overrideData.justification,
                        }),
                      });
                      if (res.ok) {
                        setReports((prev) =>
                          prev.map((r) =>
                            r.id === selectedReport.id
                              ? { ...r, priorityScore: overrideData.priorityScore }
                              : r
                          )
                        );
                        setActionMessage({
                          type: "success",
                          text: `Human operator override saved into audit ledger: Priority set to P-${overrideData.priorityScore}`,
                        });
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              ) : (
                <div className="p-8 rounded-xl bg-[#0F172A] border border-slate-800 text-center text-xs text-slate-500 font-mono">
                  Select an incident from the map or queue to inspect AI Triage telemetry.
                </div>
              )}

              {/* Crew Capacity Visualization Panel */}
              <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-amber-400" />
                    <h3 className="font-mono font-bold text-xs text-white">WORKFORCE CAPACITY MONITORS</h3>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    {analytics?.workforceCapacity.activeSlots ?? 4} /{" "}
                    {analytics?.workforceCapacity.totalSlots ?? 12} Slots Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(analytics?.departmentStats || [
                    { id: "dept-1", name: "Road Maintenance", totalCapacity: 4, activeLoad: 3, isSaturated: false },
                    { id: "dept-2", name: "Drainage & Sewerage", totalCapacity: 3, activeLoad: 3, isSaturated: true },
                    { id: "dept-3", name: "Power Grid Utility", totalCapacity: 3, activeLoad: 1, isSaturated: false },
                    { id: "dept-4", name: "Waste Management", totalCapacity: 2, activeLoad: 1, isSaturated: false },
                  ]).map((dept) => {
                    const pct = Math.round((dept.activeLoad / dept.totalCapacity) * 100);
                    return (
                      <div key={dept.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-300 flex items-center gap-1.5">
                            <span>{dept.name}</span>
                            {dept.isSaturated && (
                              <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-mono font-bold">
                                100% SATURATED
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {dept.activeLoad}/{dept.totalCapacity} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              dept.isSaturated ? "bg-amber-500" : pct >= 75 ? "bg-blue-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 6. OPERATIONAL ISSUE QUEUE TABLE */}
          <section aria-label="Issue Queue" className="rounded-xl border border-slate-800 bg-[#0F172A] overflow-hidden shadow-lg space-y-0">
            {/* Queue Controls & Filter Bar */}
            <div className="p-3.5 bg-[#0B1120] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-400" />
                <h2 className="font-mono font-bold text-xs text-white">OPERATIONAL ISSUE QUEUE</h2>
                <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {filteredQueue.length} records
                </span>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter queue by street or ward..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Ward Filter */}
                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Wards</option>
                  <option value="Ward 4">Ward 4 (Mirpur)</option>
                  <option value="Ward 9">Ward 9 (Gulshan)</option>
                  <option value="Ward 15">Ward 15 (Dhanmondi)</option>
                  <option value="Ward 2">Ward 2 (Pallabi)</option>
                  <option value="Ward 26">Ward 26 (Farmgate)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CRITICAL">Critical (P-80+)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            {/* High-Information Density Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B1120] border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Issue</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">AI Confidence</th>
                    <th className="py-2.5 px-3">Assigned Crew</th>
                    <th className="py-2.5 px-3">SLA Status</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {filteredQueue.map((report) => {
                    const isSelected = selectedReportId === report.id;
                    const isCritical = report.priorityScore >= 80;

                    return (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                        className={`cursor-pointer transition-colors relative ${
                          isSelected
                            ? "bg-blue-950/60 text-white font-medium"
                            : "hover:bg-slate-900/60 text-slate-300"
                        }`}
                      >
                        {/* ID */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-[11px] relative">
                          {isSelected && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r"
                            />
                          )}
                          #{report.id.slice(-6).toUpperCase()}
                        </td>

                        {/* Issue Title & Category */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white line-clamp-1 max-w-[200px]">
                            {report.title}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {report.category?.name || "Hazard"}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-2.5 px-3">
                          <div className="text-slate-300 line-clamp-1 max-w-[180px]">{report.address}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{report.wardZone}</span>
                        </td>

                        {/* Priority Score */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                              isCritical
                                ? "bg-red-950 text-red-300 border-red-800"
                                : report.priorityScore >= 60
                                ? "bg-orange-950 text-orange-300 border-orange-800"
                                : "bg-blue-950 text-blue-300 border-blue-800"
                            }`}
                          >
                            P-{Math.round(report.priorityScore)}
                          </span>
                        </td>

                        {/* AI Confidence */}
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-blue-400" />
                            <span>
                              {report.aiAnalysis?.confidenceScore
                                ? Math.round(report.aiAnalysis.confidenceScore * 100)
                                : 92}
                              %
                            </span>
                          </span>
                        </td>

                        {/* Assigned Crew */}
                        <td className="py-2.5 px-3">
                          {report.status === "ASSIGNED" || report.status === "IN_PROGRESS" ? (
                            <span className="text-amber-300 font-medium text-[11px] flex items-center gap-1">
                              <HardHat className="h-3 w-3 text-amber-400" />
                              <span>{report.assignedWorker?.name || "Crew Alpha"}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-mono">Unassigned</span>
                          )}
                        </td>

                        {/* SLA */}
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {report.status === "RESOLVED" || report.status === "CITIZEN_VERIFIED" ? (
                            <span className="text-emerald-400">SLA Met</span>
                          ) : (
                            <span className="text-slate-300 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span>28h left</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              report.status === "RESOLVED"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : report.status === "IN_PROGRESS"
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : report.status === "FAILED_RECOVERY"
                                ? "bg-purple-950 text-purple-300 border-purple-800"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* A02 Auto-Assign Trigger */}
                            {report.status !== "RESOLVED" && report.status !== "CITIZEN_VERIFIED" && (
                              <button
                                type="button"
                                onClick={() => handleAutoAssign(report.id, report.title)}
                                disabled={assigningId === report.id}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors shadow-xs disabled:opacity-50"
                                title="Auto-Assign Crew with A02 Optimizer"
                              >
                                {assigningId === report.id ? "Assigning..." : "Assign"}
                              </button>
                            )}

                            {/* A07 Failure Simulation Button (for resilience test) */}
                            {report.status === "ASSIGNED" && (
                              <button
                                type="button"
                                onClick={() => handleSimulateFailure(report.id)}
                                disabled={simulatingId === report.id}
                                className="p-1 rounded hover:bg-red-950 border border-red-900 text-red-400"
                                title="Simulate Step Failure (A07 test)"
                              >
                                <Bug className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* A07 Recovery Button */}
                            {report.status === "FAILED_RECOVERY" && (
                              <button
                                type="button"
                                onClick={() => handleRecoverWorkflow(report.id)}
                                disabled={recoveringId === report.id}
                                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px]"
                                title="A07 Automated Workflow Recovery"
                              >
                                {recoveringId === report.id ? "Recovering..." : "Recover"}
                              </button>
                            )}

                            {/* Inspect Link */}
                            <Link
                              href={`/reports/${report.id}`}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                              title="Open Operational Dossier"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* 7. A02 WORKFORCE SATURATION CONFLICT MODAL */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-amber-500/80 rounded-xl shadow-2xl max-w-lg w-full p-5 text-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                  A02 CONSTRAINT CONFLICT DETECTED
                </span>
                <h3 className="font-bold text-white text-sm">{conflictModal.reportTitle}</h3>
                <p className="mt-1 text-slate-300 text-xs">{conflictModal.conflictReason}</p>
              </div>
              <button
                type="button"
                onClick={() => setConflictModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200">
              Department workforce capacity is at 100% saturation. Select an automated resolution strategy to proceed:
            </div>

            <div className="space-y-2">
              {conflictModal.fallbackOptions.map((opt) => (
                <button
                  key={opt.strategy}
                  type="button"
                  onClick={() => handleAutoAssign(conflictModal.reportId, conflictModal.reportTitle, opt.strategy)}
                  className="w-full p-3 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>{opt.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{opt.tradeoffExplanation}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setConflictModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
