"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Cpu,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Car,
  School,
  Layers,
  History,
  Eye,
  Check,
  RotateCcw,
  UserCheck,
} from "lucide-react";

export interface AIAutoTriageData {
  reportId: string;
  categoryName: string;
  suggestedPriorityScore: number;
  confidenceScore: number; // 0.0 - 1.0
  severityRating: number; // 1 to 5
  requiresVerification: boolean;

  // The 6 "WHY THIS PRIORITY?" Factors:
  roadSeverity: {
    scorePct: number;
    metricLabel: string;
    explanation: string;
  };
  trafficImportance: {
    scorePct: number;
    metricLabel: string;
    explanation: string;
  };
  sensitiveLocations: {
    scorePct: number;
    metricLabel: string;
    explanation: string;
    nearbyEntities: string[];
  };
  similarReports: {
    scorePct: number;
    count: number;
    explanation: string;
  };
  imageConfidence: {
    scorePct: number;
    modelName: string;
    explanation: string;
  };
  historicalPattern: {
    scorePct: number;
    metricLabel: string;
    explanation: string;
  };

  // Three-Tier Governance Actors:
  governance: {
    aiRecommendation: {
      suggestedPriority: number;
      suggestedDepartment: string;
      generatedAt: string;
    };
    humanVerification: {
      isVerified: boolean;
      verificationCount: number;
      inspectorAttestation?: string | null;
    };
    finalOperationalDecision: {
      isApproved: boolean;
      isOverridden: boolean;
      approvedPriority: number;
      approverName?: string | null;
      operatorJustification?: string | null;
      decidedAt?: string | null;
    };
  };
}

export interface AIAutoTriagePanelProps {
  data?: Partial<AIAutoTriageData>;
  canOverride?: boolean;
  onApplyOverride?: (override: {
    priorityScore: number;
    severityRating: number;
    justification: string;
  }) => Promise<void> | void;
  className?: string;
}

export const AIAutoTriagePanel: React.FC<AIAutoTriagePanelProps> = ({
  data,
  canOverride = true,
  onApplyOverride,
  className = "",
}) => {
  // Safe Fallback Data Defaults
  const triage: AIAutoTriageData = {
    reportId: data?.reportId || "rep-001",
    categoryName: data?.categoryName || "Deep Road Crater / Pothole",
    suggestedPriorityScore: data?.suggestedPriorityScore ?? 88,
    confidenceScore: data?.confidenceScore ?? 0.94,
    severityRating: data?.severityRating ?? 4.5,
    requiresVerification: data?.requiresVerification ?? true,

    roadSeverity: data?.roadSeverity || {
      scorePct: 88,
      metricLabel: "Severe Cave-in (4.5/5)",
      explanation: "Substrate failure with sharp sheared asphalt edges, posing tire rim breach and wheel loss risk.",
    },
    trafficImportance: data?.trafficImportance || {
      scorePct: 92,
      metricLabel: "Tier 1 Arterial Route",
      explanation: "Mirpur Main Transit Corridor carrying over 45,000 commuters and public transit buses daily.",
    },
    sensitiveLocations: data?.sensitiveLocations || {
      scorePct: 95,
      metricLabel: "Vulnerable Pedestrian Zone",
      explanation: "Located within 45m of Mirpur Model Elementary School and 180m from Central Diagnostic Hospital.",
      nearbyEntities: ["Primary School (45m)", "Hospital Route (180m)"],
    },
    similarReports: data?.similarReports || {
      scorePct: 75,
      count: 4,
      explanation: "4 corroborating citizen reports logged within 60m radius over the past 48 hours.",
    },
    imageConfidence: data?.imageConfidence || {
      scorePct: 96,
      modelName: "Gemini Vision v2.5",
      explanation: "High-contrast geometric edge and depth calculation without optical occlusion.",
    },
    historicalPattern: data?.historicalPattern || {
      scorePct: 80,
      metricLabel: "Monsoon Recurrence Node",
      explanation: "Ward 4 drainage basin recorded 12 pavement failure events across the last 18 months.",
    },

    governance: data?.governance || {
      aiRecommendation: {
        suggestedPriority: 88,
        suggestedDepartment: "Road Maintenance Dept",
        generatedAt: "Today, 10:42 AM",
      },
      humanVerification: {
        isVerified: true,
        verificationCount: 18,
        inspectorAttestation: "Community consensus verified by 18 citizens & Zone 4 Field Inspector.",
      },
      finalOperationalDecision: {
        isApproved: false,
        isOverridden: false,
        approvedPriority: 88,
        approverName: null,
        operatorJustification: null,
      },
    },
  };

  // State for Human Override Module
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overridePriority, setOverridePriority] = useState(triage.suggestedPriorityScore);
  const [overrideSeverity, setOverrideSeverity] = useState(Math.round(triage.severityRating));
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Active state of decision (can be updated by operator)
  const [currentDecision, setCurrentDecision] = useState(triage.governance.finalOperationalDecision);
  const shouldReduceMotion = useReducedMotion();

  const confidencePct = Math.round(triage.confidenceScore * 100);

  const handleCommitOverride = async () => {
    if (!overrideReason.trim()) return;
    setIsSubmittingOverride(true);
    try {
      if (onApplyOverride) {
        await onApplyOverride({
          priorityScore: overridePriority,
          severityRating: overrideSeverity,
          justification: overrideReason,
        });
      }
      setCurrentDecision({
        isApproved: true,
        isOverridden: true,
        approvedPriority: overridePriority,
        approverName: "Engr. Farhana Yasmin (Authority)",
        operatorJustification: overrideReason,
        decidedAt: "Just now",
      });
      setOverrideSuccess(true);
      setShowOverrideForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-700/80 bg-[#0F172A] shadow-xl text-slate-100 overflow-hidden divide-y divide-slate-800 ${className}`}
      role="region"
      aria-label="Explainable AI Auto-Triage Decision Support System"
    >
      {/* 1. TOP HEADER: Explainable Decision Support Banner (Subtle Purple AI Accent) */}
      <div className="p-4 bg-[#111933]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-xs">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs tracking-wider text-purple-300 uppercase">
                EXPLAINABLE AI DECISION SUPPORT SYSTEM
              </span>
              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-purple-950 border border-purple-700/60 text-purple-300">
                v2.5 Vision Triage
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Machine learning assessment &bull; Subject to human verification &amp; operational oversight
            </p>
          </div>
        </div>

        {/* Epistemic Humility Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/30 border border-amber-800/40 text-[11px] font-medium text-amber-300">
          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
          <span>Requires verification &bull; Suggested assessment</span>
        </div>
      </div>

      {/* 2. SECTION 1: AI TRIAGE (Category, Severity, Confidence, Priority Score) */}
      <div className="p-4 space-y-3 bg-[#0D152B]/60">
        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
          AI TRIAGE BASELINE
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Category */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Detected Category</span>
            <div className="mt-1 font-bold text-white text-xs truncate" title={triage.categoryName}>
              {triage.categoryName}
            </div>
            <span className="text-[10px] text-purple-400/90 font-mono mt-1">Multi-modal classification</span>
          </div>

          {/* Severity */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase">AI Severity Assessment</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-lg font-black text-white">
                {triage.severityRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ 5.0</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">Significant Impact</span>
          </div>

          {/* Confidence */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Model Confidence</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-mono text-lg font-black text-purple-300">{confidencePct}%</span>
              <Sparkles className="h-3 w-3 text-purple-400" />
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">High Reliability</span>
          </div>

          {/* Suggested Priority Score */}
          <div className="p-3 rounded-lg bg-[#181226] border border-purple-800/60 flex flex-col justify-between">
            <span className="text-[10px] text-purple-300 font-mono uppercase font-bold">Suggested Priority</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-black text-purple-300">
                P-{Math.round(triage.suggestedPriorityScore)}
              </span>
              <span className="text-[10px] text-purple-400/80 font-mono">/ 100</span>
            </div>
            <span className="text-[10px] font-bold text-red-400 font-mono uppercase">Critical Tier</span>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2: WHY THIS PRIORITY? (6 Visual Reasoning Factors) */}
      <div className="p-4 space-y-3.5 bg-[#0A1024]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-400" />
            <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
              WHY THIS PRIORITY? (DETERMINISTIC WEIGHT BREAKDOWN)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Formula: P = 0.40S + 0.25R + 0.20C + 0.15D
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Factor 1: Road severity */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>1. Road Severity</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-white bg-slate-800 px-1.5 py-0.2 rounded">
                {triage.roadSeverity.metricLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${triage.roadSeverity.scorePct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-amber-500 rounded-full"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{triage.roadSeverity.explanation}</p>
          </div>

          {/* Factor 2: Traffic importance */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-blue-400" />
                <span>2. Traffic Importance</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-900/60">
                {triage.trafficImportance.metricLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${triage.trafficImportance.scorePct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {triage.trafficImportance.explanation}
            </p>
          </div>

          {/* Factor 3: Nearby sensitive location */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-purple-400" />
                <span>3. Sensitive Location Proximity</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-900/60">
                {triage.sensitiveLocations.metricLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${triage.sensitiveLocations.scorePct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-300 pt-0.5">
              {triage.sensitiveLocations.nearbyEntities.map((ent) => (
                <span key={ent} className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                  📍 {ent}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {triage.sensitiveLocations.explanation}
            </p>
          </div>

          {/* Factor 4: Number of similar reports */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>4. Similar Reports &amp; Consensus</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-900/60">
                {triage.similarReports.count} Cluster Reports
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${triage.similarReports.scorePct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {triage.similarReports.explanation}
            </p>
          </div>

          {/* Factor 5: Image confidence */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <span>5. Photographic Vision Confidence</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-900/60">
                {triage.imageConfidence.scorePct}% Score
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${triage.imageConfidence.scorePct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {triage.imageConfidence.explanation} ({triage.imageConfidence.modelName})
            </p>
          </div>

          {/* Factor 6: Historical pattern */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-amber-400" />
                <span>6. Historical Pattern Analysis</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-900/60">
                {triage.historicalPattern.metricLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={shouldReduceMotion ? false : { width: 0 }}
                animate={{ width: `${triage.historicalPattern.scorePct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-amber-500 rounded-full"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {triage.historicalPattern.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* 4. SECTION 3: THREE-TIER GOVERNANCE PIPELINE */}
      <div className="p-4 bg-[#0B1226] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            THREE-TIER MUNICIPAL GOVERNANCE PIPELINE
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Audit Immutable Trail</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Tier 1: AI Recommendation */}
          <div className="p-3 rounded-lg bg-[#141228] border border-purple-800/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[10px] text-purple-300 uppercase flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span>1. AI RECOMMENDATION</span>
              </span>
              <span className="font-mono font-bold text-purple-300 text-xs">
                P-{triage.governance.aiRecommendation.suggestedPriority}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Suggested Dispatch: <strong>{triage.governance.aiRecommendation.suggestedDepartment}</strong>
            </p>
            <span className="text-[10px] font-mono text-slate-400 block">
              Automated Triage: {triage.governance.aiRecommendation.generatedAt}
            </span>
          </div>

          {/* Tier 2: Human Verification */}
          <div className="p-3 rounded-lg bg-[#0E1A2E] border border-blue-800/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[10px] text-blue-300 uppercase flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>2. HUMAN VERIFICATION</span>
              </span>
              <span className="font-mono font-bold text-blue-300 text-xs">
                {triage.governance.humanVerification.verificationCount} Votes
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Citizen consensus status: <strong>Verified</strong>
            </p>
            <span className="text-[10px] text-slate-400 block line-clamp-1">
              {triage.governance.humanVerification.inspectorAttestation}
            </span>
          </div>

          {/* Tier 3: Final Operational Decision */}
          <div
            className={`p-3 rounded-lg border space-y-1.5 ${
              currentDecision.isOverridden
                ? "bg-[#25131C] border-amber-800/60"
                : "bg-[#0B1E19] border-emerald-800/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[10px] text-emerald-300 uppercase flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>3. OPERATIONAL DECISION</span>
              </span>
              <span className="font-mono font-bold text-emerald-300 text-xs">
                P-{currentDecision.approvedPriority}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {currentDecision.isOverridden ? (
                <span className="text-amber-300 font-semibold">
                  Overridden by Human Authority ({currentDecision.approverName || "Officer"})
                </span>
              ) : (
                <span className="text-emerald-300 font-semibold">
                  Accepted AI Recommendation (Enforced)
                </span>
              )}
            </p>
            {currentDecision.operatorJustification && (
              <p className="text-[10px] text-slate-300 italic">
                Note: &ldquo;{currentDecision.operatorJustification}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. SECTION 4: AUTHORIZED HUMAN OPERATOR REVIEW & OVERRIDE */}
      {canOverride && (
        <div className="p-4 bg-[#0F172A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-300" />
              <h5 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                MUNICIPAL OPERATOR AUDIT &amp; OVERRIDE MODULE
              </h5>
            </div>

            <button
              type="button"
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              <span>{showOverrideForm ? "Cancel Review" : "Review / Override AI Assessment"}</span>
              {showOverrideForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {overrideSuccess && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Human override registered into municipal audit log. Operational priority set to P-{overridePriority}.
              </span>
            </div>
          )}

          {/* Interactive Override Form */}
          {showOverrideForm && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-4 animate-in fade-in-50 text-xs">
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200">
                <strong>Administrative Notice:</strong> Overriding AI auto-triage updates the deterministic priority calculation and will be logged in the public transparency ledger under your municipal officer credential.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Adjusted Priority Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-200">Adjusted Priority Score (0-100):</label>
                    <span className="font-mono font-bold text-white text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      P-{overridePriority}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>10 (Low)</span>
                    <span>50 (Medium)</span>
                    <span>80 (Critical)</span>
                    <span>100 (Emergency)</span>
                  </div>
                </div>

                {/* Adjusted Severity Selector */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 block">Operator Assessed Severity:</label>
                  <div className="grid grid-cols-5 gap-1 font-mono text-xs font-bold">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setOverrideSeverity(lvl)}
                        className={`py-1.5 rounded border transition-colors ${
                          overrideSeverity === lvl
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        Lvl {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Justification Textarea */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-200 block">
                  Operator Justification Reason (Required for audit log):
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Upgrading priority due to school board examinations starting at 8:00 AM..."
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOverridePriority(triage.suggestedPriorityScore);
                    setOverrideSeverity(Math.round(triage.severityRating));
                    setOverrideReason("Accepted baseline AI triage recommendations.");
                  }}
                  className="text-xs text-slate-400 hover:text-white underline font-mono"
                >
                  Reset to AI Suggested
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOverrideForm(false)}
                    className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitOverride}
                    disabled={isSubmittingOverride || !overrideReason.trim()}
                    className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmittingOverride ? (
                      <span>Recording...</span>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Commit Human Override</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAutoTriagePanel;
