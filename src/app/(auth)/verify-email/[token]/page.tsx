"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import { BrandLogoEmblem } from "@/components/ui/BrandLogo";
import { useAuth } from "@/components/auth/AuthContext";

export default function VerifyEmailTokenPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    let active = true;
    async function confirm() {
      if (!token) {
        if (active) {
          setStatus("error");
          setMessage("Invalid or unavailable verification link.");
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (!active) return;

        if (res.ok && json.success) {
          setStatus("success");
          setMessage(json.message || "Your email address has been verified.");
          await refreshUser();
        } else {
          setStatus("error");
          setMessage(json.error?.message || "Invalid or expired verification link.");
        }
      } catch {
        if (active) {
          setStatus("error");
          setMessage("Unable to verify your email right now. Please try again.");
        }
      }
    }

    confirm();
    return () => {
      active = false;
    };
  }, [token, refreshUser]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 bg-[#F7F9FC]">
      <div className="w-full max-w-md civic-card rounded-2xl p-8 bg-white border border-[#E4E7EC] text-center space-y-5 shadow-float">
        <div className="mx-auto flex justify-center">
          <BrandLogoEmblem size={48} />
        </div>

        {status === "verifying" && (
          <div className="space-y-3 py-4">
            <div className="mx-auto h-7 w-7 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-[#667085]">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-[#101828]">Email Verified</h1>
            <p className="text-xs text-[#344054]">{message}</p>
            <Link
              href="/settings?tab=security"
              className="civic-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 py-3 px-4 text-xs font-bold text-white"
            >
              <span>Return to Security Settings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-[#101828]">Verification Unavailable</h1>
            <p className="text-xs text-[#667085]">{message}</p>
            <Link
              href="/settings?tab=security"
              className="civic-btn-secondary inline-flex w-full items-center justify-center rounded-xl border border-[#E4E7EC] bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-[#101828]"
            >
              Go to Account Settings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
