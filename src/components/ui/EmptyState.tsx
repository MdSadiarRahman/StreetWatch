import React from "react";
import { AlertCircle, Inbox } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`civic-card p-10 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export interface LoadingStateProps {
  message?: string;
  label?: string;
  className?: string;
}

export function LoadingState({
  message,
  label,
  className = "",
}: LoadingStateProps) {
  const displayMessage = message || label || "Loading operational data...";
  return (
    <div
      className={`p-10 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="h-6 w-6 border-2 border-civic border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-medium">{displayMessage}</span>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load information",
  message = "A network or server error occurred. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`civic-card p-8 text-center flex flex-col items-center justify-center space-y-3 border-red-200 bg-red-50/30 ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-rose-700">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-tactile rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
