"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  MapPin,
  Cpu,
  Check,
  Circle,
  ExternalLink,
  ThumbsUp,
  Wrench,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { MapReportPin } from "@/components/map/CityMapCanvas";
import BeforeAfterComparison from "@/components/streetwatch/BeforeAfterComparison";
import {
  LIFECYCLE_STEPS,
  mapReportStatusToLifecycle,
  getLifecycleStepIndex,
} from "@/lib/workflow/rules";
import {
  getPublicStatusDisplay,
  getPublicPriorityDisplay,
  formatRelativeReportedTime,
} from "./RecentCommunityReports";

const SingleIssueMap = dynamic(() => import("@/components/map/SingleIssueMap"), {
  ssr: false,
  loading: () => (
    <div className="h-52 w-full rounded-xl border border-[#E4E7EC] bg-slate-100 flex items-center justify-center text-xs text-[#667085]">
      Loading issue location map...
    </div>
  ),
});

interface FullIssueDetail extends MapReportPin {
  updatedAt?: string;
  category?: {
    id?: string;
    name: string;
    slug?: string;
    department?: {
      name: string;
      slaHours: number;
    };
  };
  assignments?: {
    worker: {
      name: string;
      role: string;
    };
  }[];
}

export interface IssueDetailDrawerProps {
  report: MapReportPin | null;
  onClose: () => void;
  onVerify?: (reportId: string) => void;
}

export function IssueDetailDrawer({
  report,
  onClose,
  onVerify,
}: IssueDetailDrawerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [fullReport, setFullReport] = useState<FullIssueDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Sync Escape key to close drawer cleanly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && report) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [report, onClose]);

  // Fetch full record details (including assignments & department SLA) from /api/reports/[id]
  useEffect(() => {
    if (!report?.id) {
      setFullReport(null);
      return;
    }
    let active = true;
    setLoadingDetails(true);
    setFullReport(report as FullIssueDetail);

    fetch(`/api/reports/${report.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data?.report) {
          setFullReport(json.data.report);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (active) setLoadingDetails(false);
      });

    return () => {
      active = false;
    };
  }, [report?.id]);

  const activeIssue = fullReport || (report as FullIssueDetail | null);

  return (
    <AnimatePresence>
      {report && activeIssue && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Issue details for ${activeIssue.title}`}
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          {/* Detail Slide-over Panel */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0.96 }}
            animate={{ x: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl bg-[#F7F9FC] h-full shadow-2xl border-l border-[#E4E7EC] flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-[#E4E7EC] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#667085] block">
                  Public Service Record &bull; #{activeIssue.id.slice(-6).toUpperCase()}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-[#101828] line-clamp-1">
                  Issue Details
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/reports/${activeIssue.id}`}
                  className="civic-btn-secondary inline-flex items-center gap-1 rounded-lg border border-[#E4E7EC] bg-[#F7F9FC] hover:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-[#101828]"
                >
                  <span>Full Page</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#667085]" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close issue details"
                  className="civic-btn-tertiary p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[#E4E7EC] text-[#667085] hover:bg-slate-100 hover:text-[#101828]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {/* 1. TOP SUMMARY CARD + IMAGE */}
              <div className="civic-interactive-card group rounded-2xl border border-[#E4E7EC] bg-white overflow-hidden shadow-xs">
                <div className="relative h-56 w-full bg-slate-100 border-b border-[#E4E7EC] overflow-hidden">
                  <img
                    src={
                      activeIssue.beforeProofUrl ||
                      activeIssue.imageUrl ||
                      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={activeIssue.title}
                    className="h-full w-full object-cover civic-card-image"
                  />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="rounded-md bg-[#F7F9FC] border border-[#E4E7EC] px-2.5 py-0.5 text-xs font-semibold text-[#101828]">
                      {activeIssue.category?.name || "Civic Hazard"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          getPublicPriorityDisplay(activeIssue.priorityScore).cls
                        }`}
                      >
                        {getPublicPriorityDisplay(activeIssue.priorityScore).label}
                      </span>
                      <span
                        role="status"
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          getPublicStatusDisplay(activeIssue.status).bgClass
                        } ${getPublicStatusDisplay(activeIssue.status).textColor}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            getPublicStatusDisplay(activeIssue.status).dotColor
                          }`}
                        />
                        <span>{getPublicStatusDisplay(activeIssue.status).label}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#101828] leading-snug">
                      {activeIssue.title}
                    </h3>
                    <p className="text-xs text-[#667085] mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
                      <span>
                        {activeIssue.address} &bull; {activeIssue.wardZone}
                      </span>
                    </p>
                  </div>

                  {activeIssue.description && (
                    <p className="text-xs text-[#344054] leading-relaxed bg-[#F7F9FC] p-3 rounded-lg border border-[#E4E7EC]">
                      {activeIssue.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. AI ASSESSMENT CARD */}
              <div className="civic-interactive-ai rounded-2xl border border-purple-200/80 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#7C5CFC] flex items-center gap-1.5">
                    <Cpu className="h-4 w-4" />
                    <span>AI Assessment</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#667085]">
                    Priority P-{Math.round(activeIssue.priorityScore)}/100
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-lg bg-[#F7F9FC] border border-[#E4E7EC] p-2.5">
                    <span className="text-[10px] text-[#667085] block">Category</span>
                    <span className="font-bold text-[#101828] mt-0.5 block truncate">
                      {activeIssue.aiAnalysis?.detectedCategory ||
                        activeIssue.category?.name ||
                        "Hazard"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#F7F9FC] border border-[#E4E7EC] p-2.5">
                    <span className="text-[10px] text-[#667085] block">Severity</span>
                    <span className="font-bold text-[#101828] mt-0.5 block">
                      {(activeIssue.severityScore || 80) >= 80
                        ? "Critical"
                        : (activeIssue.severityScore || 80) >= 60
                        ? "High"
                        : "Moderate"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-purple-50/60 border border-purple-200/70 p-2.5">
                    <span className="text-[10px] text-[#7C5CFC] block">Confidence</span>
                    <span className="font-mono font-bold text-[#7C5CFC] mt-0.5 block">
                      {Math.round((activeIssue.aiAnalysis?.confidenceScore || 0.94) * 100)}%
                    </span>
                  </div>
                </div>

                {activeIssue.aiAnalysis?.severityReasoning && (
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {activeIssue.aiAnalysis.severityReasoning}
                  </p>
                )}
              </div>

              {/* 3. PROGRESS TIMELINE (Vertical Public Story) */}
              <div className="civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#101828]">
                    Progress
                  </h4>
                  <span className="text-[11px] font-mono text-[#667085]">
                    {formatRelativeReportedTime(activeIssue.createdAt)}
                  </span>
                </div>

                {(() => {
                  const activeLifecycle = mapReportStatusToLifecycle(activeIssue.status);
                  const activeIndex = getLifecycleStepIndex(activeLifecycle);
                  return (
                    <div className="space-y-2.5">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isCompleted = idx < activeIndex;
                        const isCurrent = idx === activeIndex;
                        const isFuture = idx > activeIndex;

                        return (
                          <div
                            key={step.state}
                            className={`flex items-start gap-3 text-xs ${
                              isFuture ? "opacity-45" : "opacity-100"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <span className="h-5 w-5 rounded-full bg-[#12B76A] text-white flex items-center justify-center">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </span>
                              ) : isCurrent ? (
                                <span className="h-5 w-5 rounded-full bg-[#2563EB] text-white ring-4 ring-blue-100 flex items-center justify-center">
                                  <Circle className="h-2.5 w-2.5 fill-current" />
                                </span>
                              ) : (
                                <span className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`font-bold ${
                                    isCurrent ? "text-[#2563EB]" : "text-[#101828]"
                                  }`}
                                >
                                  {step.label}
                                </span>
                                <span className="text-[10px] font-mono text-[#667085]">
                                  {isCurrent
                                    ? "Current Stage"
                                    : isCompleted
                                    ? idx === 0
                                      ? new Date(activeIssue.createdAt).toLocaleDateString()
                                      : "Completed"
                                    : "Pending"}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#667085] leading-snug">
                                {step.defaultAction}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* 4. LOCATION (SMALL FOCUSED MAP OF ONLY THIS ISSUE) */}
              <div className="civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#101828]">
                    Location
                  </h4>
                  <span className="text-[11px] text-[#667085] font-medium">
                    {activeIssue.wardZone}
                  </span>
                </div>
                <p className="text-xs text-[#344054] font-medium">
                  {activeIssue.address}
                </p>
                <SingleIssueMap
                  latitude={activeIssue.latitude}
                  longitude={activeIssue.longitude}
                  address={activeIssue.address}
                  priorityScore={activeIssue.priorityScore}
                  status={activeIssue.status}
                  heightClassName="h-48"
                />
              </div>

              {/* 5. MUNICIPAL ACTION */}
              <div className="civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-4 space-y-2.5 shadow-xs">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#101828] flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>Municipal Action</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#F7F9FC] border border-[#E4E7EC] p-3">
                    <span className="text-[10px] text-[#667085] block">Assigned Team</span>
                    <span className="font-bold text-[#101828] mt-0.5 block">
                      {loadingDetails
                        ? "Checking dispatch..."
                        : activeIssue.assignments?.[0]?.worker?.name ||
                          activeIssue.category?.department?.name ||
                          "Awaiting Municipal Dispatch"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#F7F9FC] border border-[#E4E7EC] p-3">
                    <span className="text-[10px] text-[#667085] block">Current Status</span>
                    <span className="font-bold text-[#101828] mt-0.5 block">
                      {getPublicStatusDisplay(activeIssue.status).label}
                    </span>
                    {activeIssue.category?.department?.slaHours && (
                      <span className="text-[10px] font-mono text-[#667085] flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>SLA Target: {activeIssue.category.department.slaHours}h</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. BEFORE / AFTER EVIDENCE (ONLY IF ACTUAL UPLOADED EVIDENCE EXISTS) */}
              {activeIssue.afterProofUrl && (
                <BeforeAfterComparison
                  beforeUrl={activeIssue.beforeProofUrl || activeIssue.imageUrl || ""}
                  afterUrl={activeIssue.afterProofUrl}
                  resolvedAt={activeIssue.updatedAt}
                />
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="bg-white border-t border-[#E4E7EC] px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
              {onVerify && (
                <button
                  type="button"
                  disabled={verifying}
                  onClick={async () => {
                    setVerifying(true);
                    await onVerify(activeIssue.id);
                    setVerifying(false);
                  }}
                  className="civic-btn-secondary inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F7F9FC] px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#101828] disabled:opacity-50"
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>Confirm ({activeIssue.verificationCount})</span>
                </button>
              )}

              <Link
                href={`/reports/${activeIssue.id}`}
                className="civic-btn-primary group flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 min-h-[42px] text-xs font-bold text-white shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 civic-icon-shift" />
                <span>Open Full Public Record</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default IssueDetailDrawer;
