"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FILE } from "@/shared/types/file.interface";
import { toast } from "sonner";
import "@excalidraw/excalidraw/index.css";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { Save, CheckCircle2, Loader2 } from "lucide-react";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading whiteboard...</div>
      </div>
    ),
  },
);

interface CanvasProps {
  onSaveTrigger: number;
  fileId: string;
  fileData: FILE | null;
  isPublicAccess?: boolean;
  permissions?: "VIEW" | "EDIT";
  onSaveSuccess?: () => void;
}

export default function ShareCanvas({
  onSaveTrigger,
  fileId,
  fileData,
  isPublicAccess = false,
  permissions = "EDIT",
  onSaveSuccess,
}: CanvasProps) {
  const [whiteBoardData, setWhiteBoardData] = useState<any>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const excalidrawRef = useRef<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        window.matchMedia("(prefers-color-scheme: dark)").matches ||
        document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    if (typeof window !== "undefined") {
      checkDarkMode();

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", checkDarkMode);

      return () => mediaQuery.removeEventListener("change", checkDarkMode);
    }
  }, []);

  useEffect(() => {
    if (fileData?.whiteboard) {
      try {
        const parsedData = JSON.parse(fileData.whiteboard);
        setWhiteBoardData(parsedData);
        console.log("✅ Loaded whiteboard data");
      } catch (e) {
        console.error("❌ Failed to parse whiteboard data:", e);
      }
    }
  }, [fileData]);

  useEffect(() => {
    if (onSaveTrigger > 0 && permissions === "EDIT") {
      console.log("🔄 Save triggered for whiteboard");
      saveWhiteboard();
    }
  }, [onSaveTrigger, permissions]);

  const saveWhiteboard = useCallback(async () => {
    if (isSaving || permissions === "VIEW") {
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteboard: JSON.stringify(whiteBoardData),
        }),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      console.log("✅ Whiteboard saved successfully!");
      toast.success("Whiteboard saved successfully!");
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (e) {
      console.error("❌ Error saving whiteboard:", e);
      toast.error("Error saving whiteboard!");
    } finally {
      setIsSaving(false);
    }
  }, [fileId, whiteBoardData, permissions, onSaveSuccess, isSaving]);

  const handleChange = useCallback(
    (elements: readonly any[]) => {
      setWhiteBoardData(elements);

      if (permissions === "EDIT") {
        setHasUnsavedChanges(true);
      }
    },
    [permissions],
  );

  useEffect(() => {
    if (excalidrawRef.current && permissions === "VIEW") {
      excalidrawRef.current.readyPromise.then((api: any) => {
        api.updateScene({
          appState: {
            viewModeEnabled: true,
          },
        });
      });
    }
  }, [permissions]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

    if (diff < 60) return "Saved just now";
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} min ago`;
    return `Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode
            ? "bg-[#1e1e1e] border-[#333]"
            : "bg-gray-50/80 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Whiteboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          {permissions === "EDIT" && (
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <span
                  className={`text-xs ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                >
                  Unsaved changes
                </span>
              ) : lastSaved ? (
                <span
                  className={`text-xs flex items-center gap-1.5 ${
                    isDarkMode ? "text-emerald-400" : "text-emerald-600"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {formatLastSaved()}
                </span>
              ) : null}

              <button
                onClick={saveWhiteboard}
                disabled={isSaving || !hasUnsavedChanges}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    hasUnsavedChanges
                      ? isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                      : isDarkMode
                        ? "bg-emerald-600/80 text-white"
                        : "bg-emerald-600/90 text-white"
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Saved</span>
                  </>
                )}
              </button>
            </div>
          )}

          {permissions === "VIEW" && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span>Read-only mode</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" style={{ height: "100%", width: "100%" }}>
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;
          }}
          theme={isDarkMode ? "dark" : "light"}
          initialData={{ elements: whiteBoardData }}
          onChange={handleChange}
          viewModeEnabled={permissions === "VIEW"}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              toggleTheme: false,
              changeViewBackgroundColor: permissions === "EDIT",
            },
          }}
        />
      </div>
    </div>
  );
}
