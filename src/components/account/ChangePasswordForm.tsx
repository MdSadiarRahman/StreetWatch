"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { PasswordInput } from "@/components/account/PasswordInput";
import { PasswordStrengthMeter } from "@/components/account/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import type { UserProfile } from "@/types";

export function ChangePasswordForm({ onCompleted }: { onCompleted?: () => void }) {
  const { setUserState } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (!strength.isValid) {
      setError("Please satisfy all password policy requirements before saving.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Unable to update your password. Please try again.");
        setSubmitting(false);
        return;
      }

      if (json.data?.user) {
        setUserState(json.data.user as UserProfile);
      }

      // Clear sensitive password inputs immediately from state
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(json.message || "Your password has been updated successfully.");
      onCompleted?.();
    } catch {
      setError("Network error while changing password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-900"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <PasswordInput
        id="current-password"
        label="Current Password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        placeholder="Enter your current password"
        required
        disabled={submitting}
      />

      <div className="space-y-2">
        <PasswordInput
          id="new-password"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          placeholder="Create a strong new password"
          required
          disabled={submitting}
          describedBy="change-pw-strength"
        />
        <PasswordStrengthMeter id="change-pw-strength" password={newPassword} />
      </div>

      <PasswordInput
        id="confirm-new-password"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        placeholder="Re-enter your new password"
        required
        disabled={submitting}
        error={
          confirmPassword && confirmPassword !== newPassword
            ? "Confirmation does not match new password."
            : null
        }
      />

      <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[11px] text-[#667085] flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
          Other active sessions are signed out automatically.
        </span>

        <button
          type="submit"
          disabled={submitting}
          className="civic-btn-primary inline-flex items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm disabled:opacity-50"
        >
          {submitting ? "Changing password..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}
