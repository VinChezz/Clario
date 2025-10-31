"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { FILE } from "@/shared/types/file.interface";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import LogoClarioLoader from "@/app/_loaders/ClarioLoader";
import { ActiveComponent, WindowMode } from "@/types/window.interface";
import dynamic from "next/dynamic";
import WorkspaceHeader from "../_components/header/WorkspaceHeader";
import { useIsMobile } from "@/hooks/useIsMobile";

const Editor = dynamic(() => import("../_components/Editor"), {
  loading: () => <div>Loading Editor...</div>,
  ssr: false,
});

const Canvas = dynamic(() => import("../_components/Canvas"), {
  loading: () => <div>Loading Canvas...</div>,
  ssr: false,
});

export default function WorkspacePage() {
  const isMobile = useIsMobile();
  const params = useParams();
  const fileId = params.fieldId as string;

  const [fileData, setFileData] = useState<FILE | null>(null);
  const [triggerSave, setTriggerSave] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [windowMode, setWindowMode] = useState<WindowMode>(
    isMobile ? "fullscreen" : "fullscreen"
  );
  const [activeComponent, setActiveComponent] = useState<ActiveComponent>(
    isMobile ? "editor" : "editor"
  );

  const [dividerPercent, setDividerPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (isMobile) {
      setWindowMode("fullscreen");
      setActiveComponent("editor");
    } else {
      setWindowMode("split");
      setActiveComponent("editor");
    }
  }, [isMobile]);

  useEffect(() => {
    if (windowMode === "split" && activeComponent !== "both") {
      setActiveComponent("both");
    }
  }, [windowMode, activeComponent]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    // УБИРАЕМ userSelect: 'none' - это основная проблема!
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    draggingRef.current = false;
    document.body.style.cursor = "default";
    // УБИРАЕМ сброс userSelect - это ломает скролл!
    window.dispatchEvent(new Event("resize"));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  const onMouseMoveWindow = useCallback((e: MouseEvent) => {
    if (!draggingRef.current) return;
    const container = splitRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let percent = (px / rect.width) * 100;
    percent = Math.max(10, Math.min(90, percent));
    setDividerPercent(percent);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMoveWindow);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", onMouseMoveWindow);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMoveWindow);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onMouseMoveWindow]);

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

        setFileData((prev) =>
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
  }, [refreshFileData]);

  const handleWindowModeChange = useCallback((mode: WindowMode) => {
    setWindowMode(mode);
    if (mode === "split") setActiveComponent("both");
  }, []);

  const handleActiveComponentChange = useCallback(
    (component: ActiveComponent) => {
      setActiveComponent(component);
    },
    []
  );

  useEffect(() => {
    const fetchFileData = async () => {
      if (!fileId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/files/${fileId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setFileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setFileData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFileData();
  }, [fileId]);

  if (!fileId || isLoading) return <LogoClarioLoader />;

  if (error)
    return (
      <div className="p-4">
        <h2>Error loading file</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reload
        </button>
      </div>
    );

  if (!fileData)
    return (
      <div className="p-4">
        <h2>File not found</h2>
        <p>File with ID {fileId} was not found.</p>
      </div>
    );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <WorkspaceHeader
        file={fileData}
        onSave={() => setTriggerSave((prev) => prev + 1)}
        windowMode={windowMode}
        activeComponent={activeComponent}
        onWindowModeChange={handleWindowModeChange}
        onActiveComponentChange={handleActiveComponentChange}
        currentComponent={activeComponent}
      />

      {windowMode === "split" ? (
        <div
          ref={splitRef}
          className="flex flex-1 relative overflow-hidden min-w-0"
        >
          <div
            className="flex-1 min-w-0 overflow-hidden"
            style={{ flexBasis: `${dividerPercent}%` }}
          >
            <Editor
              onSaveTrigger={triggerSave}
              fileId={fileId}
              fileData={fileData}
              onSaveSuccess={handleSaveSuccess}
              onVersionRestore={handleVersionRestore}
              windowMode="split"
              activeComponent="both"
              onWindowModeChange={handleWindowModeChange}
              onActiveComponentChange={handleActiveComponentChange}
              currentComponent="editor"
            />
          </div>

          <div
            onMouseDown={startDrag}
            className="w-[5px] cursor-col-resize z-20 bg-gray-200"
            aria-hidden
          />

          <div
            className="flex-1 min-w-0 overflow-hidden"
            style={{ flexBasis: `${100 - dividerPercent}%` }}
          >
            <Canvas
              onSaveTrigger={triggerSave}
              fileId={fileId}
              fileData={fileData}
              onVersionRestore={handleVersionRestore}
              windowMode="split"
              activeComponent="both"
              onWindowModeChange={handleWindowModeChange}
              onActiveComponentChange={handleActiveComponentChange}
              currentComponent="canvas"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {activeComponent === "editor" ? (
            <Editor
              onSaveTrigger={triggerSave}
              fileId={fileId}
              fileData={fileData}
              onSaveSuccess={handleSaveSuccess}
              onVersionRestore={handleVersionRestore}
              windowMode={windowMode}
              activeComponent="editor"
              onWindowModeChange={handleWindowModeChange}
              onActiveComponentChange={handleActiveComponentChange}
              currentComponent="editor"
              isFullscreen
            />
          ) : (
            <Canvas
              onSaveTrigger={triggerSave}
              fileId={fileId}
              fileData={fileData}
              onVersionRestore={handleVersionRestore}
              windowMode={windowMode}
              activeComponent="canvas"
              onWindowModeChange={handleWindowModeChange}
              onActiveComponentChange={handleActiveComponentChange}
              currentComponent="canvas"
              isFullscreen
            />
          )}
        </div>
      )}
    </div>
  );
}
