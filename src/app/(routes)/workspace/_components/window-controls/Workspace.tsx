"use client";
import React, { useState, useCallback } from "react";
import Editor from "../Editor";
import Canvas from "../Canvas";
import { WindowMode, ActiveComponent } from "@/types/window.interface";
import { FILE } from "@/shared/types/file.interface";
import { useIsMobile } from "@/hooks/useIsMobile";

interface WorkspaceProps {
  fileId: string;
  fileData: FILE | null;
  onSaveTrigger: number;
  onSaveSuccess?: () => void;
  onVersionRestore?: (content: string, type: "document" | "whiteboard") => void;
}

export default function Workspace({
  fileId,
  fileData,
  onSaveTrigger,
  onSaveSuccess,
  onVersionRestore,
}: WorkspaceProps) {
  const isMobile = useIsMobile();

  const [windowMode, setWindowMode] = useState<WindowMode>(
    isMobile ? "fullscreen" : "split"
  );
  const [activeComponent, setActiveComponent] = useState<ActiveComponent>(
    isMobile ? "editor" : "editor"
  );

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

  if (windowMode === "fullscreen") {
    return (
      <div className="h-full w-full">
        {activeComponent === "editor" ? (
          <Editor
            fileId={fileId}
            fileData={fileData}
            onSaveTrigger={onSaveTrigger}
            onSaveSuccess={onSaveSuccess}
            onVersionRestore={onVersionRestore}
            currentComponent="editor"
            {...commonWindowProps}
          />
        ) : (
          <Canvas
            onSaveTrigger={onSaveTrigger}
            fileId={fileId}
            fileData={fileData}
            onVersionRestore={onVersionRestore}
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
          onSaveTrigger={onSaveTrigger}
          onSaveSuccess={onSaveSuccess}
          onVersionRestore={onVersionRestore}
          currentComponent="editor"
          {...commonWindowProps}
        />
      </div>
      <div className="flex-1">
        <Canvas
          onSaveTrigger={onSaveTrigger}
          fileId={fileId}
          fileData={fileData}
          onVersionRestore={onVersionRestore}
          currentComponent="canvas"
          {...commonWindowProps}
        />
      </div>
    </div>
  );
}
