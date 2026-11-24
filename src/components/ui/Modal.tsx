"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus & lock background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 8 }
            }
            transition={{
              duration: 0.18,
              ease: [0.16, 1, 0.3, 1], // Precision Swiss curve
            }}
            className={`civic-card relative z-10 w-full ${sizeClasses} bg-white shadow-2xl border border-slate-300 space-y-4 focus:outline-none ${className}`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-5 pb-3">
              <div>
                {title && (
                  <h3 id="modal-title" className="text-base font-bold text-slate-900">
                    {title}
                  </h3>
                )}
                {description && (
                  <p id="modal-description" className="text-xs text-slate-500 font-medium mt-0.5">
                    {description}
                  </p>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-2 text-xs text-slate-700">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 p-4 px-5 rounded-b-lg">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
