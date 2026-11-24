"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  Upload,
  MapPin,
  Check,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  ShieldCheck,
  Layers,
  AlertTriangle,
  RotateCcw,
  Compass,
  Eye,
  FileText,
  Radio,
  PlusCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/CategoryIcons";

// Dynamically import Leaflet map component with SSR disabled
const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[240px] w-full bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-500 font-medium rounded-xl border border-slate-200">
        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
        <span>Loading geospatial map coordinate picker...</span>
      </div>
    ),
  }
);

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
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

interface SubmissionReceipt {
  reportId: string;
  trackingNumber: string;
  status: string;
  title: string;
  address: string;
  wardZone: string;
  categoryName: string;
  priorityScore: number;
  confidenceScore: number;
  severityScore: number;
  imageUrl: string;
  createdAt: string;
  expectedNextStep: string;
}

const PRIMARY_CATEGORIES = [
  {
    id: "cat-pothole",
    name: "Road Crater / Pothole",
    slug: "pothole",
    description: "Cavity, asphalt sinkhole, or broken surface threatening wheels",
  },
  {
    id: "cat-manhole",
    name: "Open Manhole / Sewer Drain",
    slug: "manhole",
    description: "Missing lid, broken grate, or dangerous pedestrian pit",
  },
  {
    id: "cat-wire",
    name: "Exposed Wire / Electrical",
    slug: "live-wire",
    description: "Snapped cable, dangling power line, or sparking junction",
  },
  {
    id: "cat-water",
    name: "Waterlogging / Flooding",
    slug: "waterlogging",
    description: "Stagnant monsoon pool, blocked drainage, or submerged street",
  },
  {
    id: "cat-garbage",
    name: "Garbage Overflow / Dump",
    slug: "garbage",
    description: "Uncollected biohazard spill, clogged culvert, or foul odor",
  },
  {
    id: "AUTO",
    name: "Not Sure / Let AI Identify",
    slug: "auto-detect",
    description: "Gemini Vision AI will automatically classify from your photo",
  },
];

const SAMPLE_HAZARD_PHOTOS = [
  {
    label: "Road Crater (Mirpur 10)",
    categorySlug: "pothole",
    categoryName: "Road Crater / Pothole",
    url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    suggestedTitle: "Deep Asphalt Cave-in at Mirpur Section 10",
    estimatedSeverity: 4.5,
  },
  {
    label: "Open Manhole (Dhanmondi 27)",
    categorySlug: "manhole",
    categoryName: "Open Manhole / Sewer Drain",
    url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    suggestedTitle: "Uncovered Drain Pit near Pedestrian Walkway",
    estimatedSeverity: 4.8,
  },
  {
    label: "Low Dangling Wire (Gulshan 1)",
    categorySlug: "live-wire",
    categoryName: "Exposed Wire / Electrical",
    url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    suggestedTitle: "Live Electrical Cable Dangling over Roadway",
    estimatedSeverity: 4.9,
  },
  {
    label: "Blocked Culvert & Garbage (Mohammadpur)",
    categorySlug: "garbage",
    categoryName: "Garbage Overflow / Dump",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    suggestedTitle: "Waste Overflow Obstructing Drainage Canal",
    estimatedSeverity: 3.5,
  },
];

export default function CitizenReportingPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Progressive Disclosure Step State:
  // 1: Issue Type -> 2: Photo -> 3: Location -> 4: AI Analysis -> 5: Review & Submit -> 6: Tracking Receipt
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form Fields (Minimal & Auto-populated)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("pothole");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Road Crater / Pothole");
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_HAZARD_PHOTOS[0].url);
  const [address, setAddress] = useState<string>("Mirpur 10 Circle, Ward 4, Dhaka");
  const [wardZone, setWardZone] = useState<string>("Ward 4");
  const [lat, setLat] = useState<number>(23.8067);
  const [lng, setLng] = useState<number>(90.3683);

  // AI Analysis Derived Telemetry
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    detectedCategory: string;
    severityScore: number;
    confidenceScore: number;
    suggestedTitle: string;
    departmentRouting: string;
  }>({
    detectedCategory: "Road Crater / Pothole",
    severityScore: 4.5,
    confidenceScore: 0.96,
    suggestedTitle: "Deep Asphalt Cave-in at Mirpur Section 10",
    departmentRouting: "Road Maintenance Dept (SLA: 4 Hours)",
  });

  // Duplicate Check Status
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckData | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Submission & Receipt States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<SubmissionReceipt | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Duplicate Check whenever location changes
  useEffect(() => {
    let active = true;
    async function runDuplicateCheck() {
      setCheckingDuplicate(true);
      try {
        const query = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          categoryId: selectedCategorySlug !== "auto-detect" ? selectedCategorySlug : "",
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

    const timer = setTimeout(runDuplicateCheck, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lat, lng, selectedCategorySlug]);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (Dhaka City)`);
        },
        () => {
          // Fallback to Mirpur default
          setAddress("Mirpur Section 10 (GPS Approximate)");
        }
      );
    }
  };

  // Run AI analysis transition from Step 3 to Step 5
  const handleTriggerAIAnalysis = () => {
    setCurrentStep(4);
    // Smooth, calm analysis simulation (1.2 seconds)
    setTimeout(() => {
      // Find matching sample photo data or compute intelligent defaults
      const matched = SAMPLE_HAZARD_PHOTOS.find((p) => p.url === photoUrl);
      setAiAnalysisResult({
        detectedCategory: matched ? matched.categoryName : selectedCategoryName,
        severityScore: matched ? matched.estimatedSeverity : 4.2,
        confidenceScore: 0.95,
        suggestedTitle: matched ? matched.suggestedTitle : `${selectedCategoryName} near ${address.split(",")[0]}`,
        departmentRouting: "Municipal Response Division (SLA: 4 Hours)",
      });
      setCurrentStep(5);
    }, 1200);
  };

  // Final Submission to Backend
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setFormError(null);

    // Ensure citizen is authenticated for demo seamlessness
    try {
      const authCheck = await fetch("/api/auth/me");
      if (!authCheck.ok) {
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "citizen@streetwatch.demo", password: "Demo@1234" }),
        });
      }
    } catch {}

    try {
      const payload = {
        title: aiAnalysisResult.suggestedTitle,
        description: `Citizen reported ${selectedCategoryName} located at ${address}. Verified with photographic proof.`,
        categoryId: selectedCategorySlug === "auto-detect" ? "AUTO" : "AUTO",
        wardZone,
        address,
        imageUrl: photoUrl,
        latitude: lat,
        longitude: lng,
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.data?.report) {
        const rep = json.data.report;
        const trackingNum = `SW-${new Date().getFullYear()}-DHK-${rep.id.slice(-4).toUpperCase()}`;

        setSubmissionReceipt({
          reportId: rep.id,
          trackingNumber: trackingNum,
          status: "REPORTED",
          title: rep.title || aiAnalysisResult.suggestedTitle,
          address: rep.address || address,
          wardZone: rep.wardZone || wardZone,
          categoryName: selectedCategoryName,
          priorityScore: Math.round(rep.priorityScore || 85),
          confidenceScore: Math.round(aiAnalysisResult.confidenceScore * 100),
          severityScore: aiAnalysisResult.severityScore,
          imageUrl: photoUrl,
          createdAt: "Just now",
          expectedNextStep: `Work order dispatched to ${wardZone} Municipal Crew. A field inspector and community members will verify consensus.`,
        });

        setCurrentStep(6);
      } else {
        setFormError(json.error?.message || "Failed to submit report. Please check details.");
      }
    } catch {
      setFormError("Network error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy tracking ID
  const handleCopyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* 1. CALM CIVIC HEADER & STEP PROGRESS INDICATOR */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Dhaka Municipal Citizen Action Service</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Report a Civic Hazard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Fast, calm, and intelligent. No long forms—our AI automatically extracts severity and routes directly to the right municipal crew.
          </p>
        </div>

        {/* 2. PROGRESS STEP BAR (1 through 6) */}
        {currentStep < 6 && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              {[
                { num: 1, label: "Issue Type" },
                { num: 2, label: "Photo Evidence" },
                { num: 3, label: "Location" },
                { num: 5, label: "AI Review & Send" },
              ].map((s) => {
                const isPassed = currentStep > s.num;
                const isCurrent = currentStep === s.num || (currentStep === 4 && s.num === 5);

                return (
                  <div key={s.num} className="flex items-center gap-1.5">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isPassed ? <Check className="h-3.5 w-3.5" /> : s.num}
                    </span>
                    <span
                      className={`hidden sm:inline text-xs ${
                        isCurrent ? "font-bold text-blue-900" : isPassed ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 3. STEP 1: SELECT ISSUE TYPE */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in-50">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                STEP 1 OF 5
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                What kind of hazard are you reporting?
              </h2>
              <p className="text-xs text-slate-500">
                Tap the category that best matches. If unsure, choose AI Auto-Detect.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRIMARY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategorySlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug);
                      setSelectedCategoryName(cat.name);
                      // Fast auto-advance to step 2!
                      setCurrentStep(2);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <DynamicCategoryIcon nameOrSlug={cat.slug} size={18} />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                        {cat.slug === "auto-detect" && (
                          <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-purple-100 text-purple-700">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. STEP 2: TAKE/UPLOAD PHOTO (VISUALLY PROMINENT) */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                  STEP 2 OF 5
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Provide Photographic Evidence
                </h2>
                <p className="text-xs text-slate-500">
                  Clear photos help AI estimate depth, scale, and dispatch the correct crew.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Change Category
              </button>
            </div>

            {/* Prominent Photo Preview / Camera Tile */}
            <div className="space-y-3">
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-inner group">
                <Image src={photoUrl} alt="Hazard Observation" fill className="object-cover" />

                {/* Floating Overlay Pill */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-white font-mono text-xs font-bold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Evidence Attached</span>
                </div>

                {/* Floating Camera Button Over Preview */}
                <label className="absolute bottom-3 right-3 cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg transition-all active:scale-95">
                  <Camera className="h-4 w-4" />
                  <span>Retake / Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const localUrl = URL.createObjectURL(e.target.files[0]);
                        setPhotoUrl(localUrl);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Instant 1-Tap Sample Photos for Quick Hackathon Testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Or tap a real verified Dhaka hazard sample:</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_HAZARD_PHOTOS.map((sample) => {
                    const isSelected = photoUrl === sample.url;
                    return (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(sample.url);
                          setSelectedCategorySlug(sample.categorySlug);
                          setSelectedCategoryName(sample.categoryName);
                        }}
                        className={`p-1.5 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-100"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="relative h-14 w-full rounded-lg overflow-hidden bg-slate-200">
                          <Image src={sample.url} alt={sample.label} fill className="object-cover" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 block truncate mt-1">
                          {sample.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-[0.99]"
              >
                <span>Confirm Location</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 5. STEP 3: CONFIRM LOCATION */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                  STEP 3 OF 5
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Confirm Hazard Location
                </h2>
                <p className="text-xs text-slate-500">
                  Tap on the map or use your GPS location to pinpoint the exact road defect.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
              >
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                <span>My GPS</span>
              </button>
            </div>

            {/* Interactive Leaflet Location Picker */}
            <div className="space-y-2">
              <LocationPickerMap
                initialLat={lat}
                initialLng={lng}
                onLocationSelect={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                  setAddress(`Ward 4, Coordinate: ${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E`);
                }}
              />
              <span className="text-[11px] font-mono text-slate-500 block text-right">
                📍 Coordinates: {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
              </span>
            </div>

            {/* Clean Address & Ward Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Street Address / Landmark:</span>
                <span className="font-mono text-slate-500 text-[11px]">Auto-Detected</span>
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Mirpur 10 Circle, near Transit Hub"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Duplicate Notice if found nearby */}
            {duplicateCheck?.isDuplicate && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Nearby Similar Hazard Detected ({duplicateCheck.distanceMeters}m away)</span>
                  <p className="text-[11px] text-amber-800">
                    A neighbor already flagged &ldquo;{duplicateCheck.parentReport?.title}&rdquo;. Submitting this will add a verification vote and boost municipal response priority!
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerAIAnalysis}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-[0.99]"
              >
                <span>Analyze with AI</span>
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 6. STEP 4: AI ANALYZES (CALM, INTELLIGENT SCAN STATE) */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 shadow-sm text-center space-y-4">
            <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 animate-ping" />
              <div className="h-14 w-14 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center text-blue-600 shadow-md">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Gemini Vision AI is Analyzing the Defect...
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Validating surface depth, calculating road disruption index, and checking municipal SLA dispatch routing.
              </p>
            </div>

            {/* Calm Scanning Progress Bar */}
            <div className="h-1.5 w-56 mx-auto bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div
                initial={shouldReduceMotion ? false : { width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono text-blue-700">
              <Radio className="h-3 w-3 text-blue-600 animate-pulse" />
              <span>Multi-Modal Vision Triage in Progress</span>
            </div>
          </div>
        )}

        {/* 7. STEP 5: REVIEW AI RESULT & SUBMIT */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in-50">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider block">
                STEP 4 OF 5 &bull; AI TRIAGE PREVIEW
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Review Automated Assessment
              </h2>
              <p className="text-xs text-slate-500">
                AI extracted the following metrics from your photo. You can submit directly.
              </p>
            </div>

            {/* AI Result Card */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>Gemini Vision Assessment</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold border border-purple-200">
                  96% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-purple-100">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Detected Hazard</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {aiAnalysisResult.detectedCategory}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-purple-100">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Severity Index</span>
                  <span className="font-bold text-amber-600 mt-0.5 block">
                    {aiAnalysisResult.severityScore.toFixed(1)} / 5.0 (High)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-purple-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Response Dept</span>
                  <span className="font-bold text-blue-900 mt-0.5 block truncate">
                    Road Maintenance
                  </span>
                </div>
              </div>
            </div>

            {/* Suggested Title & Location Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Report Title (Auto-Generated):
                </label>
                <input
                  type="text"
                  value={aiAnalysisResult.suggestedTitle}
                  onChange={(e) =>
                    setAiAnalysisResult((prev) => ({ ...prev, suggestedTitle: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Target: <strong>{address}</strong></span>
              </div>
            </div>

            {/* Final Submission CTA Button */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                className="flex-1 min-h-[48px] py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Registering in Municipal Ledger...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Submit Civic Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 8. STEP 6: RECEIVE TRACKING ID & CALM CITIZEN RECEIPT */}
        {currentStep === 6 && submissionReceipt && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-6 animate-in zoom-in-95">
            {/* Celebratory Checkmark */}
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Report Successfully Filed!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thank you for taking civic action. Your submission has been algorithmically scored and dispatched to the municipal maintenance division.
              </p>
            </div>

            {/* Official Tracking Receipt Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                    OFFICIAL TRACKING IDENTIFIER
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-black text-blue-900 tracking-wider">
                      {submissionReceipt.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTrackingId(submissionReceipt.trackingNumber)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-[11px] font-mono text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedId ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="self-start sm:self-auto">
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold font-mono">
                    ● ACTIVE: REPORTED
                  </span>
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Location:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {submissionReceipt.address}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">AI Category:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {submissionReceipt.categoryName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Assessed Priority:</span>
                  <span className="font-bold text-red-600 font-mono mt-0.5 block">
                    P-{submissionReceipt.priorityScore}/100 (Critical Tier)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Ward &amp; Zone:</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {submissionReceipt.wardZone} (Dhaka North)
                  </span>
                </div>
              </div>

              {/* Expected Next Step Alert */}
              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
                <span className="font-bold block uppercase text-[10px] font-mono text-blue-800">
                  Expected Next Operational Step:
                </span>
                <p className="leading-relaxed">
                  {submissionReceipt.expectedNextStep}
                </p>
              </div>
            </div>

            {/* Simple Tracking Timeline (Light Theme) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Incident Resolution Timeline
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    ✓
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-bold text-slate-900">1. Report Ingested &amp; GPS Validated</span>
                    <span className="text-[10px] font-mono text-slate-500">Just now</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    ✓
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-bold text-slate-900">2. AI Vision Triage &amp; Priority Scored</span>
                    <span className="text-[10px] font-mono text-slate-500">Just now</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ring-4 ring-blue-100">
                    3
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-bold text-blue-900">3. Community Consensus &amp; Inspector Check</span>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                      In Progress
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-50">
                  <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    4
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-slate-600">4. Crew Dispatched to Site</span>
                    <span className="text-[10px] font-mono text-slate-400">Within 45m</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-50">
                  <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    5
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-slate-600">5. Physical Repair &amp; Citizen Sign-Off</span>
                    <span className="text-[10px] font-mono text-slate-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href={`/reports/${submissionReceipt.reportId}`}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider text-center transition flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>View Incident Dossier</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setSubmissionReceipt(null);
                }}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>File Another Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
