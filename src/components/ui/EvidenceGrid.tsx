"use client";

import Image from "next/image";
import { ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

export interface EvidenceGridProps {
  title: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  isResolved?: boolean;
}

export default function EvidenceGrid({
  title,
  beforeUrl,
  afterUrl,
  isResolved = false,
}: EvidenceGridProps) {
  const fallbackBefore =
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
  const fallbackAfter =
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80";

  if (afterUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Photographic Proof Comparison (Before vs After)
          </span>
          <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold">
            Repair Evidence Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before Column */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              Before Repair (Citizen Evidence)
            </span>
            <div className="civic-interactive-card relative h-60 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
              <Image
                src={beforeUrl || fallbackBefore}
                alt={title}
                fill
                className="civic-card-image object-cover"
                sizes="(max-width: 640px) 100vw, 35vw"
              />
              <div className="absolute top-2.5 left-2.5 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs">
                Initial Hazard
              </div>
            </div>
          </div>

          {/* After Column */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-emerald-800 block">
              After Repair (Field Worker Evidence)
            </span>
            <div className="civic-interactive-card relative h-60 w-full overflow-hidden rounded-lg border-2 border-emerald-400 bg-emerald-50/50">
              <Image
                src={afterUrl || fallbackAfter}
                alt="Repaired proof evidence"
                fill
                className="civic-card-image object-cover"
                sizes="(max-width: 640px) 100vw, 35vw"
              />
              <div className="absolute top-2.5 left-2.5 bg-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs">
                Completed Repair
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="civic-interactive-card relative h-64 sm:h-80 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
      <Image
        src={beforeUrl || fallbackBefore}
        alt={title}
        fill
        priority
        className="civic-card-image object-cover"
        sizes="(max-width: 1024px) 100vw, 65vw"
      />
      <div className="absolute top-3 left-3 bg-slate-900/80 px-2.5 py-1 rounded text-[11px] font-bold text-white shadow-2xs">
        Citizen Photographic Record
      </div>
    </div>
  );
}
