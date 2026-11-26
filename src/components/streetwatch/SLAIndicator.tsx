"use client";

import React from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface SLAIndicatorProps {
  createdAt: string | Date;
  slaHours?: number;
  isResolved?: boolean;
  className?: string;
}

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({
  createdAt,
  slaHours = 48,
  isResolved = false,
  className = "",
}) => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const elapsedHours = Math.max(0, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
  const remainingHours = slaHours - elapsedHours;
  const isBreached = remainingHours <= 0;

  if (isResolved) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        title="Resolved within SLA tracking policy"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        SLA Met
      </span>
    );
  }

  if (isBreached) {
    const overdueHours = Math.round(Math.abs(remainingHours));
    return (
      <span
        className={`civic-badge-interactive inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:shadow-civic-critical ${className}`}
        title={`SLA Breached by ${overdueHours}h (Target: ${slaHours}h)`}
        role="status"
        aria-live="polite"
      >
        <AlertTriangle className="h-3 w-3 text-rose-600" />
        SLA Breached (+{overdueHours}h)
      </span>
    );
  }

  const remainingRounded = Math.round(remainingHours);
  const isImminent = remainingRounded <= 6;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
        isImminent
          ? "bg-amber-50 text-amber-800 border-amber-300"
          : "bg-slate-50 text-slate-700 border-slate-200"
      } ${className}`}
      title={`Target SLA: ${slaHours} hours`}
    >
      <Clock className={`h-3 w-3 ${isImminent ? "text-amber-600" : "text-slate-500"}`} />
      <span>{remainingRounded}h SLA left</span>
    </span>
  );
};

export default SLAIndicator;
