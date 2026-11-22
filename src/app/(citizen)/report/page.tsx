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
} from "lucide-react";

// Dynamically import Leaflet map component with SSR disabled
const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Loading interactive map canvas...
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-brand shadow-2xs">
                <PlusCircle className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Report a Civic Hazard or Road Defect
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Submit photo evidence and coordinates. StreetWatch AI auto-triages urgency and dispatches certified municipal teams.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-200/80 bg-blue-50/70 px-3 py-1 text-xs font-bold text-blue-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI Powered Triage</span>
          </div>
        </div>

        {/* Stepper Guide */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">1</span>
            <span className="hidden sm:inline">Issue Details</span>
          </div>
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">2</span>
            <span className="hidden sm:inline">Map &amp; Duplicate Check</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-700">3</span>
            <span className="hidden sm:inline">Auto-Triage &amp; Dispatch</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Minimalist Bento Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Form Inputs & Evidence Dropzone */}
        <div className="space-y-6 lg:col-span-7">
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Info className="h-4 w-4 text-brand" />
              1. Issue Details
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Issue Title *
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deep Road Crater Causing Traffic Skids"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>

            {/* Category & Ward Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                >
                  <option value="AUTO">✨ Auto-Detect with AI Triage</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ward / District *
                </label>
                <select
                  value={wardZone}
                  onChange={(e) => setWardZone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                >
                  <option value="Ward 4">Ward 4 (Mirpur Sector 10)</option>
                  <option value="Ward 9">Ward 9 (Gulshan - Badda)</option>
                  <option value="Ward 15">Ward 15 (Dhanmondi)</option>
                  <option value="Ward 2">Ward 2 (Pallabi)</option>
                  <option value="Ward 26">Ward 26 (Farmgate)</option>
                  <option value="Ward 31">Ward 31 (Mohammadpur)</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Specific Location Landmark *
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Opposite City Hospital Gate, Mirpur Road"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hazard Description * (Min 15 chars)
              </label>
              <textarea
                required
                rows={3}
                minLength={15}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the severity, hazards, pedestrian danger, or vehicles affected..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>

            {/* Photo URL & Quick Sample Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Photographic Proof URL *
              </label>
              <div className="relative mb-2">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              {/* Quick Sample Selector for Demo Testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  Quick Demo Photos:
                </span>
                {SAMPLE_PHOTOS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample.url);
                      if (!title) setTitle(`${sample.label} Reported on Street`);
                    }}
                    className={`rounded-lg border px-2 py-0.5 text-xs font-medium transition ${
                      imageUrl === sample.url
                        ? "border-brand bg-blue-50 text-brand font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              {/* Live Evidence Preview */}
              {imageUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <img
                      src={imageUrl}
                      alt="Hazard preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Photographic Evidence Loaded</span>
                    <span className="text-[11px] text-slate-500">EXIF metadata &amp; visual hazard features will be analyzed by Gemini Vision.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Map Pin Picker & Live AI Pre-Check */}
        <div className="space-y-6 lg:col-span-5">
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                2. Geolocation Pin
              </h2>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 py-0.5">
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

            {/* Live Duplicate & AI Pre-Check Box (M06) */}
            <div className="rounded-xl border p-3.5 text-xs transition">
              {checkingDuplicate ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  <span>Scanning nearby radius for duplicate reports...</span>
                </div>
              ) : duplicateCheck?.isDuplicate ? (
                <div className="space-y-2 text-amber-900 bg-amber-50/80 -m-3.5 p-3.5 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Duplicate Hazard Detected ({duplicateCheck.distanceMeters}m away)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    A report matching this hazard already exists: <strong>&ldquo;{duplicateCheck.parentReport?.title}&rdquo;</strong>.
                    To prevent redundant city dispatches, consider upvoting the existing report!
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/60 -m-3.5 p-3.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Clean Geographic Coordinates</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      No conflicting open reports within 50m radius.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Triaging Notice */}
            <div className="flex items-start gap-2 rounded-xl bg-blue-50/50 p-3 border border-blue-100 text-xs text-blue-900">
              <Sparkles className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <span>
                Submission automatically executes <strong>Gemini AI Triage</strong> to calculate urgency score and initiate the 8-stage resolution workflow.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:shadow-glow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? "Analyzing with Gemini AI & Submitting..." : "Submit Civic Report (Trigger AI Triage)"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
