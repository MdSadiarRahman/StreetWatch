"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export interface ThemeToggleProps {
  surface?: "light" | "dark" | "auto";
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({
  surface = "auto",
  showLabel = false,
  compact = false,
  className = "",
}: ThemeToggleProps) {
  const { resolvedTheme, mounted, toggleTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const labelText = mounted ? (isDark ? "Light" : "Dark") : "Theme";
  const ariaLabel = mounted
    ? isDark
      ? "Switch to Light Mode"
      : "Switch to Dark Mode"
    : "Toggle color theme";

  const surfaceClasses =
    surface === "dark"
      ? "border-slate-700/80 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:border-slate-600 shadow-xs"
      : surface === "light"
      ? "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] hover:border-slate-400 shadow-2xs"
      : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 shadow-2xs";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      aria-pressed={mounted ? isDark : undefined}
      title={ariaLabel}
      data-testid="theme-toggle-btn"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-all duration-200 ease-out hover:-translate-y-[1px] hover:scale-[1.01] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-500/40 shrink-0 ${
        compact ? "min-h-[40px] min-w-[40px] px-2.5 text-xs" : "min-h-[40px] px-3 py-1.5 text-xs"
      } ${surfaceClasses} ${className}`}
    >
      <Moon className="w-4 h-4 text-slate-600 dark:hidden shrink-0" aria-hidden="true" />
      <Sun className="w-4 h-4 text-amber-400 hidden dark:block shrink-0" aria-hidden="true" />
      {showLabel && (
        <span className="whitespace-nowrap">{labelText}</span>
      )}
    </button>
  );
}

export default ThemeToggle;
