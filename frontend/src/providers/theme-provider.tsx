"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface UseThemeProps {
  theme?: string;
  setTheme: (theme: string) => void;
  resolvedTheme?: "light" | "dark";
  themes: string[];
  systemTheme?: "light" | "dark";
}

const ThemeContext = createContext<UseThemeProps>({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
  themes: ["light", "dark", "system"],
  systemTheme: "light",
});

export function useTheme(): UseThemeProps {
  return useContext(ThemeContext);
}

export interface ThemeProviderProps {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = true,
  storageKey = "theme",
  themes = ["light", "dark", "system"],
  forcedTheme,
}: ThemeProviderProps) {
  // Always start with defaultTheme on both server and first client render
  // to prevent React 19 hydration mismatches. Sync from localStorage after mount.
  const [theme, setThemeState] = useState<string>(defaultTheme);

  // Sync from localStorage after mount (client-only, avoids SSR mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setThemeState(stored);
    } catch {
      // Ignore localStorage errors in restricted contexts
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystem = () => setSystemTheme(media.matches ? "dark" : "light");
    updateSystem();
    media.addEventListener("change", updateSystem);
    return () => media.removeEventListener("change", updateSystem);
  }, []);

  const activeTheme = forcedTheme || theme;

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (activeTheme === "system" && enableSystem) {
      return systemTheme;
    }
    return activeTheme === "dark" ? "dark" : "light";
  }, [activeTheme, enableSystem, systemTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (attribute === "class") {
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    } else {
      root.setAttribute(attribute, resolvedTheme);
    }
  }, [attribute, resolvedTheme]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // Ignore localStorage errors
    }
  };

  const value = useMemo(
    () => ({
      theme: activeTheme,
      setTheme,
      resolvedTheme,
      themes,
      systemTheme,
    }),
    [activeTheme, resolvedTheme, themes, systemTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
