"use client";

import React, { useState } from "react";
import ImageUpload from "./ImageUpload";
import LocationPicker from "./LocationPicker";
import CategorySelector, { CategoryOption } from "./CategorySelector";
import SeveritySelector from "./SeveritySelector";
import ConfirmationStep, { DuplicateCheckInfo } from "./ConfirmationStep";

export interface ReportFormData {
  title: string;
  description: string;
  imageUrl: string;
  address: string;
  wardZone: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  severityLevel: number;
}

export interface ReportIssueFormProps {
  categories: CategoryOption[];
  initialData?: Partial<ReportFormData>;
  mapNode?: React.ReactNode;
  duplicateInfo?: DuplicateCheckInfo | null;
  onSubmit: (data: ReportFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  className?: string;
}

export const ReportIssueForm: React.FC<ReportIssueFormProps> = ({
  categories,
  initialData,
  mapNode,
  duplicateInfo,
  onSubmit,
  isSubmitting = false,
  className = "",
}) => {
  const [formData, setFormData] = useState<ReportFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    address: initialData?.address || "Dhanmondi Lake Road",
    wardZone: initialData?.wardZone || "Ward-15",
    latitude: initialData?.latitude || 23.7461,
    longitude: initialData?.longitude || 90.3742,
    categoryId: initialData?.categoryId || categories[0]?.id || "",
    severityLevel: initialData?.severityLevel || 3,
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const selectedCategory = categories.find((c) => c.id === formData.categoryId) || categories[0];

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className={`civic-card bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 ${className}`}>
      {/* Stepper Progress */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
        {[
          { num: 1, label: "Evidence" },
          { num: 2, label: "Location" },
          { num: 3, label: "Details" },
          { num: 4, label: "Review" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-1.5">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                step === s.num
                  ? "bg-blue-600 text-white"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </span>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Image Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <ImageUpload
            value={formData.imageUrl}
            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          />
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!formData.imageUrl}
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Continue to Location
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Location Picker */}
      {step === 2 && (
        <div className="space-y-4">
          <LocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            address={formData.address}
            wardZone={formData.wardZone}
            mapNode={mapNode}
            onLocationChange={(lat, lng, addr, wz) =>
              setFormData((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                address: addr,
                wardZone: wz,
              }))
            }
          />
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Continue to Details
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Category & Severity */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">Issue Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Hazardous Deep Pothole Near Bus Stop"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:border-blue-600 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide context regarding traffic impact or pedestrian risk..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:border-blue-600 outline-none"
            />
          </div>

          <CategorySelector
            categories={categories}
            selectedCategoryId={formData.categoryId}
            onSelect={(id) => setFormData((prev) => ({ ...prev, categoryId: id }))}
          />

          <SeveritySelector
            value={formData.severityLevel}
            onChange={(lvl) => setFormData((prev) => ({ ...prev, severityLevel: lvl }))}
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!formData.title}
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Review Incident
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Pre-submission confirmation */}
      {step === 4 && (
        <ConfirmationStep
          title={formData.title}
          description={formData.description}
          imageUrl={formData.imageUrl}
          address={formData.address}
          wardZone={formData.wardZone}
          latitude={formData.latitude}
          longitude={formData.longitude}
          categoryName={selectedCategory?.name || "Hazard"}
          categorySlug={selectedCategory?.slug || "pothole"}
          severityLevel={formData.severityLevel}
          duplicateInfo={duplicateInfo}
          isSubmitting={isSubmitting}
          onConfirm={handleSubmit}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
};

export default ReportIssueForm;
