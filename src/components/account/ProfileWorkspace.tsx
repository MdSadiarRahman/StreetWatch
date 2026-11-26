"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  HardHat,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { UserAvatar, formatRoleLabel, getRoleBadgeClasses } from "@/components/account/UserAvatar";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { DHAKA_WARDS } from "@/lib/auth/password-policy";
import type { UserProfile } from "@/types";

export function ProfileWorkspace() {
  const { user, loading, refreshUser, setUserState } = useAuth();
  const [editing, setEditing] = useState(false);

  // Editable form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user && !editing) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setWard(user.ward || "");
      setLocation(user.location || "");
      setAddress(user.address || "");
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user, editing]);

  const startEditing = () => {
    if (!user) return;
    setName(user.name || "");
    setPhone(user.phone || "");
    setWard(user.ward || "");
    setLocation(user.location || "");
    setAddress(user.address || "");
    setAvatarUrl(user.avatarUrl || null);
    setFeedback(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setFeedback({ type: "error", text: "Full name must be at least 2 characters." });
      return;
    }

    if (phone.trim() && !/^[+]?[0-9\s\-().]{7,20}$/.test(phone.trim())) {
      setFeedback({
        type: "error",
        text: "Please enter a valid phone number (e.g. +880 1711-000000).",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phone.trim() || null,
          ward: ward.trim() || null,
          location: location.trim() || null,
          address: address.trim() || null,
          avatarUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error?.message || "Unable to update your profile. Please try again.",
        });
        setSaving(false);
        return;
      }

      if (json.data?.user) {
        setUserState(json.data.user as UserProfile);
      } else {
        await refreshUser();
      }

      setEditing(false);
      setFeedback({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Unable to update your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 w-full animate-pulse rounded-2xl bg-white border border-[#E4E7EC]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <div className="civic-card p-8 space-y-4">
          <UserIcon className="h-10 w-10 text-[#2563EB] mx-auto" />
          <h1 className="text-xl font-bold text-[#101828]">Sign in required</h1>
          <p className="text-sm text-[#667085]">
            Please sign in to view and manage your StreetWatch civic profile.
          </p>
          <Link
            href="/login?callbackUrl=/profile"
            className="civic-btn-primary inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm"
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

  const createdDateFormatted = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Registered Member";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F9FC] pb-24 sm:pb-12">
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E4E7EC] pb-4">
          <div className="space-y-1">
            <Link
              href={portalHomeHref}
              className="civic-link-interactive inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828]"
            >
              <ArrowLeft className="h-3.5 w-3.5 civic-icon-shift" />
              <span>Back to {portalHomeLabel}</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">My Profile</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/settings"
              className="civic-btn-secondary inline-flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-white hover:bg-slate-50 px-3.5 py-2 min-h-[40px] text-xs font-bold text-[#101828]"
            >
              <Settings className="h-3.5 w-3.5 text-[#667085]" />
              <span>Account Settings</span>
            </Link>
            {!editing && (
              <button
                type="button"
                onClick={startEditing}
                className="civic-btn-primary inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 min-h-[40px] text-xs font-bold text-white shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Feedback Banner */}
        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-semibold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Profile Surface */}
        {editing ? (
          <form
            onSubmit={handleSave}
            className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-7 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#101828]">Edit Personal Information</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Update your visible name, avatar, contact number, and ward location details.
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(
                  user.role
                )}`}
              >
                {formatRoleLabel(user.role)}
              </span>
            </div>

            {/* Avatar Upload Section */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#344054]">
                Profile Avatar
              </span>
              <AvatarUploader
                name={name || user.name}
                role={user.role}
                value={avatarUrl}
                onChange={setAvatarUrl}
                disabled={saving}
              />
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-[#101828] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  maxLength={24}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1711-000000"
                  disabled={saving}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-ward"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5"
                >
                  Ward / Jurisdiction Zone
                </label>
                <select
                  id="profile-ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-[#101828] focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
                >
                  <option value="">Select Ward</option>
                  {DHAKA_WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                  {ward && !DHAKA_WARDS.includes(ward as any) && <option value={ward}>{ward}</option>}
                </select>
              </div>

              <div>
                <label
                  htmlFor="profile-location"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5"
                >
                  Location / City Area
                </label>
                <input
                  id="profile-location"
                  type="text"
                  maxLength={80}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dhaka North"
                  disabled={saving}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-address"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5"
                >
                  Street Address / Work Base
                </label>
                <input
                  id="profile-address"
                  type="text"
                  maxLength={160}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Mirpur Sector 10, Road 12"
                  disabled={saving}
                  className="w-full rounded-xl border border-[#E4E7EC] bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-[#E4E7EC]">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="civic-btn-secondary inline-flex items-center justify-center rounded-xl border border-[#E4E7EC] bg-white hover:bg-slate-50 px-4 py-2.5 min-h-[44px] text-xs font-bold text-[#344054] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="civic-btn-primary inline-flex items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Identity Summary Card */}
            <div className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E7EC] pb-5">
                <div className="flex items-center gap-4">
                  <UserAvatar name={user.name} avatarUrl={user.avatarUrl} role={user.role} size="xl" />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-[#101828] truncate">{user.name}</h2>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(
                          user.role
                        )}`}
                      >
                        {formatRoleLabel(user.role)}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] flex items-center gap-1.5 flex-wrap">
                      <span>{user.email}</span>
                      {user.emailVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <Link
                          href="/settings?tab=security"
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                        >
                          Not verified
                        </Link>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clean Personal Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#2563EB]" />
                    Email
                  </span>
                  <div className="font-semibold text-[#101828] break-all">{user.email}</div>
                </div>

                <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#2563EB]" />
                    Phone
                  </span>
                  <div className="font-semibold text-[#101828]">
                    {user.phone || <span className="text-[#667085] font-normal">Not provided</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
                    Location &amp; Ward
                  </span>
                  <div className="font-semibold text-[#101828]">
                    {[user.location, user.ward].filter(Boolean).join(" · ") || (
                      <span className="text-[#667085] font-normal">Not specified</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                    Street Address / Assignment Base
                  </span>
                  <div className="font-semibold text-[#101828]">
                    {user.address || <span className="text-[#667085] font-normal">No address saved</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] p-3.5 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
                    Account Created
                  </span>
                  <div className="font-semibold text-[#101828]">{createdDateFormatted}</div>
                </div>
              </div>
            </div>

            {/* Role-Specific Profile Card (Non-sensitive operational context) */}
            {user.role === "CITIZEN" && (
              <div className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">Civic Reputation &amp; Activity</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Community Trust Index:{" "}
                      <strong className="font-mono text-[#101828]">{user.trustScore.toFixed(1)}</strong>{" "}
                      &middot; Earned through verified incident reports and repair approvals.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="civic-btn-secondary inline-flex items-center justify-center rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] hover:bg-slate-100 px-4 py-2 text-xs font-bold text-[#101828] shrink-0"
                >
                  Open My Reports
                </Link>
              </div>
            )}

            {user.role === "AUTHORITY" && (
              <div className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">Municipal Authority Standing</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Authorized command desk officer for Dhaka Metropolitan Dispatch, AI triage overrides, and SLA escalation.
                    </p>
                  </div>
                </div>
                <Link
                  href="/authority"
                  className="civic-btn-secondary inline-flex items-center justify-center rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] hover:bg-slate-100 px-4 py-2 text-xs font-bold text-[#101828] shrink-0"
                >
                  Open Command Center
                </Link>
              </div>
            )}

            {user.role === "FIELD_WORKER" && (
              <div className="civic-card civic-interactive-card rounded-2xl border border-[#E4E7EC] bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <HardHat className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">Field Operative Assignment Profile</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Department:{" "}
                      <strong className="text-[#101828]">
                        {user.departmentName || "Municipal Operations"}
                      </strong>{" "}
                      &middot; Active Task Capacity:{" "}
                      <strong className="font-mono text-[#101828]">
                        {user.activeTaskCount ?? 0} / {user.workerCapacity ?? 3} slots
                      </strong>
                    </p>
                  </div>
                </div>
                <Link
                  href="/worker"
                  className="civic-btn-secondary inline-flex items-center justify-center rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] hover:bg-slate-100 px-4 py-2 text-xs font-bold text-[#101828] shrink-0"
                >
                  Open Worker Terminal
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
