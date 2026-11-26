"use client";

import React from "react";

export interface IssuePriorityIndicatorProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showBar?: boolean;
  className?: string;
}

export function getPriorityTier(score: number): {
  label: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
} {
  if (score >= 80) {
    return {
      label: "Critical",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      bgClass: "bg-red-500",
      textClass: "text-red-700",
      borderClass: "border-red-300",
      dotClass: "bg-red-600",
    };
  }
  if (score >= 60) {
    return {
      label: "High",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      bgClass: "bg-amber-500",
      textClass: "text-amber-700",
      borderClass: "border-amber-300",
      dotClass: "bg-amber-600",
    };
  }
  if (score >= 40) {
    return {
      label: "Medium",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      bgClass: "bg-blue-500",
      textClass: "text-blue-700",
      borderClass: "border-blue-300",
      dotClass: "bg-blue-600",
    };
  }
  return {
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    bgClass: "bg-slate-400",
    textClass: "text-slate-600",
    borderClass: "border-slate-300",
    dotClass: "bg-slate-500",
  };
}

export const IssuePriorityIndicator: React.FC<IssuePriorityIndicatorProps> = ({
  score,
  size = "md",
  showLabel = true,
  showBar = false,
  className = "",
}) => {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const tier = getPriorityTier(normalizedScore);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`civic-badge-interactive inline-flex items-center gap-1.5 font-mono font-bold rounded-md border ${
          normalizedScore >= 80
            ? "hover:shadow-civic-critical"
            : normalizedScore >= 60
            ? "hover:shadow-civic-warning"
            : ""
        } ${tier.badgeClass} ${sizeClasses[size]}`}
        title={`Priority Score: ${normalizedScore}/100 (${tier.label})`}
        aria-label={`Priority ${normalizedScore} out of 100, ${tier.label}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${tier.dotClass}`}
          aria-hidden="true"
        />
        <span>P-{normalizedScore}</span>
        {showLabel && (
          <span className="font-sans font-medium text-[11px] opacity-80 uppercase tracking-wider">
            {tier.label}
          </span>
        )}
      </div>

      {showBar && (
        <div
          className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60"
          role="progressbar"
          aria-valuenow={normalizedScore}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full ${tier.bgClass} transition-all duration-300`}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default IssuePriorityIndicator;
