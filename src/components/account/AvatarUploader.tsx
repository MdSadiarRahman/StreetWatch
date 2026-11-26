"use client";

import React, { useRef, useState } from "react";
import { Camera, Trash2, Upload, AlertCircle } from "lucide-react";
import { UserAvatar } from "@/components/account/UserAvatar";
import type { Role } from "@/types";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_RAW_FILE_BYTES = 5 * 1024 * 1024; // 5MB input cap before browser downscaling

export interface AvatarUploaderProps {
  name: string;
  role: Role;
  value: string | null;
  onChange: (nextUrl: string | null) => void;
  disabled?: boolean;
}

async function compressImageToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error("Unsupported or corrupted image file."));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Center-crop square thumbnail cleanly
        const minDim = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minDim) / 2);
        const sy = Math.max(0, (img.height - minDim) / 2);
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const webp = canvas.toDataURL("image/webp", 0.86);
        if (webp.startsWith("data:image/webp") && webp.length <= 650_000) {
          resolve(webp);
          return;
        }
        const jpeg = canvas.toDataURL("image/jpeg", 0.85);
        resolve(jpeg);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUploader({
  name,
  role,
  value,
  onChange,
  disabled = false,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Please select a PNG, JPG, or WebP image file.");
      return;
    }

    if (file.size > MAX_RAW_FILE_BYTES) {
      setError("Image file size must be 5MB or smaller.");
      return;
    }

    setProcessing(true);
    try {
      const compressed = await compressImageToAvatarDataUrl(file);
      if (compressed.length > 680_000) {
        setError("Processed avatar exceeds allowed size limit. Please choose a smaller image.");
        return;
      }
      onChange(compressed);
    } catch {
      setError("Unable to process selected image. Please try another photo.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative self-start">
          <UserAvatar name={name} avatarUrl={value} role={role} size="xl" />
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-[#E4E7EC] shadow-xs flex items-center justify-center text-[#2563EB]"
          >
            <Camera className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || processing}
              className="civic-btn-secondary inline-flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-white hover:bg-[#F7F9FC] px-3.5 py-2 min-h-[40px] text-xs font-bold text-[#101828] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>{processing ? "Processing..." : value ? "Replace Photo" : "Upload Photo"}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
                disabled={disabled || processing}
                className="civic-btn-secondary inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 px-3 py-2 min-h-[40px] text-xs font-bold text-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-[#667085]">
            PNG, JPG, or WebP up to 5MB. Automatically cropped and optimized for your civic profile.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelected}
          aria-label="Upload profile avatar image"
          className="hidden"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
