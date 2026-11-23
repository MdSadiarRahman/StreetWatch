"use client";

import React from "react";
import { HardHat, User, CheckCircle2, AlertTriangle } from "lucide-react";

export interface CrewStatusProps {
  workerName: string;
  departmentName?: string;
  activeTaskCount: number;
  workerCapacity?: number;
  isAvailable?: boolean;
  className?: string;
}

export const CrewStatus: React.FC<CrewStatusProps> = ({
  workerName,
  departmentName = "Public Works",
  activeTaskCount,
  workerCapacity = 3,
  isAvailable = true,
  className = "",
}) => {
  const isSaturated = activeTaskCount >= workerCapacity;

  return (
    <div
      className={`civic-card p-2.5 rounded-lg border border-slate-200/80 bg-white flex items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
            isSaturated
              ? "bg-amber-100 text-amber-800"
              : isAvailable
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <HardHat className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{workerName}</span>
          <span className="text-[11px] text-slate-500 block leading-tight">{departmentName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right">
          <span
            className={`font-mono font-bold text-xs ${
              isSaturated ? "text-amber-700" : "text-slate-800"
            }`}
          >
            {activeTaskCount}/{workerCapacity}
          </span>
          <span className="text-[10px] text-slate-500 block">Slots Active</span>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
            isSaturated
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {isSaturated ? "Saturated" : "Available"}
        </span>
      </div>
    </div>
  );
};

export default CrewStatus;
