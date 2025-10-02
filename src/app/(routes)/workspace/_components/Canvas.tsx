"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css"; // <- важно: стили Excalidraw
import { FILE } from "@/shared/types/file.interface";

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
  const excalidrawRef = useRef<any>(null);

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
    if (onSaveTrigger) saveWhiteboard();
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
    try {
      await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteboard: JSON.stringify(whiteBoardData),
        }),
      });
      console.log("Whiteboard saved successfully!");
    } catch (error) {
      console.error("Error saving whiteboard:", error);
    }
  };

  return (
    <div style={{ height: "90vh", width: "100%" }}>
      {fileData && (
        <Excalidraw
          excalidrawAPI={(api) => (excalidrawRef.current = api)}
          theme="light"
          initialData={{ elements: whiteBoardData }}
          onChange={(elements) => setWhiteBoardData(elements)}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              toggleTheme: false,
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
      )}
    </div>
  );
}
