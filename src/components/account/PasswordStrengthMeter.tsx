"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";

export interface PasswordStrengthMeterProps {
  password: string;
  id?: string;
}

export function PasswordStrengthMeter({ password, id }: PasswordStrengthMeterProps) {
  const result = evaluatePasswordStrength(password);

  const labelColor =
    result.score >= 4
      ? "text-emerald-700"
      : result.score === 3
      ? "text-blue-700"
      : result.score === 2
      ? "text-amber-700"
      : "text-rose-700";

  const segmentColor = (index: number) => {
    if (result.score === 0 || index >= result.score) {
      return "bg-slate-200";
    }
    if (result.score >= 4) return "bg-emerald-600";
    if (result.score === 3) return "bg-blue-600";
    if (result.score === 2) return "bg-amber-500";
    return "bg-rose-600";
  };

  return (
    <div id={id} className="space-y-2.5 pt-1">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#667085]">Password strength</span>
          <span className={`font-bold ${password ? labelColor : "text-[#667085]"}`} aria-live="polite">
            {password ? result.label : "Not set"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors duration-200 ${segmentColor(i)}`}
            />
          ))}
        </div>
      </div>

      <ul
        aria-label="Password policy requirements"
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3"
      >
        {result.checks.map((check) => (
          <li
            key={check.id}
            className={`flex items-center gap-1.5 font-medium ${
              check.met ? "text-emerald-800" : "text-[#667085]"
            }`}
          >
            {check.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            )}
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
