"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  Filter,
  MapPin,
  ThumbsUp,
  AlertCircle,
  List,
  Map as MapIcon,
  ChevronRight,
  Radio,
  SlidersHorizontal,
  X,
  ExternalLink,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

// Dynamic import for Leaflet map canvas with SSR disabled
const CityMapCanvas = dynamic(
  () => import("@/components/map/CityMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 font-medium">
        <div className="h-5 w-5 border-2 border-civic border-t-transparent rounded-full animate-spin mb-2" />
        <span>Loading Dhaka Geospatial Operational Canvas...</span>
      </div>
    ),
  }
);

interface ReportItem {
  id: string;
  title: string;
  description: string;
  address: string;
  wardZone: string;
  latitude: number;
  longitude: number;
  status: string;
  priorityScore: number;
  verificationCount: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function PublicCityMapPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state (M05)
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedWard, setSelectedWard] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CRITICAL" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "verifications" | "newest">("priority");

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  // Load reports and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [repRes, catRes] = await Promise.all([
          fetch("/api/reports?limit=100"),
          fetch("/api/categories"),
        ]);
        if (repRes.ok) {
          const json = await repRes.json();
          setReports(json.data?.items || []);
        }
        if (catRes.ok) {
          const json = await catRes.json();
          setCategories(json.data?.categories || []);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter & Sort logic (M05)
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        // Text search
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            r.title.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q) ||
            r.wardZone.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Category filter
        if (selectedCategory !== "ALL" && r.category?.id !== selectedCategory) {
          return false;
        }

        // Ward filter
        if (selectedWard !== "ALL" && r.wardZone !== selectedWard) {
          return false;
        }

        // Status filter
        if (statusFilter === "CRITICAL") {
          return r.priorityScore >= 80 && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED";
        }
        if (statusFilter === "IN_PROGRESS") {
          return r.status === "IN_PROGRESS" || r.status === "ASSIGNED";
        }
        if (statusFilter === "RESOLVED") {
          return r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED";
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return b.priorityScore - a.priorityScore;
        }
        if (sortBy === "verifications") {
          return b.verificationCount - a.verificationCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, search, selectedCategory, selectedWard, statusFilter, sortBy]);

  // Operational metrics calculation
  const criticalCount = useMemo(
    () => reports.filter((r) => r.priorityScore >= 80 && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED").length,
    [reports]
  );
  const activeCrewCount = useMemo(
    () => reports.filter((r) => r.status === "IN_PROGRESS" || r.status === "ASSIGNED").length,
    [reports]
  );
  const resolvedCount = useMemo(
    () => reports.filter((r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED").length,
    [reports]
  );

  const avgPriority = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, r) => acc + r.priorityScore, 0);
    return Math.round(sum / filteredReports.length);
  }, [filteredReports]);

  const getStatusBadge = (status: string, score: number) => {
    if (status === "RESOLVED" || status === "CITIZEN_VERIFIED") {
      return {
        label: "Resolved",
        cls: "bg-emerald-50 text-emerald-800 border-emerald-300",
        dotCls: "bg-emerald-600",
      };
    }
    if (status === "IN_PROGRESS" || status === "ASSIGNED") {
      return {
        label: "Crew Dispatched",
        cls: "bg-amber-50 text-amber-800 border-amber-300",
        dotCls: "bg-amber-600",
      };
    }
    if (score >= 80) {
      return {
        label: "Critical Hazard",
        cls: "bg-rose-50 text-rose-800 border-rose-300",
        dotCls: "bg-rose-600",
      };
    }
    return {
      label: "AI Triaged",
      cls: "bg-blue-50 text-blue-800 border-blue-300",
      dotCls: "bg-blue-600",
    };
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      {/* Mobile Operational View Switcher */}
      <div className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 z-30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dhaka Operational Feed
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
              mobileView === "map"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
              mobileView === "list"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Feed ({filteredReports.length})
          </button>
        </div>
      </div>

      {/* Left Panel: 70% Civic Swiss Operational Feed & Filter (480px on Desktop) */}
      <div
        className={`${
          mobileView === "list" ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[480px] shrink-0 border-r border-slate-200 bg-white h-full overflow-hidden z-20 shadow-sm`}
      >
        {/* Civic Operational Header & Live Metrics */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          {/* Header Title with Official Live Telemetry Status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-slate-900 text-white text-[11px] font-bold font-mono">
                  SW
                </span>
                <h1 className="text-sm font-bold tracking-tight text-slate-900">
                  Municipal Incident Registry
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Real-time civic triage &amp; crew dispatch coordination
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
              </span>
              <span>LIVE 24 WARDS</span>
            </div>
          </div>

          {/* Precision Municipal Metric Counters */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-left">
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Critical
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              </div>
              <div className="mt-1 font-mono text-lg font-black text-rose-900">
                {criticalCount}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Active Crew
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <div className="mt-1 font-mono text-lg font-black text-amber-900">
                {activeCrewCount}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Resolved
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-1 font-mono text-lg font-black text-emerald-900">
                {resolvedCount}
              </div>
            </div>
          </div>

          {/* Search Box with Clear Button */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by hazard, street landmark, or ward..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50/60 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(["ALL", "CRITICAL", "IN_PROGRESS", "RESOLVED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold border transition shrink-0 flex items-center gap-1.5 ${
                  statusFilter === st
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {st === "CRITICAL" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                {st === "IN_PROGRESS" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                {st === "RESOLVED" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {st === "ALL" ? "All Incidents" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Category & Ward Operational Dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-civic"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              aria-label="Filter by ward zone"
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-civic"
            >
              <option value="ALL">All Dhaka Wards</option>
              <option value="Ward 4">Ward 4 (Mirpur 10)</option>
              <option value="Ward 9">Ward 9 (Gulshan - Badda)</option>
              <option value="Ward 15">Ward 15 (Dhanmondi)</option>
              <option value="Ward 2">Ward 2 (Pallabi)</option>
              <option value="Ward 26">Ward 26 (Farmgate)</option>
              <option value="Ward 31">Ward 31 (Mohammadpur)</option>
            </select>
          </div>

          {/* Results Summary & Precision Sort */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-bold text-slate-900">{filteredReports.length}</span>
              <span>records listed</span>
              <span className="text-slate-300">&bull;</span>
              <span>Avg Priority:</span>
              <span className="font-mono font-bold text-slate-900">{avgPriority}/100</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "priority" | "verifications" | "newest")}
                aria-label="Sort list by"
                className="rounded border border-slate-200 bg-white py-0.5 px-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
              >
                <option value="priority">Priority Score</option>
                <option value="verifications">Citizen Votes</option>
                <option value="newest">Recent First</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Information Density Incident Feed List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-2 bg-slate-50/50">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              <div className="h-5 w-5 border-2 border-civic border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Retrieving live municipal incident database...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-600 bg-white rounded-lg border border-slate-200 p-6">
              <AlertCircle className="mx-auto h-6 w-6 text-slate-400 mb-2" />
              <p className="font-bold text-slate-800">No active incidents matching criteria</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try clearing search terms or selecting all wards.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const isSelected = selectedReportId === report.id;
              const badge = getStatusBadge(report.status, report.priorityScore);

              return (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReportId(report.id);
                    if (window.innerWidth < 768) setMobileView("map");
                  }}
                  className={`cursor-pointer rounded-lg p-3.5 transition-all duration-150 border ${
                    isSelected
                      ? "border-civic bg-blue-50/70 shadow-sm ring-1 ring-civic"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-2xs"
                  }`}
                >
                  {/* Category Pill and Monospace Priority Score */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 rounded px-2 py-0.5 border border-slate-200">
                      <DynamicCategoryIcon nameOrSlug={report.category?.name || ""} size={14} />
                      <span className="truncate max-w-[170px]">{report.category?.name}</span>
                    </span>

                    <span
                      className={`font-mono text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                        report.priorityScore >= 80
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : report.priorityScore >= 60
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-blue-50 text-blue-800 border-blue-300"
                      }`}
                    >
                      P-{Math.round(report.priorityScore)}/100
                    </span>
                  </div>

                  {/* Incident Title */}
                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 hover:text-civic transition">
                    {report.title}
                  </h3>

                  {/* Geographic Coordinates & Address */}
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate font-medium text-slate-600">
                      {report.address}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="shrink-0 font-bold text-slate-700">
                      {report.wardZone}
                    </span>
                  </div>

                  {/* Operational Status & Action Link */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold border ${badge.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dotCls}`} />
                        {badge.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200">
                        <ThumbsUp className="h-2.5 w-2.5 text-civic" />
                        {report.verificationCount}
                      </span>
                    </div>

                    <Link
                      href={`/reports/${report.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-tactile inline-flex items-center gap-1 rounded bg-slate-900 hover:bg-civic text-white px-2.5 py-1 text-[11px] font-bold transition-colors"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: 20% Spatial Map-First Operational Canvas */}
      <div
        className={`${
          mobileView === "map" ? "flex" : "hidden"
        } md:flex flex-1 h-full w-full relative bg-slate-100`}
      >
        {/* Floating Spatial HUD: Dhaka Bounds & Live Status Overlay */}
        <div className="absolute top-4 right-4 z-30 hidden sm:flex items-center gap-3 rounded-lg border border-slate-300/90 spatial-hud px-3.5 py-2 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            <span>Critical (&ge;80)</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            <span>Dispatched</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Resolved</span>
          </div>
        </div>

        <CityMapCanvas
          reports={filteredReports}
          selectedReportId={selectedReportId}
          onSelectReport={(id) => setSelectedReportId(id)}
        />
      </div>
    </div>
  );
}
