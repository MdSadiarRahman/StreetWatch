"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-xl",
  }[size];

  const positionClasses = position === "left" ? "left-0" : "right-0";
  const initialOffset = position === "left" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex"
        >
          {/* Calm Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { x: initialOffset, opacity: 0.95 }
            }
            animate={{ x: 0, opacity: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { x: initialOffset, opacity: 0.95 }
            }
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1], // Precision Swiss curve
            }}
            className={`fixed top-0 bottom-0 ${positionClasses} w-full ${sizeClasses} bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10 ${className}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0">
              {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-700">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
