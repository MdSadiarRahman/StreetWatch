"use client";

import React from "react";
import { Filter, X } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  activeFilter,
  onFilterChange,
  onClear,
  label,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs ${className}`}
      role="group"
      aria-label={label || "Filter records"}
    >
      {label && (
        <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Filter className="h-3 w-3" />
          {label}:
        </span>
      )}

      {options.map((opt) => {
        const isActive = activeFilter === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onFilterChange(opt.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all text-xs shrink-0 border ${
              isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
            aria-pressed={isActive}
          >
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-600"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}

      {onClear && activeFilter !== "ALL" && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs px-2 py-1 rounded transition-colors ml-1 shrink-0"
          title="Reset filter"
        >
          <X className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;
