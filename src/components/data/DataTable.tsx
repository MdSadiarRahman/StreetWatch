"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";

export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  sortKey,
  sortOrder,
  onSort,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no items matching your criteria in the system.",
  className = "",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="civic-card bg-white rounded-lg border border-slate-200 overflow-hidden p-8">
        <LoadingState message="Loading data records..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="civic-card bg-white rounded-lg border border-slate-200 overflow-hidden p-8">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`civic-card bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" role="table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 select-none ${col.headerClassName || ""}`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-slate-700 hover:text-blue-700 focus:outline-none"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortOrder === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-blue-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-slate-50/80 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 align-middle text-slate-700 ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
