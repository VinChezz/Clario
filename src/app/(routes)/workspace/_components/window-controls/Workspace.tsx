"use client";
import React, { useState, useCallback } from "react";
import Editor from "../Editor";
import Canvas from "../Canvas";
import { WindowMode, ActiveComponent } from "@/types/window.interface";
import { FILE } from "@/shared/types/file.interface";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";

interface WorkspaceProps {
  fileId: string;
  fileData: FILE | null;
  onSaveSuccess?: () => void;
  onVersionRestore?: (content: string, type: "document" | "whiteboard") => void;
}

export default function Workspace({
  fileId,
  fileData: initialFileData,
  onSaveSuccess,
  onVersionRestore,
}: WorkspaceProps) {
  const isMobile = useIsMobile();
  const [fileData, setFileData] = useState<FILE | null>(initialFileData);

  const [windowMode, setWindowMode] = useState<WindowMode>(
    isMobile ? "fullscreen" : "split"
  );
  const [activeComponent, setActiveComponent] = useState<ActiveComponent>(
    isMobile ? "editor" : "editor"
  );

  // Добавьте недостающую функцию refreshFileData
  const refreshFileData = useCallback(async () => {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setFileData(data);
    } catch (err) {
      console.error("Error refreshing file data:", err);
      toast.error("Failed to refresh file data");
    }
  }, [fileId]);

  const handleWindowModeChange = useCallback(
    (mode: WindowMode) => {
      if (isMobile && mode === "split") return;
      setWindowMode(mode);
    },
    [isMobile]
  );

  const handleActiveComponentChange = useCallback(
    (component: ActiveComponent) => {
      setActiveComponent(component);
    },
    []
  );

  const commonWindowProps = {
    windowMode,
    activeComponent,
    onWindowModeChange: handleWindowModeChange,
    onActiveComponentChange: handleActiveComponentChange,
  };

  // Исправленная handleVersionRestore
  const handleVersionRestore = useCallback(
    async (content: string, contentType: "document" | "whiteboard") => {
      try {
        const updateData =
          contentType === "document"
            ? { document: content }
            : { whiteboard: content };

        const res = await fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) throw new Error("Failed to update file");

        setFileData((prev: FILE | null) =>
          prev
            ? {
                ...prev,
                document: contentType === "document" ? content : prev.document,
                whiteboard:
                  contentType === "whiteboard" ? content : prev.whiteboard,
              }
            : null
        );

        toast.success(
          `Version synchronized in ${
            contentType === "document" ? "Editor" : "Canvas"
          }`
        );

        await refreshFileData();
      } catch (error) {
        console.error("Error syncing version:", error);
        toast.error("Failed to sync version");
      }
    },
    [fileId, refreshFileData]
  );

  const handleSaveSuccess = useCallback(async () => {
    await refreshFileData();
    if (onSaveSuccess) {
      onSaveSuccess();
    }
  }, [refreshFileData, onSaveSuccess]);

  if (windowMode === "fullscreen") {
    return (
      <div className="h-full w-full">
        {activeComponent === "editor" ? (
          <Editor
            fileId={fileId}
            fileData={fileData}
            onSaveSuccess={handleSaveSuccess}
            onVersionRestore={handleVersionRestore}
            currentComponent="editor"
            {...commonWindowProps}
          />
        ) : (
          <Canvas
            fileId={fileId}
            fileData={fileData}
            onVersionRestore={handleVersionRestore}
            currentComponent="canvas"
            {...commonWindowProps}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 border-r">
        <Editor
          fileId={fileId}
          fileData={fileData}
          onSaveSuccess={handleSaveSuccess}
          onVersionRestore={handleVersionRestore}
          currentComponent="editor"
          {...commonWindowProps}
        />
      </div>
      <div className="flex-1">
        <Canvas
          fileId={fileId}
          fileData={fileData}
          onVersionRestore={handleVersionRestore}
          currentComponent="canvas"
          {...commonWindowProps}
        />
      </div>
    </div>
  );
}
