import React from "react";

export type BadgeVariant =
  | "default"
  | "civic"
  | "critical"
  | "warning"
  | "success"
  | "muted"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "xs" | "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const variantClasses: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: "bg-slate-100 text-slate-800 border-slate-200",
      dot: "bg-slate-600",
    },
    civic: {
      container: "bg-blue-50 text-civic border-blue-200",
      dot: "bg-civic",
    },
    critical: {
      container: "bg-rose-50 text-rose-800 border-rose-300",
      dot: "bg-rose-600",
    },
    warning: {
      container: "bg-amber-50 text-amber-800 border-amber-300",
      dot: "bg-amber-600",
    },
    success: {
      container: "bg-emerald-50 text-emerald-800 border-emerald-300",
      dot: "bg-emerald-600",
    },
    muted: {
      container: "bg-slate-50 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },
    outline: {
      container: "bg-transparent text-slate-700 border-slate-300",
      dot: "bg-slate-500",
    },
  };

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded border ${sizeClasses} ${variantClasses[variant].container} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${variantClasses[variant].dot}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export interface StatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "sm", className = "" }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case "RESOLVED":
    case "CITIZEN_VERIFIED":
      return (
        <Badge variant="success" size={size} dot className={className}>
          {normalized === "CITIZEN_VERIFIED" ? "Citizen Verified" : "Resolved"}
        </Badge>
      );
    case "IN_PROGRESS":
    case "ASSIGNED":
      return (
        <Badge variant="warning" size={size} dot className={className}>
          {normalized === "IN_PROGRESS" ? "In Progress" : "Crew Dispatched"}
        </Badge>
      );
    case "CRITICAL":
    case "FAILED_RECOVERY":
      return (
        <Badge variant="critical" size={size} dot className={className}>
          {normalized === "FAILED_RECOVERY" ? "Action Required" : "Critical"}
        </Badge>
      );
    case "AI_TRIAGED":
    case "COMMUNITY_VERIFIED":
    case "PRIORITY_SCORED":
      return (
        <Badge variant="civic" size={size} dot className={className}>
          AI Triaged
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size={size} dot className={className}>
          {status.replace("_", " ")}
        </Badge>
      );
  }
}

export interface PriorityBadgeProps {
  score: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PriorityBadge({ score, size = "sm", className = "" }: PriorityBadgeProps) {
  const rounded = Math.round(score);
  let variant: BadgeVariant = "civic";

  if (rounded >= 80) {
    variant = "critical";
  } else if (rounded >= 60) {
    variant = "warning";
  }

  return (
    <Badge
      variant={variant}
      size={size}
      className={`font-mono text-[11px] font-extrabold ${className}`}
    >
      P-{rounded}/100
    </Badge>
  );
}
