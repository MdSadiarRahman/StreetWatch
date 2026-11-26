"use client";

import { Layers } from "lucide-react";

export interface WorkflowStepItem {
  id: string;
  stepName: string;
  status: string;
  attemptCount: number;
  errorMessage?: string | null;
  recoveryAction?: string | null;
  executedAt: string;
}

export interface WorkflowStepperProps {
  workflowLogs?: WorkflowStepItem[];
  currentStepIndex?: number;
}

const ORDERED_STEPS = [
  { name: "STEP_1_INGEST", title: "Incident Ingested & GPS Verified" },
  { name: "STEP_2_AI_TRIAGE", title: "Gemini AI Triaged & Scored" },
  { name: "STEP_3_COMMUNITY_GATE", title: "Community Consensus Gate" },
  { name: "STEP_4_PRIORITY_OPTIMIZE", title: "A02 Constraint Engine Evaluated" },
  { name: "STEP_5_DISPATCH", title: "Municipal Crew Dispatched" },
  { name: "STEP_6_FIELD_START", title: "Repair In Progress" },
  { name: "STEP_6_FIELD_RESOLVE", title: "Repair Proof Submitted" },
  { name: "STEP_7_CITIZEN_SIGNOFF", title: "Citizen Final Verification & Closed" },
];

export default function WorkflowStepper({
  workflowLogs = [],
}: WorkflowStepperProps) {
  return (
    <div className="civic-card civic-interactive-card p-5 space-y-4">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
        <Layers className="h-4 w-4 text-civic" />
        <span>State Machine Progression (A07)</span>
      </span>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {ORDERED_STEPS.map((step, idx) => {
          const stepLog = workflowLogs.find((l) => l.stepName === step.name);
          const isCompleted = stepLog?.status === "SUCCESS";
          const isFailed = stepLog?.status === "FAILED";
          const isRetried = stepLog?.status === "RETRIED";
          const isRolledBack = stepLog?.status === "ROLLED_BACK";
          const isCurrent =
            !isCompleted &&
            !isFailed &&
            !isRolledBack &&
            idx === workflowLogs.length;

          return (
            <div key={step.name} className="relative text-xs civic-timeline-stage group">
              <span
                className={`civic-timeline-dot absolute -left-6 top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold border transition ${
                  isCompleted
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : isRetried
                    ? "bg-amber-600 text-white border-amber-700"
                    : isRolledBack
                    ? "bg-purple-600 text-white border-purple-700"
                    : isFailed
                    ? "bg-rose-600 text-white border-rose-700"
                    : isCurrent
                    ? "bg-civic text-white border-blue-800 ring-2 ring-blue-100"
                    : "bg-white text-slate-400 border-slate-300"
                }`}
              >
                {isCompleted ? "✓" : isRolledBack ? "↺" : isFailed ? "✕" : idx + 1}
              </span>

              <div className="font-bold text-slate-800">
                {step.title}
              </div>

              {stepLog ? (
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                  <span>{new Date(stepLog.executedAt).toLocaleTimeString()}</span>
                  {stepLog.attemptCount > 1 && (
                    <span className="rounded bg-amber-100 text-amber-900 px-1 font-bold">
                      Attempt #{stepLog.attemptCount}
                    </span>
                  )}
                  {stepLog.recoveryAction && (
                    <span className="rounded bg-blue-50 text-blue-900 border border-blue-200 px-1 font-mono text-[9px]">
                      {stepLog.recoveryAction}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Pending progression</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
