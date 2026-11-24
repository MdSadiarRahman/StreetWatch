"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Calm, fast, purposeful page transition wrapper.
 * Communicates continuity and state change without distraction.
 * Automatically respects prefers-reduced-motion.
 */
export function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1], // Precision Swiss curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
