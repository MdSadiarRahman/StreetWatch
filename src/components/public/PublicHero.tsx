"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  PlusCircle,
  ArrowRight,
  MapPin,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { MapReportPin } from "@/components/map/CityMapCanvas";

export interface PublicHeroProps {
  reports: MapReportPin[];
  loading?: boolean;
  onSelectIssue?: (reportId: string) => void;
}

export function PublicHero({ reports, loading = false, onSelectIssue }: PublicHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  const openCount = reports.filter(
    (r) => r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED"
  ).length;
  const resolvedCount = reports.filter(
    (r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED"
  ).length;

  // Map Dhaka metro lat/lng bounds to crisp spatial grid coordinates for the live hero preview
  // Bounds roughly Dhaka Metro: lat 23.72 - 23.83, lng 90.35 - 90.43
  const previewPins = reports.slice(0, 5).map((r) => {
    const normX = Math.min(86, Math.max(12, ((r.longitude - 90.35) / 0.08) * 74 + 12));
    const normY = Math.min(82, Math.max(18, (1 - (r.latitude - 23.72) / 0.10) * 64 + 18));
    const isResolved = r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED";
    const isCritical = r.priorityScore >= 80 && !isResolved;
    return {
      ...r,
      x: normX,
      y: normY,
      isResolved,
      isCritical,
    };
  });

  const featuredCluster = previewPins[0] || null;

  return (
    <section
      aria-label="StreetWatch Civic Platform Introduction"
      className="relative border-b border-[#E4E7EC] bg-white overflow-hidden"
    >
      {/* Subtle Civic Grid Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#E4E7EC_1px,transparent_1px),linear-gradient(to_bottom,#E4E7EC_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.35] dark:opacity-[0.45]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT COLUMN: Civic Storytelling & Clear Purpose */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-5"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E7EC] bg-[#F7F9FC] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              <Cpu className="h-3.5 w-3.5 text-[#7C5CFC]" />
              <span>CIVIC INTELLIGENCE PLATFORM</span>
            </div>

            {/* Clean Civic Swiss Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#101828] leading-[1.12]">
                See a problem.{" "}
                <span className="text-[#2563EB] block sm:inline">
                  Help your city fix it.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#667085] max-w-2xl leading-relaxed">
                StreetWatch helps citizens report public hazards, uses AI to organize and prioritize them, and gives municipal teams the tools to track issues from report to resolution.
              </p>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                href="/report"
                className="civic-btn-primary inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-5 py-3 min-h-[46px] text-sm font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              >
                <PlusCircle className="h-4 w-4 text-blue-100" />
                <span>Report an Issue</span>
              </Link>

              <Link
                href="#recent-reports"
                className="civic-btn-secondary inline-flex items-center justify-center gap-2 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F7F9FC] hover:border-blue-300 px-5 py-3 min-h-[46px] text-sm font-semibold text-[#101828] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              >
                <span>Explore City Reports</span>
                <ArrowRight className="civic-icon-shift h-4 w-4 text-[#667085]" />
              </Link>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#667085] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#12B76A]" />
                <span>Verified civic audit trail</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-[#7C5CFC]" />
                <span>Explainable AI severity triage</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#2563EB]" />
                <span>Real-time municipal dispatch</span>
              </span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Compact Live-City Spatial Preview */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-3 sm:p-4 shadow-sm space-y-3">
              {/* Top Telemetry Header */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12B76A]" />
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#101828] uppercase tracking-wider">
                    Dhaka Live City Grid
                  </span>
                </div>
                <Link
                  href="#live-map"
                  className="civic-link-interactive text-[11px] font-semibold text-[#2563EB] hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <span>Full Map</span>
                  <ArrowRight className="civic-icon-shift h-3 w-3" />
                </Link>
              </div>

              {/* Compact Spatial Coordinate Visualization */}
              <div className="relative h-60 sm:h-64 w-full rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                {/* Arterial Map Grid Roads (Subtle Vector Backdrop) */}
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full text-slate-200/80"
                  viewBox="0 0 400 260"
                  fill="none"
                >
                  <path d="M0 70 Q 150 55 400 85" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 155 Q 210 185 400 135" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M85 0 Q 110 130 95 260" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M235 0 Q 215 120 260 260" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M325 0 Q 345 140 310 260" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" />
                  <circle cx="200" cy="130" r="68" stroke="#E4E7EC" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {/* Live Issue Markers Plotted from Real API Coordinates */}
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[#667085] font-mono">
                    Syncing live Dhaka pins...
                  </div>
                ) : (
                  previewPins.map((pin) => {
                    const pinBg = pin.isResolved
                      ? "bg-[#12B76A] border-emerald-200"
                      : pin.isCritical
                      ? "bg-[#D92D20] border-red-200"
                      : "bg-[#F79009] border-amber-200";
                    return (
                      <button
                        key={pin.id}
                        type="button"
                        onClick={() => onSelectIssue?.(pin.id)}
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        title={`${pin.title} (${pin.wardZone})`}
                        aria-label={`Inspect ${pin.title} in ${pin.wardZone}`}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-full"
                      >
                        <span
                          className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-mono font-bold text-white shadow-sm transition-all duration-150 group-hover:scale-110 group-hover:ring-4 group-hover:ring-blue-500/25 ${pinBg}`}
                        >
                          {pin.isResolved ? "✓" : Math.round(pin.priorityScore)}
                        </span>
                      </button>
                    );
                  })
                )}

                {/* Representative Spatial Cluster Indicator */}
                {previewPins.length > 2 && (
                  <div
                    style={{ left: "34%", top: "36%" }}
                    aria-hidden="true"
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200 bg-blue-50/70 px-2 py-0.5 text-[10px] font-mono font-bold text-[#2563EB] shadow-xs"
                  >
                    Ward Cluster
                  </div>
                )}

                {/* Floating Compact Featured Issue Card (Selective 10% Glassmorphism) */}
                {featuredCluster && (
                  <button
                    type="button"
                    onClick={() => onSelectIssue?.(featuredCluster.id)}
                    className="civic-interactive-card absolute bottom-2.5 left-2.5 right-2.5 rounded-lg border border-[#E4E7EC] bg-white/95 backdrop-blur-md p-2.5 shadow-sm text-left flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            featuredCluster.isResolved
                              ? "bg-[#12B76A]"
                              : featuredCluster.isCritical
                              ? "bg-[#D92D20]"
                              : "bg-[#F79009]"
                          }`}
                        />
                        <span className="font-bold text-[#101828]">
                          P-{Math.round(featuredCluster.priorityScore)}
                        </span>
                        <span className="text-[#667085]">&bull; {featuredCluster.wardZone}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#101828] truncate mt-0.5">
                        {featuredCluster.title}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-[#F7F9FC] border border-[#E4E7EC] px-2 py-1 text-[10px] font-bold text-[#2563EB]">
                      Inspect
                    </span>
                  </button>
                )}
              </div>

              {/* Mini Status Footer inside Preview */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-white border border-[#E4E7EC] px-2 py-1.5">
                  <span className="font-mono font-bold text-[#101828] block">
                    {loading ? "—" : openCount}
                  </span>
                  <span className="text-[10px] text-[#667085]">Active Hazards</span>
                </div>
                <div className="rounded-lg bg-white border border-[#E4E7EC] px-2 py-1.5">
                  <span className="font-mono font-bold text-[#12B76A] flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{loading ? "—" : resolvedCount}</span>
                  </span>
                  <span className="text-[10px] text-[#667085]">Resolved</span>
                </div>
                <div className="rounded-lg bg-white border border-[#E4E7EC] px-2 py-1.5">
                  <span className="font-mono font-bold text-[#7C5CFC] flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>24</span>
                  </span>
                  <span className="text-[10px] text-[#667085]">City Wards</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default PublicHero;
