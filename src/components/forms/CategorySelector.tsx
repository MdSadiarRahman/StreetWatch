"use client";

import React from "react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";
import { Check } from "lucide-react";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  baseRiskWeight?: number;
  description?: string;
}

export interface CategorySelectorProps {
  categories: CategoryOption[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
  label?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  label = "Hazard Category Classification",
  className = "",
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div>
        <label className="block text-xs font-bold text-slate-800 tracking-tight">
          {label}
        </label>
        <p className="text-[11px] text-slate-500">
          Select municipal category for dispatch routing and base hazard weighting.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 text-blue-900 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <div
                  className={`h-7 w-7 rounded flex items-center justify-center ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <DynamicCategoryIcon slug={cat.slug} className="h-4 w-4" />
                </div>
                {isSelected && (
                  <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <span className="font-semibold text-xs block leading-tight">{cat.name}</span>
                {typeof cat.baseRiskWeight === "number" && (
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    Risk Factor: x{cat.baseRiskWeight.toFixed(1)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
