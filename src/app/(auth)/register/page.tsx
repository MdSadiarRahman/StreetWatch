"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, ArrowRight, AlertCircle } from "lucide-react";
import { BrandLogoEmblem } from "@/components/ui/BrandLogo";
import { PasswordInput } from "@/components/account/PasswordInput";
import { PasswordStrengthMeter } from "@/components/account/PasswordStrengthMeter";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { useAuth } from "@/components/auth/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!strength.isValid) {
      setError("Please satisfy all password policy requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Registration failed.");
        setLoading(false);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      await refreshUser();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-canvas">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-3">
            <BrandLogoEmblem size={54} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Create Citizen Account
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
            Join your community to report and verify civic improvements
          </p>
        </div>

        {/* Main Card */}
        <div className="bento-card p-6 sm:p-8 bg-white shadow-subtle border border-border">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>
            </div>

            <div className="space-y-2">
              <PasswordInput
                id="register-password"
                name="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Create a strong password"
                required
                disabled={loading}
                describedBy="register-pw-strength"
              />
              <PasswordStrengthMeter id="register-pw-strength" password={password} />
            </div>

            <PasswordInput
              id="register-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              required
              disabled={loading}
              error={
                confirmPassword && confirmPassword !== password
                  ? "Passwords do not match."
                  : null
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="civic-btn-primary group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-civic hover:bg-civic-hover py-3 px-4 text-sm font-bold text-white shadow-sm border border-blue-800/20 disabled:opacity-50"
            >
              {loading ? "Creating Citizen Profile..." : "Complete Registration"}
              {!loading && <ArrowRight className="h-4 w-4 civic-icon-shift" />}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-600">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Sign in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
}
