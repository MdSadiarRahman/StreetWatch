"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(totalItems, currentPage * pageSize) : currentPage * pageSize;

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 py-3 ${className}`}
      aria-label="Pagination Navigation"
    >
      {typeof totalItems === "number" ? (
        <span className="text-[11px] text-slate-500 font-mono">
          Showing <strong className="text-slate-800">{startItem}</strong>-
          <strong className="text-slate-800">{endItem}</strong> of{" "}
          <strong className="text-slate-800">{totalItems}</strong> records
        </span>
      ) : (
        <span className="text-[11px] text-slate-500 font-mono">
          Page {currentPage} of {totalPages}
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            );
          })
          .map((page, idx, array) => {
            const prev = array[idx - 1];
            const hasGap = prev && page - prev > 1;

            return (
              <React.Fragment key={page}>
                {hasGap && <span className="px-1 text-slate-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`h-7 w-7 rounded font-mono text-xs font-semibold transition-colors ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
