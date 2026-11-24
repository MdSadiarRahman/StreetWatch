"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  LayoutDashboard,
  PlusCircle,
  ShieldAlert,
  HardHat,
} from "lucide-react";
import { Role } from "@/types";

export interface MobileNavigationProps {
  userRole?: Role;
  className?: string;
}

export function MobileNavigation({
  userRole = "CITIZEN",
  className = "",
}: MobileNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 md:hidden shadow-overlay ${className}`}
      aria-label="Mobile Bottom Navigation"
    >
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          pathname === "/" ? "text-civic font-extrabold" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <MapPin className="h-4 w-4" />
        <span>Map</span>
      </Link>

      <Link
        href="/report"
        aria-current={pathname === "/report" ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          pathname === "/report" ? "text-civic font-extrabold" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <PlusCircle className="h-4 w-4" />
        <span>Report</span>
      </Link>

      <Link
        href="/dashboard"
        aria-current={pathname === "/dashboard" ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          pathname === "/dashboard" ? "text-civic font-extrabold" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <LayoutDashboard className="h-4 w-4" />
        <span>Track</span>
      </Link>

      {userRole === "AUTHORITY" && (
        <Link
          href="/authority"
          aria-current={pathname.startsWith("/authority") ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            pathname.startsWith("/authority") ? "text-civic font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Authority</span>
        </Link>
      )}

      {userRole === "FIELD_WORKER" && (
        <Link
          href="/worker"
          aria-current={pathname.startsWith("/worker") ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            pathname.startsWith("/worker") ? "text-civic font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <HardHat className="h-4 w-4" />
          <span>Terminal</span>
        </Link>
      )}
    </nav>
  );
}
