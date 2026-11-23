import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * 1. Pothole / Road Crater Icon
 * Features: asphalt cross-section, depth layers, yellow hazard warning rim
 */
export function PotholeCategoryIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="potholeAsphalt" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="craterDepth" x1="16" y1="12" x2="16" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Road Segment */}
      <rect x="3" y="6" width="26" height="20" rx="4" fill="url(#potholeAsphalt)" />
      {/* Road Markings */}
      <rect x="5" y="15" width="4" height="2" rx="1" fill="#F8FAFC" opacity="0.6" />
      <rect x="23" y="15" width="4" height="2" rx="1" fill="#F8FAFC" opacity="0.6" />
      {/* Crater Hole */}
      <ellipse cx="16" cy="16" rx="8" ry="5.5" fill="url(#craterDepth)" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Fracture Cracks */}
      <path d="M10 13L7 11M22 13L25 10M12 19L9 22M21 19L24 22" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      {/* Danger Dot */}
      <circle cx="16" cy="16" r="2" fill="#EF4444" />
    </svg>
  );
}

/**
 * 2. Live Wire / High Voltage Hazard Icon
 * Features: severed power conduit, glowing electric arc, lightning bolt
 */
export function LiveWireCategoryIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="wireConduit" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <filter id="electricSparkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FBBF24" floodOpacity="0.8" />
        </filter>
      </defs>
      {/* Left Conduit Tube */}
      <path d="M4 18C4 18 8 16 11 16C13 16 14 18 14 18" stroke="url(#wireConduit)" strokeWidth="3.5" strokeLinecap="round" />
      {/* Right Conduit Tube */}
      <path d="M28 14C28 14 24 16 21 16C19 16 18 14 18 14" stroke="url(#wireConduit)" strokeWidth="3.5" strokeLinecap="round" />
      {/* Exposed Copper Strands */}
      <line x1="14" y1="17.5" x2="16.5" y2="16" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="14.5" x2="15.5" y2="16" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
      {/* Central Electric Lightning Arc */}
      <polygon
        points="17,7 11,18 16,18 15,25 21,14 16,14"
        fill="#FBBF24"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        filter="url(#electricSparkGlow)"
      />
    </svg>
  );
}

/**
 * 3. Open Manhole / Missing Drain Cover Icon
 * Features: subterranean circular void, warning barrier grating
 */
export function ManholeCategoryIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="manholeRim" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      {/* Cast Iron Outer Flange */}
      <circle cx="16" cy="16" r="13" fill="url(#manholeRim)" stroke="#0F172A" strokeWidth="1.5" />
      {/* Deep Dark Well */}
      <circle cx="16" cy="16" r="9.5" fill="#020617" />
      {/* Warning Chevron Rim */}
      <path d="M16 8L16 11M24 16L21 16M16 24L16 21M8 16L11 16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      {/* Stepping Ladder Inside Void */}
      <line x1="13" y1="13" x2="19" y2="13" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="16" x2="19" y2="16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="19" x2="19" y2="19" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* Hazard Exclamation Flag */}
      <circle cx="16" cy="16" r="1.5" fill="#EF4444" />
    </svg>
  );
}

/**
 * 4. Waterlogging & Flooded Drainage Icon
 * Features: storm waves, rising water level, rain drops
 */
export function WaterloggingCategoryIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="waterFlow" x1="4" y1="14" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      {/* Rain Drops */}
      <path d="M10 6L9 9M16 4L15 7M22 6L21 9" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
      {/* Surface Ripples */}
      <path
        d="M5 15C8 13.5 11 13.5 14 15C17 16.5 20 16.5 23 15C25 14 26.5 14 27 15"
        stroke="#7DD3FC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Deep Body of Water */}
      <path
        d="M5 19C8 17.5 11 17.5 14 19C17 20.5 20 20.5 23 19C25.5 17.8 26.5 18.2 27 19V25C27 26.1 26.1 27 25 27H7C5.9 27 5 26.1 5 25V19Z"
        fill="url(#waterFlow)"
      />
      {/* Drain Grate Bars Submerged */}
      <line x1="10" y1="23" x2="22" y2="23" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/**
 * 5. Broken Streetlight / Outage Icon
 * Features: luminaire pole, darkness rays, spark
 */
export function StreetlightCategoryIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="lampPole" x1="8" y1="6" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      {/* Pole Curve */}
      <path d="M10 27V12C10 8 13 5 18 5H21" stroke="url(#lampPole)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Lamp Head */}
      <path d="M19 5L24 7V10L18 8L19 5Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
      {/* Broken Glow Sparks */}
      <path d="M21 12L21 14M24 11L26 13M18 11L16 13" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="21,15 19,19 22,19 20,23 23,17 21,17" fill="#FBBF24" />
      {/* Ground Base */}
      <rect x="7" y="27" width="6" height="2" rx="1" fill="#475569" />
    </svg>
  );
}

/**
 * 6. Garbage & Sanitation Overflow Icon
 * Features: waste receptacle, overflow warning, recyclable arrows
 */
export function GarbageCategoryIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="binBody" x1="8" y1="12" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      {/* Open Bin Lid */}
      <path d="M7 11L25 8" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="14" y="6" width="4" height="2" rx="1" fill="#334155" />
      {/* Overflow Spilling Out */}
      <circle cx="12" cy="8" r="2.5" fill="#F59E0B" />
      <rect x="18" y="7" width="4" height="3" rx="1" fill="#EF4444" transform="rotate(-15 18 7)" />
      {/* Bin Body */}
      <path d="M9 13L11 27H21L23 13H9Z" fill="url(#binBody)" stroke="#065F46" strokeWidth="1.2" />
      {/* Vertical Flutes */}
      <line x1="13" y1="16" x2="13.5" y2="24" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="16" y1="16" x2="16" y2="24" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="19" y1="16" x2="18.5" y2="24" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/**
 * Helper to dynamically render category icon by slug or name
 */
export interface DynamicCategoryIconProps {
  nameOrSlug?: string;
  slug?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function DynamicCategoryIcon({
  nameOrSlug,
  slug,
  name,
  size = 24,
  className = "",
}: DynamicCategoryIconProps) {
  const normalized = (nameOrSlug || slug || name || "").toLowerCase();

  if (normalized.includes("pothole") || normalized.includes("road") || normalized.includes("crater")) {
    return <PotholeCategoryIcon size={size} className={className} />;
  }
  if (normalized.includes("wire") || normalized.includes("electric") || normalized.includes("power")) {
    return <LiveWireCategoryIcon size={size} className={className} />;
  }
  if (normalized.includes("manhole") || normalized.includes("drain cover") || normalized.includes("sewer")) {
    return <ManholeCategoryIcon size={size} className={className} />;
  }
  if (normalized.includes("water") || normalized.includes("drain") || normalized.includes("flood")) {
    return <WaterloggingCategoryIcon size={size} className={className} />;
  }
  if (normalized.includes("light") || normalized.includes("streetlamp") || normalized.includes("lamp")) {
    return <StreetlightCategoryIcon size={size} className={className} />;
  }
  if (normalized.includes("garbage") || normalized.includes("waste") || normalized.includes("trash")) {
    return <GarbageCategoryIcon size={size} className={className} />;
  }

  // Fallback generic hazard icon
  return <PotholeCategoryIcon size={size} className={className} />;
}
