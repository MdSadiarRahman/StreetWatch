"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "pulse" | "shimmer" | "static";
}

/**
 * Base calm skeleton element for loading state indicators.
 * Respects prefers-reduced-motion via CSS media query fallback.
 */
export function Skeleton({
  className = "",
  variant = "shimmer",
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === "shimmer"
      ? "shimmer-wave"
      : variant === "pulse"
      ? "animate-pulse bg-slate-200"
      : "bg-slate-200";

  return (
    <div
      aria-hidden="true"
      className={`rounded-md ${variantClass} ${className}`}
      {...props}
    />
  );
}

/**
 * Pre-composed Skeleton for Issue Cards (Feed & Spatial Panels)
 */
export function IssueCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-label="Loading incident card"
      className={`civic-card bg-white rounded-lg border border-slate-200 p-3.5 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2 w-10" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-14 w-14 rounded-md shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

/**
 * Pre-composed Skeleton for Operational Data Table Rows
 */
export function TableRowSkeleton({
  cols = 6,
  className = "",
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <tr className={`border-b border-slate-100 ${className}`}>
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-4 py-3 align-middle">
          <Skeleton
            className={`h-3.5 ${
              idx === 0
                ? "w-16"
                : idx === 1
                ? "w-40"
                : idx === 2
                ? "w-28"
                : idx === 3
                ? "w-12"
                : idx === 4
                ? "w-20"
                : "w-16"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * Pre-composed Skeleton for Bento Metric KPI Cards
 */
export function MetricCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-label="Loading metric"
      className={`civic-card bg-white p-5 space-y-2 border border-slate-200 rounded-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
      <div className="space-y-1 pt-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-2.5 w-32" />
      </div>
    </div>
  );
}

/**
 * Pre-composed Skeleton for Issue Inspector Drawer Content
 */
export function DetailDrawerSkeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-label="Loading incident details" className={`p-4 space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>

      <Skeleton className="h-44 w-full rounded-lg" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}
