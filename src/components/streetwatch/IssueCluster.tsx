"use client";

import React from "react";

export interface IssueClusterProps {
  count: number;
  highestPriority?: number;
  onClick?: () => void;
  className?: string;
}

export const IssueCluster: React.FC<IssueClusterProps> = ({
  count,
  highestPriority = 50,
  onClick,
  className = "",
}) => {
  const getClusterTheme = () => {
    if (highestPriority >= 80) return "bg-red-600 border-red-200 text-white shadow-red-500/40 ring-red-400";
    if (highestPriority >= 60) return "bg-amber-500 border-amber-200 text-white shadow-amber-500/40 ring-amber-300";
    return "bg-blue-600 border-blue-200 text-white shadow-blue-500/40 ring-blue-300";
  };

  const getSizeClasses = () => {
    if (count > 50) return "h-12 w-12 text-sm";
    if (count > 10) return "h-10 w-10 text-xs";
    return "h-8 w-8 text-xs";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full font-mono font-bold shadow-lg ring-4 ring-opacity-50 transition-transform duration-200 hover:scale-110 focus:outline-none ${getClusterTheme()} ${getSizeClasses()} ${className}`}
      aria-label={`Geospatial incident cluster of ${count} reports`}
    >
      <span>{count}</span>
      {highestPriority >= 80 && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
        </span>
      )}
    </button>
  );
};

export default IssueCluster;
