"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "streetwatch-theme";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  mounted: boolean;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemResolvedTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveThemeMode(mode: ThemeMode): ResolvedTheme {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return getSystemResolvedTheme();
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    // Ignore storage read failures in restricted contexts
  }
  return "light";
}

function applyThemeToDocument(mode: ThemeMode, resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  const syncTheme = useCallback((nextMode: ThemeMode, persist: boolean) => {
    const resolved = resolveThemeMode(nextMode);
    setThemeState(nextMode);
    setResolvedTheme(resolved);
    applyThemeToDocument(nextMode, resolved);

    if (persist && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
      } catch {
        // Ignore storage write failures in restricted contexts
      }
    }
  }, []);

  useEffect(() => {
    const initialMode = readStoredThemeMode();
    syncTheme(initialMode, false);
    setMounted(true);
  }, [syncTheme]);

  useEffect(() => {
    if (!mounted || theme !== "system" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const nextResolved = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(nextResolved);
      applyThemeToDocument("system", nextResolved);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [mounted, theme]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      syncTheme(next, true);
    },
    [syncTheme]
  );

  const toggleTheme = useCallback(() => {
    const nextResolved: ResolvedTheme = resolvedTheme === "dark" ? "light" : "dark";
    syncTheme(nextResolved, true);
  }, [resolvedTheme, syncTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, mounted, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
