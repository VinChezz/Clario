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
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";

const Editor = dynamic(() => import("../_components/Editor"), {
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#a0a0a0]">
      Loading editor...
    </div>
  ),
  ssr: false,
});

const Canvas = dynamic(() => import("../_components/Canvas"), {
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-[#a0a0a0]">
      Loading canvas...
    </div>
  ),
  ssr: false,
});

export default function WorkspacePage() {
  const isMobile = useIsMobile();
  const params = useParams();
  const fileId = params.fieldId as string;
  const { activeTeam, isLoading: teamLoading } = useActiveTeam();

  const [fileData, setFileData] = useState<FILE | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [windowMode, setWindowMode] = useState<WindowMode>("split");
  const [activeComponent, setActiveComponent] =
    useState<ActiveComponent>("both");
  const [isSaving, setIsSaving] = useState(false);

  const [editorSaveHandler, setEditorSaveHandler] = useState<
    (() => Promise<void>) | null
  >(null);
  const [canvasSaveHandler, setCanvasSaveHandler] = useState<
    (() => Promise<void>) | null
  >(null);

  const [dividerPercent, setDividerPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setWindowMode("fullscreen");
      setActiveComponent("editor");
    } else {
      setWindowMode("split");
      setActiveComponent("both");
    }
  }, [isMobile]);

  useEffect(() => {
    if (windowMode === "split" && activeComponent !== "both") {
      setActiveComponent("both");
    }
  }, [windowMode, activeComponent]);

  const fetchVersions = useCallback(
    async (forceRefresh = false) => {
      if (!fileId) return;

      setVersionsLoading(true);
      try {
        const response = await fetch(
          `/api/files/${fileId}/versions?t=${Date.now()}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setVersions([]);
            return;
          }
          throw new Error(`Failed to fetch versions: ${response.status}`);
        }

        const data = await response.json();
        setVersions(data);
      } catch (error) {
        console.error("Error fetching versions:", error);
        setVersions([]);
      } finally {
        setVersionsLoading(false);
      }
    },
    [fileId]
  );

  useEffect(() => {
    if (fileId) {
      fetchVersions();
    }
  }, [fileId, fetchVersions]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    draggingRef.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "";

    window.dispatchEvent(new Event("resize"));
  };

  const onMouseMoveWindow = useCallback((e: MouseEvent) => {
    if (!draggingRef.current) return;
    const container = splitRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let percent = (px / rect.width) * 100;
    percent = Math.max(25, Math.min(75, percent));
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

        await refreshFileData();
        toast.success("Version restored successfully");
      } catch (error) {
        console.error("Error syncing version:", error);
        toast.error("Failed to restore version");
      }
    },
    [fileId, refreshFileData]
  );

  const handleSaveSuccess = useCallback(async () => {
    await refreshFileData();
    await fetchVersions(true);
  }, [refreshFileData, fetchVersions]);

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

  const handleSave = useCallback(async () => {
    if (isSaving) {
      console.log("Save already in progress, skipping...");
      return { editor: false, canvas: false };
    }

    setIsSaving(true);

    try {
      const saveResults = {
        editor: false,
        canvas: false,
      };

      if (windowMode === "split") {
        if (editorSaveHandler && canvasSaveHandler) {
          const [editorResult, canvasResult] = await Promise.allSettled([
            editorSaveHandler(),
            canvasSaveHandler(),
          ]);

          saveResults.editor = editorResult.status === "fulfilled";
          saveResults.canvas = canvasResult.status === "fulfilled";

          if (editorResult.status === "rejected") {
            console.error("Editor save failed:", editorResult.reason);
          }
          if (canvasResult.status === "rejected") {
            console.error("Canvas save failed:", canvasResult.reason);
          }
        }
      } else if (windowMode === "fullscreen") {
        if (activeComponent === "editor" && editorSaveHandler) {
          await editorSaveHandler();
          saveResults.editor = true;
        } else if (activeComponent === "canvas" && canvasSaveHandler) {
          await canvasSaveHandler();
          saveResults.canvas = true;
        }
      }

      if (saveResults.editor || saveResults.canvas) {
        toast.success("Changes saved successfully");
      }

      return saveResults;
    } catch (error) {
      console.error("Error saving components:", error);
      toast.error("Failed to save changes");
      return { editor: false, canvas: false };
    } finally {
      setIsSaving(false);
    }
  }, [
    windowMode,
    activeComponent,
    editorSaveHandler,
    canvasSaveHandler,
    isSaving,
  ]);

  const handleEditorSaveHandlerChange = useCallback(
    (handler: () => Promise<void>) => {
      setEditorSaveHandler(() => handler);
    },
    []
  );

  const handleCanvasSaveHandlerChange = useCallback(
    (handler: () => Promise<void>) => {
      setCanvasSaveHandler(() => handler);
    },
    []
  );

  if (!fileId || isLoading || teamLoading) {
    return (
      <div>
        <LogoClarioLoader />
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-gray-200 dark:bg-[#252528] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f0f0f0] mb-2">
            No Active Team
          </h2>
          <p className="text-gray-600 dark:text-[#a0a0a0] mb-6">
            Please select a team to continue working.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f0f0f0] mb-2">
            Error Loading File
          </h2>
          <p className="text-gray-600 dark:text-[#a0a0a0] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 dark:bg-[#252528] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#f0f0f0] mb-2">
            File Not Found
          </h2>
          <p className="text-gray-600 dark:text-[#a0a0a0]">
            File with ID {fileId} was not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0a] overflow-hidden">
      <WorkspaceHeader
        file={fileData}
        onSave={handleSave}
        windowMode={windowMode}
        activeComponent={activeComponent}
        onWindowModeChange={handleWindowModeChange}
        onActiveComponentChange={handleActiveComponentChange}
        currentComponent="both"
      />

      {windowMode === "split" ? (
        <div
          ref={splitRef}
          className="flex flex-1 relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]"
        >
          <div
            className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-[#1a1a1c] rounded-r-lg shadow-sm border-r border-gray-100 dark:border-[#2a2a2d]"
            style={{ flexBasis: `${dividerPercent}%` }}
          >
            <Editor
              fileId={fileId}
              fileData={fileData}
              onSaveSuccess={handleSaveSuccess}
              onVersionRestore={handleVersionRestore}
              windowMode={windowMode}
              activeComponent={activeComponent}
              onWindowModeChange={handleWindowModeChange}
              onActiveComponentChange={handleActiveComponentChange}
              currentComponent="editor"
              isFullscreen={false}
              onSaveHandlerChange={handleEditorSaveHandlerChange}
              versions={versions}
              versionsLoading={versionsLoading}
              onRefreshVersions={fetchVersions}
            />
          </div>

          <div
            onMouseDown={startDrag}
            className={`w-1 cursor-col-resize z-20 bg-gray-300 dark:bg-[#2a2a2d] hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors ${
              isDragging ? "bg-blue-500 dark:bg-blue-600" : ""
            }`}
            aria-label="Resize panels"
          />

          <div
            className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-[#1a1a1c] rounded-l-lg shadow-sm border-l border-gray-100 dark:border-[#2a2a2d]"
            style={{ flexBasis: `${100 - dividerPercent}%` }}
          >
            <Canvas
              fileId={fileId}
              fileData={fileData}
              onVersionRestore={handleVersionRestore}
              windowMode={windowMode}
              activeComponent={activeComponent}
              onWindowModeChange={handleWindowModeChange}
              onActiveComponentChange={handleActiveComponentChange}
              currentComponent="canvas"
              isFullscreen={false}
              onSaveHandlerChange={handleCanvasSaveHandlerChange}
              onSaveSuccess={handleSaveSuccess}
              versions={versions}
              versionsLoading={versionsLoading}
              onRefreshVersions={fetchVersions}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
          {activeComponent === "editor" ? (
            <div className="h-full bg-white dark:bg-[#1a1a1c] rounded-lg shadow-sm border border-gray-100 dark:border-[#2a2a2d]">
              <Editor
                fileId={fileId}
                fileData={fileData}
                onSaveSuccess={handleSaveSuccess}
                onVersionRestore={handleVersionRestore}
                windowMode={windowMode}
                activeComponent="editor"
                onWindowModeChange={handleWindowModeChange}
                onActiveComponentChange={handleActiveComponentChange}
                currentComponent="editor"
                isFullscreen={true}
                onSaveHandlerChange={handleEditorSaveHandlerChange}
                versions={versions}
                versionsLoading={versionsLoading}
                onRefreshVersions={fetchVersions}
              />
            </div>
          ) : (
            <div className="h-full bg-white dark:bg-[#1a1a1c] rounded-lg shadow-sm border border-gray-100 dark:border-[#2a2a2d]">
              <Canvas
                fileId={fileId}
                fileData={fileData}
                onVersionRestore={handleVersionRestore}
                windowMode={windowMode}
                activeComponent="canvas"
                onWindowModeChange={handleWindowModeChange}
                onActiveComponentChange={handleActiveComponentChange}
                currentComponent="canvas"
                isFullscreen={true}
                onSaveHandlerChange={handleCanvasSaveHandlerChange}
                onSaveSuccess={handleSaveSuccess}
                versions={versions}
                versionsLoading={versionsLoading}
                onRefreshVersions={fetchVersions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
