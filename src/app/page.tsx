"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
  X,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Flame,
  HardHat,
  CheckCircle2,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import { MapReportPin } from "@/components/map/CityMapCanvas";

// Dynamic import for Leaflet map canvas with SSR disabled
const CityMapCanvas = dynamic(
  () => import("@/components/map/CityMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 font-medium">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
        <span>Loading Dhaka Geospatial Operational GIS Grid...</span>
      </div>
    ),
  }
);

export default function PublicCityMapPage() {
  const [reports, setReports] = useState<MapReportPin[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedWard, setSelectedWard] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "IN_PROGRESS" | "RESOLVED">("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "verifications" | "newest">("priority");

  // Selection & UI Drawers
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showFeedDrawer, setShowFeedDrawer] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut for '/' and 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (selectedReportId) {
          setSelectedReportId(null);
        } else if (showFeedDrawer) {
          setShowFeedDrawer(false);
        } else if (search) {
          setSearch("");
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedReportId, showFeedDrawer, search]);

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

  // Filter & Sort logic
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        // Text search
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            r.title.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q) ||
            (r.wardZone && r.wardZone.toLowerCase().includes(q));
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
        if (statusFilter === "HIGH") {
          return r.priorityScore >= 60 && r.priorityScore < 80 && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED";
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

  // Operational metrics
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

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedWard !== "ALL" ||
    statusFilter !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedWard("ALL");
    setStatusFilter("ALL");
  };

  const handleVerify = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: "CONFIRM" }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, verificationCount: r.verificationCount + 1 }
              : r
          )
        );
      }
    } catch (e) {
      console.error("Verification failed:", e);
    }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100 flex flex-col">
      {/* 1. FULL OPERATIONAL GIS MAP AREA */}
      <div className="absolute inset-0 z-0">
        <CityMapCanvas
          reports={filteredReports}
          selectedReportId={selectedReportId}
          onSelectReport={(id) => setSelectedReportId(id)}
          onVerifyReport={handleVerify}
        />
      </div>

      {/* 2. FLOATING TOP SEARCH & QUICK FILTER BAR */}
      <div className="absolute top-4 left-4 z-30 max-w-[calc(100vw-32px)] sm:max-w-xl pointer-events-auto flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-lg p-2.5 space-y-2">
          {/* Main Search Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search municipal hazards, street landmarks, or ward..."
                aria-label="Search incidents"
                className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-lg pl-9 pr-12 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
              />
              <div className="absolute right-2.5 flex items-center gap-1">
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Toggle Registry Feed Drawer Button */}
            <button
              type="button"
              onClick={() => setShowFeedDrawer(!showFeedDrawer)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 shrink-0 ${
                showFeedDrawer
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Open Incident Registry Dossier List"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                {filteredReports.length}
              </span>
            </button>
          </div>

          {/* Quick Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin text-xs">
            {(
              [
                { key: "ALL", label: "All Incidents", dot: null },
                { key: "CRITICAL", label: "Critical", dot: "bg-red-600" },
                { key: "HIGH", label: "High Risk", dot: "bg-orange-600" },
                { key: "IN_PROGRESS", label: "In Progress", dot: "bg-amber-500" },
                { key: "RESOLVED", label: "Resolved", dot: "bg-emerald-600" },
              ] as const
            ).map((st) => {
              const isActive = statusFilter === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st.dot && <span className={`h-2 w-2 rounded-full ${st.dot}`} />}
                  <span>{st.label}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-bold px-2 py-1 rounded shrink-0 ml-1"
                title="Reset active filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. FLOATING TOP-CENTER MUNICIPAL KPI HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden lg:flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-xl px-4 py-2 shadow-md pointer-events-auto text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            DHAKA GIS GRID
          </span>
        </div>

        <span className="w-px h-4 bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          <span className="text-slate-500 text-[11px]">Critical:</span>
          <strong className="font-mono text-slate-900">{criticalCount}</strong>
        </div>

        <span className="w-px h-4 bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <HardHat className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-slate-500 text-[11px]">Active Crews:</span>
          <strong className="font-mono text-slate-900">{activeCrewCount}</strong>
        </div>

        <span className="w-px h-4 bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-slate-500 text-[11px]">Resolved:</span>
          <strong className="font-mono text-slate-900">{resolvedCount}</strong>
        </div>
      </div>

      {/* 4. SLIDING INCIDENT REGISTRY FEED DRAWER (Left side) */}
      {showFeedDrawer && (
        <aside
          aria-label="Incident Registry Feed Drawer"
          className="absolute left-0 top-0 bottom-0 w-full sm:w-[420px] bg-white/95 backdrop-blur-md border-r border-slate-200/90 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 pointer-events-auto"
        >
          {/* Feed Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Municipal Incident Feed</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {filteredReports.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Priority-ranked urban hazards across 24 Wards
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFeedDrawer(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
              aria-label="Close feed drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Feed Controls (Category & Ward & Sort) */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white shrink-0 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
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
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 font-mono"
              >
                <option value="ALL">All City Wards</option>
                <option value="Ward 4">Ward 4 (Mirpur 10)</option>
                <option value="Ward 9">Ward 9 (Gulshan - Badda)</option>
                <option value="Ward 15">Ward 15 (Dhanmondi)</option>
                <option value="Ward 2">Ward 2 (Pallabi)</option>
                <option value="Ward 26">Ward 26 (Farmgate)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "priority" | "verifications" | "newest")}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800"
              >
                <option value="priority">Priority Score</option>
                <option value="verifications">Citizen Votes</option>
                <option value="newest">Recent First</option>
              </select>
            </div>
          </div>

          {/* Incident Cards Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 scrollbar-thin">
            {filteredReports.map((report) => {
              const isSelected = selectedReportId === report.id;
              return (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReportId(report.id);
                    if (window.innerWidth < 640) setShowFeedDrawer(false);
                  }}
                  className={`pt-2.5 first:pt-0 cursor-pointer rounded-lg p-2.5 transition-all ${
                    isSelected
                      ? "bg-blue-50/80 border border-blue-400 shadow-xs ring-1 ring-blue-500"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {report.category?.name || "Hazard"}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        report.priorityScore >= 80
                          ? "bg-red-50 text-red-700 border-red-200"
                          : report.priorityScore >= 60
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      P-{Math.round(report.priorityScore)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{report.title}</h3>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">{report.address}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
