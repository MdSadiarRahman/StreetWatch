"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, ArrowLeftRight, AlertTriangle } from "lucide-react";

export interface BeforeAfterComparisonProps {
  beforeUrl: string;
  afterUrl?: string | null;
  beforeLabel?: string;
  afterLabel?: string;
  resolvedAt?: string;
  className?: string;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = "Original Incident (Before)",
  afterLabel = "Resolution Proof (After)",
  resolvedAt,
  className = "",
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isInteractive, setIsInteractive] = useState(false);

  if (!afterUrl) {
    return (
      <div className={`civic-card bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs ${className}`}>
        <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Awaiting Field Worker Proof</span>
        </div>
        <div className="relative h-56 rounded-md overflow-hidden bg-slate-200">
          <img src={beforeUrl} alt={beforeLabel} className="w-full h-full object-cover" />
          <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded">
            {beforeLabel}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Field crew has not uploaded the post-remediation photographic proof yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`civic-card bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Before & After Dual Evidence</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Immutable audit proof comparing original hazard to field crew repair.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInteractive(!isInteractive)}
          className="text-[11px] font-medium text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded flex items-center gap-1"
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>{isInteractive ? "Side-by-Side" : "Interactive Slider"}</span>
        </button>
      </div>

      {isInteractive ? (
        <div className="relative h-64 sm:h-72 w-full rounded-md overflow-hidden select-none border border-slate-300">
          {/* After image base */}
          <img
            src={afterUrl}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute bottom-2 right-2 z-10 bg-emerald-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
            {afterLabel}
          </span>

          {/* Before image overlay with clip */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={beforeUrl}
              alt={beforeLabel}
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: "100%", height: "100%" }}
            />
            <span className="absolute bottom-2 left-2 z-10 bg-rose-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
              {beforeLabel}
            </span>
          </div>

          {/* Slider divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize flex items-center justify-center"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="h-7 w-7 -ml-3.5 rounded-full bg-white text-slate-800 border-2 border-blue-600 flex items-center justify-center shadow-lg text-[10px]">
              ⬌
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
            aria-label="Comparison slider position"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative h-48 rounded-md overflow-hidden bg-slate-900 border border-slate-200">
            <img src={beforeUrl} alt={beforeLabel} className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 bg-slate-900/80 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
              {beforeLabel}
            </span>
          </div>
          <div className="relative h-48 rounded-md overflow-hidden bg-slate-900 border border-slate-200">
            <img src={afterUrl} alt={afterLabel} className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 bg-slate-900/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
              {afterLabel}
            </span>
          </div>
        </div>
      )}

      {resolvedAt && (
        <div className="mt-2 text-right text-[10px] text-slate-500 font-mono">
          Remediation confirmed on: {new Date(resolvedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default BeforeAfterComparison;
