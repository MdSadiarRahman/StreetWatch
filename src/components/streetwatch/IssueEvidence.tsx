"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Camera, Calendar, User, CheckCircle2, ShieldCheck, ZoomIn, X } from "lucide-react";

export interface IssueEvidenceProps {
  imageUrl: string;
  caption?: string;
  timestamp?: string;
  uploadedBy?: string;
  isVerified?: boolean;
  className?: string;
}

export const IssueEvidence: React.FC<IssueEvidenceProps> = ({
  imageUrl,
  caption = "Photographic Hazard Evidence",
  timestamp,
  uploadedBy,
  isVerified = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={`civic-card bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group ${className}`}
      >
        <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
          <img
            src={imageUrl}
            alt={caption}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="absolute bottom-2.5 right-2.5 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-md backdrop-blur-sm transition-colors text-xs flex items-center gap-1 shadow"
            aria-label="Enlarge evidence photo"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium pr-1">Enlarge</span>
          </button>

          {isVerified && (
            <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 shadow">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified Evidence</span>
            </div>
          )}
        </div>

        <div className="p-3 text-xs">
          <p className="font-semibold text-slate-800 line-clamp-1">{caption}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            {timestamp && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                {new Date(timestamp).toLocaleDateString()}
              </span>
            )}
            {uploadedBy && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                {uploadedBy}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 z-10 bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-full transition-colors"
              aria-label="Close enlarged photo"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={imageUrl}
              alt={caption}
              className="max-h-[80vh] w-auto object-contain mx-auto"
            />
            <div className="p-3 bg-slate-900 text-white text-xs flex items-center justify-between">
              <span>{caption}</span>
              {timestamp && <span className="text-slate-400">{new Date(timestamp).toLocaleString()}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IssueEvidence;
