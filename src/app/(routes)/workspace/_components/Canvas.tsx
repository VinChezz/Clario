"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { FILE } from "@/shared/types/file.interface";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { usePresence } from "@/hooks/usePresence";
import { useVersionManager } from "@/hooks/useVersionManager";
import { PresenceIndicator } from "./PresenceIndicator";
import { VersionHistory } from "./VersionHistory";
import { toast } from "sonner";
import { EditorCanvasHeader } from "./header/EditorCanvasHeader";

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
  const excalidrawRef = useRef<any>(null);

  const { activeTeam } = useActiveTeam();

  const { activeUsers, updatePresence, startPresenceUpdates } =
    usePresence(fileId);

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
    const determinePermissions = async () => {
      try {
        const userRes = await fetch("/api/auth/user");
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const dbUser = await userRes.json();

        if (!activeTeam || !dbUser) {
          setPermissions("VIEW");
          return;
        }

        const isCreator = activeTeam.createdById === dbUser.id;
        const isEditor = activeTeam.members?.some(
          (member: any) => member.userId === dbUser.id && member.role === "EDIT"
        );

        setPermissions(isCreator || isEditor ? "EDIT" : "VIEW");
      } catch (err) {
        console.error("Error determining permissions:", err);
        setPermissions("VIEW");
      }
    };

    determinePermissions();
  }, [activeTeam]);

  useEffect(() => {
    if (fileId && permissions === "EDIT") {
      const cleanup = startPresenceUpdates();
      return cleanup;
    }
  }, [fileId, permissions, startPresenceUpdates]);

  useEffect(() => {
    if (fileData?.whiteboard) {
      try {
        const data = JSON.parse(fileData.whiteboard);
        setWhiteBoardData(data);
        lastElementCount.current = data.length;
      } catch (e) {
        console.error("Failed to parse whiteboard data:", e);
      }
    }
  }, [fileData]);

  // Обробник ручного збереження
  useEffect(() => {
    if (onSaveTrigger && permissions === "EDIT") {
      handleManualSave();
    }
  }, [onSaveTrigger]);

  useEffect(() => {
    const tryRefresh = () => {
      try {
        excalidrawRef.current?.readyPromise?.then((api: any) => api.refresh());
      } catch (e) {}
    };

    const t = setTimeout(tryRefresh, 50);
    window.addEventListener("resize", tryRefresh);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", tryRefresh);
    };
  }, [fileData]);

  // Функція для створення автоматичної версії
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

  // Ручне збереження
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

      // Створюємо версію
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

  const onChange = useCallback(
    (elements: any) => {
      if (permissions === "EDIT") {
        setWhiteBoardData(elements);

        // Перевіряємо зміни для автоматичних версій
        if (elements && elements.length > 0 && autoVersioning) {
          checkAndCreateAutoVersion(elements);
        }

        updatePresence({
          status: "EDITING",
          cursor: { position: 0 },
        });
      }
    },
    [permissions, updatePresence, autoVersioning, checkAndCreateAutoVersion]
  );

  // Завантажуємо версії при відкритті історії
  useEffect(() => {
    if (showVersionHistory) {
      fetchVersions();
    }
  }, [showVersionHistory, fetchVersions]);

  // Обробник відновлення версії
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

            <div className="flex-1">
              <Excalidraw
                excalidrawAPI={(api) => (excalidrawRef.current = api)}
                theme="light"
                initialData={{ elements: whiteBoardData }}
                onChange={onChange}
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
