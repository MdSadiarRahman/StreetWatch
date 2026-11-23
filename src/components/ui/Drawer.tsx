"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  size = "md",
  className = "",
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-xl",
  }[size];

  const positionClasses = position === "left" ? "left-0" : "right-0";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={`fixed top-0 bottom-0 ${positionClasses} w-full ${sizeClasses} bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10 ${className}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
}
