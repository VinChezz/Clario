"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { FILE } from "@/shared/types/file.interface";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { usePresence } from "@/hooks/usePresence";
import { useVersionManager } from "@/hooks/useVersionManager";
import { VersionHistory } from "./VersionHistory";
import { toast } from "sonner";
import { EditorCanvasHeader } from "./header/EditorCanvasHeader";
import { throttle } from "lodash";
import { useRealtimeCanvasCursor } from "@/hooks/useRealtimeCanvasCursor";
import { useRealtimeCanvasContent } from "@/hooks/useRealtimeCanvasContent";
import { useSocket } from "@/hooks/useSocket";
import { CanvasCursorOverlay } from "./collaboration/UserCursorCanvas";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface CanvasProps {
  onSaveTrigger: number;
  fileId: string;
  fileData: FILE | null;
  onVersionRestore?: (content: string, type: "document" | "whiteboard") => void;
}

export default function Canvas({
  onSaveTrigger,
  fileId,
  fileData,
  onVersionRestore,
}: CanvasProps) {
  const [whiteBoardData, setWhiteBoardData] = useState<any>([]);
  const [permissions, setPermissions] = useState<"VIEW" | "EDIT">("VIEW");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTool, setCurrentTool] = useState<
    "selection" | "rectangle" | "ellipse" | "arrow" | "line" | "text" | "hand"
  >("selection");
  const [isInitialized, setIsInitialized] = useState(false);

  const [socketStatus, setSocketStatus] = useState<string>("disconnected");

  const excalidrawRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const { activeTeam } = useActiveTeam();

  // SOCKET HOOKS
  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const { activeUsers, updatePresence, startPresenceUpdates } =
    usePresence(fileId);
  const { cursors, sendCursorUpdate, subscribeToCursorUpdates } =
    useRealtimeCanvasCursor(fileId, currentUser);
  const {
    remoteContent,
    sendContentUpdate,
    subscribeToContentUpdates,
    subscribeToContentSync,
  } = useRealtimeCanvasContent(fileId, currentUser);

  const versionManager = useVersionManager({
    fileId,
    fileData,
    onVersionRestore,
  });

  const {
    versions,
    showVersionHistory,
    setShowVersionHistory,
    fetchVersions,
    createManualVersion,
    restoreVersion,
    hasSignificantCanvasChanges,
    lastElementCount,
    autoVersioning,
    isLoading: versionsLoading,
  } = versionManager;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log("👤 FETCHING CURRENT USER...");
        const userRes = await fetch("/api/auth/user");
        console.log("👤 USER RESPONSE STATUS:", userRes.status);

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const dbUser = await userRes.json();
        console.log("👤 USER FETCHED:", {
          name: dbUser.name,
          id: dbUser.id,
          hasId: !!dbUser.id,
        });

        setCurrentUser(dbUser);

        if (!activeTeam || !dbUser) {
          console.log("👤 SET PERMISSIONS: VIEW (no team or user)");
          setPermissions("VIEW");
          return;
        }

        const isCreator = activeTeam.createdById === dbUser.id;
        const isEditor = activeTeam.members?.some(
          (member: any) => member.userId === dbUser.id && member.role === "EDIT"
        );

        const newPermissions = isCreator || isEditor ? "EDIT" : "VIEW";
        console.log("👤 SET PERMISSIONS:", newPermissions);
        setPermissions(newPermissions);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        setPermissions("VIEW");
      }
    };

    fetchCurrentUser();
  }, [activeTeam]);

  useEffect(() => {
    if (!currentUser || permissions !== "EDIT") return;

    console.log("🔌 Starting fast realtime services...");

    const unsubscribeContent = subscribeToContentUpdates((content, user) => {
      console.log("⚡ FAST RECEIVE from:", user?.name);

      if (excalidrawRef.current && content) {
        excalidrawRef.current.updateScene({
          elements: content,
          commitToHistory: false,
        });

        setWhiteBoardData(content);

        setTimeout(() => {
          if (excalidrawRef.current) {
            excalidrawRef.current.refresh();
          }
        }, 0);
      }
    });

    const unsubscribeCursors = subscribeToCursorUpdates();

    return () => {
      console.log("🧹 Cleaning up realtime services");
      unsubscribeContent();
      unsubscribeCursors();
    };
  }, [
    currentUser,
    permissions,
    subscribeToContentUpdates,
    subscribeToCursorUpdates,
  ]);
  useEffect(() => {
    if (remoteContent && excalidrawRef.current && isInitialized) {
      console.log("🔄 APPLYING REMOTE CONTENT:", {
        remoteElements: remoteContent.length,
        remoteContentSample: remoteContent.slice(0, 2),
        currentElements: excalidrawRef.current.getSceneElements()?.length || 0,
      });

      try {
        excalidrawRef.current.updateScene({
          elements: remoteContent,
          commitToHistory: false,
        });

        setWhiteBoardData(remoteContent);

        console.log("✅ Remote content applied successfully");

        setTimeout(() => {
          if (excalidrawRef.current) {
            excalidrawRef.current.refresh();
          }
        }, 100);
      } catch (error) {
        console.error("❌ Error applying remote content:", error);
      }
    }
  }, [remoteContent, isInitialized]);

  const generateUserColor = (userId: string): string => {
    const colors = [
      "#3B82F6",
      "#EF4444",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6366F1",
    ];
    const index =
      userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  useEffect(() => {
    console.log("🔌 CANVAS SOCKET STATUS:", {
      isConnected,
      currentUser: currentUser?.name,
      fileId,
      permissions,
    });

    setSocketStatus(isConnected ? "connected" : "disconnected");

    if (!isConnected && currentUser) {
      console.log("🔄 Canvas: Socket disconnected but user exists");
    }
  }, [isConnected, currentUser, fileId, permissions]);

  const sendContentUpdateThrottled = useCallback(
    throttle((elements: any) => {
      if (isConnected && currentUser && permissions === "EDIT") {
        console.log("🚀 FAST SEND:", elements.length);
        sendContentUpdate(elements);
      }
    }, 100),
    [isConnected, currentUser, permissions, sendContentUpdate]
  );

  const handleCanvasMouseMove = useCallback(
    throttle((event: React.MouseEvent) => {
      if (
        !currentUser ||
        permissions !== "EDIT" ||
        !canvasContainerRef.current
      ) {
        return;
      }

      const canvasElement =
        canvasContainerRef.current.querySelector(".excalidraw");
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        sendCursorUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          position: { x: 0, y: 0 },
          tool: currentTool,
          isActive: false,
        });
        return;
      }

      console.log("🖱️ Sending cursor position:", { x, y });

      sendCursorUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: { x, y },
        tool: currentTool,
        isActive: true,
      });

      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }

      mouseMoveTimeoutRef.current = setTimeout(() => {
        sendCursorUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          position: { x, y },
          tool: currentTool,
          isActive: false,
        });
      }, 1000);
    }, 100),
    [currentUser, permissions, sendCursorUpdate, currentTool]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    if (currentUser && permissions === "EDIT") {
      sendCursorUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: { x: 0, y: 0 },
        tool: currentTool,
        isActive: false,
      });

      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    }
  }, [currentUser, permissions, sendCursorUpdate, currentTool]);

  useEffect(() => {
    if (fileData?.whiteboard) {
      try {
        const data = JSON.parse(fileData.whiteboard);
        setWhiteBoardData(data);
        lastElementCount.current = data.length;
        console.log("📁 Loaded whiteboard data:", data.length, "elements");
      } catch (e) {
        console.error("Failed to parse whiteboard data:", e);
      }
    }
  }, [fileData]);

  const handleManualSave = useCallback(async () => {
    if (permissions !== "EDIT") {
      console.log("❌ No permission to save whiteboard");
      return;
    }

    try {
      console.log("💾 Manual save triggered...");

      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteboard: JSON.stringify(whiteBoardData),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to save whiteboard:", errorText);
        throw new Error("Failed to save whiteboard");
      }

      console.log("✅ Whiteboard saved successfully!");

      if (autoVersioning) {
        try {
          await createManualVersion({
            name: `Whiteboard manual save ${new Date().toLocaleString()}`,
            description: "Manually created whiteboard version",
            content: JSON.stringify(whiteBoardData),
            type: "whiteboard",
          });
          toast.success("Whiteboard saved with new version!");
        } catch (versionError) {
          console.error("⚠️ Version creation failed:", versionError);
          toast.success("Whiteboard saved! (Version creation failed)");
        }
      } else {
        toast.success("Whiteboard saved!");
      }

      lastElementCount.current = whiteBoardData.length;
    } catch (error) {
      console.error("❌ Error saving whiteboard:", error);
      toast.error("Failed to save whiteboard");
    }
  }, [
    fileId,
    permissions,
    whiteBoardData,
    createManualVersion,
    autoVersioning,
  ]);

  const checkAndCreateAutoVersion = useCallback(
    (elements: any) => {
      if (!autoVersioning) return;

      try {
        if (!elements || elements.length === 0) return;

        const currentElementCount = elements.length;

        if (hasSignificantCanvasChanges(elements, lastElementCount.current)) {
          console.log(`🎯 Major canvas change detected, creating auto-version`);

          createManualVersion({
            name: `Whiteboard auto-save ${new Date().toLocaleString()}`,
            description:
              "Automatically created whiteboard version after major changes",
            content: JSON.stringify(elements),
            type: "whiteboard",
          });

          lastElementCount.current = currentElementCount;
        }
      } catch (error) {
        console.error("❌ Failed to create auto-version:", error);
      }
    },
    [createManualVersion, autoVersioning, hasSignificantCanvasChanges]
  );

  useEffect(() => {
    if (onSaveTrigger && permissions === "EDIT") {
      handleManualSave();
    }
  }, [onSaveTrigger, handleManualSave]);

  useEffect(() => {
    if (showVersionHistory) {
      fetchVersions();
    }
  }, [showVersionHistory, fetchVersions]);

  const handleRestoreVersion = useCallback(
    async (version: any) => {
      try {
        console.log("🔄 Restoring whiteboard version:", version.id);

        await restoreVersion(version.id, "whiteboard");

        toast.success(`Version ${version.version} restored successfully!`);
        setShowVersionHistory(false);
      } catch (error) {
        console.error("❌ Failed to restore version:", error);

        if (error instanceof Error) {
          if (error.message.includes("404")) {
            toast.error("Version or file not found");
          } else if (
            error.message.includes("401") ||
            error.message.includes("403")
          ) {
            toast.error("Access denied");
          } else if (error.message.includes("400")) {
            toast.error("Invalid version data");
          } else {
            toast.error(`Restore failed: ${error.message}`);
          }
        } else {
          toast.error("Failed to restore version");
        }
      }
    },
    [restoreVersion]
  );

  useEffect(() => {
    console.log("🔍 Canvas Debug Info:", {
      currentUser: currentUser?.name,
      permissions,
      cursorsCount: cursors.length,
      currentTool,
      whiteboardElements: whiteBoardData.length,
      isConnected,
      isInitialized,
    });
  }, [
    currentUser,
    permissions,
    cursors,
    currentTool,
    whiteBoardData,
    isConnected,
    isInitialized,
  ]);

  const sendImmediateUpdate = useCallback(
    (elements: any) => {
      if (isConnected && currentUser && permissions === "EDIT") {
        console.log("⚡ IMMEDIATE SEND");
        sendContentUpdate(elements);
      }
    },
    [isConnected, currentUser, permissions, sendContentUpdate]
  );

  const onChange = useCallback(
    (elements: any, appState: any) => {
      if (permissions === "EDIT") {
        console.log("✏️ CANVAS ONCHANGE:", {
          elements: elements?.length || 0,
          tool: appState?.activeTool?.type,
        });

        setWhiteBoardData(elements);

        const isMajorChange =
          appState?.activeTool?.type !== "selection" &&
          appState?.activeTool?.type !== "hand";

        if (isMajorChange) {
          sendImmediateUpdate(elements);
        } else {
          sendContentUpdateThrottled(elements);
        }

        updatePresence({
          status: "EDITING",
          cursor: { position: 0 },
        });

        if (elements && elements.length > 0 && autoVersioning) {
          checkAndCreateAutoVersion(elements);
        }
      }
    },
    [permissions, updatePresence, autoVersioning, checkAndCreateAutoVersion]
  );

  useEffect(() => {
    if (
      isConnected &&
      isInitialized &&
      whiteBoardData &&
      whiteBoardData.length > 0
    ) {
      console.log("🚀 Sending initial content after connection");

      const timer = setTimeout(() => {
        sendContentUpdate(whiteBoardData);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, isInitialized, whiteBoardData, sendContentUpdate]);

  const handleCanvasAction = useCallback(
    (action: string) => {
      if (excalidrawRef.current && permissions === "EDIT") {
        const elements = excalidrawRef.current.getSceneElements();
        sendImmediateUpdate(elements);
      }
    },
    [permissions, sendImmediateUpdate]
  );

  const handleExcalidrawReady = useCallback(
    (api: any) => {
      console.log("🎉 Excalidraw ready - fast init");
      excalidrawRef.current = api;
      setIsInitialized(true);

      const currentElements = api.getSceneElements();
      const shouldApplyData =
        (!currentElements || currentElements.length === 0) &&
        whiteBoardData &&
        whiteBoardData.length > 0;

      if (shouldApplyData) {
        api.updateScene({
          elements: whiteBoardData,
          commitToHistory: false,
        });

        if (isConnected) {
          sendImmediateUpdate(whiteBoardData);
        }
      }
    },
    [whiteBoardData, isConnected, sendImmediateUpdate]
  );

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden">
      <div
        className={`flex-1 relative transition-all duration-200 ${
          showVersionHistory ? "border-r border-gray-200" : ""
        }`}
      >
        {fileData && (
          <div className="w-full h-full flex flex-col">
            <EditorCanvasHeader
              permissions={permissions}
              fileType="whiteboard"
              activeUsers={activeUsers}
              versions={versions}
              versionsLoading={versionsLoading}
              onToggleVersionHistory={() =>
                setShowVersionHistory(!showVersionHistory)
              }
              fetchVersions={fetchVersions}
            />

            <div
              ref={canvasContainerRef}
              className="flex-1 relative"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            >
              <Excalidraw
                excalidrawAPI={handleExcalidrawReady}
                theme="light"
                initialData={{ elements: whiteBoardData }}
                onChange={onChange}
                onPointerDown={() => handleCanvasAction("pointerDown")}
                onPointerUp={() => handleCanvasAction("pointerUp")}
                viewModeEnabled={permissions === "VIEW"}
                UIOptions={{
                  canvasActions: {
                    saveToActiveFile: false,
                    loadScene: false,
                    export: false,
                    toggleTheme: false,
                    changeViewBackgroundColor: permissions === "EDIT",
                  },
                  tools: {
                    image: permissions === "EDIT",
                  },
                }}
              >
                <MainMenu>
                  <MainMenu.DefaultItems.ClearCanvas />
                  <MainMenu.DefaultItems.SaveAsImage />
                  <MainMenu.DefaultItems.ChangeCanvasBackground />
                </MainMenu>

                <WelcomeScreen>
                  <WelcomeScreen.Hints.MenuHint />
                  <WelcomeScreen.Hints.ToolbarHint />
                  <WelcomeScreen.Center>
                    <WelcomeScreen.Center.MenuItemHelp />
                  </WelcomeScreen.Center>
                </WelcomeScreen>
              </Excalidraw>

              {/* Overlay с курсорами */}
              <CanvasCursorOverlay
                cursors={cursors}
                containerRef={canvasContainerRef}
              />
            </div>
          </div>
        )}
      </div>

      {showVersionHistory && (
        <div className="w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <VersionHistory
              versions={versions}
              onRestoreVersion={handleRestoreVersion}
              onClose={() => setShowVersionHistory(false)}
              isLoading={versionsLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
