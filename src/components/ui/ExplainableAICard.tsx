"use client";

import { Sparkles, AlertTriangle, ShieldCheck, Info } from "lucide-react";

export interface PriorityBreakdownData {
  severityWeight?: number;
  locationRiskWeight?: number;
  communityConsensusWeight?: number;
  slaDecayWeight?: number;
  formula?: string;
}

export interface ExplainableAICardProps {
  priorityScore: number;
  breakdown?: PriorityBreakdownData;
  severityReasoning?: string | null;
  optimizationNote?: string | null;
  showFormulaDetails?: boolean;
}

export default function ExplainableAICard({
  priorityScore,
  breakdown,
  severityReasoning,
  optimizationNote,
  showFormulaDetails = true,
}: ExplainableAICardProps) {
  const isCritical = priorityScore >= 80;
  const isHigh = priorityScore >= 60 && priorityScore < 80;

  const sev = breakdown?.severityWeight ?? 35;
  const loc = breakdown?.locationRiskWeight ?? 20;
  const com = breakdown?.communityConsensusWeight ?? 10;
  const sla = breakdown?.slaDecayWeight ?? 10;

  return (
    <div className="civic-card p-5 space-y-4">
      {/* Header with Monospace Score Pill */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-civic" />
          <span>Explainable AI Priority (A02)</span>
        </span>
        <span
          className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded border ${
            isCritical
              ? "bg-rose-50 text-rose-800 border-rose-300"
              : isHigh
              ? "bg-amber-50 text-amber-800 border-amber-300"
              : "bg-blue-50 text-civic border-blue-300"
          }`}
        >
          P-{Math.round(priorityScore)}/100
        </span>
      </div>

      {/* 4-Component Weight Progress Bars */}
      {showFormulaDetails && (
        <div className="space-y-3 pt-1 text-xs">
          {/* Component 1: Severity */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Physical Hazard Severity</span>
              <span className="font-mono text-slate-800">{sev} / 40</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (sev / 40) * 100)}%` }}
              />
            </div>
          </div>

          {/* Component 2: Location Risk */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Spatial Location Risk</span>
              <span className="font-mono text-slate-800">{loc} / 25</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (loc / 25) * 100)}%` }}
              />
            </div>
          </div>

          {/* Component 3: Community Consensus */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Community Consensus</span>
              <span className="font-mono text-slate-800">{com} / 20</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-civic rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (com / 20) * 100)}%` }}
              />
            </div>
          </div>

          {/* Component 4: SLA Aging Decay */}
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>SLA Decay Accrual</span>
              <span className="font-mono text-slate-800">{sla} / 15</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (sla / 15) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Algorithmic Reasoning Box */}
      <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900 block mb-1">Algorithmic Reasoning:</strong>
        {severityReasoning ||
          "Evaluated using Gemini multimodal vision and municipal risk weight matrices."}
      </div>

      {/* Optimization Note Pill */}
      {optimizationNote && (
        <div className="text-[11px] text-slate-600 font-mono bg-blue-50/70 p-2.5 rounded border border-blue-200 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 text-civic shrink-0 mt-0.5" />
          <span>{optimizationNote}</span>
        </div>
      )}
    </div>
  );
}
