"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowDown,
} from "lucide-react";
import { ReportStatus } from "@/types";
import {
  LIFECYCLE_STEPS,
  IssueLifecycleState,
  LifecycleStepMeta,
  mapReportStatusToLifecycle,
  getLifecycleStepIndex,
} from "@/lib/workflow/rules";

export interface LifecycleEventOverride {
  state: IssueLifecycleState;
  timestamp?: string | Date;
  actor?: string;
  action?: string;
  notes?: string;
}

export interface IssueStatusTimelineProps {
  currentStatus: ReportStatus | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  reporterName?: string;
  assignedWorkerName?: string;
  verificationCount?: number;
  events?: LifecycleEventOverride[];
  className?: string;
  showAuditTrailDefault?: boolean;
}

export const IssueStatusTimeline: React.FC<IssueStatusTimelineProps> = ({
  currentStatus,
  createdAt,
  updatedAt,
  reporterName = "Citizen Reporter",
  assignedWorkerName,
  verificationCount = 0,
  events = [],
  className = "",
  showAuditTrailDefault = true,
}) => {
  const [showDetailedTrail, setShowDetailedTrail] = useState(showAuditTrailDefault);
  const shouldReduceMotion = useReducedMotion();
  const activeLifecycleState = mapReportStatusToLifecycle(currentStatus);
  const currentIndex = getLifecycleStepIndex(activeLifecycleState);
  const isFailed = currentStatus === "REJECTED" || currentStatus === "FAILED_RECOVERY";

  // Build real or fallback timestamp & actor metadata for each step
  const getStepEventData = (stepMeta: LifecycleStepMeta, stepIdx: number) => {
    // Check if custom event was passed
    const custom = events.find((e) => e.state === stepMeta.state);
    if (custom) {
      return {
        timestamp: custom.timestamp
          ? new Date(custom.timestamp).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recorded in Ledger",
        actor: custom.actor || stepMeta.defaultActor,
        action: custom.action || stepMeta.defaultAction,
        notes: custom.notes,
      };
    }

    // Default intelligent derivation based on ticket data
    let timestamp = "Pending workflow progression";
    let actor = stepMeta.defaultActor;
    let action = stepMeta.defaultAction;

    if (stepIdx <= currentIndex) {
      if (stepMeta.state === "REPORTED") {
        timestamp = createdAt
          ? new Date(createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Logged recently";
        actor = `${reporterName} (Verified Citizen)`;
        action = "Logged geolocated photographic evidence & hazard assessment.";
      } else if (stepMeta.state === "AI_TRIAGED") {
        timestamp = createdAt
          ? new Date(new Date(createdAt).getTime() + 45000).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Completed (+45s)";
        actor = "Gemini Vision AI Engine (v2.5)";
        action = "Automated visual edge detection, severity calculation & priority scoring.";
      } else if (stepMeta.state === "VERIFIED") {
        timestamp = createdAt
          ? new Date(new Date(createdAt).getTime() + 1800000).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Verified";
        actor = `Community Consensus (${verificationCount || 1} verified votes) & Zone Inspector`;
        action = "Physical hazard presence corroborated and approved for dispatch.";
      } else if (stepMeta.state === "ASSIGNED") {
        timestamp = updatedAt
          ? new Date(updatedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Dispatched";
        actor = "Municipal Dispatch Authority";
        action = assignedWorkerName
          ? `Work order issued and locked to ${assignedWorkerName}.`
          : "Work order dispatched to response crew with active SLA countdown.";
      } else if (stepMeta.state === "IN_PROGRESS") {
        timestamp = updatedAt
          ? new Date(updatedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Underway";
        actor = assignedWorkerName || "Assigned Field Response Crew";
        action = "Crew arrived on-site; remediation & physical repair active.";
      } else if (stepMeta.state === "RESOLVED") {
        timestamp = updatedAt
          ? new Date(updatedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Resolved";
        actor = assignedWorkerName || "Field Crew Lead";
        action = "Physical repairs finished; timestamped after-proof uploaded.";
      } else if (stepMeta.state === "CLOSED") {
        timestamp = updatedAt
          ? new Date(updatedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Archived";
        actor = `${reporterName} & Public Works Ledger`;
        action = "Citizen verified repair quality. Ticket permanently closed and archived.";
      }
    }

    return { timestamp, actor, action, notes: undefined };
  };

  const currentStepMeta = LIFECYCLE_STEPS[currentIndex] || LIFECYCLE_STEPS[0];
  const nextStepMeta =
    currentIndex < LIFECYCLE_STEPS.length - 1
      ? LIFECYCLE_STEPS[currentIndex + 1]
      : null;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden ${className}`}
      role="region"
      aria-label="Deterministic Issue Lifecycle Timeline"
    >
      {/* 1. TOP HEADER: Operational Lifecycle Status Banner */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
              DETERMINISTIC STATE MACHINE
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Stage {currentIndex + 1} of {LIFECYCLE_STEPS.length}
            </span>
          </div>
          <h3 className="mt-1 text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Current Status:</span>
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-xs uppercase tracking-wide shadow-xs">
              {currentStepMeta.label}
            </span>
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailedTrail(!showDetailedTrail)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors self-start sm:self-center"
        >
          <span>{showDetailedTrail ? "Compact Stepper" : "View Audit Trail"}</span>
          {showDetailedTrail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isFailed && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>
            <strong>Workflow Escalation:</strong> Ticket flagged as {currentStatus}. Automatic retry or authority reassignment required.
          </span>
        </div>
      )}

      {/* 2. EXECUTIVE HORIZONTAL STEPPER (Always Visible) */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        {/* Desktop View */}
        <div className="hidden lg:block relative py-2">
          {/* Background Track & Bounded Progress Fill */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-slate-200 rounded-full overflow-hidden -z-0">
            <motion.div
              initial={shouldReduceMotion ? false : { width: 0 }}
              animate={{
                width: `${Math.max(0, Math.min(100, (currentIndex / (LIFECYCLE_STEPS.length - 1)) * 100))}%`,
              }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>

          <div className="grid grid-cols-7 gap-2 relative z-10 text-center">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = idx > currentIndex;

              return (
                <div key={step.state} className="flex flex-col items-center">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 border-2 ${
                      isCompleted
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : isCurrent
                        ? "bg-white text-blue-700 border-blue-600 ring-4 ring-blue-100 scale-105 shadow-sm"
                        : "bg-white text-slate-400 border-slate-300"
                    }`}
                    title={step.label}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>

                  <span
                    className={`mt-2 text-xs font-bold tracking-tight ${
                      isCurrent
                        ? "text-blue-900"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.shortLabel}
                  </span>

                  {isCurrent && (
                    <span className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-blue-100 text-blue-800 uppercase animate-pulse">
                      Active Now
                    </span>
                  )}
                  {isCompleted && (
                    <span className="mt-0.5 font-mono text-[9px] text-emerald-700 font-semibold">
                      ✓ Done
                    </span>
                  )}
                  {isFuture && (
                    <span className="mt-0.5 font-mono text-[9px] text-slate-400">
                      Pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Horizontal Scrollable Stepper */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={step.state}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs shrink-0 border transition-all ${
                  isCurrent
                    ? "bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs ring-2 ring-blue-100"
                    : isCompleted
                    ? "bg-white border-slate-200 text-slate-700 font-medium"
                    : "bg-slate-50/60 border-slate-200/60 text-slate-400"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    isCompleted
                      ? "bg-blue-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </span>
                <span>{step.label}</span>
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-slate-300 ml-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. NEXT ALLOWED OPERATIONAL ACTION BANNER */}
      {nextStepMeta ? (
        <div className="p-4 bg-blue-50/70 border-b border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-blue-600 text-white">
                NEXT PERMISSIBLE ACTION
              </span>
              <span className="font-mono text-xs font-bold text-blue-900">
                &rarr; {nextStepMeta.label}
              </span>
            </div>
            <p className="text-xs text-blue-950 font-medium">
              {currentStepMeta.nextAllowedAction}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-blue-800">
              <span>Authorized Actor:</span>
              <strong className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-[10px]">
                {currentStepMeta.nextAllowedActor}
              </strong>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-bold text-blue-800 shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>Awaiting Event</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-950 uppercase font-mono block">
                TERMINAL STATE REACHED
              </span>
              <p className="text-xs text-emerald-800">
                Incident resolution signed off by citizen and permanently sealed in municipal ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPREHENSIVE DETAILED AUDIT LIFECYCLE TRAIL (Previous, Current, Future) */}
      <AnimatePresence>
        {showDetailedTrail && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 sm:p-6 bg-white space-y-4 overflow-hidden"
          >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              AUDIT TRAIL &amp; STATE MACHINE HISTORY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Immutable Municipal Transitions
            </span>
          </div>

          <div className="space-y-3">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = idx > currentIndex;
              const eventData = getStepEventData(step, idx);

              return (
                <div
                  key={step.state}
                  className={`rounded-xl border p-3.5 transition-all duration-200 ${
                    isCurrent
                      ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-100 shadow-sm"
                      : isCompleted
                      ? "bg-slate-50/60 border-slate-200"
                      : "bg-white border-dashed border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          isCompleted
                            ? "bg-blue-600 text-white"
                            : isCurrent
                            ? "bg-blue-600 text-white ring-2 ring-blue-200 animate-pulse"
                            : "bg-slate-100 text-slate-400 border border-slate-300"
                        }`}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isCurrent ? "text-blue-950" : isCompleted ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </span>

                          {isCurrent && (
                            <span className="px-2 py-0.2 rounded font-mono text-[9px] font-bold bg-blue-600 text-white uppercase tracking-wider shadow-2xs">
                              ● Current Stage
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          )}
                          {isFuture && (
                            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-medium bg-slate-100 text-slate-500">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 self-start sm:self-auto pl-9 sm:pl-0">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{eventData.timestamp}</span>
                    </div>
                  </div>

                  {/* Step Action & Actor Details */}
                  <div className="mt-2.5 pl-9 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500 font-semibold shrink-0">Actor:</span>
                      <span
                        className={`font-medium ${
                          isCurrent ? "text-blue-900 font-bold" : isCompleted ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {eventData.actor}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-500 font-semibold shrink-0">Action:</span>
                      <span
                        className={`leading-relaxed ${
                          isCurrent ? "text-slate-800 font-medium" : isCompleted ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {eventData.action}
                      </span>
                    </div>

                    {isCurrent && step.nextAllowedAction && (
                      <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-start gap-1.5 text-[11px] text-blue-900">
                        <ArrowDown className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Next Transition Trigger:</span>{" "}
                          <span>{step.nextAllowedAction}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};

export default IssueStatusTimeline;
