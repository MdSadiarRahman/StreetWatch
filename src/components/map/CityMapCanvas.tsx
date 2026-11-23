"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

export interface MapReportPin {
  id: string;
  title: string;
  address: string;
  wardZone: string;
  latitude: number;
  longitude: number;
  status: string;
  priorityScore: number;
  verificationCount: number;
  category?: {
    name: string;
  };
}

interface CityMapCanvasProps {
  reports: MapReportPin[];
  selectedReportId: string | null;
  onSelectReport?: (id: string) => void;
}

// Map recentering helper
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.0 });
  }, [lat, lng, map]);
  return null;
}

export default function CityMapCanvas({
  reports,
  selectedReportId,
  onSelectReport,
}: CityMapCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Center coordinate: Dhaka Metropolitan Area
  const defaultCenter: [number, number] = [23.7808, 90.3802];
  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId),
    [reports, selectedReportId]
  );

  // Generate color-coded Swiss municipal divIcons
  const createPinIcon = (report: MapReportPin) => {
    let pinColor = "#1D4ED8"; // Civic Blue
    let badgeText = Math.round(report.priorityScore).toString();

    if (report.priorityScore >= 80 || report.status === "ASSIGNED") {
      pinColor = "#DC2626"; // Critical Crimson
    } else if (report.status === "IN_PROGRESS") {
      pinColor = "#D97706"; // Amber
    } else if (
      report.status === "RESOLVED" ||
      report.status === "CITIZEN_VERIFIED"
    ) {
      pinColor = "#047857"; // Emerald
      badgeText = "✓";
    }

    const isSelected = selectedReportId === report.id;

    return L.divIcon({
      className: "custom-marker-icon",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isSelected ? "36px" : "30px"};
          height: ${isSelected ? "36px" : "30px"};
          background: ${pinColor};
          color: white;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-weight: 800;
          font-size: ${isSelected ? "11px" : "10px"};
          border-radius: 9999px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
          transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          ${badgeText}
        </div>
      `,
      iconSize: isSelected ? [36, 36] : [30, 30],
      iconAnchor: isSelected ? [18, 18] : [15, 15],
      popupAnchor: [0, -18],
    });
  };

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
        Initializing Spatial Geospatial Canvas...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={
          selectedReport
            ? [selectedReport.latitude, selectedReport.longitude]
            : defaultCenter
        }
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedReport && (
          <MapRecenter
            lat={selectedReport.latitude}
            lng={selectedReport.longitude}
          />
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createPinIcon(report)}
            eventHandlers={{
              click: () => onSelectReport?.(report.id),
            }}
          >
            <Popup className="streetwatch-map-popup">
              <div className="p-3 max-w-[260px] bg-white">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {report.category?.name || "Civic Hazard"}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    Score: {Math.round(report.priorityScore)}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {report.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  📍 {report.address} ({report.wardZone})
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600">
                    👍 {report.verificationCount} votes
                  </span>
                  <Link
                    href={`/reports/${report.id}`}
                    className="text-xs font-bold text-civic hover:underline inline-flex items-center gap-0.5"
                  >
                    Inspect Record &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Spatial HUD Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-[400] spatial-hud rounded-lg p-3 max-w-[260px] pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Spatial Priority Map
          </span>
          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            {reports.length} Incidents
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-critical" />
            <span>Critical (&ge;80)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-inProgress" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-civic" />
            <span>AI Triaged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-resolved" />
            <span>Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
