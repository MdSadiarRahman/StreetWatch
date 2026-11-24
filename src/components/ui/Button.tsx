"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

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

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
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
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-[11px] font-bold rounded gap-1.5 min-h-[32px] sm:min-h-[28px]",
    sm: "px-3 py-1.5 text-xs font-bold rounded-md gap-1.5 min-h-[36px]",
    md: "px-4 py-2 text-xs sm:text-sm font-bold rounded-lg gap-2 min-h-[44px]",
    lg: "px-5 py-2.5 text-sm font-bold rounded-lg gap-2.5 min-h-[48px]",
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

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      disabled={isDisabled}
      whileTap={
        shouldReduceMotion || isDisabled
          ? undefined
          : { scale: 0.98, transition: { duration: 0.08, ease: "easeOut" } }
      }
      whileHover={
        shouldReduceMotion || isDisabled || !tactile
          ? undefined
          : { y: -1, transition: { duration: 0.12, ease: "easeOut" } }
      }
      className={`inline-flex items-center justify-center select-none font-sans font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-shadow ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${className}`}
      {...(props as any)}
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
    </motion.button>
  );
}

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
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
  disabled,
  ...props
}: IconButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    xs: "p-1 h-8 w-8 min-h-[36px] min-w-[36px] rounded",
    sm: "p-1.5 h-9 w-9 min-h-[40px] min-w-[40px] rounded-md",
    md: "p-2 h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg",
    lg: "p-2.5 h-12 w-12 min-h-[48px] min-w-[48px] rounded-lg",
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
    <motion.button
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={
        shouldReduceMotion || disabled
          ? undefined
          : { scale: 0.94, transition: { duration: 0.08 } }
      }
      whileHover={
        shouldReduceMotion || disabled
          ? undefined
          : { scale: 1.04, transition: { duration: 0.12 } }
      }
      className={`inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic ${sizeClasses} ${variantClasses[variant]} ${className}`}
      {...(props as any)}
    >
      {icon}
    </motion.button>
  );
}

export default Button;
