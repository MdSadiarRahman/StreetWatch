"use client";

import React, { useState } from "react";
import { Sparkles, Info, ChevronDown, ChevronUp, Cpu, Scale } from "lucide-react";
import AIConfidence from "./AIConfidence";
import { PriorityBreakdown } from "@/types";

export interface AIExplanationPanelProps {
  detectedCategory?: string;
  confidenceScore: number;
  severityReasoning?: string;
  priorityBreakdown?: PriorityBreakdown | null;
  optimizationNote?: string | null;
  className?: string;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  detectedCategory = "Civic Hazard",
  confidenceScore,
  severityReasoning,
  priorityBreakdown,
  optimizationNote,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`civic-card bg-slate-50/80 border border-slate-200/90 rounded-lg p-3.5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center text-blue-700">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Gemini Vision Triage</span>
              <span className="text-[10px] font-mono text-slate-500 font-normal">v2.5</span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Detected: <strong className="text-slate-900">{detectedCategory}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AIConfidence score={confidenceScore} size="sm" />
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse AI explanation" : "Expand AI explanation"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {severityReasoning && (
        <div className="mt-2.5 text-xs text-slate-700 bg-white/80 p-2.5 rounded border border-slate-200/60 leading-relaxed">
          {severityReasoning}
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5 text-xs">
          {priorityBreakdown && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 mb-1.5 uppercase tracking-wider">
                <Scale className="h-3 w-3 text-slate-500" />
                <span>Deterministic Priority Weights</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-2 rounded border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Severity (40%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {priorityBreakdown.severityWeight ?? 0} pts
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Risk (25%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {priorityBreakdown.locationRiskWeight ?? 0} pts
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Consensus (20%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {priorityBreakdown.communityConsensusWeight ?? 0} pts
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">SLA Decay (15%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {priorityBreakdown.slaDecayWeight ?? 0} pts
                  </span>
                </div>
              </div>
              {priorityBreakdown.formula && (
                <div className="mt-1.5 text-[10px] font-mono text-slate-500 bg-slate-100/70 p-1.5 rounded">
                  {priorityBreakdown.formula}
                </div>
              )}
            </div>
          )}

          {optimizationNote && (
            <div className="flex items-start gap-1.5 text-[11px] text-blue-800 bg-blue-50/80 p-2 rounded border border-blue-100">
              <Info className="h-3.5 w-3.5 shrink-0 text-blue-600 mt-0.5" />
              <span>{optimizationNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplanationPanel;
