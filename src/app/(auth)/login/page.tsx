"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle, User, Building2, HardHat } from "lucide-react";
import { BrandLogoEmblem } from "@/components/ui/BrandLogo";

function LoginForm() {
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
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex justify-center mb-3">
          <BrandLogoEmblem size={54} />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Sign in to StreetWatch
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
          Autonomous Civic Action &bull; Real-time AI Hazard Triage
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bento-card p-6 sm:p-8 bg-white shadow-float border border-slate-200/90">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-tactile mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-civic hover:bg-civic-hover py-3 px-4 text-sm font-bold text-white shadow-sm border border-blue-800/20 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Grid"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Quick Demo Login Section */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-civic" />
              1-Click Role Demo Access
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Citizen Pass */}
            <button
              type="button"
              onClick={() => handleDemoLogin("citizen@streetwatch.demo")}
              disabled={loading}
              className="btn-tactile flex items-center justify-between rounded-xl border border-blue-200/90 bg-blue-50/40 p-3 hover:border-blue-300 hover:bg-blue-50/80 hover:shadow-2xs text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Citizen Reporter Pass</div>
                  <div className="text-[10px] text-slate-500 font-mono">Tanvir Ahmed &bull; Dhaka Ward 4</div>
                </div>
              </div>
              <span className="rounded-lg bg-white border border-blue-200/80 px-2 py-1 text-[10px] font-bold text-blue-700 shadow-2xs">
                Auto-Fill &rarr;
              </span>
            </button>

            {/* Authority Admin Pass */}
            <button
              type="button"
              onClick={() => handleDemoLogin("admin@streetwatch.demo")}
              disabled={loading}
              className="btn-tactile flex items-center justify-between rounded-xl border border-rose-200/90 bg-rose-50/40 p-3 hover:border-rose-300 hover:bg-rose-50/80 hover:shadow-2xs text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Authority Command Key</div>
                  <div className="text-[10px] text-slate-500 font-mono">Farhana Yeasmin &bull; Chief Engineer</div>
                </div>
              </div>
              <span className="rounded-lg bg-white border border-rose-200/80 px-2 py-1 text-[10px] font-bold text-rose-700 shadow-2xs">
                Command Center &rarr;
              </span>
            </button>

            {/* Field Worker Pass */}
            <button
              type="button"
              onClick={() => handleDemoLogin("worker1@streetwatch.demo")}
              disabled={loading}
              className="btn-tactile flex items-center justify-between rounded-xl border border-amber-200/90 bg-amber-50/40 p-3 hover:border-amber-300 hover:bg-amber-50/80 hover:shadow-2xs text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                  <HardHat className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Field Worker Token</div>
                  <div className="text-[10px] text-slate-500 font-mono">Rafiqul Islam &bull; Electrical Lead</div>
                </div>
              </div>
              <span className="rounded-lg bg-white border border-amber-200/80 px-2 py-1 text-[10px] font-bold text-amber-800 shadow-2xs">
                Worker Terminal &rarr;
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
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-canvas">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading authentication screen...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
