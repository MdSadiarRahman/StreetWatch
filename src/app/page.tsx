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
  Sparkles,
} from "lucide-react";

// Dynamic import for Leaflet map canvas with SSR disabled
const CityMapCanvas = dynamic(
  () => import("@/components/map/CityMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-slate-100 flex items-center justify-center text-sm text-slate-400">
        Loading Interactive City Geospatial Canvas...
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

  // Average priority calculation
  const avgPriority = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, r) => acc + r.priorityScore, 0);
    return Math.round(sum / filteredReports.length);
  }, [filteredReports]);

  const getStatusBadge = (status: string, score: number) => {
    if (status === "RESOLVED" || status === "CITIZEN_VERIFIED") {
      return { label: "Resolved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (status === "IN_PROGRESS") {
      return { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (score >= 85) {
      return { label: "Critical Hazard", cls: "bg-red-50 text-red-700 border-red-200" };
    }
    return { label: "Community Verified", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-canvas">
      {/* Mobile Toggle Bar */}
      <div className="flex md:hidden items-center justify-around border-b border-slate-200 bg-white p-2">
        <button
          onClick={() => setMobileView("map")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold ${
            mobileView === "map" ? "bg-brand text-white" : "text-slate-600"
          }`}
        >
          <MapIcon className="h-4 w-4" />
          Map View
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold ${
            mobileView === "list" ? "bg-brand text-white" : "text-slate-600"
          }`}
        >
          <List className="h-4 w-4" />
          List View ({filteredReports.length})
        </button>
      </div>

      {/* Left Panel: Filter & Report List (440px on Desktop) */}
      <div
        className={`${
          mobileView === "list" ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-[440px] shrink-0 border-r border-slate-200/80 bg-white h-full overflow-hidden z-20`}
      >
        {/* Filter Controls Header */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, road, or ward..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(["ALL", "CRITICAL", "IN_PROGRESS", "RESOLVED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition shrink-0 ${
                  statusFilter === st
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {st === "ALL" ? "All Issues" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Category & Ward Dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-brand"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:border-brand"
            >
              <option value="ALL">All Wards</option>
              <option value="Ward 4">Ward 4 (Mirpur)</option>
              <option value="Ward 9">Ward 9 (Gulshan)</option>
              <option value="Ward 15">Ward 15 (Dhanmondi)</option>
              <option value="Ward 2">Ward 2 (Pallabi)</option>
              <option value="Ward 26">Ward 26 (Farmgate)</option>
              <option value="Ward 31">Ward 31 (Mohammadpur)</option>
            </select>
          </div>

          {/* Sort Selector & Summary Stats Bar */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1 font-medium">
              <Filter className="h-3.5 w-3.5" />
              <span>
                {filteredReports.length} reports &bull; Avg:{" "}
                <strong className="text-slate-800">{avgPriority}/100</strong>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "priority" | "verifications" | "newest")}
                className="rounded border border-slate-200 bg-white py-0.5 px-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none"
              >
                <option value="priority">Priority</option>
                <option value="verifications">Votes</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Report Card List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading live civic reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <AlertCircle className="mx-auto h-6 w-6 text-slate-400 mb-2" />
              No reports match your selected filters.
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
                  className={`cursor-pointer rounded-xl p-3.5 transition border ${
                    isSelected
                      ? "border-brand bg-blue-50/50 shadow-sm"
                      : "border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {report.category?.name}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${
                        report.priorityScore >= 85
                          ? "bg-red-50 text-status-critical border-red-200"
                          : "bg-blue-50 text-brand border-blue-200"
                      }`}
                    >
                      Score: {Math.round(report.priorityScore)}/100
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {report.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      {report.address}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        <ThumbsUp className="h-3 w-3 text-slate-400" />
                        {report.verificationCount}
                      </span>
                    </div>

                    <Link
                      href={`/reports/${report.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-0.5"
                    >
                      Details <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Full-Bleed Interactive Map Canvas */}
      <div
        className={`${
          mobileView === "map" ? "flex" : "hidden"
        } md:flex flex-1 h-full w-full relative`}
      >
        <CityMapCanvas
          reports={filteredReports}
          selectedReportId={selectedReportId}
          onSelectReport={(id) => setSelectedReportId(id)}
        />
      </div>
    </div>
  );
}
