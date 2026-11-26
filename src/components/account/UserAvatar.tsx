"use client";

import React from "react";
import type { Role } from "@/types";

export interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  role?: Role | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "SW";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function formatRoleLabel(role?: Role | string): string {
  switch (role) {
    case "AUTHORITY":
      return "Authority Officer";
    case "FIELD_WORKER":
      return "Field Worker";
    case "CITIZEN":
    default:
      return "Citizen";
  }
}

export function getRoleBadgeClasses(role?: Role | string, theme: "light" | "dark" = "light"): string {
  if (theme === "dark") {
    switch (role) {
      case "AUTHORITY":
        return "bg-rose-950/70 text-rose-300 border-rose-800/80";
      case "FIELD_WORKER":
        return "bg-amber-950/70 text-amber-300 border-amber-800/80";
      default:
        return "bg-blue-950/70 text-blue-300 border-blue-800/80";
    }
  }
  switch (role) {
    case "AUTHORITY":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "FIELD_WORKER":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
};

export function UserAvatar({
  name,
  avatarUrl,
  role = "CITIZEN",
  size = "sm",
  theme = "light",
  className = "",
}: UserAvatarProps) {
  const initials = getInitials(name);

  const fallbackColors =
    theme === "dark"
      ? role === "AUTHORITY"
        ? "bg-rose-950/80 border-rose-500/40 text-rose-200"
        : role === "FIELD_WORKER"
        ? "bg-amber-950/80 border-amber-500/40 text-amber-200"
        : "bg-blue-950/80 border-blue-500/40 text-blue-200"
      : role === "AUTHORITY"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : role === "FIELD_WORKER"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-200 text-blue-700";

  if (avatarUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden border shrink-0 ${
          theme === "dark" ? "border-slate-700 bg-slate-900" : "border-[#E4E7EC] bg-slate-100"
        } ${SIZE_CLASSES[size]} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name ? `${name} profile avatar` : "User profile avatar"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name ? `${name} avatar initials` : "User avatar"}
      className={`rounded-full border flex items-center justify-center font-mono font-bold shrink-0 select-none ${fallbackColors} ${SIZE_CLASSES[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
