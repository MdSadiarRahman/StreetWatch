"use client";

import React from "react";
import { Check, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { ReportStatus } from "@/types";

export interface IssueStatusTimelineProps {
  currentStatus: ReportStatus | string;
  className?: string;
}

interface StepDef {
  key: ReportStatus;
  label: string;
  description: string;
}

const ORDERED_STEPS: StepDef[] = [
  { key: "REPORTED", label: "Reported", description: "Incident logged" },
  { key: "AI_TRIAGED", label: "AI Triage", description: "Vision & severity" },
  { key: "COMMUNITY_VERIFIED", label: "Verified", description: "Citizen consensus" },
  { key: "ASSIGNED", label: "Assigned", description: "Crew dispatched" },
  { key: "IN_PROGRESS", label: "In Progress", description: "Field resolution" },
  { key: "RESOLVED", label: "Resolved", description: "Proof uploaded" },
  { key: "CITIZEN_VERIFIED", label: "Closed", description: "Citizen approved" },
];

export const IssueStatusTimeline: React.FC<IssueStatusTimelineProps> = ({
  currentStatus,
  className = "",
}) => {
  const getStepIndex = (status: string) => {
    switch (status) {
      case "REPORTED":
        return 0;
      case "AI_TRIAGED":
        return 1;
      case "COMMUNITY_VERIFIED":
      case "PRIORITY_SCORED":
        return 2;
      case "ASSIGNED":
        return 3;
      case "IN_PROGRESS":
        return 4;
      case "RESOLVED":
        return 5;
      case "CITIZEN_VERIFIED":
        return 6;
      case "REJECTED":
      case "FAILED_RECOVERY":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isFailed = currentStatus === "REJECTED" || currentStatus === "FAILED_RECOVERY";

  return (
    <div className={`w-full py-2 ${className}`}>
      {isFailed && (
        <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>
            Current Status: <strong>{currentStatus.replace("_", " ")}</strong> (Workflow halted / escalated)
          </span>
        </div>
      )}

      {/* Desktop Stepper */}
      <nav aria-label="Issue Progress" className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
          style={{
            width: `${Math.max(0, Math.min(100, (currentIndex / (ORDERED_STEPS.length - 1)) * 100))}%`,
          }}
        />

        {ORDERED_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 text-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all border-2 ${
                  isDone
                    ? "bg-blue-600 text-white border-blue-600"
                    : isCurrent
                    ? "bg-white text-blue-700 border-blue-600 ring-4 ring-blue-100"
                    : "bg-white text-slate-400 border-slate-300"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  isCurrent ? "text-blue-900" : isDone ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-500 hidden lg:block">
                {step.description}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Mobile Compact Horizontal Scroll Stepper */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {ORDERED_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs shrink-0 border ${
                isCurrent
                  ? "bg-blue-50 border-blue-300 text-blue-800 font-bold"
                  : isDone
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-white border-slate-100 text-slate-400"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isDone ? "bg-blue-600 text-white" : isCurrent ? "bg-blue-200 text-blue-900" : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </span>
              <span>{step.label}</span>
              {idx < ORDERED_STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-slate-300 ml-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IssueStatusTimeline;
