"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { BrandLogoEmblem } from "@/components/ui/BrandLogo";
import { PasswordInput } from "@/components/account/PasswordInput";
import { PasswordStrengthMeter } from "@/components/account/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";

type TokenState = "checking" | "valid" | "expired" | "invalid" | "success";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function validateToken() {
      if (!token) {
        if (active) setTokenState("invalid");
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!active) return;

        if (res.ok && json.success) {
          setTokenState("valid");
        } else if (res.status === 410 || json.error?.code === "TOKEN_EXPIRED") {
          setTokenState("expired");
        } else {
          setTokenState("invalid");
        }
      } catch {
        if (active) setTokenState("invalid");
      }
    }

    validateToken();
    return () => {
      active = false;
    };
  }, [token]);

  const strength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!strength.isValid) {
      setError("Please satisfy all password requirements before resetting.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 410 || json.error?.code === "TOKEN_EXPIRED") {
          setTokenState("expired");
          return;
        }
        if (json.error?.code === "TOKEN_INVALID") {
          setTokenState("invalid");
          return;
        }
        setError(json.error?.message || "Unable to reset password right now.");
        setSubmitting(false);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setTokenState("success");
    } catch {
      setError("Network error while resetting password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#F7F9FC]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-3">
            <BrandLogoEmblem size={54} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#101828]">
            Reset your password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#667085]">
            Choose a strong new password to secure your StreetWatch account.
          </p>
        </div>

        <div className="civic-card civic-interactive-card rounded-2xl p-6 sm:p-8 bg-white shadow-float border border-[#E4E7EC]">
          {tokenState === "checking" && (
            <div className="py-10 text-center space-y-3">
              <div className="mx-auto h-7 w-7 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-[#667085]">Validating reset link...</p>
            </div>
          )}

          {tokenState === "expired" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-[#101828]">
                  Your password reset link has expired.
                </h2>
                <p className="text-xs text-[#667085]">
                  For your security, password reset links are valid for 30 minutes and single-use only.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="civic-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 text-xs font-bold text-white shadow-sm"
              >
                <span>Request a New Link</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {tokenState === "invalid" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-[#101828]">
                  Invalid or unavailable reset link.
                </h2>
                <p className="text-xs text-[#667085]">
                  This link may have already been used, superseded by a newer request, or entered incorrectly.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/forgot-password"
                  className="civic-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 text-xs font-bold text-white shadow-sm"
                >
                  <span>Request a New Link</span>
                </Link>
                <Link
                  href="/login"
                  className="civic-btn-secondary inline-flex w-full items-center justify-center rounded-xl border border-[#E4E7EC] bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-semibold text-[#344054]"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {tokenState === "success" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-[#101828]">
                  Your password has been reset successfully.
                </h2>
                <p className="text-xs text-[#667085]">
                  Existing sessions have been signed out for security. Sign in with your new password.
                </p>
              </div>
              <Link
                href="/login"
                className="civic-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 text-xs font-bold text-white shadow-sm"
              >
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {tokenState === "valid" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <PasswordInput
                  id="reset-new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  required
                  disabled={submitting}
                  describedBy="reset-pw-strength"
                />
                <PasswordStrengthMeter id="reset-pw-strength" password={newPassword} />
              </div>

              <PasswordInput
                id="reset-confirm-password"
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

              <button
                type="submit"
                disabled={submitting}
                className="civic-btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 min-h-[46px] text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                <span>{submitting ? "Resetting password..." : "Reset Password"}</span>
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
