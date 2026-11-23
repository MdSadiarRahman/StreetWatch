"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, message, type, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
            error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />,
            warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
            info: <Info className="h-4 w-4 text-civic shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3.5 shadow-overlay text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <span className="mt-0.5">{icons[toast.type || "info"]}</span>
              <div className="flex-1">
                {toast.title && <h5 className="font-bold text-slate-900">{toast.title}</h5>}
                <p className="font-medium text-slate-600 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss toast"
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (msg: string) => console.log("Toast fallback:", msg),
    };
  }
  return ctx;
}
