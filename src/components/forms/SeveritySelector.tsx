"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export interface SeveritySelectorProps {
  value: number; // 1 to 5
  onChange: (severity: number) => void;
  label?: string;
  className?: string;
}

const SEVERITY_LEVELS = [
  { level: 1, label: "Minor", desc: "Cosmetic flaw or surface pothole; no traffic hazard" },
  { level: 2, label: "Moderate", desc: "Minor traffic slowdown; pedestrians affected" },
  { level: 3, label: "Significant", desc: "Vehicle wheel damage risk; moderate pedestrian hazard" },
  { level: 4, label: "Severe", desc: "Lane blocked, sharp road cave-in, immediate trip risk" },
  { level: 5, label: "Critical", desc: "Open manhole, live wire, structural road collapse" },
];

export const SeveritySelector: React.FC<SeveritySelectorProps> = ({
  value,
  onChange,
  label = "Citizen Assessed Severity Level",
  className = "",
}) => {
  const currentLevel = SEVERITY_LEVELS.find((l) => l.level === value) || SEVERITY_LEVELS[2];

  const getColorClasses = (lvl: number, isSelected: boolean) => {
    if (lvl === 5) {
      return isSelected
        ? "bg-red-600 text-white border-red-600 ring-2 ring-red-200"
        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    }
    if (lvl >= 4) {
      return isSelected
        ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200"
        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    }
    if (lvl >= 3) {
      return isSelected
        ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200"
        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    }
    return isSelected
      ? "bg-slate-700 text-white border-slate-700 ring-2 ring-slate-200"
      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-800 tracking-tight">
            {label}
          </label>
          <p className="text-[11px] text-slate-500">
            Scale from 1 (minor) to 5 (immediate public danger).
          </p>
        </div>
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
          Level {value}/5
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Severity rating 1 to 5">
        {SEVERITY_LEVELS.map((s) => {
          const isSelected = value === s.level;
          return (
            <button
              key={s.level}
              type="button"
              onClick={() => onChange(s.level)}
              className={`py-2 px-1 rounded-md text-center border font-bold text-xs transition-all ${getColorClasses(
                s.level,
                isSelected
              )}`}
              role="radio"
              aria-checked={isSelected}
              title={`${s.level} - ${s.label}`}
            >
              <span className="block font-mono text-sm leading-none mb-1">{s.level}</span>
              <span className="block text-[10px] font-sans font-medium uppercase tracking-wider truncate">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanatory description card */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">{currentLevel.label}: </span>
          <span className="text-slate-600">{currentLevel.desc}</span>
        </div>
      </div>
    </div>
  );
};

export default SeveritySelector;
