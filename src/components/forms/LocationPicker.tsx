"use client";

import React from "react";
import { MapPin, Navigation, Compass } from "lucide-react";

export interface LocationPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  wardZone: string;
  onLocationChange: (lat: number, lng: number, address: string, wardZone: string) => void;
  mapNode?: React.ReactNode;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  address,
  wardZone,
  onLocationChange,
  mapNode,
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-xs font-bold text-slate-800 tracking-tight">
          Geospatial Location & City Ward
        </label>
        <p className="text-[11px] text-slate-500">
          Pinpoint exact hazard coordinates for crew routing and duplicate cluster detection.
        </p>
      </div>

      {/* Map display slot */}
      {mapNode ? (
        <div className="rounded-lg overflow-hidden border border-slate-200 shadow-xs">
          {mapNode}
        </div>
      ) : (
        <div className="h-48 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
          <MapPin className="h-6 w-6 text-slate-400" />
          <span>Interactive Map Location Selector</span>
        </div>
      )}

      {/* Address & Zone Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Street Address / Landmark
          </label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => onLocationChange(latitude, longitude, e.target.value, wardZone)}
              placeholder="e.g. 142 Mirpur Road, Sector 4"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Ward / Zone
          </label>
          <input
            type="text"
            value={wardZone}
            onChange={(e) => onLocationChange(latitude, longitude, address, e.target.value)}
            placeholder="e.g. Ward-04"
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono"
          />
        </div>
      </div>

      {/* Lat/Lng display pill */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200/70">
        <span className="flex items-center gap-1">
          <Compass className="h-3 w-3 text-slate-400" />
          <span>GPS Pin:</span>
        </span>
        <span>
          {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E
        </span>
      </div>
    </div>
  );
};

export default LocationPicker;
