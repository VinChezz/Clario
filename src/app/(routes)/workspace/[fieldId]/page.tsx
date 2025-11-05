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

  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    console.log("🔍 WorkspacePage - ActiveTeam state:", {
      activeTeam: activeTeam
        ? {
            id: activeTeam.id,
            name: activeTeam.name,
            createdById: activeTeam.createdById,
            membersCount: activeTeam.members?.length,
          }
        : "NULL",
      teamLoading,
      fileId,
      timestamp: new Date().toISOString(),
    });
  }, [activeTeam, teamLoading, fileId]);

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

  const fetchVersions = useCallback(
    async (forceRefresh = false) => {
      if (!fileId) return;

      setVersionsLoading(true);
      try {
        console.log(`📋 Fetching versions for file: ${fileId}`, {
          forceRefresh,
        });
        const response = await fetch(
          `/api/files/${fileId}/versions?t=${Date.now()}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.warn("Versions API not found, returning empty array");
            setVersions([]);
            return;
          }
          throw new Error(`Failed to fetch versions: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Versions fetched:`, data.length);
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
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    draggingRef.current = false;
    document.body.style.cursor = "default";
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

        console.log(
          `✅ WORKSPACE: ${contentType} version applied to file data`
        );
        console.log(`🔄 Version restore in ${contentType}`, {
          contentType,
          windowMode,
          activeComponent,
        });

        await refreshFileData();
      } catch (error) {
        console.error("Error syncing version:", error);
        toast.error("Failed to sync version");
      }
    },
    [fileId, refreshFileData, windowMode, activeComponent]
  );

  useEffect(() => {
    console.log("🔧 Debug - Current state:", {
      windowMode,
      activeComponent,
      editorSaveHandler: !!editorSaveHandler,
      canvasSaveHandler: !!canvasSaveHandler,
      fileData: !!fileData,
      versionsCount: versions.length,
      activeTeam: !!activeTeam, // ДОБАВЬТЕ ЭТО
      teamLoading, // ДОБАВЬТЕ ЭТО
    });
  }, [
    windowMode,
    activeComponent,
    editorSaveHandler,
    canvasSaveHandler,
    fileData,
    versions,
    activeTeam, // ДОБАВЬТЕ ЭТО
    teamLoading, // ДОБАВЬТЕ ЭТО
  ]);

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
      console.log("🔄 Save already in progress, skipping...");
      return { editor: false, canvas: false };
    }

    setIsSaving(true);

    console.log("💾 Workspace save triggered", {
      windowMode,
      activeComponent,
      editorSaveHandler: !!editorSaveHandler,
      canvasSaveHandler: !!canvasSaveHandler,
      activeTeam: activeTeam?.id, // ДОБАВЬТЕ ЭТО
    });

    try {
      const saveResults = {
        editor: { success: false, message: "" },
        canvas: { success: false, message: "" },
      };

      if (windowMode === "split") {
        if (editorSaveHandler && canvasSaveHandler) {
          const [editorResult, canvasResult] = await Promise.allSettled([
            editorSaveHandler(),
            canvasSaveHandler(),
          ]);

          if (editorResult.status === "fulfilled") {
            saveResults.editor = { success: true, message: "Changes saved" };
          } else {
            saveResults.editor = {
              success: false,
              message: "Document save failed",
            };
            console.error("❌ Editor save failed:", editorResult.reason);
          }

          if (canvasResult.status === "fulfilled") {
            saveResults.canvas = { success: true, message: "Changes saved" };
          } else {
            saveResults.canvas = {
              success: false,
              message: "Whiteboard save failed",
            };
            console.error("❌ Canvas save failed:", canvasResult.reason);
          }
        } else {
          console.error("Save handlers not ready");
        }
      } else if (windowMode === "fullscreen") {
        if (activeComponent === "editor" && editorSaveHandler) {
          await editorSaveHandler();
          saveResults.editor = { success: true, message: "Changes saved" };
        } else if (activeComponent === "canvas" && canvasSaveHandler) {
          await canvasSaveHandler();
          saveResults.canvas = { success: true, message: "Changes saved" };
        } else {
          console.error("Save handler not ready");
        }
      }

      return {
        editor: saveResults.editor.success,
        canvas: saveResults.canvas.success,
      };
    } catch (error) {
      console.error("❌ Error saving components:", error);
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
    activeTeam, // ДОБАВЬТЕ ЭТО
  ]);

  const handleEditorSaveHandlerChange = useCallback(
    (handler: () => Promise<void>) => {
      console.log("✅ Editor save handler registered");
      setEditorSaveHandler(() => handler);
      setIsEditorReady(true);
    },
    []
  );

  const handleCanvasSaveHandlerChange = useCallback(
    (handler: () => Promise<void>) => {
      console.log("✅ Canvas save handler registered");
      setCanvasSaveHandler(() => handler);
      setIsCanvasReady(true);
    },
    []
  );

  // ОБНОВИТЕ УСЛОВИЯ ЗАГРУЗКИ - ДОБАВЬТЕ teamLoading
  if (!fileId || isLoading || teamLoading) return <LogoClarioLoader />;

  // ДОБАВЬТЕ ПРОВЕРКУ НА activeTeam
  if (!activeTeam) {
    return (
      <div className="p-4">
        <h2>No Active Team</h2>
        <p>Please select a team to continue working.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
        >
          Reload Page
        </button>
      </div>
    );
  }

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
        onSave={handleSave}
        windowMode={windowMode}
        activeComponent={activeComponent}
        onWindowModeChange={setWindowMode}
        onActiveComponentChange={setActiveComponent}
        currentComponent="both"
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
            className="w-[5px] cursor-col-resize z-20 bg-gray-200"
            aria-hidden
          />

          <div
            className="flex-1 min-w-0 overflow-hidden"
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
        <div className="flex-1 overflow-hidden">
          {activeComponent === "editor" ? (
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
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
