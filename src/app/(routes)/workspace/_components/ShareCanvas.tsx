"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { FILE } from "@/shared/types/file.interface";
import { toast } from "sonner";
import "@excalidraw/excalidraw/index.css";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">Loading whiteboard...</div>
      </div>
    ),
  }
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
  const excalidrawRef = useRef<any>(null);

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

  // ВАЖНО: Сохранение при onSaveTrigger (из WorkspaceHeader)
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
      // Только отмечаем что есть изменения, но не сохраняем автоматически
      if (permissions === "EDIT") {
        setHasUnsavedChanges(true);
      }
    },
    [permissions]
  );

  // Установка readOnly режима через API после инициализации
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

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
        <div className="flex gap-2">
          {permissions !== "VIEW" && (
            <button
              onClick={saveWhiteboard}
              className={`px-3 py-1 rounded text-sm ${
                hasUnsavedChanges
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving
                ? "Saving..."
                : hasUnsavedChanges
                ? "Save Changes"
                : "Saved"}
            </button>
          )}

          <button
            onClick={() => {
              console.log("Current whiteboard data:", whiteBoardData);
              toast.info("Check console for whiteboard data");
            }}
            className="px-3 py-1 bg-gray-300 rounded text-sm"
          >
            Debug data
          </button>

          {permissions === "VIEW" && (
            <span className="px-3 py-1 bg-yellow-200 rounded text-sm">
              Read-only Whiteboard
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {permissions === "EDIT"
            ? hasUnsavedChanges
              ? "Unsaved changes"
              : "All changes saved"
            : "View only"}
        </div>
      </div>

      <div style={{ height: "100%", width: "100%" }}>
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;
          }}
          theme="light"
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
        >
          <MainMenu>
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
            {permissions === "VIEW" && (
              <MainMenu.Item onSelect={() => {}}>
                <div className="text-yellow-600 font-medium">
                  🔒 Read-only Mode
                </div>
              </MainMenu.Item>
            )}
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.MenuItemHelp />
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>
      </div>
    </div>
  );
}
