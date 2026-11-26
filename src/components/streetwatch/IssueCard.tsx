"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, ThumbsUp, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import { StatusBadge } from "@/components/ui/Badge";
import IssuePriorityIndicator from "./IssuePriorityIndicator";
import SLAIndicator from "./SLAIndicator";
import { ReportItem, ReportStatus } from "@/types";

export interface IssueCardProps {
  report: ReportItem | {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    address: string;
    wardZone?: string;
    status: ReportStatus | string;
    severityScore?: number;
    priorityScore: number;
    verificationCount?: number;
    createdAt: string;
    category?: {
      name: string;
      slug: string;
    };
  };
  isSelected?: boolean;
  onSelect?: (reportId: string) => void;
  showThumbnail?: boolean;
  className?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  report,
  isSelected = false,
  onSelect,
  showThumbnail = true,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const categorySlug = report.category?.slug || "pothole";
  const categoryName = report.category?.name || "Civic Hazard";

  return (
    <motion.div
      className={`civic-card civic-interactive-card group bg-white rounded-lg border p-3.5 flex flex-col justify-between relative ${
        isSelected
          ? "border-blue-600 ring-2 ring-blue-100 shadow-md"
          : "border-slate-200/90 hover:border-blue-400"
      } ${className}`}
    >
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r"
        />
      )}
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <DynamicCategoryIcon slug={categorySlug} className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block leading-none">
                {categoryName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {report.wardZone || "City Zone"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <IssuePriorityIndicator score={report.priorityScore} size="sm" showLabel={false} />
            <StatusBadge status={report.status as ReportStatus} size="sm" />
          </div>
        </div>

        {/* Title and Thumbnail */}
        <div className="flex gap-3 mb-2.5">
          {showThumbnail && report.imageUrl && (
            <div className="h-16 w-16 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
              <img
                src={report.imageUrl}
                alt={report.title}
                className="w-full h-full object-cover civic-card-image"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
              {report.title}
            </h4>
            {report.description && (
              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                {report.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{report.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-500">
          <SLAIndicator createdAt={report.createdAt} isResolved={report.status === "RESOLVED" || report.status === "CITIZEN_VERIFIED"} />
          {(report.verificationCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">
              <ThumbsUp className="h-2.5 w-2.5" />
              <span>{report.verificationCount}</span>
            </span>
          )}
        </div>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(report.id)}
            className="civic-link-interactive inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            <span>Inspect</span>
            <ArrowRight className="h-3 w-3 civic-icon-shift" />
          </button>
        ) : (
          <Link
            href={`/reports/${report.id}`}
            className="civic-link-interactive inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            <span>View</span>
            <ArrowRight className="h-3 w-3 civic-icon-shift" />
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default IssueCard;
