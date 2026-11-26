"use client";

import React from "react";
import { Sparkles, CheckCircle, HelpCircle } from "lucide-react";

export interface AIConfidenceProps {
  score: number; // 0 to 1 or 0 to 100
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AIConfidence: React.FC<AIConfidenceProps> = ({
  score,
  showPercent = true,
  size = "md",
  className = "",
}) => {
  // Normalize 0.0-1.0 or 0-100 to 0-100
  const normalized = score <= 1.0 ? Math.round(score * 100) : Math.round(score);

  const getTier = (val: number) => {
    if (val >= 90) return { label: "High Confidence", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val >= 70) return { label: "Moderate Confidence", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (val >= 50) return { label: "Caution", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Manual Review Needed", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const tier = getTier(normalized);

  const sizeClasses = {
    sm: "text-[11px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
    lg: "text-sm px-2.5 py-1 gap-2",
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border font-medium civic-badge-interactive hover:shadow-civic-ai ${tier.color} ${sizeClasses[size]} ${className}`}
      title={`AI Confidence Score: ${normalized}% - ${tier.label}`}
      role="status"
    >
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
      {showPercent && <span className="font-mono font-bold">{normalized}%</span>}
      <span className="opacity-90">{tier.label}</span>
    </div>
  );
};

export default AIConfidence;
