"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  LayoutDashboard,
  ShieldAlert,
  HardHat,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  roles?: Role[];
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    label: "Public Map & Feed",
    href: "/",
    icon: MapPin,
  },
  {
    label: "My Citizen Reports",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["CITIZEN", "AUTHORITY"],
  },
  {
    label: "File Incident Report",
    href: "/report",
    icon: PlusCircle,
    roles: ["CITIZEN", "AUTHORITY"],
  },
  {
    label: "Municipal Authority Desk",
    href: "/authority",
    icon: ShieldAlert,
    roles: ["AUTHORITY"],
  },
  {
    label: "Field Worker Terminal",
    href: "/worker",
    icon: HardHat,
    roles: ["FIELD_WORKER"],
  },
];

export interface SidebarProps {
  userRole?: Role;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  userRole = "CITIZEN",
  collapsed = false,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = SIDEBAR_NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      } ${className}`}
      aria-label="Sidebar navigation"
    >
      <div className="flex-1 py-4 px-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className="rounded bg-blue-100 text-civic px-1.5 py-0.5 text-[10px] font-mono font-extrabold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer: System Status */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Dhaka Telemetry
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-700 font-bold">24 Municipal Wards</p>
            <span className="text-[10px] text-slate-400 block font-mono">Status: Nominal / Active</span>
          </div>
        </div>
      )}
    </aside>
  );
}
