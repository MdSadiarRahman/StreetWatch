"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  Building,
  Info,
  Radio,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

// Dynamically import Leaflet map component with SSR disabled
const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 font-medium rounded-lg border border-slate-200">
        <div className="h-4 w-4 border-2 border-civic border-t-transparent rounded-full animate-spin mb-1.5" />
        <span>Loading geospatial map coordinate picker...</span>
      </div>
    ),
  }
);

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  baseRiskWeight: number;
}

interface DuplicateCheckData {
  isDuplicate: boolean;
  distanceMeters: number | null;
  parentReport: {
    id: string;
    title: string;
    address: string;
    status: string;
  } | null;
}

const SAMPLE_PHOTOS = [
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
    label: "Live Wire Hazard",
    url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    categoryHint: "Exposed Live Wire",
  },
  {
    label: "Garbage Spill",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    categoryHint: "Garbage Overflow",
  },
];

export default function ReportIssuePage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("AUTO");
  const [wardZone, setWardZone] = useState("Ward 4");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState(SAMPLE_PHOTOS[0].url);
  const [lat, setLat] = useState(23.7808);
  const [lng, setLng] = useState(90.3802);

  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckData | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          setCategories(json.data?.categories || []);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Check geospatial duplicate whenever location or category changes
  useEffect(() => {
    let active = true;
    async function runDuplicateCheck() {
      setCheckingDuplicate(true);
      try {
        const query = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          categoryId: categoryId !== "AUTO" ? categoryId : "",
        });
        const res = await fetch(`/api/reports/check-duplicate?${query.toString()}`);
        if (res.ok && active) {
          const json = await res.json();
          setDuplicateCheck(json.data);
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
      } finally {
        if (active) setCheckingDuplicate(false);
      }
    }

    const timer = setTimeout(runDuplicateCheck, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lat, lng, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId,
          wardZone,
          address: address || `${wardZone}, Near Selected Coordinate`,
          imageUrl,
          latitude: lat,
          longitude: lng,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message || "Failed to submit report.");
        setSubmitting(false);
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch {
      setError("An unexpected error occurred while submitting.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* 70% Civic Swiss Page Header */}
      <div className="border-b border-slate-200 pb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-civic text-white text-xs font-bold font-mono">
                +
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                File a Civic Hazard or Infrastructure Defect
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Submit verified photographic proof and coordinates for algorithmic AI triage and municipal dispatch.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-civic">
            <Radio className="h-3 w-3 text-civic animate-pulse" />
            <span>AI Automated Triage Protocol Active</span>
          </div>
        </div>

        {/* Clean Swiss Operational Workflow Stepper */}
        <div className="grid grid-cols-3 gap-3 pt-3 text-xs border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-[10px] text-white font-mono">
              1
            </span>
            <span>Incident Details &amp; Proof</span>
          </div>
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-[10px] text-white font-mono">
              2
            </span>
            <span>Spatial GPS &amp; Proximity Check</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px] text-slate-700 font-mono">
              3
            </span>
            <span>AI Urgency &amp; Crew Dispatch</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-300 bg-red-50 p-4 text-xs font-medium text-red-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Swiss Operational Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Incident Form Details */}
        <div className="space-y-5 lg:col-span-7">
          <div className="civic-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Info className="h-4 w-4 text-civic" />
                <span>1. Incident Classification &amp; Description</span>
              </h2>
              <span className="text-[11px] font-medium text-slate-500">* Required Fields</span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Incident Title *
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Road Crater Threatening Vehicle Axles"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
              />
            </div>

            {/* Category Grid Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hazard Classification *
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Select matching category</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId("AUTO")}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    categoryId === "AUTO"
                      ? "border-civic bg-blue-50/70 ring-1 ring-civic"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="h-4 w-4 text-civic" />
                    {categoryId === "AUTO" && <span className="h-1.5 w-1.5 rounded-full bg-civic" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">✨ Auto-Detect</span>
                    <span className="text-[10px] text-slate-500 font-medium">Gemini AI Vision</span>
                  </div>
                </button>

                {categories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id);
                        if (!title) setTitle(`${cat.name} Reported on Street`);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "border-civic bg-blue-50/70 ring-1 ring-civic"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <DynamicCategoryIcon nameOrSlug={cat.name} size={18} />
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-civic" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight truncate">{cat.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Risk Weight {cat.baseRiskWeight || 25}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ward / Zone Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Dhaka Municipal Ward Zone *
              </label>
              <select
                value={wardZone}
                onChange={(e) => setWardZone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
              >
                <option value="Ward 4">Ward 4 (Mirpur Sector 10)</option>
                <option value="Ward 9">Ward 9 (Gulshan - Badda)</option>
                <option value="Ward 15">Ward 15 (Dhanmondi)</option>
                <option value="Ward 2">Ward 2 (Pallabi)</option>
                <option value="Ward 26">Ward 26 (Farmgate)</option>
                <option value="Ward 31">Ward 31 (Mohammadpur)</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Street Address / Landmark *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Opposite City Hospital Gate, Mirpur Road"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Detailed Hazard Observation * (Min 15 chars)
              </label>
              <textarea
                required
                rows={3}
                minLength={15}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the physical hazard, risk to pedestrians/motorcycles, obstruction to traffic, or depth..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
              />
            </div>

            {/* Photo URL & Quick Sample Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Photographic Evidence URL *
              </label>
              <div className="relative mb-2">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-civic focus:outline-none focus:ring-1 focus:ring-civic transition"
                />
              </div>

              {/* Quick Sample Selector */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Standard Test Evidence:
                </span>
                {SAMPLE_PHOTOS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample.url);
                      if (!title) setTitle(`${sample.label} Reported on Street`);
                    }}
                    className={`rounded px-2 py-0.5 text-[11px] font-bold border transition ${
                      imageUrl === sample.url
                        ? "border-civic bg-blue-50 text-civic"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              {/* Evidence Preview */}
              {imageUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-200">
                    <img
                      src={imageUrl}
                      alt="Hazard preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Photographic Record Attached</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      High-resolution visual features will be ingested by Gemini Vision for severity extraction.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Spatial Geolocation & Duplicate Detection */}
        <div className="space-y-5 lg:col-span-5">
          <div className="civic-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-civic" />
                <span>2. Geolocation Pin &amp; Spatial Audit</span>
              </h2>
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 rounded px-2 py-0.5 border border-slate-200">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>

            {/* Interactive Leaflet Map */}
            <LocationPickerMap
              initialLat={lat}
              initialLng={lng}
              onLocationSelect={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />

            {/* Live Duplicate Proximity Audit (M06) */}
            <div className="rounded-lg border p-3 text-xs transition">
              {checkingDuplicate ? (
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-civic border-t-transparent" />
                  <span>Scanning 50m radius for existing reports...</span>
                </div>
              ) : duplicateCheck?.isDuplicate ? (
                <div className="space-y-1.5 text-amber-950 bg-amber-50 -m-3 p-3 rounded-lg border border-amber-300">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>Geospatial Duplicate Detected ({duplicateCheck.distanceMeters}m away)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                    An open report already covers this coordinate: <strong>&ldquo;{duplicateCheck.parentReport?.title}&rdquo;</strong>.
                    To prevent duplicate municipal dispatch, consider upvoting the existing report!
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-950 bg-emerald-50 -m-3 p-3 rounded-lg border border-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-900">Clean Geolocation Coordinates</span>
                    <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                      No conflicting open hazards within 50-meter buffer radius.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Triaging Notice */}
            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700">
              <FileCheck className="h-4 w-4 text-civic shrink-0 mt-0.5" />
              <span>
                Submission immediately triggers <strong>Gemini AI Triage</strong> to calculate severity score, SLA tier, and register the report in the municipal state machine.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-tactile flex w-full items-center justify-center gap-2 rounded-lg bg-civic hover:bg-civic-hover py-3 px-4 text-xs font-bold text-white shadow-2xs transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? "Analyzing with Gemini AI & Submitting..." : "Submit Incident Report (Trigger AI Triage)"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
