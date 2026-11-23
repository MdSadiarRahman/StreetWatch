import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type AlertType = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  type = "info",
  title,
  children,
  onDismiss,
  className = "",
}: AlertProps) {
  const typeMap: Record<AlertType, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
    info: {
      border: "border-blue-300",
      bg: "bg-blue-50/80",
      text: "text-blue-900",
      icon: <Info className="h-4 w-4 text-civic shrink-0" />,
    },
    success: {
      border: "border-emerald-300",
      bg: "bg-emerald-50/80",
      text: "text-emerald-950",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />,
    },
    warning: {
      border: "border-amber-300",
      bg: "bg-amber-50/80",
      text: "text-amber-950",
      icon: <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />,
    },
    danger: {
      border: "border-rose-300",
      bg: "bg-rose-50/80",
      text: "text-rose-950",
      icon: <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />,
    },
  };

  const config = typeMap[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-3.5 text-xs font-medium ${config.border} ${config.bg} ${config.text} ${className}`}
    >
      <span className="mt-0.5">{config.icon}</span>
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-bold leading-tight">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="rounded p-0.5 text-current opacity-60 hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
