"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, X, Image as ImageIcon, Sparkles, Check } from "lucide-react";

export interface SamplePhoto {
  label: string;
  url: string;
  categoryHint?: string;
}

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  samples?: SamplePhoto[];
  label?: string;
  description?: string;
  className?: string;
}

const DEFAULT_SAMPLES: SamplePhoto[] = [
  {
    label: "Road Pothole",
    url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    categoryHint: "Deep Pothole",
  },
  {
    label: "Open Manhole",
    url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    categoryHint: "Open Manhole",
  },
  {
    label: "Broken Light",
    url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    categoryHint: "Broken Streetlight",
  },
];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  samples = DEFAULT_SAMPLES,
  label = "Incident Photographic Evidence",
  description = "Upload a clear photo of the hazard. High-resolution imagery enables automated Gemini Vision AI triage.",
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-xs font-bold text-slate-800 tracking-tight">
          {label}
        </label>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group">
          <img
            src={value}
            alt="Hazard evidence preview"
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded text-xs font-semibold shadow-md transition-colors"
            >
              Change Photo
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded text-xs shadow-md transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 font-mono">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>AI Ready for Analysis</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-600 bg-blue-50/50"
              : "border-slate-300 hover:border-blue-400 bg-slate-50/50"
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload evidence photo"
        >
          <div className="mx-auto h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
            <Camera className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 block">
            Click to upload or drag & drop hazard photo
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            PNG, JPG, or WEBP up to 10MB
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Samples Presets */}
      {samples && samples.length > 0 && !value && (
        <div className="pt-2">
          <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
            Quick Select Benchmark Photos:
          </span>
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onChange(s.url)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
