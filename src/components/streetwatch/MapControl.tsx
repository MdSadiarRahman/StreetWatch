"use client";

import React from "react";
import { Plus, Minus, RotateCcw, Crosshair, Layers } from "lucide-react";

export interface MapControlProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onLocateMe?: () => void;
  onToggleLayers?: () => void;
  className?: string;
}

export const MapControl: React.FC<MapControlProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onLocateMe,
  onToggleLayers,
  className = "",
}) => {
  return (
    <div
      className={`inline-flex flex-col bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 divide-y divide-slate-100 overflow-hidden ${className}`}
      role="toolbar"
      aria-label="Map Navigation Controls"
    >
      {onZoomIn && (
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-blue-50"
          title="Zoom In"
          aria-label="Zoom in on map"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      {onZoomOut && (
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-blue-50"
          title="Zoom Out"
          aria-label="Zoom out of map"
        >
          <Minus className="h-4 w-4" />
        </button>
      )}

      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-blue-50"
          title="Locate Current Position"
          aria-label="Locate my position on map"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      )}

      {onResetView && (
        <button
          type="button"
          onClick={onResetView}
          className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-blue-50"
          title="Reset to City Grid Center"
          aria-label="Reset map view"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}

      {onToggleLayers && (
        <button
          type="button"
          onClick={onToggleLayers}
          className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-blue-50"
          title="Toggle Heatmap / Satellite Layers"
          aria-label="Toggle map visual layers"
        >
          <Layers className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default MapControl;
