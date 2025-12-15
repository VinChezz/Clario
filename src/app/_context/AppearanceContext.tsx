"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Theme = "LIGHT" | "DARK" | "AUTO";
type FontSize = "SMALL" | "MEDIUM" | "LARGE";

interface ApperanceContextType {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
  isDark: boolean;
  fontClass: string;
  toggleTheme: () => void;
}

const ApperanceContext = createContext<ApperanceContextType | undefined>(
  undefined
);

const fontSizeClasses = {
  SMALL: "text-sm",
  MEDIUM: "text-base",
  LARGE: "text-lg",
};

export function ApperanceProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("AUTO");
  const [fontSize, setFontSizeState] = useState<FontSize>("MEDIUM");

  const { data: settings } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/settings");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (settings) {
      if (settings.theme) setThemeState(settings.theme);
      if (settings.fontSize) setFontSizeState(settings.fontSize);
    }
    setMounted(true);
  }, [settings]);

  const isDark = React.useMemo(() => {
    if (!mounted) return false;
    if (theme === "DARK") return true;
    if (theme === "LIGHT") return false;

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [isDark, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.style.fontSize =
      {
        SMALL: "14px",
        MEDIUM: "16px",
        LARGE: "18px",
      }[fontSize] || "16px";
  }, [fontSize, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "AUTO") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      setThemeState("AUTO");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setFontSize = (newFontSize: FontSize) => {
    setFontSizeState(newFontSize);
  };

  const toggleTheme = () => {
    const newTheme = theme === "LIGHT" ? "DARK" : "LIGHT";
    setTheme(newTheme);
  };

  const value = {
    theme,
    fontSize,
    setTheme,
    setFontSize,
    isDark,
    fontClass: fontSizeClasses[fontSize],
    toggleTheme,
  };

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ApperanceContext.Provider value={value}>
      <div
        className={`${fontSizeClasses[fontSize]} transition-all duration-200`}
      >
        {children}
      </div>
    </ApperanceContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ApperanceContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
