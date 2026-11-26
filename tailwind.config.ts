import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        borderMuted: "#CBD5E1",
        slate: {
          950: "#020617",
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F1F5F9",
          50: "#F8FAFC",
        },
        civic: {
          DEFAULT: "#1D4ED8",
          hover: "#1E40AF",
          surface: "#FFFFFF",
          muted: "#EFF6FF",
          border: "#BFDBFE",
        },
        brand: {
          DEFAULT: "#1D4ED8",
          hover: "#1E40AF",
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
          resolved: "#047857",
          resolvedBg: "#ECFDF5",
          resolvedBorder: "#A7F3D0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "2xs": "0 1px 1px 0 rgba(15, 23, 42, 0.04)",
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)",
        elevated: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        float: "0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 4px 10px -4px rgba(15, 23, 42, 0.05)",
        glow: "0 0 16px -2px rgba(29, 78, 216, 0.25)",
        overlay: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
        focus: "0 0 0 3px rgba(29, 78, 216, 0.2)",
        "civic-hover": "0 10px 28px -6px rgba(15, 23, 42, 0.10), 0 8px 30px rgba(37, 99, 235, 0.12)",
        "civic-ai": "0 8px 26px -4px rgba(124, 92, 252, 0.14)",
        "civic-success": "0 8px 24px -4px rgba(18, 183, 106, 0.14)",
        "civic-warning": "0 8px 24px -4px rgba(247, 144, 9, 0.14)",
        "civic-critical": "0 8px 24px -4px rgba(217, 45, 32, 0.14)",
      },
      backdropBlur: {
        xs: "2px",
      },
      padding: {
        "0.2": "0.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
