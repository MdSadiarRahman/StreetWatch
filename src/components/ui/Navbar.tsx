"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin,
  LayoutDashboard,
  PlusCircle,
  HardHat,
  LogOut,
  Menu,
  X,
  User,
  FileText,
  GitBranch,
  Radio,
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
    <nav
      aria-label="Primary Navigation"
      className="sticky top-0 z-50 h-16 w-full border-b border-[#E4E7EC] bg-white/95 backdrop-blur-md shadow-xs transition-all"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        {/* LEFT: StreetWatch Identity + Role Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo size="md" href="/" />

          {user && (
            <div
              className={`hidden xl:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${
                getRoleBadge(user.role).color
              }`}
            >
              {getRoleBadge(user.role).label}
            </div>
          )}
        </div>

        {/* CENTER: Civic Public Story Anchors + Role-Aware Operational Links */}
        <div className="hidden lg:flex items-center gap-1">
          <Link
            href="/#live-snapshot"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#344054] hover:text-[#101828] hover:bg-slate-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Radio className="h-3.5 w-3.5 text-emerald-600" />
            <span>Live City</span>
          </Link>

          <Link
            href="/#recent-reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#344054] hover:text-[#101828] hover:bg-slate-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Reports</span>
          </Link>

          <Link
            href="/#how-it-works"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#344054] hover:text-[#101828] hover:bg-slate-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <GitBranch className="h-3.5 w-3.5 text-slate-500" />
            <span>How It Works</span>
          </Link>

          {user?.role === "CITIZEN" && (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                pathname === "/dashboard"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-[#344054] hover:text-[#101828] hover:bg-slate-100/80"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>My Reports</span>
            </Link>
          )}

          {user?.role === "AUTHORITY" && (
            <Link
              href="/authority"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                pathname.startsWith("/authority")
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-[#344054] hover:text-[#101828] hover:bg-slate-100/80"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Command Center</span>
            </Link>
          )}

          {user?.role === "FIELD_WORKER" && (
            <Link
              href="/worker"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                pathname.startsWith("/worker")
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-[#344054] hover:text-[#101828] hover:bg-slate-100/80"
              }`}
            >
              <HardHat className="h-3.5 w-3.5" />
              <span>Worker Terminal</span>
            </Link>
          )}
        </div>

        {/* RIGHT: Public Map Link, Primary CTA ("Report an Issue"), Auth Actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/#live-map"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
              pathname === "/"
                ? "text-[#101828] hover:bg-slate-100"
                : "text-[#667085] hover:text-[#101828] hover:bg-slate-100"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Public Map</span>
          </Link>

          <Link
            href="/report"
            className="civic-btn-primary flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm border border-blue-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-100" />
            <span>Report an Issue</span>
          </Link>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200 ml-1" />
          ) : user ? (
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-[#E4E7EC]">
              <div className="flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-[#F7F9FC] px-2.5 py-1.5 text-xs text-[#101828]">
                <User className="h-3.5 w-3.5 text-[#667085]" />
                <span className="font-semibold max-w-[100px] truncate">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg border border-[#E4E7EC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#667085] transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title="Logout from session"
                aria-label="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-[#E4E7EC]">
              <Link
                href="/login"
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#344054] transition hover:bg-slate-100 hover:text-[#101828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-bold text-[#101828] shadow-xs transition hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE ACTION + HAMBURGER */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden shrink-0">
          <Link
            href="/report"
            className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-2.5 sm:px-3 py-2 min-h-[40px] text-[11px] sm:text-xs font-bold text-white shadow-sm whitespace-nowrap"
          >
            <PlusCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Report</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#344054] hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            aria-label={mobileMenuOpen ? "Close mobile navigation menu" : "Open mobile navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          role="region"
          aria-label="Mobile Navigation Drawer"
          className="border-b border-[#E4E7EC] bg-white/95 px-4 pt-3 pb-5 backdrop-blur-xl md:hidden space-y-3 shadow-float animate-in slide-in-from-top-2 duration-200"
        >
          {user && (
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#101828]">{user.name}</div>
                  <div className="text-[10px] text-[#667085]">{user.email}</div>
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
              href="/#live-map"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#344054] hover:bg-slate-100 transition"
            >
              <MapPin className="h-4 w-4 text-[#2563EB]" />
              Public Map
            </Link>

            <Link
              href="/#recent-reports"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#344054] hover:bg-slate-100 transition"
            >
              <FileText className="h-4 w-4 text-[#667085]" />
              Recent Reports
            </Link>

            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#344054] hover:bg-slate-100 transition"
            >
              <GitBranch className="h-4 w-4 text-[#667085]" />
              How StreetWatch Works
            </Link>

            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg bg-blue-50 px-3 py-2.5 min-h-[44px] text-xs font-bold text-[#2563EB] border border-blue-200/70"
            >
              <PlusCircle className="h-4 w-4 text-[#2563EB]" />
              <span>Report an Issue</span>
            </Link>

            {user?.role === "CITIZEN" && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#344054] hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-[#667085]" />
                My Reports
              </Link>
            )}

            {user?.role === "AUTHORITY" && (
              <Link
                href="/authority"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#344054] hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="h-4 w-4 text-amber-600" />
                Command Center
              </Link>
            )}

            {user?.role === "FIELD_WORKER" && (
              <Link
                href="/worker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#344054] hover:bg-slate-100 transition"
              >
                <HardHat className="h-4 w-4 text-emerald-600" />
                Worker Terminal
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg text-center border border-[#E4E7EC] py-2.5 min-h-[44px] flex items-center justify-center text-xs font-bold text-[#344054] hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-[#2563EB] py-2.5 min-h-[44px] flex items-center justify-center text-xs font-bold text-white shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
