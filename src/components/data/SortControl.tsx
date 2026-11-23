"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface SortOption {
  key: string;
  label: string;
}

export interface SortControlProps {
  options: SortOption[];
  currentKey: string;
  order: "asc" | "desc";
  onSortChange: (key: string, order: "asc" | "desc") => void;
  className?: string;
}

export const SortControl: React.FC<SortControlProps> = ({
  options,
  currentKey,
  order,
  onSortChange,
  className = "",
}) => {
  const toggleOrder = () => {
    onSortChange(currentKey, order === "asc" ? "desc" : "asc");
  };

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span className="text-slate-500 font-medium text-[11px] uppercase tracking-wider hidden sm:inline">
        Sort:
      </span>
      <select
        value={currentKey}
        onChange={(e) => onSortChange(e.target.value, order)}
        className="bg-white border border-slate-200 text-slate-700 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        aria-label="Sort by field"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={toggleOrder}
        className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        title={`Sort order: ${order === "asc" ? "Ascending" : "Descending"}. Click to invert.`}
        aria-label={`Toggle sort order, current: ${order}`}
      >
        {order === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
        )}
      </button>
    </div>
  );
};

export default SortControl;
