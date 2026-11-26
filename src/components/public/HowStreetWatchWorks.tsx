"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  Cpu,
  UserCheck,
  Truck,
  Wrench,
  CheckCircle2,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    num: "01",
    title: "REPORT",
    description: "Citizen submits a photo and location.",
    statusTag: "Ingested",
    icon: Camera,
    accentCls: "bg-blue-50 text-[#2563EB] border-blue-200",
    tagCls: "bg-blue-50 text-[#2563EB]",
  },
  {
    num: "02",
    title: "AI TRIAGE",
    description: "AI analyzes the issue and suggests category, severity, and priority.",
    statusTag: "Scored",
    icon: Cpu,
    accentCls: "bg-purple-50 text-[#7C5CFC] border-purple-200",
    tagCls: "bg-purple-50 text-[#7C5CFC]",
  },
  {
    num: "03",
    title: "VERIFY",
    description: "Reports are reviewed and verified with community consensus.",
    statusTag: "Confirmed",
    icon: UserCheck,
    accentCls: "bg-sky-50 text-sky-700 border-sky-200",
    tagCls: "bg-sky-50 text-sky-700",
  },
  {
    num: "04",
    title: "ASSIGN",
    description: "The appropriate municipal team receives the work order.",
    statusTag: "Dispatched",
    icon: Truck,
    accentCls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagCls: "bg-indigo-50 text-indigo-700",
  },
  {
    num: "05",
    title: "RESOLVE",
    description: "Field workers address the issue and upload photographic evidence.",
    statusTag: "Fixed",
    icon: Wrench,
    accentCls: "bg-amber-50 text-[#B45309] border-amber-200",
    tagCls: "bg-amber-50 text-[#B45309]",
  },
  {
    num: "06",
    title: "TRACK",
    description: "Citizens follow public progress and verify completion.",
    statusTag: "Closed",
    icon: CheckCircle2,
    accentCls: "bg-emerald-50 text-[#12B76A] border-emerald-200",
    tagCls: "bg-emerald-50 text-[#047857]",
  },
];

export function HowStreetWatchWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="border-b border-[#E4E7EC] bg-[#F7F9FC] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2563EB] block">
              HOW STREETWATCH WORKS
            </span>
            <h2
              id="how-it-works-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828]"
            >
              From citizen reports to city action.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] max-w-md">
            Every submitted hazard moves through a structured, verifiable civic workflow—never disappearing into an untracked inbox.
          </p>
        </div>

        {/* Desktop: Clean Horizontal 6-Step Process */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-3 relative">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.22, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${step.accentCls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#667085]">
                    {step.num}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-mono text-xs font-bold text-[#101828] tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-1">
                  <span className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${step.tagCls}`}>
                    {step.statusTag}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile & Tablet: Compact Vertical Timeline */}
        <div className="lg:hidden relative space-y-3 pl-4 border-l-2 border-[#E4E7EC] ml-2">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-xl border border-[#E4E7EC] bg-white p-3.5 shadow-xs flex items-start gap-3"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[23px] top-4 h-3 w-3 rounded-full bg-white border-2 border-[#2563EB]"
                />
                <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${step.accentCls}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-mono text-xs font-bold text-[#101828]">
                      {step.num}. {step.title}
                    </h3>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${step.tagCls}`}>
                      {step.statusTag}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowStreetWatchWorks;
