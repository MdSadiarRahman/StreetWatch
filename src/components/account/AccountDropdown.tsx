"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { UserAvatar, formatRoleLabel } from "@/components/account/UserAvatar";
import type { UserProfile } from "@/types";

export interface AccountDropdownProps {
  user: UserProfile;
  onLogout: () => Promise<void> | void;
  signingOut?: boolean;
  theme?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

export function AccountDropdown({
  user,
  onLogout,
  signingOut = false,
  theme = "light",
  compact = false,
  className = "",
}: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isDark = theme === "dark";
  const roleLabel = formatRoleLabel(user.role);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open account menu for ${user.name}`}
        className={`civic-btn-secondary flex items-center gap-2 rounded-xl border px-2.5 py-1.5 min-h-[40px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
          isDark
            ? "bg-[#0F172A] border-slate-700/90 text-slate-100 hover:bg-slate-800"
            : "bg-[#F7F9FC] border-[#E4E7EC] text-[#101828] hover:bg-white hover:border-blue-300"
        }`}
      >
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} role={user.role} size="xs" theme={theme} />
        {!compact && (
          <div className="hidden sm:block text-left leading-tight min-w-0 max-w-[130px]">
            <div className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-[#101828]"}`}>
              {user.name}
            </div>
            <div className={`text-[10px] font-medium truncate ${isDark ? "text-slate-400" : "text-[#667085]"}`}>
              {roleLabel}
            </div>
          </div>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          } ${isDark ? "text-slate-400" : "text-[#667085]"}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-float z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${
            isDark
              ? "bg-[#0F172A] border-slate-700 text-slate-100"
              : "bg-white border-[#E4E7EC] text-[#101828]"
          }`}
        >
          {/* User Identity Header */}
          <div
            className={`px-4 py-3 border-b flex items-center gap-2.5 ${
              isDark ? "border-slate-800 bg-[#0B1120]" : "border-[#E4E7EC] bg-[#F7F9FC]"
            }`}
          >
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} role={user.role} size="sm" theme={theme} />
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-[#101828]"}`}>
                {user.name}
              </div>
              <div className={`text-[11px] truncate ${isDark ? "text-slate-400" : "text-[#667085]"}`}>
                {roleLabel}
              </div>
            </div>
            {user.emailVerified && (
              <span
                title="Verified account email"
                className={`inline-flex items-center rounded-full p-1 ${
                  isDark ? "bg-emerald-950/70 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[40px] text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                isDark ? "text-slate-200 hover:bg-slate-800" : "text-[#344054] hover:bg-slate-100 hover:text-[#101828]"
              }`}
            >
              <UserIcon className={`h-4 w-4 shrink-0 ${isDark ? "text-blue-400" : "text-[#2563EB]"}`} />
              <span>Profile</span>
            </Link>

            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[40px] text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                isDark ? "text-slate-200 hover:bg-slate-800" : "text-[#344054] hover:bg-slate-100 hover:text-[#101828]"
              }`}
            >
              <Settings className={`h-4 w-4 shrink-0 ${isDark ? "text-slate-400" : "text-[#667085]"}`} />
              <span>Settings</span>
            </Link>

            <Link
              href="/#how-it-works"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[40px] text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                isDark ? "text-slate-200 hover:bg-slate-800" : "text-[#344054] hover:bg-slate-100 hover:text-[#101828]"
              }`}
            >
              <HelpCircle className={`h-4 w-4 shrink-0 ${isDark ? "text-slate-400" : "text-[#667085]"}`} />
              <span>Help</span>
            </Link>
          </div>

          {/* Sign Out Divider */}
          <div className={`p-1.5 border-t ${isDark ? "border-slate-800" : "border-[#E4E7EC]"}`}>
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={async () => {
                setOpen(false);
                await onLogout();
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[40px] text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 ${
                isDark
                  ? "text-rose-300 hover:bg-rose-950/60"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
