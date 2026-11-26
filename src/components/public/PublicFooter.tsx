"use client";

import React, { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import Modal from "@/components/ui/Modal";

export function PublicFooter() {
  const [infoModal, setInfoModal] = useState<"privacy" | "accessibility" | "about" | null>(null);

  return (
    <footer className="border-t border-[#E4E7EC] bg-white text-[#667085]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Statement */}
          <div className="md:col-span-5 space-y-3">
            <BrandLogo size="sm" href="/" showBadge={false} />
            <p className="text-xs leading-relaxed text-[#667085] max-w-sm">
              Built to make urban issue reporting more transparent, actionable, and connected.
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              StreetWatch Municipal Civic Infrastructure &bull; Dhaka
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2.5">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101828]">
                Platform
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setInfoModal("about")}
                    className="hover:text-[#2563EB] transition text-left"
                  >
                    About StreetWatch
                  </button>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-[#2563EB] transition">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#recent-reports" className="hover:text-[#2563EB] transition">
                    Public Reports
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101828]">
                Civic Actions
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/report" className="font-semibold text-[#2563EB] hover:underline">
                    Report an Issue
                  </Link>
                </li>
                <li>
                  <Link href="/#live-map" className="hover:text-[#2563EB] transition">
                    Live City Map
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#2563EB] transition">
                    Portal Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 col-span-2 sm:col-span-1">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101828]">
                Governance
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setInfoModal("privacy")}
                    className="hover:text-[#2563EB] transition text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setInfoModal("accessibility")}
                    className="hover:text-[#2563EB] transition text-left"
                  >
                    Accessibility
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E4E7EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#667085]">
          <span>&copy; {new Date().getFullYear()} StreetWatch Civic Auto-Triage Platform.</span>
          <span className="font-mono">70% Civic Swiss &bull; Public Accountability Ledger</span>
        </div>
      </div>

      {/* Accessible Info Modals for About / Privacy / Accessibility */}
      <Modal
        isOpen={infoModal !== null}
        onClose={() => setInfoModal(null)}
        title={
          infoModal === "about"
            ? "About StreetWatch Civic Platform"
            : infoModal === "privacy"
            ? "Public Privacy & Evidence Protection"
            : "WCAG 2.1 AA Accessibility Commitment"
        }
        size="md"
      >
        {infoModal === "about" && (
          <div className="space-y-2.5 text-xs text-[#344054] leading-relaxed">
            <p>
              StreetWatch connects citizens, explainable AI auto-triage, and municipal maintenance crews around one shared public ledger.
            </p>
            <p>
              Every issue submitted receives automated category/severity analysis, duplicate cluster grouping, transparent priority scoring, and a trackable workflow through resolution sign-off.
            </p>
          </div>
        )}
        {infoModal === "privacy" && (
          <div className="space-y-2.5 text-xs text-[#344054] leading-relaxed">
            <p>
              Public incident dossiers expose only street-level infrastructure locations, hazard photographs, and municipal workflow steps. Citizen reporter identities and contact credentials remain protected behind authenticated RBAC APIs.
            </p>
            <p>
              AI assessments are advisory decision-support tools verified by community consensus and authorized municipal operators.
            </p>
          </div>
        )}
        {infoModal === "accessibility" && (
          <div className="space-y-2.5 text-xs text-[#344054] leading-relaxed">
            <p>
              StreetWatch is engineered to meet WCAG 2.1 AA standards: full keyboard navigation, skip-to-content landmarks, visible focus outlines, screen-reader status roles, non-color-only severity labels, 44px+ mobile touch targets, and full support for <code className="font-mono bg-slate-100 px-1 rounded">prefers-reduced-motion</code>.
            </p>
          </div>
        )}
      </Modal>
    </footer>
  );
}

export default PublicFooter;
