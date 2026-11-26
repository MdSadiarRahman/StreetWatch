"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  ExternalLink,
  HardHat,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Sliders,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { UserAvatar, formatRoleLabel, getRoleBadgeClasses } from "@/components/account/UserAvatar";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { DHAKA_WARDS } from "@/lib/auth/password-policy";
import type { UserProfile } from "@/types";

type SettingsSection = "account" | "security" | "notifications" | "preferences" | "sessions";

function formatLastChanged(isoDate?: string | null): string {
  if (!isoDate) return "Initial account password (update recommended)";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (diffDays <= 0) return `Today (${formatted})`;
  if (diffDays === 1) return `1 day ago (${formatted})`;
  return `${diffDays} days ago (${formatted})`;
}

export function SettingsWorkspace({ initialTab = "account" }: { initialTab?: string }) {
  const { user, loading, signingOut, setUserState, logout } = useAuth();
  const validTab = ["account", "security", "notifications", "preferences", "sessions"].includes(
    initialTab
  )
    ? (initialTab as SettingsSection)
    : "account";
  const [activeTab, setActiveTab] = useState<SettingsSection>(validTab);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Notification & preference states hydrated strictly from persisted user
  const [notifyStatusUpdates, setNotifyStatusUpdates] = useState(true);
  const [notifyAssignments, setNotifyAssignments] = useState(true);
  const [notifyResolutions, setNotifyResolutions] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [prefCompactTables, setPrefCompactTables] = useState(false);
  const [prefDefaultWard, setPrefDefaultWard] = useState("");

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setNotifyStatusUpdates(user.notifyStatusUpdates ?? true);
      setNotifyAssignments(user.notifyAssignments ?? true);
      setNotifyResolutions(user.notifyResolutions ?? true);
      setNotifySystem(user.notifySystem ?? true);
      setPrefCompactTables(user.prefCompactTables ?? false);
      setPrefDefaultWard(user.prefDefaultWard || "");
    }
  }, [user]);

  const handleSavePreferences = async (overrides?: Partial<UserProfile>) => {
    setPrefFeedback(null);
    setSavingPrefs(true);

    const payload: Record<string, unknown> = {
      notifyStatusUpdates: overrides?.notifyStatusUpdates ?? notifyStatusUpdates,
      notifyResolutions: overrides?.notifyResolutions ?? notifyResolutions,
      notifySystem: overrides?.notifySystem ?? notifySystem,
      prefCompactTables: overrides?.prefCompactTables ?? prefCompactTables,
      prefDefaultWard:
        (overrides?.prefDefaultWard !== undefined ? overrides.prefDefaultWard : prefDefaultWard) || null,
    };

    if (user?.role === "AUTHORITY" || user?.role === "FIELD_WORKER") {
      payload.notifyAssignments = overrides?.notifyAssignments ?? notifyAssignments;
    }

    try {
      const res = await fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setPrefFeedback({
          type: "error",
          text: json.error?.message || "Unable to save preferences right now.",
        });
        setSavingPrefs(false);
        return;
      }

      if (json.data?.user) {
        setUserState(json.data.user as UserProfile);
      }
      setPrefFeedback({ type: "success", text: "Preferences saved successfully." });
    } catch {
      setPrefFeedback({
        type: "error",
        text: "Unable to save preferences right now. Please try again.",
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleRequestVerification = async () => {
    setVerifyFeedback(null);
    setSendingVerify(true);
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setVerifyFeedback({
          type: "error",
          text: json.error?.message || "Unable to send verification link.",
        });
      } else {
        setVerifyFeedback({
          type: "success",
          text: json.message || "Verification link sent to your registered email address.",
        });
      }
    } catch {
      setVerifyFeedback({
        type: "error",
        text: "Network error while sending verification email.",
      });
    } finally {
      setSendingVerify(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-6">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 h-64 animate-pulse rounded-2xl bg-white border border-[#E4E7EC]" />
          <div className="lg:col-span-9 h-80 animate-pulse rounded-2xl bg-white border border-[#E4E7EC]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="civic-card p-8 space-y-4">
          <Shield className="h-10 w-10 text-[#2563EB] mx-auto" />
          <h1 className="text-xl font-bold text-[#101828]">Sign in required</h1>
          <p className="text-sm text-[#667085]">
            Sign in to access your StreetWatch account, security, and session settings.
          </p>
          <Link
            href="/login?callbackUrl=/settings"
            className="civic-btn-primary inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white"
          >
            Sign In to StreetWatch
          </Link>
        </div>
      </div>
    );
  }

  const portalHomeHref =
    user.role === "AUTHORITY" ? "/authority" : user.role === "FIELD_WORKER" ? "/worker" : "/dashboard";
  const portalHomeLabel =
    user.role === "AUTHORITY"
      ? "Command Center"
      : user.role === "FIELD_WORKER"
      ? "Worker Terminal"
      : "My Reports";

  const navItems: { id: SettingsSection; label: string; icon: React.ElementType; summary: string }[] = [
    { id: "account", label: "Account", icon: UserIcon, summary: "Profile & email" },
    { id: "security", label: "Security", icon: Lock, summary: "Password & verification" },
    { id: "notifications", label: "Notifications", icon: Bell, summary: "Status & dispatch alerts" },
    { id: "preferences", label: "Preferences", icon: Sliders, summary: "Ward & role workspace" },
    { id: "sessions", label: "Sessions", icon: KeyRound, summary: "Active session & sign out" },
  ];

  const roleSectionTitle =
    user.role === "AUTHORITY"
      ? "Authority Account Information"
      : user.role === "FIELD_WORKER"
      ? "Worker Account Information"
      : "Citizen Account Overview";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F9FC] pb-24 sm:pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E4E7EC] pb-4">
          <div className="space-y-1">
            <Link
              href={portalHomeHref}
              className="civic-link-interactive inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828]"
            >
              <ArrowLeft className="h-3.5 w-3.5 civic-icon-shift" />
              <span>Back to {portalHomeLabel}</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#101828]">Settings</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(
                  user.role
                )}`}
              >
                {formatRoleLabel(user.role)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#667085]">
              Manage your StreetWatch account, password security, notification preferences, and active session.
            </p>
          </div>

          <Link
            href="/profile"
            className="civic-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-white hover:bg-slate-50 px-3.5 py-2 min-h-[40px] text-xs font-bold text-[#101828] self-start sm:self-auto"
          >
            <UserIcon className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Open Profile</span>
          </Link>
        </div>

        {/* Two-Column Desktop / Responsive Single-Column Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail Navigation (Scrollable tabs on mobile, sticky rail on desktop) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-20">
            <nav
              role="tablist"
              aria-label="Settings sections"
              className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none rounded-2xl border border-[#E4E7EC] bg-white p-2 shadow-xs"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveTab(item.id);
                      setPrefFeedback(null);
                    }}
                    className={`civic-btn-tertiary shrink-0 lg:w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 min-h-[44px] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "text-[#344054] hover:bg-[#F7F9FC] hover:text-[#101828]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#667085]"}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold whitespace-nowrap">{item.label}</div>
                      <div
                        className={`hidden lg:block text-[10px] truncate ${
                          isActive ? "text-blue-100" : "text-[#667085]"
                        }`}
                      >
                        {item.summary}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Settings Content Panels */}
          <div className="lg:col-span-9 space-y-5 min-w-0">
            {/* 1. ACCOUNT SECTION */}
            {activeTab === "account" && (
              <div className="space-y-4">
                <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                        Account
                      </span>
                      <h2 className="text-base font-bold text-[#101828] mt-0.5">Personal Profile</h2>
                      <p className="text-xs text-[#667085]">
                        Manage your display name, avatar photo, contact phone, and ward location.
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="civic-btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 min-h-[40px] text-xs font-bold text-white shadow-xs shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <UserAvatar name={user.name} avatarUrl={user.avatarUrl} role={user.role} size="lg" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
                      <div>
                        <span className="text-[11px] text-[#667085] block">Name</span>
                        <span className="font-bold text-[#101828] mt-0.5 block truncate">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#667085] block">Email</span>
                        <span className="font-semibold text-[#101828] mt-0.5 block truncate">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#667085] block">Phone / Location</span>
                        <span className="font-semibold text-[#101828] mt-0.5 block truncate">
                          {user.phone || user.location || "Not configured"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Account Recovery Email Card */}
                <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#667085]">
                          Account Recovery
                        </span>
                        <h3 className="text-sm font-bold text-[#101828]">Email Recovery &amp; Verification</h3>
                        <p className="text-xs text-[#667085] mt-0.5">
                          Recovery notifications and password reset links are sent to{" "}
                          <strong className="text-[#101828]">{user.email}</strong>.
                        </p>
                      </div>
                    </div>

                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 self-start sm:self-center">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestVerification}
                        disabled={sendingVerify}
                        className="civic-btn-secondary inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 min-h-[40px] text-xs font-bold text-amber-900 disabled:opacity-50 self-start sm:self-center"
                      >
                        {sendingVerify ? "Sending..." : "Verify Email"}
                      </button>
                    )}
                  </div>

                  {verifyFeedback && (
                    <div
                      role={verifyFeedback.type === "error" ? "alert" : "status"}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                        verifyFeedback.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-rose-200 bg-rose-50 text-rose-900"
                      }`}
                    >
                      {verifyFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span>{verifyFeedback.text}</span>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* 2. SECURITY SECTION */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E7EC] pb-4">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                        Security
                      </span>
                      <h2 className="text-base font-bold text-[#101828] mt-0.5">
                        Account Security Overview
                      </h2>
                      <p className="text-xs text-[#667085]">
                        Non-sensitive status of your credentials, email verification, and account access.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm((prev) => !prev)}
                      className="civic-btn-primary inline-flex items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 min-h-[40px] text-xs font-bold text-white shadow-xs shrink-0"
                    >
                      {showPasswordForm ? "Hide Password Form" : "Change Password"}
                    </button>
                  </div>

                  {/* Clean Security Status Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                        Password
                      </span>
                      <div className="font-semibold text-[#101828]">
                        {formatLastChanged(user.passwordChangedAt)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                        Email Status
                      </span>
                      <div className="font-semibold text-[#101828] flex items-center gap-1.5">
                        {user.emailVerified ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-amber-800">Not verified</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                        Account Status
                      </span>
                      <div className="font-semibold text-emerald-700">Active</div>
                    </div>
                  </div>

                  {!user.emailVerified && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <span className="text-amber-950 font-medium">
                        Verify your email address so recovery and security notifications work reliably.
                      </span>
                      <button
                        type="button"
                        onClick={handleRequestVerification}
                        disabled={sendingVerify}
                        className="civic-btn-secondary rounded-xl border border-amber-300 bg-white hover:bg-amber-50 px-3.5 py-2 min-h-[38px] font-bold text-amber-900 shrink-0 disabled:opacity-50"
                      >
                        {sendingVerify ? "Sending..." : "Verify Email"}
                      </button>
                    </div>
                  )}

                  {verifyFeedback && (
                    <div
                      role={verifyFeedback.type === "error" ? "alert" : "status"}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                        verifyFeedback.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-rose-200 bg-rose-50 text-rose-900"
                      }`}
                    >
                      <span>{verifyFeedback.text}</span>
                    </div>
                  )}
                </section>

                {showPasswordForm && (
                  <section className="civic-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#101828]">Update Password</h3>
                      <p className="text-xs text-[#667085] mt-0.5">
                        Enter your current password and choose a strong replacement password.
                      </p>
                    </div>
                    <ChangePasswordForm />
                  </section>
                )}
              </div>
            )}

            {/* 3. NOTIFICATIONS SECTION (Persisted to DB/account-store via PATCH /api/auth/preferences) */}
            {activeTab === "notifications" && (
              <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-5">
                <div className="border-b border-[#E4E7EC] pb-4">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                    Notifications
                  </span>
                  <h2 className="text-base font-bold text-[#101828] mt-0.5">
                    Alert &amp; Event Preferences
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Choose which municipal workflow updates your account receives. Changes save to your account record.
                  </p>
                </div>

                {prefFeedback && (
                  <div
                    role={prefFeedback.type === "error" ? "alert" : "status"}
                    className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                      prefFeedback.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-rose-200 bg-rose-50 text-rose-900"
                    }`}
                  >
                    {prefFeedback.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{prefFeedback.text}</span>
                  </div>
                )}

                <div className="divide-y divide-[#E4E7EC]">
                  {[
                    {
                      key: "notifyStatusUpdates" as const,
                      title: "Issue Status Updates",
                      desc: "Receive updates when reported incidents progress through AI triage, assignment, and repair.",
                      checked: notifyStatusUpdates,
                      onToggle: (v: boolean) => {
                        setNotifyStatusUpdates(v);
                        handleSavePreferences({ notifyStatusUpdates: v });
                      },
                    },
                    ...(user.role === "AUTHORITY" || user.role === "FIELD_WORKER"
                      ? [
                          {
                            key: "notifyAssignments" as const,
                            title: "Assignment Notifications",
                            desc:
                              user.role === "AUTHORITY"
                                ? "Alerts when A02 optimization dispatches or encounters capacity conflicts."
                                : "Immediate dispatch notifications when new repair work orders are assigned to you.",
                            checked: notifyAssignments,
                            onToggle: (v: boolean) => {
                              setNotifyAssignments(v);
                              handleSavePreferences({ notifyAssignments: v });
                            },
                          },
                        ]
                      : []),
                    {
                      key: "notifyResolutions" as const,
                      title: "Resolution Notifications",
                      desc: "Notifications when field crews submit after-repair proof or citizen sign-off completes.",
                      checked: notifyResolutions,
                      onToggle: (v: boolean) => {
                        setNotifyResolutions(v);
                        handleSavePreferences({ notifyResolutions: v });
                      },
                    },
                    {
                      key: "notifySystem" as const,
                      title: "System & Security Notifications",
                      desc: "Important civic grid notices, password updates, and account verification alerts.",
                      checked: notifySystem,
                      onToggle: (v: boolean) => {
                        setNotifySystem(v);
                        handleSavePreferences({ notifySystem: v });
                      },
                    },
                  ].map((item) => (
                    <div key={item.key} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#101828]">{item.title}</div>
                        <p className="text-xs text-[#667085] mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.checked}
                        aria-label={item.title}
                        disabled={savingPrefs}
                        onClick={() => item.onToggle(!item.checked)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-50 ${
                          item.checked ? "bg-[#2563EB]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            item.checked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. PREFERENCES & ROLE SECTION */}
            {activeTab === "preferences" && (
              <div className="space-y-4">
                <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-5">
                  <div className="border-b border-[#E4E7EC] pb-4">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                      Preferences
                    </span>
                    <h2 className="text-base font-bold text-[#101828] mt-0.5">
                      Workspace &amp; Regional Defaults
                    </h2>
                    <p className="text-xs text-[#667085]">
                      Customize your default municipal ward focus and list density preferences.
                    </p>
                  </div>

                  {prefFeedback && (
                    <div
                      role={prefFeedback.type === "error" ? "alert" : "status"}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                        prefFeedback.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-rose-200 bg-rose-50 text-rose-900"
                      }`}
                    >
                      <span>{prefFeedback.text}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="pref-default-ward"
                        className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5"
                      >
                        Default Monitoring Ward
                      </label>
                      <select
                        id="pref-default-ward"
                        value={prefDefaultWard}
                        onChange={(e) => setPrefDefaultWard(e.target.value)}
                        disabled={savingPrefs}
                        className="w-full sm:max-w-xs rounded-xl border border-[#E4E7EC] bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-[#101828] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                      >
                        <option value="">All Dhaka Wards</option>
                        {DHAKA_WARDS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#E4E7EC]">
                      <div>
                        <div className="text-sm font-bold text-[#101828]">Compact Data Density</div>
                        <p className="text-xs text-[#667085]">
                          Prefer tighter row spacing when reviewing issue lists and audit registries.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={prefCompactTables}
                        aria-label="Compact Data Density"
                        disabled={savingPrefs}
                        onClick={() => setPrefCompactTables(!prefCompactTables)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                          prefCompactTables ? "bg-[#2563EB]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            prefCompactTables ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSavePreferences()}
                        disabled={savingPrefs}
                        className="civic-btn-primary rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 min-h-[42px] text-xs font-bold text-white shadow-sm disabled:opacity-50"
                      >
                        {savingPrefs ? "Saving..." : "Save Preferences"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Role-Specific Account Context Card */}
                <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2.5">
                    {user.role === "AUTHORITY" ? (
                      <Building2 className="h-5 w-5 text-rose-600" />
                    ) : user.role === "FIELD_WORKER" ? (
                      <HardHat className="h-5 w-5 text-amber-600" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
                    )}
                    <h3 className="text-sm font-bold text-[#101828]">{roleSectionTitle}</h3>
                  </div>

                  {user.role === "AUTHORITY" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3">
                        <span className="text-[11px] text-[#667085] block">Operational Clearance</span>
                        <span className="font-bold text-[#101828]">Dispatch Override &amp; SLA Escalation</span>
                      </div>
                      <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3">
                        <span className="text-[11px] text-[#667085] block">Jurisdiction Scope</span>
                        <span className="font-bold text-[#101828]">Dhaka Metropolitan (DNCC / DSCC)</span>
                      </div>
                    </div>
                  )}

                  {user.role === "FIELD_WORKER" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3">
                        <span className="text-[11px] text-[#667085] block">Assigned Department</span>
                        <span className="font-bold text-[#101828]">
                          {user.departmentName || "Municipal Engineering"}
                        </span>
                      </div>
                      <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3">
                        <span className="text-[11px] text-[#667085] block">Active Work Order Load</span>
                        <span className="font-bold font-mono text-[#101828]">
                          {user.activeTaskCount ?? 0} / {user.workerCapacity ?? 3} active slots
                        </span>
                      </div>
                    </div>
                  )}

                  {user.role === "CITIZEN" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3">
                        <span className="text-[11px] text-[#667085] block">Civic Trust Index</span>
                        <span className="font-bold font-mono text-[#101828]">
                          {user.trustScore.toFixed(1)} points
                        </span>
                      </div>
                      <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3">
                        <span className="text-[11px] text-[#667085] block">Verification Rights</span>
                        <span className="font-bold text-[#101828]">Community Upvote &amp; Repair Sign-off</span>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* 5. SESSIONS SECTION */}
            {activeTab === "sessions" && (
              <section className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 space-y-5">
                <div className="border-b border-[#E4E7EC] pb-4">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB]">
                    Sessions
                  </span>
                  <h2 className="text-base font-bold text-[#101828] mt-0.5">Session Control</h2>
                  <p className="text-xs text-[#667085]">
                    Your current session uses an HTTP-only signed authentication cookie. Changing or resetting your password automatically invalidates older sessions.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
                      <span className="text-sm font-bold text-[#101828]">Current Browser Session</span>
                    </div>
                    <p className="text-xs text-[#667085]">
                      Signed in as <strong className="text-[#101828]">{user.email}</strong> ({formatRoleLabel(user.role)})
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={logout}
                    className="civic-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 px-4 py-2.5 min-h-[44px] text-xs font-bold text-rose-700 disabled:opacity-50 shrink-0"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
