"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, RotateCcw, Clock, ShieldAlert } from "lucide-react";
import { WorkflowLogEntry, WorkflowStepStatus } from "@/types";

export interface ActivityTimelineProps {
  logs: (WorkflowLogEntry | {
    id: string;
    stepName: string;
    status: WorkflowStepStatus | string;
    attemptCount?: number;
    errorMessage?: string | null;
    recoveryAction?: string | null;
    executedAt: string;
  })[];
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  logs,
  className = "",
}) => {
  if (!logs || logs.length === 0) {
    return (
      <div className={`p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200 ${className}`}>
        No workflow activity events logged yet.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      case "FAILED":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />;
      case "RETRIED":
        return <RotateCcw className="h-3.5 w-3.5 text-amber-600" />;
      case "ROLLED_BACK":
        return <ShieldAlert className="h-3.5 w-3.5 text-purple-600" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "RETRIED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ROLLED_BACK":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className={`space-y-3 relative pl-4 border-l-2 border-slate-200 ${className}`}>
      {logs.map((log) => (
        <div key={log.id} className="relative group">
          {/* Timeline Dot */}
          <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-600 transition-colors" />

          <div className="civic-card bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                {getStatusIcon(log.status)}
                <span>{log.stepName}</span>
              </span>

              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className={`px-1.5 py-0.5 rounded border font-semibold ${getStatusBadge(log.status)}`}>
                  {log.status}
                </span>
                <span className="text-slate-400">
                  {new Date(log.executedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {log.errorMessage && (
              <div className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-100 font-mono">
                Error: {log.errorMessage}
              </div>
            )}

            {log.recoveryAction && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-100 flex items-center gap-1">
                <RotateCcw className="h-3 w-3 text-amber-600 shrink-0" />
                <span>Recovery: {log.recoveryAction}</span>
              </div>
            )}

            {(log.attemptCount ?? 1) > 1 && (
              <span className="text-[10px] text-slate-400 font-mono block">
                Attempts: {log.attemptCount}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
