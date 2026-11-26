"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  MapPin,
  Clock,
  Cpu,
  ArrowRight,
  RotateCcw,
  X,
  AlertCircle,
} from "lucide-react";
import { MapReportPin } from "@/components/map/CityMapCanvas";
import {
  LIFECYCLE_STEPS,
  mapReportStatusToLifecycle,
  getLifecycleStepIndex,
} from "@/lib/workflow/rules";
import { IssueCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";

export type CategoryFilterGroup =
  | "ALL"
  | "ROAD"
  | "DRAINAGE"
  | "WASTE"
  | "STREETLIGHT"
  | "ELECTRICAL"
  | "OTHER";

export type PublicStatusFilter = "ALL" | "REPORTED" | "IN_PROGRESS" | "RESOLVED";

export type PriorityFilter = "ALL" | "CRITICAL" | "HIGH";

export type DateFilter = "ALL" | "TODAY" | "WEEK";

export interface RecentCommunityReportsProps {
  reports: MapReportPin[];
  allReportsCount: number;
  loading?: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
  // Filter state controlled from parent so Map & Reports stay synchronized cleanly
  search: string;
  onSearchChange: (val: string) => void;
  categoryGroup: CategoryFilterGroup;
  onCategoryGroupChange: (val: CategoryFilterGroup) => void;
  statusFilter: PublicStatusFilter;
  onStatusFilterChange: (val: PublicStatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (val: PriorityFilter) => void;
  wardFilter: string;
  onWardFilterChange: (val: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (val: DateFilter) => void;
  availableWards: string[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  // Card actions
  onViewDetails: (reportId: string) => void;
  onViewOnMap: (reportId: string) => void;
}

export function formatRelativeReportedTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (diffMs < 0) return "Just reported";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Reported ${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Reported ${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Reported ${days} day${days > 1 ? "s" : ""} ago`;
  return `Reported ${new Date(isoDate).toLocaleDateString()}`;
}

export function getPublicStatusDisplay(status: string): {
  label: string;
  dotColor: string;
  textColor: string;
  bgClass: string;
} {
  if (status === "CITIZEN_VERIFIED") {
    return {
      label: "Closed & Verified",
      dotColor: "bg-[#12B76A]",
      textColor: "text-emerald-800",
      bgClass: "bg-emerald-50 border-emerald-200",
    };
  }
  if (status === "RESOLVED") {
    return {
      label: "Resolved",
      dotColor: "bg-[#12B76A]",
      textColor: "text-emerald-800",
      bgClass: "bg-emerald-50 border-emerald-200",
    };
  }
  if (status === "IN_PROGRESS") {
    return {
      label: "In Progress",
      dotColor: "bg-[#F79009]",
      textColor: "text-amber-800",
      bgClass: "bg-amber-50 border-amber-200",
    };
  }
  if (status === "ASSIGNED") {
    return {
      label: "Assigned to Crew",
      dotColor: "bg-[#2563EB]",
      textColor: "text-blue-800",
      bgClass: "bg-blue-50 border-blue-200",
    };
  }
  if (status === "AI_TRIAGED" || status === "COMMUNITY_VERIFIED" || status === "PRIORITY_SCORED") {
    return {
      label: status === "COMMUNITY_VERIFIED" ? "Verified" : "AI Triaged",
      dotColor: "bg-[#7C5CFC]",
      textColor: "text-purple-800",
      bgClass: "bg-purple-50 border-purple-200",
    };
  }
  return {
    label: "Reported",
    dotColor: "bg-slate-500",
    textColor: "text-slate-700",
    bgClass: "bg-slate-100 border-slate-200",
  };
}

export function getPublicPriorityDisplay(score: number): {
  label: string;
  cls: string;
} {
  if (score >= 80) {
    return {
      label: "CRITICAL PRIORITY",
      cls: "bg-rose-50 text-[#D92D20] border-rose-200",
    };
  }
  if (score >= 60) {
    return {
      label: "HIGH PRIORITY",
      cls: "bg-amber-50 text-[#B45309] border-amber-200",
    };
  }
  if (score >= 40) {
    return {
      label: "MEDIUM PRIORITY",
      cls: "bg-blue-50 text-[#2563EB] border-blue-200",
    };
  }
  return {
    label: "STANDARD PRIORITY",
    cls: "bg-slate-100 text-[#667085] border-slate-200",
  };
}

export function RecentCommunityReports({
  reports,
  allReportsCount,
  loading = false,
  fetchError = null,
  onRetry,
  search,
  onSearchChange,
  categoryGroup,
  onCategoryGroupChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  wardFilter,
  onWardFilterChange,
  dateFilter,
  onDateFilterChange,
  availableWards,
  onResetFilters,
  hasActiveFilters,
  onViewDetails,
  onViewOnMap,
}: RecentCommunityReportsProps) {
  const shouldReduceMotion = useReducedMotion();

  const categoryButtons: { key: CategoryFilterGroup; label: string }[] = [
    { key: "ALL", label: "All Issues" },
    { key: "ROAD", label: "Road" },
    { key: "DRAINAGE", label: "Drainage" },
    { key: "WASTE", label: "Waste" },
    { key: "STREETLIGHT", label: "Streetlight" },
    { key: "ELECTRICAL", label: "Electrical" },
    { key: "OTHER", label: "Other" },
  ];

  const statusButtons: { key: PublicStatusFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "REPORTED", label: "Reported" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
  ];

  return (
    <section
      id="recent-reports"
      aria-labelledby="recent-reports-heading"
      className="border-b border-[#E4E7EC] bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] block">
              PUBLIC ISSUE DISCOVERY
            </span>
            <h2
              id="recent-reports-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828] mt-0.5"
            >
              Recent community reports
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Browse verified civic hazards across Dhaka, monitor repair progress, and confirm issues in your neighborhood.
            </p>
          </div>
          <div className="text-xs font-mono text-[#667085] shrink-0">
            Showing <strong className="text-[#101828]">{reports.length}</strong> of{" "}
            <strong className="text-[#101828]">{allReportsCount}</strong> reports
          </div>
        </div>

        {/* Simple Discovery & Filtering Toolbar */}
        <div className="rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-4 space-y-3.5">
          {/* Search Input & Secondary Select Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-5 relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-[#667085]" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search reports by location or issue..."
                aria-label="Search reports by location or issue"
                className="w-full rounded-lg border border-[#E4E7EC] bg-white pl-10 pr-9 py-2.5 text-xs font-medium text-[#101828] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search query"
                  className="absolute right-2.5 p-1 text-[#667085] hover:text-[#101828]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Priority, Area/Ward, Date Filters */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={priorityFilter}
                onChange={(e) => onPriorityFilterChange(e.target.value as PriorityFilter)}
                aria-label="Filter by Priority"
                className="w-full rounded-lg border border-[#E4E7EC] bg-white px-3 py-2.5 text-xs font-semibold text-[#101828] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical (P-80+)</option>
                <option value="HIGH">High &amp; Above (P-60+)</option>
              </select>

              <select
                value={wardFilter}
                onChange={(e) => onWardFilterChange(e.target.value)}
                aria-label="Filter by Area or Ward"
                className="w-full rounded-lg border border-[#E4E7EC] bg-white px-3 py-2.5 text-xs font-semibold text-[#101828] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="ALL">All Areas / Wards</option>
                {availableWards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
                aria-label="Filter by Date Reported"
                className="w-full rounded-lg border border-[#E4E7EC] bg-white px-3 py-2.5 text-xs font-semibold text-[#101828] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="ALL">Any Date</option>
                <option value="TODAY">Last 24 Hours</option>
                <option value="WEEK">Last 7 Days</option>
              </select>
            </div>
          </div>

          {/* Simple Category & Status Chip Rows */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-[#E4E7EC]/70">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
              {categoryButtons.map((cat) => {
                const active = categoryGroup === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => onCategoryGroupChange(cat.key)}
                    className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold border transition shrink-0 ${
                      active
                        ? "bg-[#101828] text-white border-[#101828]"
                        : "bg-white text-[#344054] border-[#E4E7EC] hover:border-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Status Chips + Reset */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
              <span className="text-[11px] font-semibold text-[#667085] mr-1 shrink-0">
                Status:
              </span>
              {statusButtons.map((st) => {
                const active = statusFilter === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => onStatusFilterChange(st.key)}
                    className={`px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold border transition shrink-0 ${
                      active
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-white text-[#344054] border-[#E4E7EC] hover:border-slate-300"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#2563EB] hover:text-blue-800 shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Community Reports Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <IssueCardSkeleton key={i} />
            ))}
          </div>
        ) : fetchError ? (
          <ErrorState
            title="Unable to Load Public Reports"
            message={fetchError}
            onRetry={onRetry}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No matching public reports"
            description="No civic issues match the active filters. Clear or broaden your search to inspect all city reports."
            icon={<AlertCircle className="h-5 w-5 text-slate-400" />}
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Filters</span>
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map((report) => {
              const lifecycleState = mapReportStatusToLifecycle(report.status);
              const stepIdx = getLifecycleStepIndex(lifecycleState);
              const progressPct = Math.round(((stepIdx + 1) / LIFECYCLE_STEPS.length) * 100);
              const priorityBadge = getPublicPriorityDisplay(report.priorityScore);
              const statusDisplay = getPublicStatusDisplay(report.status);
              const aiConfidence = report.aiAnalysis?.confidenceScore
                ? Math.round(report.aiAnalysis.confidenceScore * 100)
                : null;

              return (
                <motion.article
                  key={report.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-2xl border border-[#E4E7EC] bg-white overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Issue Image */}
                    <div
                      onClick={() => onViewDetails(report.id)}
                      className="relative h-44 w-full bg-slate-100 overflow-hidden cursor-pointer border-b border-[#E4E7EC]"
                    >
                      <img
                        src={
                          report.beforeProofUrl ||
                          report.imageUrl ||
                          "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={report.title}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Category Pill over top-left */}
                      <span className="absolute top-3 left-3 rounded-md bg-white/95 backdrop-blur-sm border border-[#E4E7EC] px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101828] shadow-xs">
                        {report.category?.name || "Civic Hazard"}
                      </span>

                      {aiConfidence !== null && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-sm border border-purple-200 px-2 py-1 text-[10px] font-mono font-bold text-[#7C5CFC] shadow-xs">
                          <Cpu className="h-3 w-3" />
                          <span>{aiConfidence}% AI</span>
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Title & Location */}
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-[#101828] line-clamp-1">
                          {report.title}
                        </h3>
                        <p className="text-xs text-[#667085] flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {report.address} &bull; {report.wardZone}
                          </span>
                        </p>
                        <p className="text-[11px] text-[#667085] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{formatRelativeReportedTime(report.createdAt)}</span>
                        </p>
                      </div>

                      {/* Priority & Status Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${priorityBadge.cls}`}
                        >
                          {priorityBadge.label}
                        </span>
                        <span
                          role="status"
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusDisplay.bgClass} ${statusDisplay.textColor}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDisplay.dotColor}`} />
                          <span>{statusDisplay.label}</span>
                        </span>
                      </div>

                      {/* Clean Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#667085]">Lifecycle Progress</span>
                          <span className="font-bold text-[#101828]">{progressPct}%</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-valuenow={progressPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Issue progress ${progressPct}%`}
                          className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-[#E4E7EC]"
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              report.status === "RESOLVED" || report.status === "CITIZEN_VERIFIED"
                                ? "bg-[#12B76A]"
                                : report.status === "IN_PROGRESS" || report.status === "ASSIGNED"
                                ? "bg-[#2563EB]"
                                : "bg-[#7C5CFC]"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-4 py-3 border-t border-[#E4E7EC] bg-[#F7F9FC] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onViewOnMap(report.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-slate-50 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[#344054] transition"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>View on Map</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewDetails(report.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-3.5 py-1.5 min-h-[36px] text-xs font-bold text-white shadow-xs transition"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default RecentCommunityReports;
