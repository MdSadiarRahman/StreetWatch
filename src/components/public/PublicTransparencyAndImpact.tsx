"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  PlusCircle,
  Users,
  Wrench,
  FileText,
  Sparkles,
} from "lucide-react";
import { MapReportPin } from "@/components/map/CityMapCanvas";
import BeforeAfterComparison from "@/components/streetwatch/BeforeAfterComparison";
import { PublicAnalyticsSummary } from "./LiveCitySnapshot";

export interface PublicTransparencyAndImpactProps {
  reports: MapReportPin[];
  analytics: PublicAnalyticsSummary | null;
  onOpenDetails: (reportId: string) => void;
}

export function PublicTransparencyAndImpact({
  reports,
  analytics,
  onOpenDetails,
}: PublicTransparencyAndImpactProps) {
  // Real counts grouped by verified system states (never fabricated)
  const stageCounts = [
    {
      label: "Reported",
      count: reports.length,
      description: "Submitted with GPS & photo",
    },
    {
      label: "AI Triaged",
      count: reports.filter((r) => r.status !== "REPORTED").length,
      description: "Classified & scored",
    },
    {
      label: "Verified",
      count: reports.filter((r) => (r.verificationCount || 0) > 0).length,
      description: "Community corroborated",
    },
    {
      label: "Assigned",
      count: reports.filter((r) =>
        ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CITIZEN_VERIFIED"].includes(r.status)
      ).length,
      description: "Municipal team assigned",
    },
    {
      label: "Field Action",
      count: reports.filter((r) =>
        ["IN_PROGRESS", "RESOLVED", "CITIZEN_VERIFIED"].includes(r.status)
      ).length,
      description: "On-site work active/done",
    },
    {
      label: "Resolved",
      count: reports.filter((r) =>
        ["RESOLVED", "CITIZEN_VERIFIED"].includes(r.status)
      ).length,
      description: "Evidence uploaded",
    },
  ];

  // Authentic Before / After Evidence Showcase: ONLY reports with BOTH actual before and after images
  const verifiedBeforeAfterReports = reports.filter(
    (r) => Boolean(r.afterProofUrl) && Boolean(r.beforeProofUrl || r.imageUrl)
  );

  // Real Impact Aggregates derived strictly from API/Reports data
  const totalReportsSubmitted = analytics?.totalReports ?? reports.length;
  const totalVerifications = reports.reduce(
    (sum, r) => sum + (r.verificationCount || 0),
    0
  );
  const totalResolved =
    analytics?.resolvedCount ??
    reports.filter((r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED").length;
  const activeMunicipalTeams = analytics?.departmentStats?.length ?? null;

  return (
    <>
      {/* SECTION 9: PUBLIC TRANSPARENCY ("See what happens after you report.") */}
      <section
        aria-labelledby="transparency-heading"
        className="border-b border-[#E4E7EC] bg-[#F7F9FC] py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] block">
              PUBLIC ACCOUNTABILITY
            </span>
            <h2
              id="transparency-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828]"
            >
              See what happens after you report.
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              Every civic submission enters a transparent municipal ledger. Citizens can observe every transition in real time—from AI prioritization to field crew sign-off.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stageCounts.map((stage, i) => (
              <div
                key={stage.label}
                className={`relative rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-xs flex flex-col justify-between space-y-2 ${
                  stage.label === "AI Triaged" ? "civic-interactive-ai" : "civic-interactive-card"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#667085]">
                  <span>STAGE 0{i + 1}</span>
                  {i < stageCounts.length - 1 && (
                    <ArrowRight className="civic-icon-shift hidden lg:inline h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold text-[#101828]">
                    {stage.count}
                  </div>
                  <div className="text-xs font-bold text-[#101828] mt-0.5">
                    {stage.label}
                  </div>
                  <div className="text-[11px] text-[#667085] leading-snug mt-0.5">
                    {stage.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10: BEFORE / AFTER EVIDENCE SHOWCASE (Authentic Uploaded Evidence Only) */}
      <section
        aria-labelledby="before-after-heading"
        className="border-b border-[#E4E7EC] bg-white py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="max-w-2xl space-y-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#12B76A] block">
                VERIFIED MUNICIPAL REMEDIATION
              </span>
              <h2
                id="before-after-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828]"
              >
                Verified Before &amp; After Evidence
              </h2>
              <p className="text-xs sm:text-sm text-[#667085]">
                Field crews upload post-repair proof directly on site so citizens can verify completed repairs before incidents are closed.
              </p>
            </div>
          </div>

          {verifiedBeforeAfterReports.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {verifiedBeforeAfterReports.slice(0, 2).map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-4 sm:p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-[#047857]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#12B76A]" />
                        <span>Resolved Issue Proof</span>
                      </span>
                      <h3 className="text-base font-bold text-[#101828] mt-1.5">
                        {rep.title}
                      </h3>
                      <p className="text-xs text-[#667085]">
                        {rep.address} &bull; {rep.wardZone}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenDetails(rep.id)}
                      className="shrink-0 text-xs font-bold text-[#2563EB] hover:underline"
                    >
                      Inspect Record &rarr;
                    </button>
                  </div>

                  <BeforeAfterComparison
                    beforeUrl={rep.beforeProofUrl || rep.imageUrl || ""}
                    afterUrl={rep.afterProofUrl}
                    beforeLabel="BEFORE (Original Report)"
                    afterLabel="AFTER (Field Repair)"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#667085] pt-1">
                    <span className="font-semibold text-[#101828] flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-[#12B76A]" />
                      <span>
                        Resolved by{" "}
                        {rep.category?.name
                          ? `${rep.category.name} Municipal Team`
                          : "Municipal Maintenance Crew"}
                      </span>
                    </span>
                    <span className="font-mono text-[11px]">
                      Updated {new Date(rep.updatedAt || rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E4E7EC] bg-[#F7F9FC] p-8 text-center text-xs text-[#667085]">
              Post-repair photographic comparisons appear here automatically as field crews complete assigned work orders and upload after-repair proof.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 11: COMMUNITY IMPACT (Backend Metrics Only) */}
      <section
        aria-labelledby="community-impact-heading"
        className="border-b border-[#E4E7EC] bg-[#F7F9FC] py-12 sm:py-14"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] block">
                COMMUNITY IMPACT
              </span>
              <h2
                id="community-impact-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight text-[#101828] mt-0.5"
              >
                Turning civic reports into measurable neighborhood action
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="civic-interactive-card rounded-xl border border-[#E4E7EC] bg-white p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
                <span>Reports Submitted</span>
                <span className="civic-kpi-icon p-1.5 rounded-md border border-transparent bg-blue-50">
                  <FileText className="h-4 w-4 text-[#2563EB]" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#101828]">
                {totalReportsSubmitted}
              </div>
              <p className="text-[11px] text-[#667085]">Logged in public civic ledger</p>
            </div>

            <div className="civic-interactive-ai rounded-xl border border-[#E4E7EC] bg-white p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
                <span>Citizen Verifications</span>
                <span className="civic-kpi-icon p-1.5 rounded-md border border-transparent bg-purple-50">
                  <Users className="h-4 w-4 text-[#7C5CFC]" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#101828]">
                {totalVerifications}
              </div>
              <p className="text-[11px] text-[#667085]">Peer confirmations recorded</p>
            </div>

            <div className="civic-interactive-card rounded-xl border border-[#E4E7EC] bg-white p-5 space-y-1.5 shadow-xs hover:border-emerald-400/70 hover:shadow-civic-success">
              <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
                <span>Issues Resolved</span>
                <span className="civic-kpi-icon p-1.5 rounded-md border border-transparent bg-emerald-50">
                  <ShieldCheck className="h-4 w-4 text-[#12B76A]" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#12B76A]">
                {totalResolved}
              </div>
              <p className="text-[11px] text-[#667085]">Completed with verification</p>
            </div>

            <div className="civic-interactive-card rounded-xl border border-[#E4E7EC] bg-white p-5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
                <span>Active Municipal Teams</span>
                <span className="civic-kpi-icon p-1.5 rounded-md border border-transparent bg-amber-50">
                  <Sparkles className="h-4 w-4 text-[#F79009]" />
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#101828]">
                {activeMunicipalTeams !== null ? activeMunicipalTeams : "—"}
              </div>
              <p className="text-[11px] text-[#667085]">Specialized dispatch divisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 12: FINAL CALL TO ACTION */}
      <section
        aria-labelledby="final-cta-heading"
        className="bg-white py-14 sm:py-16"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2
            id="final-cta-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828]"
          >
            See a problem in your city?
          </h2>
          <p className="text-sm sm:text-base text-[#667085] max-w-lg mx-auto">
            Report it. Track it. Help make your neighborhood safer and better connected.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
            <Link
              href="/report"
              className="civic-btn-primary inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 px-6 py-3 min-h-[46px] text-sm font-bold text-white shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Report an Issue</span>
            </Link>
            <Link
              href="#recent-reports"
              className="civic-btn-secondary inline-flex items-center justify-center gap-2 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F7F9FC] hover:border-blue-300 px-6 py-3 min-h-[46px] text-sm font-semibold text-[#101828]"
            >
              <span>Explore Public Reports</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default PublicTransparencyAndImpact;
