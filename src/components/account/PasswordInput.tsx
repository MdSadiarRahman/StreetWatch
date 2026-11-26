"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordInputProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  describedBy?: string;
  className?: string;
}

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "Enter password",
  autoComplete,
  required = false,
  disabled = false,
  error = null,
  describedBy,
  className = "",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = [describedBy, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={id}
          name={name || id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          className={`w-full rounded-xl border bg-slate-50/60 py-2.5 pl-10 pr-11 text-sm font-medium text-[#101828] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition disabled:opacity-60 ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-[#E4E7EC] focus:border-[#2563EB] focus:ring-[#2563EB]/20"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-[#101828] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
