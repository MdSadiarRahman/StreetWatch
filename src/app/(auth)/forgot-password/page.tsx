"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Send } from "lucide-react";
import { BrandLogoEmblem } from "@/components/ui/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Unable to send reset instructions right now.");
        setSubmitting(false);
        return;
      }

      setSubmittedMessage(
        json.message || "If an account exists for this email, password reset instructions have been sent."
      );
      setEmail("");
    } catch {
      setError("Network error while requesting password reset. Please try again.");
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
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#667085]">
            Enter your account email and we will send instructions to reset your password.
          </p>
        </div>

        <div className="civic-card civic-interactive-card rounded-2xl p-6 sm:p-8 bg-white shadow-float border border-[#E4E7EC]">
          {submittedMessage ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-[#101828]">Check your inbox</h2>
                <p role="status" className="text-xs sm:text-sm text-[#344054] leading-relaxed">
                  {submittedMessage}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  className="civic-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 text-xs font-bold text-white shadow-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmittedMessage(null)}
                  className="civic-btn-secondary w-full rounded-xl border border-[#E4E7EC] bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-semibold text-[#344054]"
                >
                  Try another email address
                </button>
              </div>
            </div>
          ) : (
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

              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5"
                >
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[#E4E7EC] bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#101828] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="civic-btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 min-h-[46px] text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? "Sending reset link..." : "Send Reset Link"}</span>
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#667085]">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#2563EB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
