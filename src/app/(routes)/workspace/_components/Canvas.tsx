"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { FILE } from "@/shared/types/file.interface";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

interface CanvasProps {
  onSaveTrigger: number;
  fileId: string;
  fileData: FILE | null;
}

export default function Canvas({
  onSaveTrigger,
  fileId,
  fileData,
}: CanvasProps) {
  const [whiteBoardData, setWhiteBoardData] = useState<any>([]);
  const [permissions, setPermissions] = useState<"VIEW" | "EDIT">("VIEW");
  const excalidrawRef = useRef<any>(null);
  const { activeTeam } = useActiveTeam();

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
    if (fileData?.whiteboard) {
      try {
        setWhiteBoardData(JSON.parse(fileData.whiteboard));
      } catch (e) {
        console.error("Failed to parse whiteboard data:", e);
      }
    }
  }, [fileData]);

  useEffect(() => {
    if (onSaveTrigger && permissions === "EDIT") saveWhiteboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const saveWhiteboard = async () => {
    if (permissions !== "EDIT") {
      console.log("❌ No permission to save whiteboard");
      return;
    }

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

      if (!res.ok) throw new Error("Failed to save whiteboard");

      console.log("✅ Whiteboard saved successfully!");
    } catch (error) {
      console.error("❌ Error saving whiteboard:", error);
    }
  };

  const onChange = (elements: any) => {
    if (permissions === "EDIT") {
      setWhiteBoardData(elements);
    }
  };

  return (
    <div style={{ height: "90vh", width: "100%" }} className="relative">
      {fileData && (
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
      )}
    </div>
  );
}
