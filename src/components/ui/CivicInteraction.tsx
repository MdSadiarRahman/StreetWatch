"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button, IconButton, ButtonProps, IconButtonProps } from "./Button";
import { Badge, BadgeProps } from "./Badge";
import { Tooltip, TooltipProps } from "./Tooltip";

/**
 * StreetWatch Civic Interaction System — Global Design Tokens
 * Tactile, restrained, physical elevation & semantic civic glow tokens.
 */
export const INTERACTION_TOKENS = {
  liftPx: -3,
  liftSubtlePx: -1.5,
  hoverScale: 1.01,
  pressScale: 0.985,
  durationMs: 200,
  cardDurationMs: 240,
  easeBezier: [0.16, 1, 0.3, 1] as const,
  glows: {
    civic: "0 10px 28px -6px rgba(15, 23, 42, 0.10), 0 8px 30px rgba(37, 99, 235, 0.12)",
    ai: "0 10px 26px -6px rgba(15, 23, 42, 0.12), 0 8px 28px rgba(124, 92, 252, 0.14)",
    success: "0 10px 24px -6px rgba(15, 23, 42, 0.10), 0 8px 24px rgba(18, 183, 106, 0.12)",
    warning: "0 10px 24px -6px rgba(15, 23, 42, 0.10), 0 8px 24px rgba(247, 144, 9, 0.12)",
    critical: "0 10px 24px -6px rgba(15, 23, 42, 0.10), 0 8px 24px rgba(217, 45, 32, 0.14)",
  },
};

export interface CivicButtonProps extends Omit<ButtonProps, "variant"> {
  hierarchy?: "primary" | "secondary" | "tertiary" | "success" | "danger" | "warning" | "glass";
}

/**
 * Primary, Secondary, and Tertiary interactive civic buttons implementing
 * consistent hover lift, soft glow hierarchy, active press (0.985), and disabled guard.
 */
export function CivicButton({
  hierarchy = "primary",
  className = "",
  ...props
}: CivicButtonProps) {
  const mappedVariant: ButtonProps["variant"] =
    hierarchy === "tertiary" ? "ghost" : hierarchy === "secondary" ? "outline" : hierarchy;

  const tierClass =
    hierarchy === "primary"
      ? "civic-btn-primary"
      : hierarchy === "tertiary"
      ? "civic-btn-tertiary"
      : "civic-btn-secondary";

  return <Button variant={mappedVariant} className={`${tierClass} ${className}`} {...props} />;
}

export function CivicIconButton(props: IconButtonProps) {
  return <IconButton {...props} />;
}

export type CivicGlowTone = "civic" | "ai" | "success" | "warning" | "critical" | "neutral";

export interface CivicInteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CivicGlowTone;
  selected?: boolean;
  darkSurface?: boolean;
  padded?: boolean;
}

/**
 * Core StreetWatch interactive surface implementing subtle physical elevation,
 * 1.01 scale, brighter civic border, and soft semantic perimeter glow.
 */
export function CivicInteractiveCard({
  children,
  tone = "civic",
  selected = false,
  darkSurface = false,
  padded = false,
  className = "",
  ...props
}: CivicInteractiveCardProps) {
  const toneClasses: Record<CivicGlowTone, string> = {
    civic: darkSurface
      ? "civic-interactive-card-dark"
      : "civic-interactive-card",
    ai: "civic-interactive-ai",
    success:
      "civic-interactive-card hover:border-emerald-400/70 hover:shadow-civic-success",
    warning:
      "civic-interactive-card hover:border-amber-400/70 hover:shadow-civic-warning",
    critical:
      "civic-interactive-card hover:border-rose-400/70 hover:shadow-civic-critical",
    neutral:
      "civic-interactive-card hover:border-slate-300",
  };

  const selectedClasses = selected
    ? darkSurface
      ? "border-blue-500 ring-2 ring-blue-500/25 shadow-civic-hover"
      : "border-[#2563EB] ring-2 ring-blue-500/20 shadow-civic-hover"
    : "";

  return (
    <div
      className={`${
        darkSurface ? "rounded-xl border border-slate-800 bg-[#0F172A]" : "rounded-2xl border border-[#E4E7EC] bg-white shadow-xs"
      } ${padded ? "p-4 sm:p-5" : ""} ${toneClasses[tone]} ${selectedClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export const CivicCard = CivicInteractiveCard;

export function CivicBadge({ className = "", ...props }: BadgeProps) {
  return <Badge className={`civic-badge-interactive ${className}`} {...props} />;
}

export function CivicTooltip(props: TooltipProps) {
  return <Tooltip {...props} />;
}

export interface CivicHoverPreviewProps {
  children: React.ReactNode;
  category: string;
  status: string;
  location: string;
  priorityLabel: string;
  onInspect?: () => void;
  className?: string;
}

/**
 * Lightweight contextual preview popover on desktop hover / focus-visible.
 * Automatically disabled on coarse/touch screens where cards are directly actionable.
 */
export function CivicHoverPreview({
  children,
  category,
  status,
  location,
  priorityLabel,
  onInspect,
  className = "",
}: CivicHoverPreviewProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleOpen = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), 220);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClose();
      }}
    >
      {children}

      {open && (
        <div
          role="region"
          aria-label="Quick issue preview"
          className="hidden lg:block absolute left-3 right-3 -top-2 -translate-y-full z-40 rounded-xl border border-[#E4E7EC] bg-white/95 backdrop-blur-md p-3 shadow-float pointer-events-none transition-opacity duration-150"
        >
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
            <span className="font-bold uppercase text-[#2563EB] truncate">{category}</span>
            <span className="font-bold text-[#101828] shrink-0">{priorityLabel}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#344054]">
            <span className="truncate font-medium">{location}</span>
            <span className="shrink-0 font-mono text-[10px] text-[#667085]">{status}</span>
          </div>
          {onInspect && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-end gap-1 text-[11px] font-bold text-[#2563EB]">
              <span>View Details</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
