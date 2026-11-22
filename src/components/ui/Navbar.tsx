"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  MapPin,
  LayoutDashboard,
  PlusCircle,
  HardHat,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Role } from "@/types";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          setUser(json.data?.user || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "AUTHORITY":
        return {
          label: "Authority Admin",
          color: "bg-red-50 text-red-700 border-red-200",
        };
      case "FIELD_WORKER":
        return {
          label: "Field Worker",
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "CITIZEN":
      default:
        return {
          label: "Citizen",
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Role Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                StreetWatch
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Civic Action AI
              </span>
            </div>
          </Link>

          {user && (
            <div
              className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                getRoleBadge(user.role).color
              }`}
            >
              {getRoleBadge(user.role).label}
            </div>
          )}
        </div>

        {/* Center: Role-Aware Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              pathname === "/"
                ? "bg-slate-100 text-brand font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Public Map
          </Link>

          {user?.role === "CITIZEN" && (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  pathname === "/dashboard"
                    ? "bg-slate-100 text-brand font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/report"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  pathname === "/report"
                    ? "bg-slate-100 text-brand font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                Report Issue
              </Link>
            </>
          )}

          {user?.role === "AUTHORITY" && (
            <Link
              href="/authority"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                pathname.startsWith("/authority")
                  ? "bg-slate-100 text-brand font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Command Center
            </Link>
          )}

          {user?.role === "FIELD_WORKER" && (
            <Link
              href="/worker"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                pathname.startsWith("/worker")
                  ? "bg-slate-100 text-brand font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <HardHat className="h-4 w-4" />
              My Tasks
            </Link>
          )}
        </div>

        {/* Right: Auth Actions & Profile */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white/95 px-4 pt-2 pb-4 backdrop-blur-md md:hidden space-y-2">
          {user && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-800">
                {user.name}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  getRoleBadge(user.role).color
                }`}
              >
                {getRoleBadge(user.role).label}
              </span>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4" />
            Public Map
          </Link>

          {user?.role === "CITIZEN" && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PlusCircle className="h-4 w-4" />
                Report Issue
              </Link>
            </>
          )}

          {user?.role === "AUTHORITY" && (
            <Link
              href="/authority"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              Command Center
            </Link>
          )}

          {user?.role === "FIELD_WORKER" && (
            <Link
              href="/worker"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <HardHat className="h-4 w-4" />
              My Tasks
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg text-center border border-slate-200 py-2 text-sm font-semibold text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-brand py-2 text-center text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
