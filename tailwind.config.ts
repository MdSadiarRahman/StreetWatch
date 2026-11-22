import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        slate: {
          900: "#0F172A",
          600: "#475569",
          400: "#94A3B8",
          200: "#E2E8F0",
          50: "#F8FAFC",
        },
        brand: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
          border: "#BFDBFE",
        },
        status: {
          critical: "#DC2626",
          criticalBg: "#FEF2F2",
          criticalBorder: "#FECACA",
          inProgress: "#D97706",
          inProgressBg: "#FFFBEB",
          inProgressBorder: "#FDE68A",
          verified: "#2563EB",
          verifiedBg: "#EFF6FF",
          verifiedBorder: "#BFDBFE",
          resolved: "#059669",
          resolvedBg: "#ECFDF5",
          resolvedBorder: "#A7F3D0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
        bento: "0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
