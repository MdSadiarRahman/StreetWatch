import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "outline"
  | "ghost"
  | "glass";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  tactile?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  iconLeft,
  iconRight,
  tactile = true,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-[11px] font-bold rounded gap-1.5",
    sm: "px-3 py-1.5 text-xs font-bold rounded-md gap-1.5",
    md: "px-4 py-2 text-xs sm:text-sm font-bold rounded-lg gap-2",
    lg: "px-5 py-2.5 text-sm font-bold rounded-lg gap-2.5",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-civic hover:bg-civic-hover text-white shadow-2xs border border-blue-700",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-2xs border border-slate-900",
    success:
      "bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs border border-emerald-800",
    danger:
      "bg-rose-700 hover:bg-rose-800 text-white shadow-2xs border border-rose-800",
    warning:
      "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs border border-amber-700",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs hover:border-slate-400",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent",
    glass:
      "spatial-hud hover:bg-white text-slate-800 shadow-2xs",
  };

  const tactileClass = tactile ? "btn-tactile" : "transition-colors duration-150";

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none font-sans font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${tactileClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-0.5 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{loadingText || "Loading..."}</span>
        </>
      ) : (
        <>
          {iconLeft && <span className="shrink-0">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "xs" | "sm" | "md" | "lg";
  ariaLabel: string;
  icon: React.ReactNode;
}

export function IconButton({
  variant = "outline",
  size = "md",
  ariaLabel,
  icon,
  className = "",
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    xs: "p-1 h-7 w-7 rounded",
    sm: "p-1.5 h-8 w-8 rounded-md",
    md: "p-2 h-9 w-9 rounded-lg",
    lg: "p-2.5 h-10 w-10 rounded-lg",
  }[size];

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-civic hover:bg-civic-hover text-white shadow-2xs border border-blue-700",
    secondary: "bg-slate-900 hover:bg-slate-800 text-white shadow-2xs",
    success: "bg-emerald-700 hover:bg-emerald-800 text-white",
    danger: "bg-rose-700 hover:bg-rose-800 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    outline: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
    glass: "spatial-hud hover:bg-white text-slate-800",
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`btn-tactile inline-flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic ${sizeClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}

export default Button;
