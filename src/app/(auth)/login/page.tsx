"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const submitEmail = customEmail || email;
    const submitPassword = customPassword || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submitEmail, password: submitPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Invalid login credentials.");
        setLoading(false);
        return;
      }

      // Role-based redirect
      const role = data.data?.user?.role;
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (role === "AUTHORITY") {
        router.push("/authority");
      } else if (role === "FIELD_WORKER") {
        router.push("/worker");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Demo@1234");
    handleSubmit(undefined, demoEmail, "Demo@1234");
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-canvas">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to StreetWatch
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Autonomous civic issue reporting & AI prioritization
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bento-card p-6 sm:p-8 bg-white shadow-subtle border border-border">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Quick Demo Login Section (For Judges & Hackathon Testers) */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>One-Click Demo Access (Hackathon Judges)</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("citizen@streetwatch.demo")}
                disabled={loading}
                className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span>👤 Login as Citizen (Tanvir)</span>
                <span className="text-[10px] bg-white border border-blue-200 rounded px-1.5 py-0.5 text-blue-700">
                  Auto-Fill & Login
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("admin@streetwatch.demo")}
                disabled={loading}
                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2 text-xs font-semibold text-red-900 hover:bg-red-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <span>🏛️ Login as Authority Admin (Farhana)</span>
                <span className="text-[10px] bg-white border border-red-200 rounded px-1.5 py-0.5 text-red-700">
                  Command Center
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("worker1@streetwatch.demo")}
                disabled={loading}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <span>👷 Login as Field Worker (Rafiqul)</span>
                <span className="text-[10px] bg-white border border-amber-200 rounded px-1.5 py-0.5 text-amber-700">
                  Task Feed (3/3 Cap)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-600">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Create Citizen Account
          </Link>
        </p>
      </div>
    </div>
  );
}
