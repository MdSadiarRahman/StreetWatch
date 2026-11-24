"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

export interface IssueMarkerProps {
  priorityScore: number;
  categorySlug?: string;
  isDuplicate?: boolean;
  isResolved?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IssueMarker: React.FC<IssueMarkerProps> = ({
  priorityScore,
  categorySlug = "pothole",
  isDuplicate = false,
  isResolved = false,
  isSelected = false,
  onClick,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getMarkerColors = () => {
    if (isResolved) return "bg-emerald-600 text-white border-white shadow-emerald-500/50";
    if (priorityScore >= 80) return "bg-red-600 text-white border-white shadow-red-500/50";
    if (priorityScore >= 60) return "bg-amber-500 text-white border-white shadow-amber-500/50";
    return "bg-blue-600 text-white border-white shadow-blue-500/50";
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={
        shouldReduceMotion ? undefined : { scale: 1.08, transition: { duration: 0.12 } }
      }
      whileTap={
        shouldReduceMotion ? undefined : { scale: 0.94, transition: { duration: 0.08 } }
      }
      animate={{
        scale: isSelected ? 1.18 : 1,
      }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.16,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative inline-flex items-center justify-center h-8 w-8 rounded-full border-2 shadow-lg focus:outline-none transition-shadow ${getMarkerColors()} ${
        isSelected ? "ring-4 ring-blue-400 z-30" : "z-10"
      } ${isDuplicate ? "border-dashed" : ""} ${className}`}
      title={`Priority P-${Math.round(priorityScore)} ${isDuplicate ? "(Duplicate Cluster)" : ""}`}
      aria-label={`Incident marker, Priority ${Math.round(priorityScore)}`}
    >
      <div className="h-4 w-4 flex items-center justify-center pointer-events-none">
        <DynamicCategoryIcon slug={categorySlug} className="h-3.5 w-3.5 text-white" />
      </div>

      {priorityScore >= 80 && !isResolved && (
        <span aria-hidden="true" className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white" />
        </span>
      )}
    </motion.button>
  );
};

export default IssueMarker;
