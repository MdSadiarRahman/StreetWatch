"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/theme/ThemeContext";

export interface SingleIssueMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  priorityScore?: number;
  status?: string;
  heightClassName?: string;
}

function createFocusedPinIcon(priorityScore = 60, status = "REPORTED") {
  const isResolved = status === "RESOLVED" || status === "CITIZEN_VERIFIED";
  const color = isResolved
    ? "#12B76A"
    : priorityScore >= 80
    ? "#D92D20"
    : priorityScore >= 60
    ? "#F79009"
    : "#2563EB";

  return L.divIcon({
    className: "streetwatch-single-issue-pin",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: ${color};
        border: 3px solid #ffffff;
        border-radius: 9999px;
        box-shadow: 0 4px 12px rgba(16, 24, 40, 0.35);
      ">
        <div style="width: 10px; height: 10px; border-radius: 9999px; background: #ffffff;"></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function SingleIssueMap({
  latitude,
  longitude,
  address,
  priorityScore = 60,
  status = "REPORTED",
  heightClassName = "h-52",
}: SingleIssueMapProps) {
  const { resolvedTheme } = useTheme();
  const isResolved = status === "RESOLVED" || status === "CITIZEN_VERIFIED";
  const contextStroke = isResolved ? "#12B76A" : "#2563EB";
  const position: [number, number] = [latitude, longitude];
  const icon = createFocusedPinIcon(priorityScore, status);

  return (
    <div
      aria-label={`Focused location map for ${address || "selected issue"}`}
      className={`relative w-full ${heightClassName} rounded-xl overflow-hidden border border-[#E4E7EC] dark:border-slate-700 bg-slate-100 dark:bg-slate-900`}
    >
      <MapContainer
        key={`${latitude}-${longitude}`}
        center={position}
        zoom={16}
        zoomControl={true}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          key={resolvedTheme}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={
            resolvedTheme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          maxZoom={19}
        />
        <Circle
          center={position}
          radius={90}
          pathOptions={{
            color: contextStroke,
            fillColor: contextStroke,
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: "4 4",
          }}
        />
        <Marker position={position} icon={icon} />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-md border border-[#E4E7EC] bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-mono font-semibold text-[#101828] shadow-xs">
        {latitude.toFixed(4)}&deg;N, {longitude.toFixed(4)}&deg;E &bull; 90m context radius
      </div>
    </div>
  );
}
