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
import BrandLogo from "@/components/ui/BrandLogo";
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
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-subtle transition-all">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Role Badge */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" href="/" />

          {/* Real-time Grid Status Pill */}
          <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live City Grid</span>
          </div>

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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              pathname === "/"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Public Map
          </Link>

          {user?.role === "CITIZEN" && (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  pathname === "/dashboard"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                My Reports
              </Link>
            </>
          )}

          {user?.role === "AUTHORITY" && (
            <Link
              href="/authority"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                pathname.startsWith("/authority")
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Command Center
            </Link>
          )}

          {user?.role === "FIELD_WORKER" && (
            <Link
              href="/worker"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                pathname.startsWith("/worker")
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <HardHat className="h-3.5 w-3.5" />
              Worker Terminal
            </Link>
          )}
        </div>

        {/* Right: Primary Action & Auth Profile */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Universal Quick "Report Issue" Action Pill */}
          <Link
            href="/report"
            className="btn-tactile flex items-center gap-2 rounded-lg bg-civic hover:bg-civic-hover px-4 py-2 text-xs font-bold text-white shadow-sm border border-blue-800/20"
          >
            <PlusCircle className="h-4 w-4 text-blue-100" />
            <span>Report Issue</span>
          </Link>

          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
          ) : user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-700">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold max-w-[110px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                title="Logout from session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            aria-label={mobileMenuOpen ? "Close mobile navigation menu" : "Open mobile navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          role="region"
          aria-label="Mobile Navigation Drawer"
          className="border-b border-slate-200/90 bg-white/95 px-4 pt-3 pb-5 backdrop-blur-xl md:hidden space-y-3 shadow-float animate-in slide-in-from-top-2 duration-200"
        >
          {user && (
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.email}</div>
                </div>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  getRoleBadge(user.role).color
                }`}
              >
                {getRoleBadge(user.role).label}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <MapPin className="h-4 w-4 text-blue-600" />
              Public City Map
            </Link>

            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-200/60"
            >
              <PlusCircle className="h-4 w-4 text-blue-600" />
              <span>Report New Civic Issue</span>
            </Link>

            {user?.role === "CITIZEN" && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-500" />
                Citizen Dashboard
              </Link>
            )}

            {user?.role === "AUTHORITY" && (
              <Link
                href="/authority"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-amber-600" />
                Authority Command Center
              </Link>
            )}

            {user?.role === "FIELD_WORKER" && (
              <Link
                href="/worker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <HardHat className="h-4 w-4 text-emerald-600" />
                Field Worker Terminal
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl text-center border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl bg-brand py-2 text-center text-xs font-bold text-white shadow-sm"
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
