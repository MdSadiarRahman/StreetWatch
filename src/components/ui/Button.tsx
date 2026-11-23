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
  glow?: boolean;
  tactile?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  iconLeft,
  iconRight,
  glow = false,
  tactile = true,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-[11px] font-bold rounded-lg gap-1.5",
    sm: "px-3.5 py-1.5 text-xs font-bold rounded-xl gap-2",
    md: "px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl gap-2",
    lg: "px-6 py-3.5 text-sm sm:text-base font-extrabold rounded-2xl gap-2.5",
  };

  // Base variant styles with glossy highlights and tactile micro-interactions
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white shadow-sm border border-blue-500/40 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/30 before:rounded-t-xl",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-800 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/20 before:rounded-t-xl",
    success:
      "relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm border border-emerald-500/40 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/30 before:rounded-t-xl",
    danger:
      "relative bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-sm border border-rose-500/40 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/30 before:rounded-t-xl",
    warning:
      "relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm border border-amber-400/40 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/30 before:rounded-t-xl",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-slate-300",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent",
    glass:
      "bg-white/80 hover:bg-white text-slate-800 border border-white/60 shadow-2xs backdrop-blur-md",
  };

  // Optional glow aura
  const glowClasses: Record<ButtonVariant, string> = {
    primary: "hover:shadow-glow",
    secondary: "hover:shadow-md",
    success: "hover:shadow-glowEmerald",
    danger: "hover:shadow-lg hover:shadow-rose-500/20",
    warning: "hover:shadow-lg hover:shadow-amber-500/20",
    outline: "hover:shadow-sm",
    ghost: "",
    glass: "hover:shadow-float",
  };

  const tactileClass = tactile ? "transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]" : "transition-colors duration-150";

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none overflow-hidden font-sans tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${glow ? glowClasses[variant] : ""} ${tactileClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
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
