"use client";

import { useState, useEffect, useCallback } from "react";

interface EditorSettings {
  theme: "light" | "dark" | "auto";
  fontSize: "SMALL" | "MEDIUM" | "LARGE";
  lineNumbers: boolean;
  wrapLines: boolean;
  autoSave: boolean;
  spellCheck: boolean;
}

const defaultSettings: EditorSettings = {
  theme: "auto",
  fontSize: "MEDIUM",
  lineNumbers: false,
  wrapLines: false,
  autoSave: true,
  spellCheck: true,
};

let globalSettings = defaultSettings;
let listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(globalSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const listener = () => {
      setSettings(globalSettings);
    };

    listeners.push(listener);

    fetchSettings();

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/users/settings");

      if (response.ok) {
        const data = await response.json();

        const newSettings = {
          theme: data.theme || defaultSettings.theme,
          fontSize: data.fontSize || defaultSettings.fontSize,
          lineNumbers: data.lineNumbers ?? defaultSettings.lineNumbers,
          wrapLines: data.wrapLines ?? defaultSettings.wrapLines,
          autoSave: data.autoSave ?? defaultSettings.autoSave,
          spellCheck: data.spellCheck ?? defaultSettings.spellCheck,
        };

        globalSettings = newSettings;
        setSettings(newSettings);
        notifyListeners();
      }
    } catch (error) {
      console.error("Failed to fetch editor settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSettings();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<EditorSettings>) => {
    try {
      const response = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const updatedSettings = { ...globalSettings, ...newSettings };
        globalSettings = updatedSettings;
        setSettings(updatedSettings);
        notifyListeners();

        return true;
      }
    } catch (error) {
      console.error("Failed to update editor settings:", error);
    }
    return false;
  };

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
