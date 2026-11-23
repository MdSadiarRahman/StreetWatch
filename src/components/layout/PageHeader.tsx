import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  badge,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`border-b border-slate-200 pb-5 space-y-3 ${className}`}>
      {backHref && (
        <div>
          <Link
            href={backHref}
            className="btn-tactile inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
