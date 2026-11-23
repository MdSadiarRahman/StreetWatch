"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// SVG-styled high-contrast pin for coordinate placement
const pinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path fill="#1D4ED8" stroke="#FFFFFF" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
  <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
</svg>
`;

const customMarkerIcon = new L.DivIcon({
  className: "custom-location-pin",
  html: pinSvg,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LocationPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  initialLat,
  initialLng,
  onLocationSelect,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="h-[280px] w-full rounded-lg overflow-hidden border border-slate-300 shadow-2xs relative">
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customMarkerIcon} />
        <MapClickHandler onSelect={handleSelect} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[400] spatial-hud px-2.5 py-1 rounded text-[11px] font-bold text-slate-700 shadow-2xs pointer-events-none">
        Click anywhere on map to reposition GPS pin
      </div>
    </div>
  );
}
