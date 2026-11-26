"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin,
  LayoutDashboard,
  ShieldAlert,
  HardHat,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { Role } from "@/types";

export interface TopNavigationProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  onLogout?: () => void;
  className?: string;
}

export function TopNavigation({
  user,
  onLogout,
  className = "",
}: TopNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "AUTHORITY":
        return { label: "Authority", color: "bg-red-50 text-red-800 border-red-300" };
      case "FIELD_WORKER":
        return { label: "Field Worker", color: "bg-amber-50 text-amber-800 border-amber-300" };
      case "CITIZEN":
      default:
        return { label: "Citizen", color: "bg-blue-50 text-civic border-blue-300" };
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition ${className}`}
      aria-label="Top navigation"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Telemetry Badge */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" href="/" />

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>Live City Grid</span>
          </div>

          {user && (
            <div
              className={`hidden sm:inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${
                getRoleBadge(user.role).color
              }`}
            >
              {getRoleBadge(user.role).label}
            </div>
          )}
        </div>

        {/* Center: Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              pathname === "/"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Public Map</span>
          </Link>

          {user?.role === "CITIZEN" && (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                pathname === "/dashboard"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>My Reports</span>
            </Link>
          )}

          {user?.role === "AUTHORITY" && (
            <Link
              href="/authority"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                pathname.startsWith("/authority")
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Authority Desk</span>
            </Link>
          )}

          {user?.role === "FIELD_WORKER" && (
            <Link
              href="/worker"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                pathname.startsWith("/worker")
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <HardHat className="h-3.5 w-3.5" />
              <span>Field Terminal</span>
            </Link>
          )}
        </div>

        {/* Right: Actions & User Info */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="text-xs font-bold text-slate-800 hover:text-civic transition px-2 py-1 rounded-md hover:bg-slate-100"
              >
                {user.name}
              </Link>
              <Link
                href="/settings"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
              >
                Settings
              </Link>
              <button
                onClick={onLogout}
                className="btn-tactile inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-tactile rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-tactile rounded-lg bg-civic hover:bg-civic-hover px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-civic"
            aria-label="Toggle mobile navigation"
          >
            {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileDrawerOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-3 shadow-lg">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4 text-civic" />
              <span>Public Map</span>
            </Link>
            <Link
              href="/report"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              <span>+ File Incident</span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-4 w-4 text-civic" />
              <span>My Reports</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
