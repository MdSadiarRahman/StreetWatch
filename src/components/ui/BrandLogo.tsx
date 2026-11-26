import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  href?: string;
  className?: string;
}

export function BrandLogoEmblem({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-label="StreetWatch Emblem"
    >
      <defs>
        {/* Outer Shield Gradient */}
        <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Road Perspective Gradient */}
        <linearGradient id="roadGrad" x1="24" y1="20" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Center Horizon AI Beacon */}
        <radialGradient id="beaconGlow" cx="24" cy="19" r="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
          <stop offset="60%" stopColor="#0284C7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
        </radialGradient>

        {/* Radar Arc Stroke Gradient */}
        <linearGradient id="radarArc" x1="12" y1="10" x2="36" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
        </linearGradient>

        {/* Top Gloss Edge */}
        <linearGradient id="topGloss" x1="24" y1="3" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1E3A8A" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Main Shield Body */}
      <path
        d="M24 3L8 9V21.5C8 32.5 14.8 42.4 24 45C33.2 42.4 40 32.5 40 21.5V9L24 3Z"
        fill="url(#shieldGrad)"
        filter="url(#logoShadow)"
      />

      {/* Gloss Reflection Overlay */}
      <path
        d="M24 4L9.5 9.5V21.5C9.5 28.5 12.8 35.2 18 39.5C18.5 28 22 15 24 4Z"
        fill="url(#topGloss)"
      />

      {/* Road Perspective Polygon */}
      <path
        d="M24 19L16 42.5C18.5 43.6 21.2 44.4 24 44.8C26.8 44.4 29.5 43.6 32 42.5L24 19Z"
        fill="url(#roadGrad)"
      />

      {/* Road Center Dashed Dividers (Civic Street Lane) */}
      <line x1="24" y1="23" x2="24" y2="26" stroke="#F8FAFC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="24" y1="28.5" x2="24" y2="33" stroke="#F8FAFC" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="24" y1="36" x2="24" y2="42" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />

      {/* Radar Scanning Ring 1 */}
      <path
        d="M14 16C17 13.5 20.3 12.2 24 12.2C27.7 12.2 31 13.5 34 16"
        stroke="url(#radarArc)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Radar Scanning Ring 2 */}
      <path
        d="M17.5 18C19.4 16.5 21.6 15.6 24 15.6C26.4 15.6 28.6 16.5 30.5 18"
        stroke="#7DD3FC"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Glowing AI Horizon Beacon */}
      <circle cx="24" cy="19" r="6" fill="url(#beaconGlow)" />
      <circle cx="24" cy="19" r="2.2" fill="#FFFFFF" />
      <circle cx="24" cy="19" r="1" fill="#38BDF8" />

      {/* Street Edge Yellow Hazard Warning Curb Accents */}
      <path d="M16 42.5L17.2 39L18 39L16.8 42.5" fill="#F59E0B" />
      <path d="M32 42.5L30.8 39L30 39L31.2 42.5" fill="#F59E0B" />
    </svg>
  );
}

export default function BrandLogo({
  size = "md",
  showText = true,
  showBadge = true,
  href = "/",
  className = "",
}: BrandLogoProps) {
  const pixelSizes = {
    sm: 30,
    md: 38,
    lg: 46,
    xl: 56,
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const badgeSizes = {
    sm: "text-[8px] px-1 py-0.2",
    md: "text-[9px] px-1.5 py-0.5",
    lg: "text-[10px] px-2 py-0.5",
    xl: "text-xs px-2.5 py-0.5",
  };

  const content = (
    <div className={`group flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative">
        <BrandLogoEmblem size={pixelSizes[size]} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${textSizes[size]} font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors`}>
              Street<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Watch</span>
            </span>

            {showBadge && (
              <span className={`hidden sm:inline-flex items-center rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 font-extrabold text-blue-700 border border-blue-200/80 uppercase shadow-2xs ${badgeSizes[size]}`}>
                AI 2.0
              </span>
            )}
          </div>

          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider sm:tracking-widest mt-0.5 truncate">
            Civic Auto-Triage &bull; Dhaka
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl p-0.5"
      >
        {content}
      </Link>
    );
  }

  return content;
}
