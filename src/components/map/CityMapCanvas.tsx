"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import {
  Layers,
  Map as MapIcon,
  Plus,
  Minus,
  Crosshair,
  RotateCcw,
  HardHat,
  Building,
  Flame,
  Hospital,
  AlertTriangle,
  Info,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

import {
  DHAKA_ROAD_CORRIDORS,
  DHAKA_MUNICIPAL_CREWS,
  DHAKA_PUBLIC_FACILITIES,
  DHAKA_HOTSPOT_ZONES,
  MunicipalCrewLocation,
} from "./gis-data";
import { clusterGeospatialPoints } from "./spatial-cluster";
import { MapDrawer, MapDrawerReport } from "./MapDrawer";

export interface MapReportPin extends MapDrawerReport {}

export interface CityMapCanvasProps {
  reports: MapReportPin[];
  selectedReportId: string | null;
  onSelectReport?: (id: string | null) => void;
  onVerifyReport?: (id: string) => void;
  initialStyle?: MapStyleKey;
  className?: string;
}

export type MapStyleKey = "dark" | "positron" | "satellite" | "osm";

interface MapStyleConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const MAP_STYLES: Record<MapStyleKey, MapStyleConfig> = {
  dark: {
    name: "Dark Operational GIS",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  positron: {
    name: "GIS Municipal Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    name: "Satellite & Terrain",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18,
  },
  osm: {
    name: "OpenStreetMap GIS",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

// Center of Dhaka City Grid
const DHAKA_METRO_CENTER: [number, number] = [23.7808, 90.3802];

// Map Event Coordinator component with useMap() access
function MapController({
  selectedCoords,
  onMapReady,
}: {
  selectedCoords: [number, number] | null;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 16, { duration: 0.9 });
    }
  }, [selectedCoords, map]);

  return null;
}

export default function CityMapCanvas({
  reports,
  selectedReportId,
  onSelectReport,
  onVerifyReport,
  initialStyle = "positron",
  className = "",
}: CityMapCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Map Controls State
  const [activeStyle, setActiveStyle] = useState<MapStyleKey>(initialStyle);
  const [enableClustering, setEnableClustering] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);

  // Active Layers State
  const [layers, setLayers] = useState({
    issues: true,
    hotspots: true,
    crews: true,
    roads: true,
    facilities: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) || null,
    [reports, selectedReportId]
  );

  const selectedCoords = useMemo<[number, number] | null>(() => {
    if (!selectedReport) return null;
    return [selectedReport.latitude, selectedReport.longitude];
  }, [selectedReport]);

  // Spatial Clustering of Reports
  const clusteredEntities = useMemo(() => {
    if (!enableClustering) {
      return reports.map((r) => ({
        id: r.id,
        isCluster: false as const,
        item: r,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    }
    return clusterGeospatialPoints(reports, 80);
  }, [reports, enableClustering]);

  // Marker Color System as specified:
  // Critical = red, High = orange, Medium = amber, Low = blue, Resolved = green
  const getMarkerColor = (priorityScore: number, status: string) => {
    if (status === "RESOLVED" || status === "CITIZEN_VERIFIED") {
      return { bg: "#059669", border: "#047857", text: "✓", name: "Resolved" }; // green
    }
    if (priorityScore >= 80) {
      return { bg: "#DC2626", border: "#991B1B", text: `P-${Math.round(priorityScore)}`, name: "Critical" }; // red
    }
    if (priorityScore >= 60) {
      return { bg: "#EA580C", border: "#C2410C", text: `P-${Math.round(priorityScore)}`, name: "High" }; // orange
    }
    if (priorityScore >= 40) {
      return { bg: "#D97706", border: "#B45309", text: `P-${Math.round(priorityScore)}`, name: "Medium" }; // amber
    }
    return { bg: "#2563EB", border: "#1D4ED8", text: `P-${Math.round(priorityScore)}`, name: "Low" }; // blue
  };

  // Create Swiss Municipal Pin
  const createIssueIcon = (report: MapReportPin, isSelected: boolean) => {
    const color = getMarkerColor(report.priorityScore, report.status);
    const isCritical = report.priorityScore >= 80 && report.status !== "RESOLVED";
    const size = isSelected ? 38 : 30;

    return L.divIcon({
      className: "streetwatch-issue-pin",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${size}px;
          height: ${size}px;
          background: ${color.bg};
          color: white;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-weight: 800;
          font-size: ${isSelected ? "11px" : "10px"};
          border-radius: 9999px;
          border: ${isSelected ? "3px solid #1D4ED8" : "2px solid #ffffff"};
          box-shadow: ${
            isSelected
              ? "0 0 0 4px rgba(29, 78, 216, 0.35), 0 8px 16px rgba(15, 23, 42, 0.4)"
              : "0 2px 6px rgba(15, 23, 42, 0.3)"
          };
          transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
          transition: transform 0.15s ease-out;
        ">
          ${color.text}
          ${
            isCritical
              ? `<span style="
                  position: absolute;
                  top: -3px;
                  right: -3px;
                  display: flex;
                  height: 10px;
                  width: 10px;
                ">
                  <span style="
                    position: absolute;
                    height: 100%;
                    width: 100%;
                    border-radius: 9999px;
                    background-color: #EF4444;
                    opacity: 0.75;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></span>
                  <span style="
                    position: relative;
                    height: 10px;
                    width: 10px;
                    border-radius: 9999px;
                    background-color: #DC2626;
                    border: 1.5px solid #ffffff;
                  "></span>
                </span>`
              : ""
          }
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2)],
    });
  };

  // Create Cluster Pin
  const createClusterIcon = (count: number, highestPriority: number) => {
    let clusterColor = "#2563EB";
    if (highestPriority >= 80) clusterColor = "#DC2626";
    else if (highestPriority >= 60) clusterColor = "#EA580C";
    else if (highestPriority >= 40) clusterColor = "#D97706";

    const size = count > 5 ? 42 : 36;

    return L.divIcon({
      className: "streetwatch-cluster-pin",
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${size}px;
          height: ${size}px;
          background: ${clusterColor};
          color: white;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-weight: 800;
          font-size: 12px;
          border-radius: 9999px;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
          cursor: pointer;
        ">
          ${count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Create Municipal Crew Pin
  const createCrewIcon = (crew: MunicipalCrewLocation) => {
    const isBusy = crew.status === "on_site";
    const bg = isBusy ? "#D97706" : "#2563EB";

    return L.divIcon({
      className: "streetwatch-crew-pin",
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #0F172A;
          border: 2px solid ${bg};
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
            <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/>
            <path d="M4 15v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Create Public Facility Pin
  const createFacilityIcon = (facility: { type: string }) => {
    return L.divIcon({
      className: "streetwatch-facility-pin",
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          background: #FFFFFF;
          border: 2px solid #334155;
          color: #0F172A;
          border-radius: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-size: 11px;
          font-weight: 800;
        ">
          ${facility.type === "hospital" ? "🏥" : facility.type === "fire_station" ? "🚒" : "🏛️"}
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  };

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 font-medium">
        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
        <span>Initializing Municipal GIS Operational Canvas...</span>
      </div>
    );
  }

  const currentStyleConfig = MAP_STYLES[activeStyle];

  return (
    <div className={`relative h-full w-full overflow-hidden select-none ${className}`}>
      {/* The Leaflet Map Canvas */}
      <MapContainer
        center={selectedCoords || DHAKA_METRO_CENTER}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          key={activeStyle}
          attribution={currentStyleConfig.attribution}
          url={currentStyleConfig.url}
          maxZoom={currentStyleConfig.maxZoom}
        />

        <MapController
          selectedCoords={selectedCoords}
          onMapReady={setMapInstance}
        />

        {/* LAYER 1: Arterial Road Corridors */}
        {layers.roads &&
          DHAKA_ROAD_CORRIDORS.map((road) => (
            <Polyline
              key={road.id}
              positions={road.coordinates}
              pathOptions={{
                color: "#1D4ED8",
                weight: 4,
                opacity: 0.55,
                dashArray: "6 8",
              }}
            >
              <Popup>
                <div className="p-2 text-xs font-sans">
                  <div className="font-bold text-slate-900">{road.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Dhaka Transit Arterial Corridor
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* LAYER 2: Hotspot Density Buffers */}
        {layers.hotspots &&
          DHAKA_HOTSPOT_ZONES.map((hotspot) => (
            <Circle
              key={hotspot.id}
              center={hotspot.center}
              radius={hotspot.radiusMeters}
              pathOptions={{
                color: hotspot.riskLevel === "CRITICAL" ? "#EF4444" : "#F59E0B",
                fillColor: hotspot.riskLevel === "CRITICAL" ? "#EF4444" : "#F59E0B",
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: "4 6",
              }}
            >
              <Popup>
                <div className="p-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-rose-600" />
                    <span>{hotspot.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Risk Level: <strong className="text-rose-700">{hotspot.riskLevel}</strong>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Density: {hotspot.incidentCount} active cluster reports ({hotspot.radiusMeters}m radius)
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* LAYER 3: Public Facilities */}
        {layers.facilities &&
          DHAKA_PUBLIC_FACILITIES.map((facility) => (
            <Marker
              key={facility.id}
              position={facility.coordinates}
              icon={createFacilityIcon(facility)}
            >
              <Popup>
                <div className="p-2 text-xs">
                  <div className="font-bold text-slate-900">{facility.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {facility.ward} &bull; {facility.type.replace("_", " ").toUpperCase()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* LAYER 4: Municipal Field Crews */}
        {layers.crews &&
          DHAKA_MUNICIPAL_CREWS.map((crew) => (
            <Marker
              key={crew.id}
              position={crew.coordinates}
              icon={createCrewIcon(crew)}
            >
              <Popup>
                <div className="p-2 text-xs max-w-[220px]">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <HardHat className="h-3.5 w-3.5 text-blue-600" />
                    <span>{crew.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{crew.department}</div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        crew.status === "on_site"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {crew.status.replace("_", " ")}
                    </span>
                    {crew.activeTask && (
                      <span className="text-slate-500 truncate max-w-[120px]">
                        {crew.activeTask}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* LAYER 5: Issues (Clustered or Single Markers) */}
        {layers.issues &&
          clusteredEntities.map((entity) => {
            if (entity.isCluster) {
              return (
                <Marker
                  key={entity.id}
                  position={[entity.latitude, entity.longitude]}
                  icon={createClusterIcon(entity.count, entity.highestPriority)}
                  eventHandlers={{
                    click: () => {
                      if (mapInstance) {
                        mapInstance.flyTo([entity.latitude, entity.longitude], mapInstance.getZoom() + 2, {
                          duration: 0.6,
                        });
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs max-w-[240px]">
                      <div className="font-bold text-slate-900 mb-1">
                        Spatial Cluster: {entity.count} Incidents
                      </div>
                      <div className="text-[11px] text-slate-600 mb-2">
                        Highest Risk Score: <strong>P-{Math.round(entity.highestPriority)}</strong>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {entity.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => onSelectReport?.(item.id)}
                            className="p-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] flex items-center justify-between"
                          >
                            <span className="truncate pr-1">{item.title}</span>
                            <span className="font-mono text-[10px] font-bold">
                              P-{Math.round(item.priorityScore)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            }

            const report = entity.item as MapReportPin;
            const isSelected = selectedReportId === report.id;

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createIssueIcon(report, isSelected)}
                eventHandlers={{
                  click: () => onSelectReport?.(report.id),
                }}
              />
            );
          })}
      </MapContainer>

      {/* FLOATING TOP-RIGHT TOOLBAR: Layer Control, Style Switcher, Zoom, Locate */}
      <div className="absolute top-4 right-4 z-[450] flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-lg p-1 shadow-md">
          {/* Layer Control Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowLayerMenu(!showLayerMenu);
                setShowStyleMenu(false);
              }}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showLayerMenu
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Toggle GIS Map Layers"
              aria-label="Layer control"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Layers</span>
            </button>

            {/* Layer Control Dropdown Popover */}
            {showLayerMenu && (
              <div className="absolute right-0 top-11 w-56 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-3 z-50 text-xs text-slate-800 space-y-2.5 animate-in fade-in-50 zoom-in-95">
                <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Operational Layers</span>
                  <button
                    type="button"
                    onClick={() => setShowLayerMenu(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    &times;
                  </button>
                </div>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    <span>Civic Incidents</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.issues}
                    onChange={(e) => setLayers((prev) => ({ ...prev, issues: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>Hazard Hotspots</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.hotspots}
                    onChange={(e) => setLayers((prev) => ({ ...prev, hotspots: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <HardHat className="h-3.5 w-3.5 text-blue-600" />
                    <span>Active Crews</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.crews}
                    onChange={(e) => setLayers((prev) => ({ ...prev, crews: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-blue-600" />
                    <span>Arterial Corridors</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.roads}
                    onChange={(e) => setLayers((prev) => ({ ...prev, roads: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-slate-600" />
                    <span>Public Facilities</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.facilities}
                    onChange={(e) => setLayers((prev) => ({ ...prev, facilities: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                </label>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Spatial Clustering:</span>
                  <button
                    type="button"
                    onClick={() => setEnableClustering(!enableClustering)}
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${
                      enableClustering
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {enableClustering ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Map Style Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowStyleMenu(!showStyleMenu);
                setShowLayerMenu(false);
              }}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showStyleMenu
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Select Base Map Cartography"
              aria-label="Map style control"
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Basemap</span>
            </button>

            {/* Map Style Dropdown Popover */}
            {showStyleMenu && (
              <div className="absolute right-0 top-11 w-52 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 p-2 z-50 text-xs text-slate-800 space-y-1 animate-in fade-in-50 zoom-in-95">
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((styleKey) => {
                  const cfg = MAP_STYLES[styleKey];
                  const isActive = activeStyle === styleKey;
                  return (
                    <button
                      key={styleKey}
                      type="button"
                      onClick={() => {
                        setActiveStyle(styleKey);
                        setShowStyleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "hover:bg-slate-100 text-slate-700 font-medium"
                      }`}
                    >
                      <span>{cfg.name}</span>
                      {isActive && <span className="text-blue-600 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="w-px h-5 bg-slate-200" />

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => mapInstance?.zoomIn()}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => mapInstance?.zoomOut()}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Reset / Center Dhaka */}
          <button
            type="button"
            onClick={() => {
              if (mapInstance) {
                mapInstance.flyTo(DHAKA_METRO_CENTER, 13, { duration: 0.8 });
              }
              onSelectReport?.(null);
            }}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Reset to City Grid Center"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FLOATING BOTTOM-LEFT GIS LEGEND */}
      <div className="absolute bottom-4 left-4 z-[450] pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-md p-2.5 text-xs text-slate-700 max-w-[270px]">
          <div className="flex items-center justify-between gap-3 font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <span>Municipal GIS Legend</span>
            </span>
            <button
              type="button"
              onClick={() => setLegendCollapsed(!legendCollapsed)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded text-[10px] uppercase font-mono"
            >
              {legendCollapsed ? "Expand" : "Hide"}
            </button>
          </div>

          {!legendCollapsed && (
            <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 border border-red-700" />
                  <span>Critical Priority (P-80+)</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Immediate</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-600 border border-orange-700" />
                  <span>High Priority (P-60-79)</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Within 24h</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-amber-600" />
                  <span>Medium (P-40-59)</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Within 48h</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 border border-blue-700" />
                  <span>Low Priority (&lt;40)</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Scheduled</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 border border-emerald-700" />
                  <span>Resolved & Closed</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">Verified</span>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <HardHat className="h-3 w-3 text-blue-600" />
                  <span>Crew</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>🏛️</span>
                  <span>HQ</span>
                </span>
                <span className="font-mono">Radius: 80m cluster</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELECTED ISSUE DETAIL DRAWER */}
      {selectedReport && (
        <MapDrawer
          report={selectedReport}
          nearbyCrews={DHAKA_MUNICIPAL_CREWS}
          onClose={() => onSelectReport?.(null)}
          onVerify={onVerifyReport}
        />
      )}
    </div>
  );
}
