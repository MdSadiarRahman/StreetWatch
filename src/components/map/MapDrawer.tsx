"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  ExternalLink,
  ThumbsUp,
  ShieldCheck,
  HardHat,
  ChevronRight,
  Clock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import { StatusBadge } from "@/components/ui/Badge";
import IssuePriorityIndicator from "@/components/streetwatch/IssuePriorityIndicator";
import SLAIndicator from "@/components/streetwatch/SLAIndicator";
import AIExplanationPanel from "@/components/streetwatch/AIExplanationPanel";
import BeforeAfterComparison from "@/components/streetwatch/BeforeAfterComparison";
import { MunicipalCrewLocation } from "./gis-data";

export interface MapDrawerReport {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  beforeProofUrl?: string | null;
  afterProofUrl?: string | null;
  address: string;
  wardZone: string;
  latitude: number;
  longitude: number;
  status: string;
  priorityScore: number;
  severityScore?: number;
  verificationCount: number;
  createdAt: string;
  category?: {
    id?: string;
    name: string;
    slug?: string;
  };
  aiAnalysis?: {
    detectedCategory: string;
    confidenceScore: number;
    severityReasoning: string;
    priorityBreakdown?: {
      severityWeight: number;
      locationRiskWeight: number;
      communityConsensusWeight: number;
      slaDecayWeight: number;
      formula: string;
    } | null;
    optimizationNote?: string | null;
  } | null;
}

export interface MapDrawerProps {
  report: MapDrawerReport | null;
  nearbyCrews?: MunicipalCrewLocation[];
  onClose: () => void;
  onVerify?: (id: string) => void;
  className?: string;
}

export const MapDrawer: React.FC<MapDrawerProps> = ({
  report,
  nearbyCrews = [],
  onClose,
  onVerify,
  className = "",
}) => {
  if (!report) return null;

  const categoryName = report.category?.name || "Civic Hazard";
  const categorySlug = report.category?.slug || "pothole";

  // Find closest crew if available (lat/lng euclidean approx)
  const closestCrew = nearbyCrews.length > 0 ? nearbyCrews[0] : null;

  return (
    <aside
      aria-label="Selected Incident Inspector"
      className={`fixed md:absolute right-0 bottom-0 md:top-0 w-full md:w-[420px] max-h-[85vh] md:max-h-full h-auto md:h-full bg-white/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-200/90 shadow-2xl z-[500] flex flex-col rounded-t-2xl md:rounded-none overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom md:slide-in-from-right ${className}`}
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <DynamicCategoryIcon slug={categorySlug} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              INCIDENT #{report.id.slice(-6).toUpperCase()}
            </span>
            <h3 className="text-xs font-bold text-slate-900 truncate">{categoryName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/reports/${report.id}`}
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Open Full Operational Dossier"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
            aria-label="Close inspector panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs scrollbar-thin">
        {/* Priority & Status Bar */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
          <IssuePriorityIndicator score={report.priorityScore} size="md" showBar />
          <StatusBadge status={report.status} size="md" />
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-snug">{report.title}</h2>
          {report.description && (
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{report.description}</p>
          )}
        </div>

        {/* Location & Ward */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1">
          <div className="flex items-start gap-1.5 text-slate-800">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="font-medium text-xs">{report.address}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pl-5 flex items-center justify-between">
            <span>Ward: {report.wardZone || "Dhaka Zone"}</span>
            <span>{report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</span>
          </div>
        </div>

        {/* SLA & Time Target */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs text-slate-700">
          <span className="text-[11px] font-medium text-slate-500">Service Level Target:</span>
          <SLAIndicator
            createdAt={report.createdAt}
            isResolved={report.status === "RESOLVED" || report.status === "CITIZEN_VERIFIED"}
          />
        </div>

        {/* Nearest Municipal Crew Dispatch Proximity */}
        {closestCrew && (
          <div className="p-2.5 rounded-lg border border-blue-200/80 bg-blue-50/50 space-y-1 text-xs">
            <div className="flex items-center justify-between text-blue-900 font-bold">
              <span className="flex items-center gap-1.5">
                <HardHat className="h-4 w-4 text-blue-700" />
                <span>Nearby Municipal Unit</span>
              </span>
              <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                ~650m away
              </span>
            </div>
            <div className="text-[11px] text-slate-700 font-medium">
              {closestCrew.name} &bull; <span className="text-slate-500">{closestCrew.department}</span>
            </div>
          </div>
        )}

        {/* AI Triage Analysis */}
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
        {(report.imageUrl || report.beforeProofUrl) && (
          <div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Photographic Evidence
            </span>
            <BeforeAfterComparison
              beforeUrl={report.beforeProofUrl || report.imageUrl || ""}
              afterUrl={report.afterProofUrl}
            />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0">
        {onVerify && (
          <button
            type="button"
            onClick={() => onVerify(report.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs"
          >
            <ThumbsUp className="h-3.5 w-3.5 text-blue-600" />
            <span>Confirm ({report.verificationCount})</span>
          </button>
        )}

        <Link
          href={`/reports/${report.id}`}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md"
        >
          <span>Open Full Dossier</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
};

export default MapDrawer;
