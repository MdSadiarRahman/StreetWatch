"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, MapPin, Camera, Sparkles, ShieldCheck } from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

export interface DuplicateCheckInfo {
  isDuplicate: boolean;
  distanceMeters?: number | null;
  parentReport?: {
    id: string;
    title: string;
    address: string;
    status: string;
  } | null;
}

export interface ConfirmationStepProps {
  title: string;
  description: string;
  imageUrl: string;
  address: string;
  wardZone: string;
  latitude: number;
  longitude: number;
  categoryName: string;
  categorySlug: string;
  severityLevel: number;
  duplicateInfo?: DuplicateCheckInfo | null;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onBack?: () => void;
  className?: string;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  title,
  description,
  imageUrl,
  address,
  wardZone,
  latitude,
  longitude,
  categoryName,
  categorySlug,
  severityLevel,
  duplicateInfo,
  isSubmitting = false,
  onConfirm,
  onBack,
  className = "",
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Pre-Submission Verification Summary</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Review all civic incident parameters before committing to the municipal dispatch ledger.
        </p>
      </div>

      {/* Duplicate warning banner */}
      {duplicateInfo?.isDuplicate && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              Spatial Duplicate Detected ({duplicateInfo.distanceMeters ?? 25}m away)
            </span>
            <span className="text-[11px] text-amber-800">
              A report for &ldquo;{duplicateInfo.parentReport?.title}&rdquo; is already logged in this vicinity.
              Submitting will automatically upvote and attach your photo as supporting evidence.
            </span>
          </div>
        </div>
      )}

      {/* Summary Dossier Grid */}
      <div className="civic-card bg-white rounded-lg border border-slate-200 p-4 divide-y divide-slate-100 text-xs">
        {/* Top: Photo & Hazard Header */}
        <div className="pb-3 flex gap-3">
          {imageUrl && (
            <div className="h-20 w-20 rounded-md overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
              <img src={imageUrl} alt="Hazard preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-[11px] uppercase tracking-wider mb-0.5">
              <DynamicCategoryIcon slug={categorySlug} className="h-3.5 w-3.5" />
              <span>{categoryName}</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{title || "Untitled Report"}</h4>
            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
              {description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Middle: Location & Coordinates */}
        <div className="py-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{address}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pl-5">
            <span>Zone: {wardZone || "City Grid"}</span>
            <span>{latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</span>
          </div>
        </div>

        {/* Bottom: Triage Specs */}
        <div className="pt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Severity Rating:</span>
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              Level {severityLevel}/5
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-700 font-medium">
            <Sparkles className="h-3 w-3" />
            <span>Auto Gemini AI Triage</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Back to Edit
          </button>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Transmitting to City Grid...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Civic Incident</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
