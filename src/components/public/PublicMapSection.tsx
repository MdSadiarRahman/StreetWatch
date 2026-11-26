"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  ArrowRight,
  ThumbsUp,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";
import { MapReportPin } from "@/components/map/CityMapCanvas";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import { StatusBadge } from "@/components/ui/Badge";
import IssuePriorityIndicator from "@/components/streetwatch/IssuePriorityIndicator";
import { IssueCardSkeleton } from "@/components/ui/Skeleton";

const CityMapCanvas = dynamic(() => import("@/components/map/CityMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-xs text-[#667085] font-medium">
      <div className="h-6 w-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-2" />
      <span>Loading Dhaka Geospatial Map...</span>
    </div>
  ),
});

export interface PublicMapSectionProps {
  reports: MapReportPin[];
  selectedReportId: string | null;
  onSelectReport: (id: string | null) => void;
  onOpenDetails: (reportId: string) => void;
  onVerifyReport: (reportId: string) => void;
  loading?: boolean;
}

export function PublicMapSection({
  reports,
  selectedReportId,
  onSelectReport,
  onOpenDetails,
  onVerifyReport,
  loading = false,
}: PublicMapSectionProps) {
  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  return (
    <section
      id="live-map"
      aria-labelledby="public-map-heading"
      className="border-b border-[#E4E7EC] bg-[#F7F9FC] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] block">
              SPATIAL OPERATIONS MAP
            </span>
            <h2
              id="public-map-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828] mt-0.5"
            >
              Explore reported issues
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Click any pin or spatial cluster to inspect details, verify active hazards, or switch map layers.
            </p>
          </div>
          <Link
            href="#recent-reports"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline self-start sm:self-auto"
          >
            <span>Filter &amp; search all reports</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Contained Map + Synchronized Side Panel (70% Map / 30% Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* LEFT: Contained Map Canvas (8 cols ~ 67-70%) */}
          <div className="lg:col-span-8 h-[380px] sm:h-[460px] lg:h-[540px] rounded-2xl border border-[#E4E7EC] bg-white overflow-hidden shadow-sm relative">
            <CityMapCanvas
              reports={reports}
              selectedReportId={selectedReportId}
              onSelectReport={(id) => onSelectReport(id)}
              onVerifyReport={onVerifyReport}
              disableOverlayDrawer={true}
              containedMode={true}
              initialStyle="positron"
              className="h-full w-full"
            />
          </div>

          {/* RIGHT: Issue Feed & Selected Issue Summary (4 cols ~ 30-33%) */}
          <div className="lg:col-span-4 rounded-2xl border border-[#E4E7EC] bg-white shadow-sm flex flex-col overflow-hidden lg:h-[540px]">
            {/* Selected Issue Highlight Card (when a map pin is clicked) */}
            {selectedReport ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#E4E7EC] bg-[#F7F9FC] flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0">
                      <DynamicCategoryIcon
                        slug={selectedReport.category?.slug || "pothole"}
                        className="h-4 w-4"
                      />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#667085] block">
                        Selected Pin &bull; {selectedReport.wardZone}
                      </span>
                      <span className="text-xs font-bold text-[#101828] truncate block">
                        {selectedReport.category?.name || "Civic Hazard"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectReport(null)}
                    className="text-[11px] font-semibold text-[#667085] hover:text-[#101828] px-2 py-1 rounded hover:bg-slate-200/60"
                  >
                    Show All
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs">
                  {selectedReport.imageUrl && (
                    <div className="relative h-40 w-full rounded-xl overflow-hidden border border-[#E4E7EC] bg-slate-100">
                      <img
                        src={selectedReport.beforeProofUrl || selectedReport.imageUrl}
                        alt={selectedReport.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <IssuePriorityIndicator score={selectedReport.priorityScore} size="sm" />
                    <StatusBadge status={selectedReport.status} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#101828] leading-snug">
                      {selectedReport.title}
                    </h3>
                    <p className="text-xs text-[#667085] mt-1 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{selectedReport.address}</span>
                    </p>
                  </div>

                  {selectedReport.aiAnalysis && (
                    <div className="p-3 rounded-xl border border-purple-200/80 bg-purple-50/40 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#7C5CFC]">
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3.5 w-3.5" />
                          <span>AI Triage Note</span>
                        </span>
                        <span className="font-mono">
                          {Math.round(selectedReport.aiAnalysis.confidenceScore * 100)}% conf
                        </span>
                      </div>
                      <p className="text-[11px] text-[#344054] leading-relaxed">
                        {selectedReport.aiAnalysis.severityReasoning}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#101828]">
                      <ThumbsUp className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>{selectedReport.verificationCount} verifications</span>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 border-t border-[#E4E7EC] bg-[#F7F9FC] flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onVerifyReport(selectedReport.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-slate-50 px-3 py-2 min-h-[40px] text-xs font-bold text-[#101828] transition"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span>Verify ({selectedReport.verificationCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDetails(selectedReport.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-3 py-2 min-h-[40px] text-xs font-bold text-white shadow-sm transition"
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <Link
                    href={`/reports/${selectedReport.id}`}
                    aria-label="Open full issue permalink page"
                    title="Open full page record"
                    className="p-2 min-h-[40px] min-w-[40px] rounded-lg border border-[#E4E7EC] bg-white hover:bg-slate-50 text-[#667085] hover:text-[#101828] flex items-center justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Synchronized Active City Queue Feed */
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#E4E7EC] bg-[#F7F9FC] flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Active Map Issues
                    </h3>
                    <p className="text-[11px] text-[#667085]">
                      Select an issue to locate it on the map
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB]">
                    {reports.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 scrollbar-thin max-h-[380px] lg:max-h-none">
                  {loading ? (
                    <div className="space-y-2 p-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <IssueCardSkeleton key={idx} />
                      ))}
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#667085]">
                      No reported issues match your current filters.
                    </div>
                  ) : (
                    reports.slice(0, 12).map((rep) => (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => onSelectReport(rep.id)}
                        className="w-full text-left p-3 rounded-xl hover:bg-[#F7F9FC] transition flex flex-col gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#667085] truncate">
                            {rep.category?.name || "Hazard"} &bull; {rep.wardZone}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              rep.status === "RESOLVED" || rep.status === "CITIZEN_VERIFIED"
                                ? "bg-emerald-50 text-[#12B76A] border-emerald-200"
                                : rep.priorityScore >= 80
                                ? "bg-rose-50 text-[#D92D20] border-rose-200"
                                : "bg-amber-50 text-[#B45309] border-amber-200"
                            }`}
                          >
                            P-{Math.round(rep.priorityScore)}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#101828] group-hover:text-[#2563EB] transition line-clamp-1">
                          {rep.title}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#667085]">
                          <span className="truncate flex items-center gap-1 pr-2">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{rep.address}</span>
                          </span>
                          <StatusBadge status={rep.status} size="sm" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PublicMapSection;
