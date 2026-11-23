import React from "react";

export interface ContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg" | "full";
  padded?: boolean;
}

export function ContentContainer({
  children,
  size = "default",
  padded = true,
  className = "",
  ...props
}: ContentContainerProps) {
  const sizeClasses = {
    sm: "max-w-4xl",
    default: "max-w-7xl",
    lg: "max-w-[1400px]",
    full: "max-w-full",
  }[size];

  const paddingClasses = padded ? "px-4 sm:px-6 lg:px-8 py-6 sm:py-8" : "";

  return (
    <div
      className={`mx-auto w-full ${sizeClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
