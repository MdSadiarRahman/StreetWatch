"use client";

import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

export interface MapLegendProps {
  collapsible?: boolean;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  collapsible = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-md p-2.5 text-xs text-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5 font-bold text-slate-900 uppercase text-[10px] tracking-wider">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-blue-600" />
          <span>City Incident Legend</span>
        </span>
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
            aria-label={isOpen ? "Collapse legend" : "Expand legend"}
          >
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 border border-red-700 ring-2 ring-red-100" />
              <span>Critical Priority (P-80+)</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Immediate</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-amber-600 ring-2 ring-amber-100" />
              <span>High Priority (P-60+)</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Within 24h</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 border border-blue-600 ring-2 ring-blue-100" />
              <span>Medium Priority</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Within 48h</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-600 ring-2 ring-emerald-100" />
              <span>Resolved & Verified</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Closed</span>
          </div>

          <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Dashed ring = Duplicate cluster</span>
            <span className="font-mono">Spatial Radius: 50m</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
