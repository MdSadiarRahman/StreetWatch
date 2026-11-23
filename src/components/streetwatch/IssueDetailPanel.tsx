"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import { StatusBadge } from "@/components/ui/Badge";
import IssuePriorityIndicator from "./IssuePriorityIndicator";
import SLAIndicator from "./SLAIndicator";
import AIExplanationPanel from "./AIExplanationPanel";
import BeforeAfterComparison from "./BeforeAfterComparison";
import { ReportItem } from "@/types";

export interface IssueDetailPanelProps {
  report: ReportItem | null;
  onClose: () => void;
  onStatusChange?: (reportId: string, newStatus: string) => void;
  className?: string;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({
  report,
  onClose,
  onStatusChange,
  className = "",
}) => {
  if (!report) return null;

  const categorySlug = report.category?.slug || "pothole";
  const categoryName = report.category?.name || "Civic Hazard";

  return (
    <div
      className={`civic-card bg-white border-l border-slate-200/90 shadow-2xl h-full flex flex-col overflow-hidden ${className}`}
      role="region"
      aria-label="Incident Details Inspector"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
            <DynamicCategoryIcon slug={categorySlug} className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              INCIDENT #{report.id.slice(-6).toUpperCase()}
            </span>
            <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{categoryName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/reports/${report.id}`}
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
            title="Open Full Operational Dossier"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            aria-label="Close detail panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
        {/* Priority & Status Bar */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
          <IssuePriorityIndicator score={report.priorityScore} size="md" showBar />
          <StatusBadge status={report.status} size="md" />
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">{report.title}</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{report.description}</p>
        </div>

        {/* Geospatial Address */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1">
          <div className="flex items-start gap-1.5 text-slate-700">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="font-medium text-xs">{report.address}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 pl-5">
            Zone: {report.wardZone || "Central District"} • Coordinates: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
          </div>
        </div>

        {/* AI Explanation Panel */}
        {report.aiAnalysis && (
          <AIExplanationPanel
            detectedCategory={report.aiAnalysis.detectedCategory}
            confidenceScore={report.aiAnalysis.confidenceScore}
            severityReasoning={report.aiAnalysis.severityReasoning}
            priorityBreakdown={report.aiAnalysis.priorityBreakdown}
            optimizationNote={report.aiAnalysis.optimizationNote}
          />
        )}

        {/* Evidence Photos */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Remediation Evidence</span>
          </h4>
          <BeforeAfterComparison
            beforeUrl={report.imageUrl}
            afterUrl={report.afterProofUrl}
            resolvedAt={report.updatedAt}
          />
        </div>

        {/* Meta Info */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <SLAIndicator createdAt={report.createdAt} isResolved={report.status === "RESOLVED" || report.status === "CITIZEN_VERIFIED"} />
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(report.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPanel;
