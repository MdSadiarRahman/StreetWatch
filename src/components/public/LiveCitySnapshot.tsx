"use client";

import React from "react";
import {
  FileText,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { MapReportPin } from "@/components/map/CityMapCanvas";

export interface PublicAnalyticsSummary {
  totalReports: number;
  criticalUnassignedCount: number;
  resolvedCount: number;
  resolutionRatePercent: number;
  workforceCapacity?: {
    totalSlots: number;
    activeSlots: number;
    utilizationPercent: number;
  };
  departmentStats?: {
    id: string;
    name: string;
    workerCount: number;
    openReports: number;
  }[];
}

export interface LiveCitySnapshotProps {
  reports: MapReportPin[];
  analytics: PublicAnalyticsSummary | null;
  loading?: boolean;
}

export function LiveCitySnapshot({
  reports,
  analytics,
  loading = false,
}: LiveCitySnapshotProps) {
  // Derive live counts strictly from fetched reports + backend analytics summary
  const openIssues = reports.filter(
    (r) => r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED" && r.status !== "REJECTED"
  ).length;

  const criticalIssues = reports.filter(
    (r) => r.priorityScore >= 80 && r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED"
  ).length;

  const inProgressIssues = reports.filter(
    (r) => r.status === "IN_PROGRESS" || r.status === "ASSIGNED"
  ).length;

  const resolvedIssues =
    analytics?.resolvedCount ??
    reports.filter((r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED").length;

  const totalCount = analytics?.totalReports ?? reports.length;

  const resolutionRate =
    analytics?.resolutionRatePercent ??
    (totalCount > 0 ? Math.round((resolvedIssues / totalCount) * 100) : 0);

  const reportsLast24h = reports.filter((r) => {
    const ageMs = Date.now() - new Date(r.createdAt).getTime();
    return ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;
  }).length;

  const metrics = [
    {
      label: "Open Issues",
      value: loading ? "—" : openIssues.toLocaleString(),
      context: "Active in city queue",
      icon: FileText,
      tone: "text-[#2563EB] bg-blue-50 border-blue-100",
    },
    {
      label: "Critical Issues",
      value: loading ? "—" : criticalIssues.toLocaleString(),
      context: "Priority P-80+ risk",
      icon: AlertTriangle,
      tone: "text-[#D92D20] bg-rose-50 border-rose-100",
    },
    {
      label: "In Progress",
      value: loading ? "—" : inProgressIssues.toLocaleString(),
      context: "Crews assigned / active",
      icon: Wrench,
      tone: "text-[#B45309] bg-amber-50 border-amber-100",
    },
    {
      label: "Resolved",
      value: loading ? "—" : resolvedIssues.toLocaleString(),
      context: "Remediation logged",
      icon: CheckCircle2,
      tone: "text-[#12B76A] bg-emerald-50 border-emerald-100",
    },
    {
      label: "Resolution Rate",
      value: loading ? "—" : `${resolutionRate}%`,
      context: `${totalCount} total tracked`,
      icon: TrendingUp,
      tone: "text-[#12B76A] bg-emerald-50 border-emerald-100",
    },
    {
      label: "Reports (24h)",
      value: loading ? "—" : reportsLast24h.toLocaleString(),
      context: "Recent citizen intake",
      icon: Clock,
      tone: "text-[#7C5CFC] bg-purple-50 border-purple-100",
    },
  ];

  return (
    <section
      id="live-snapshot"
      aria-labelledby="live-snapshot-heading"
      className="border-b border-[#E4E7EC] bg-white py-10 sm:py-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] block">
              LIVE CITY SNAPSHOT
            </span>
            <h2
              id="live-snapshot-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-[#101828] mt-0.5"
            >
              What&apos;s happening across the city
            </h2>
          </div>
          <span className="text-xs text-[#667085] font-mono">
            Live municipal registry telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-xl border border-[#E4E7EC] bg-[#F7F9FC]/60 p-4 flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#667085]">{m.label}</span>
                  <span className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${m.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">
                    {m.value}
                  </div>
                  <span className="text-[11px] text-[#667085] block mt-0.5 truncate">
                    {m.context}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LiveCitySnapshot;
