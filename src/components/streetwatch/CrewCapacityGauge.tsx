"use client";

import React from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export interface CrewCapacityGaugeProps {
  activeSlots: number;
  totalSlots: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const CrewCapacityGauge: React.FC<CrewCapacityGaugeProps> = ({
  activeSlots,
  totalSlots,
  label = "Workforce Capacity",
  size = "md",
  className = "",
}) => {
  const percentage = totalSlots > 0 ? Math.round((activeSlots / totalSlots) * 100) : 0;
  const isHigh = percentage >= 85;
  const isMedium = percentage >= 60;

  const getBarColor = () => {
    if (isHigh) return "bg-rose-500";
    if (isMedium) return "bg-amber-500";
    return "bg-blue-600";
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-700 flex items-center gap-1.5">
          {label}
          {isHigh && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 rounded"
              title="Workforce capacity near maximum threshold"
            >
              <AlertTriangle className="h-3 w-3" /> Peak
            </span>
          )}
        </span>
        <span className="font-mono font-bold text-slate-900">
          {activeSlots} / {totalSlots} ({percentage}%)
        </span>
      </div>

      <div
        className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 ${
          size === "sm" ? "h-1.5" : "h-2.5"
        }`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} usage at ${percentage} percent`}
      >
        <div
          className={`h-full ${getBarColor()} transition-all duration-300 rounded-full`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
};

export default CrewCapacityGauge;
