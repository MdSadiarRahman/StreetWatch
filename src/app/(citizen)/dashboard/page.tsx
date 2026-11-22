import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  FileText,
  ThumbsUp,
  CheckCircle,
  PlusCircle,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

export default async function CitizenDashboardPage() {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Fetch citizen reports & statistics
  const [reports, verificationCount] = await Promise.all([
    db.report.findMany({
      where: { reporterId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        aiAnalysis: {
          select: {
            severityReasoning: true,
            detectedCategory: true,
          },
        },
      },
    }),
    db.verification.count({
      where: { userId: session.userId },
    }),
  ]);

  const totalReports = reports.length;
  const resolvedCount = reports.filter(
    (r) => r.status === "RESOLVED" || r.status === "CITIZEN_VERIFIED"
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CITIZEN_VERIFIED":
      case "RESOLVED":
        return {
          label: "Resolved & Verified",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "IN_PROGRESS":
        return {
          label: "Repair In Progress",
          cls: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "ASSIGNED":
        return {
          label: "Crew Dispatched",
          cls: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "AI_TRIAGED":
      case "COMMUNITY_VERIFIED":
      case "PRIORITY_SCORED":
        return {
          label: "AI Triaged / Queued",
          cls: "bg-purple-50 text-purple-700 border-purple-200",
        };
      default:
        return {
          label: "Report Ingested",
          cls: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Citizen Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-brand">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Resident
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <span className="font-semibold text-slate-800">{session.name}</span>. Track your active reports and civic contributions.
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <PlusCircle className="h-4 w-4" />
          Report New Issue
        </Link>
      </div>

      {/* 3 Bento KPI Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* KPI 1 */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reports Submitted
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-slate-900">
              {totalReports}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Community Votes Cast
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-slate-900">
              {verificationCount}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ThumbsUp className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Civic Repairs Confirmed
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-emerald-600">
              {resolvedCount}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Reports List Section */}
      <div className="bento-card bg-white border border-slate-200 shadow-subtle overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Submitted Civic Reports
            </h2>
            <p className="text-xs text-slate-500">
              Live updates on verification, AI prioritization, and municipal dispatch
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-brand hover:underline"
          >
            Explore Public Map &rarr;
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              No reports filed yet
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Notice a dangerous pothole, open manhole, or live wire? Report it now.
            </p>
            <div className="mt-4">
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Submit Your First Report
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              const badge = getStatusBadge(report.status);
              return (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                      <Image
                        src={report.imageUrl}
                        alt={report.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {report.category.name}
                        </span>
                        {report.isDuplicate && (
                          <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5">
                            Duplicate Cluster
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-1">
                        {report.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {report.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        AI Priority
                      </span>
                      <span className="font-mono text-base font-extrabold text-slate-900">
                        {Math.round(report.priorityScore)}/100
                      </span>
                    </div>

                    <Link
                      href={`/reports/${report.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      aria-label="View report details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
