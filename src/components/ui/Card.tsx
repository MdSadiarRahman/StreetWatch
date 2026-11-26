"use client";

import React from "react";

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  hoverable?: boolean;
  padded?: boolean;
}

export function Card({
  children,
  hoverable = false,
  padded = true,
  className = "",
  ...props
}: CardProps) {
  const hoverClasses = hoverable ? "civic-interactive-card" : "";
  const paddingClasses = padded ? "p-5 sm:p-6" : "";

  return (
    <div
      className={`civic-card ${hoverClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`spatial-hud rounded-lg p-4 sm:p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  indicatorColor?: "rose" | "amber" | "emerald" | "blue" | "slate";
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  trend,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`civic-card civic-interactive-card p-5 space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && (
          <div className="civic-kpi-icon flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-slate-100 text-slate-700">
            {icon}
          </div>
        )}
      </div>

      <div className="font-mono text-3xl font-extrabold text-slate-900 tracking-tight">
        {value}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
        {subtext && <span>{subtext}</span>}
        {trend && (
          <span
            className={`font-bold ${
              trend.isPositive ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
