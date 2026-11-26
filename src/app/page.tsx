"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapReportPin } from "@/components/map/CityMapCanvas";
import { PublicHero } from "@/components/public/PublicHero";
import { HowStreetWatchWorks } from "@/components/public/HowStreetWatchWorks";
import { LiveCitySnapshot, PublicAnalyticsSummary } from "@/components/public/LiveCitySnapshot";
import { PublicMapSection } from "@/components/public/PublicMapSection";
import {
  RecentCommunityReports,
  CategoryFilterGroup,
  PublicStatusFilter,
  PriorityFilter,
  DateFilter,
} from "@/components/public/RecentCommunityReports";
import { PublicTransparencyAndImpact } from "@/components/public/PublicTransparencyAndImpact";
import { IssueDetailDrawer } from "@/components/public/IssueDetailDrawer";
import { PublicFooter } from "@/components/public/PublicFooter";

function matchesCategoryGroup(report: MapReportPin, group: CategoryFilterGroup): boolean {
  if (group === "ALL") return true;
  const text = `${report.category?.name || ""} ${report.category?.slug || ""}`.toLowerCase();

  switch (group) {
    case "ROAD":
      return text.includes("road") || text.includes("pothole") || text.includes("crater");
    case "DRAINAGE":
      return (
        text.includes("drain") ||
        text.includes("water") ||
        text.includes("manhole") ||
        text.includes("flood")
      );
    case "WASTE":
      return text.includes("garbage") || text.includes("waste") || text.includes("sanitation");
    case "STREETLIGHT":
      return text.includes("streetlight") || text.includes("lamp");
    case "ELECTRICAL":
      return (
        text.includes("wire") ||
        text.includes("electric") ||
        text.includes("power") ||
        text.includes("transformer")
      );
    case "OTHER":
      return (
        !matchesCategoryGroup(report, "ROAD") &&
        !matchesCategoryGroup(report, "DRAINAGE") &&
        !matchesCategoryGroup(report, "WASTE") &&
        !matchesCategoryGroup(report, "STREETLIGHT") &&
        !matchesCategoryGroup(report, "ELECTRICAL")
      );
    default:
      return true;
  }
}

export default function PublicCityPortalPage() {
  const [reports, setReports] = useState<MapReportPin[]>([]);
  const [analytics, setAnalytics] = useState<PublicAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters shared smoothly across Map & Discovery Feed
  const [search, setSearch] = useState("");
  const [categoryGroup, setCategoryGroup] = useState<CategoryFilterGroup>("ALL");
  const [statusFilter, setStatusFilter] = useState<PublicStatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [wardFilter, setWardFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");

  // Selection states: map selection vs focused detail drawer
  const [selectedMapReportId, setSelectedMapReportId] = useState<string | null>(null);
  const [detailDrawerReportId, setDetailDrawerReportId] = useState<string | null>(null);

  const loadPortalData = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const [repRes, analyticsRes] = await Promise.all([
        fetch("/api/reports?limit=100"),
        fetch("/api/analytics/summary").catch(() => null),
      ]);

      if (!repRes.ok) {
        throw new Error("Unable to load public municipal reports.");
      }

      const repJson = await repRes.json();
      setReports(repJson.data?.items || []);

      if (analyticsRes && analyticsRes.ok) {
        const analyticsJson = await analyticsRes.json();
        setAnalytics(analyticsJson.data || null);
      }
    } catch (err) {
      console.error("Failed to load public portal data:", err);
      setFetchError((err as Error)?.message || "Unable to connect to StreetWatch registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const availableWards = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      if (r.wardZone) set.add(r.wardZone);
    }
    return Array.from(set).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    const now = Date.now();
    return reports
      .filter((r) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            r.title.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q) ||
            (r.wardZone && r.wardZone.toLowerCase().includes(q)) ||
            (r.category?.name && r.category.name.toLowerCase().includes(q));
          if (!match) return false;
        }

        // Category group
        if (!matchesCategoryGroup(r, categoryGroup)) {
          return false;
        }

        // Public Status
        if (statusFilter === "REPORTED") {
          if (
            ["IN_PROGRESS", "ASSIGNED", "RESOLVED", "CITIZEN_VERIFIED"].includes(r.status)
          ) {
            return false;
          }
        } else if (statusFilter === "IN_PROGRESS") {
          if (r.status !== "IN_PROGRESS" && r.status !== "ASSIGNED") {
            return false;
          }
        } else if (statusFilter === "RESOLVED") {
          if (r.status !== "RESOLVED" && r.status !== "CITIZEN_VERIFIED") {
            return false;
          }
        }

        // Priority
        if (priorityFilter === "CRITICAL" && r.priorityScore < 80) {
          return false;
        }
        if (priorityFilter === "HIGH" && r.priorityScore < 60) {
          return false;
        }

        // Ward
        if (wardFilter !== "ALL" && r.wardZone !== wardFilter) {
          return false;
        }

        // Date range
        if (dateFilter !== "ALL") {
          const ageHours = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
          if (dateFilter === "TODAY" && ageHours > 24) return false;
          if (dateFilter === "WEEK" && ageHours > 24 * 7) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, search, categoryGroup, statusFilter, priorityFilter, wardFilter, dateFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryGroup !== "ALL" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    wardFilter !== "ALL" ||
    dateFilter !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setCategoryGroup("ALL");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setWardFilter("ALL");
    setDateFilter("ALL");
  };

  const handleVerifyReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: "CONFIRM" }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, verificationCount: (r.verificationCount || 0) + 1 }
              : r
          )
        );
      }
    } catch (e) {
      console.error("Verification failed:", e);
    }
  };

  const handleViewOnMap = (reportId: string) => {
    setSelectedMapReportId(reportId);
    const mapSection = document.getElementById("live-map");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const drawerReport = useMemo(
    () => reports.find((r) => r.id === detailDrawerReportId) || null,
    [reports, detailDrawerReportId]
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101828] flex flex-col">
      {/* SECTION 2: HERO / INTRODUCTION */}
      <PublicHero
        reports={reports}
        loading={loading}
        onSelectIssue={(id) => setDetailDrawerReportId(id)}
      />

      {/* SECTION 3: HOW STREETWATCH WORKS */}
      <HowStreetWatchWorks />

      {/* SECTION 4: LIVE CITY SNAPSHOT */}
      <LiveCitySnapshot
        reports={reports}
        analytics={analytics}
        loading={loading}
      />

      {/* SECTION 5: CONTAINED PUBLIC MAP + SYNCHRONIZED SIDE PANEL */}
      <PublicMapSection
        reports={filteredReports}
        selectedReportId={selectedMapReportId}
        onSelectReport={(id) => setSelectedMapReportId(id)}
        onOpenDetails={(id) => setDetailDrawerReportId(id)}
        onVerifyReport={handleVerifyReport}
        loading={loading}
      />

      {/* SECTION 6 & 7: RECENT COMMUNITY REPORTS & FILTER DISCOVERY */}
      <RecentCommunityReports
        reports={filteredReports}
        allReportsCount={reports.length}
        loading={loading}
        fetchError={fetchError}
        onRetry={loadPortalData}
        search={search}
        onSearchChange={setSearch}
        categoryGroup={categoryGroup}
        onCategoryGroupChange={setCategoryGroup}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        wardFilter={wardFilter}
        onWardFilterChange={setWardFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        availableWards={availableWards}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        onViewDetails={(id) => setDetailDrawerReportId(id)}
        onViewOnMap={handleViewOnMap}
      />

      {/* SECTIONS 9, 10, 11, 12: TRANSPARENCY, BEFORE/AFTER, IMPACT, FINAL CTA */}
      <PublicTransparencyAndImpact
        reports={reports}
        analytics={analytics}
        onOpenDetails={(id) => setDetailDrawerReportId(id)}
      />

      {/* SECTION 13: CIVIC PUBLIC FOOTER */}
      <PublicFooter />

      {/* SECTION 8: FOCUSED SINGLE-ISSUE DETAIL DRAWER */}
      <IssueDetailDrawer
        report={drawerReport}
        onClose={() => setDetailDrawerReportId(null)}
        onVerify={handleVerifyReport}
      />
    </div>
  );
}
