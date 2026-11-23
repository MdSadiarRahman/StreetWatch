"use client";

import React, { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "line" | "pills";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "line",
  className = "",
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Content Tabs"
      className={`flex items-center gap-1 ${
        variant === "line"
          ? "border-b border-slate-200"
          : "p-1 bg-slate-100 rounded-lg"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === "pills") {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                isActive
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.icon && <span className="h-3.5 w-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="rounded bg-slate-100 text-slate-600 px-1 py-0.2 text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition -mb-[1px] ${
              isActive
                ? "border-civic text-civic"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {tab.icon && <span className="h-3.5 w-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                  isActive ? "bg-blue-50 text-civic" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
