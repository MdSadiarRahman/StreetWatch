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

// Helper to center the map when a report is selected in the list
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.2 });
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

  // Determine active center
  const defaultCenter: [number, number] = [23.7808, 90.3802]; // Dhaka coordinates
  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId),
    [reports, selectedReportId]
  );

  // Generate color-coded custom divIcons
  const createPinIcon = (report: MapReportPin) => {
    let pinColor = "#2563EB"; // Blue default
    let badgeText = Math.round(report.priorityScore).toString();

    if (report.priorityScore >= 85 || report.status === "ASSIGNED") {
      pinColor = "#DC2626"; // Crimson
    } else if (report.status === "IN_PROGRESS") {
      pinColor = "#D97706"; // Amber
    } else if (
      report.status === "RESOLVED" ||
      report.status === "CITIZEN_VERIFIED"
    ) {
      pinColor = "#059669"; // Emerald
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
          width: ${isSelected ? "38px" : "32px"};
          height: ${isSelected ? "38px" : "32px"};
          background: ${pinColor};
          color: white;
          font-family: monospace;
          font-weight: 800;
          font-size: ${isSelected ? "12px" : "11px"};
          border-radius: 9999px;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          ${badgeText}
        </div>
      `,
      iconSize: isSelected ? [38, 38] : [32, 32],
      iconAnchor: isSelected ? [19, 19] : [16, 16],
      popupAnchor: [0, -20],
    });
  };

  if (!mounted) {
    return (
      <div className="h-full w-full animate-pulse bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Initializing City Geospatial Canvas...
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
              <div className="p-1 max-w-[240px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {report.category?.name || "Civic Hazard"}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-brand bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Score: {Math.round(report.priorityScore)}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {report.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  📍 {report.address}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-600">
                    👍 {report.verificationCount} votes
                  </span>
                  <Link
                    href={`/reports/${report.id}`}
                    className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-0.5"
                  >
                    Inspect &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Glassmorphic Floating Map Legend & Stats Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] glass-panel rounded-2xl p-3.5 shadow-lg max-w-[280px] pointer-events-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Live City Map Legend
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-critical" />
            <span>Critical (&ge;85)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-inProgress" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-status-resolved" />
            <span>Resolved</span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Active Issues:</span>
          <span className="font-mono font-bold text-slate-900">
            {reports.length}
          </span>
        </div>
      </div>
    </div>
  );
}
