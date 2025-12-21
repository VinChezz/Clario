"use client";

import { Button } from "@/components/ui/button";
import { Save, MoreHorizontal, RefreshCw } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { FILE } from "@/shared/types/file.interface";
import { redirect } from "next/navigation";
import { ActiveComponent, WindowMode } from "@/types/window.interface";
import { WindowControlsPopover } from "../window-controls/WindowControlsPopover";
import ShareButton from "../share-button/ShareButton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";
import { useFilePermissions } from "@/hooks/useFilePermissions";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";

interface WorkspaceHeaderProps {
  file?: FILE;
  onSave: () => Promise<{ editor: boolean; canvas: boolean }>;
  windowMode: WindowMode;
  activeComponent: ActiveComponent;
  onWindowModeChange?: (mode: WindowMode) => void;
  onActiveComponentChange?: (component: ActiveComponent) => void;
  currentComponent: "editor" | "canvas" | "both";
}

export default function WorkspaceHeader({
  file,
  onSave,
  windowMode,
  activeComponent,
  onWindowModeChange,
  onActiveComponentChange,
  currentComponent,
}: WorkspaceHeaderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  const { activeTeam } = useActiveTeam();

  const {
    permissions,
    canEdit,
    isLoading: permissionsLoading,
  } = useFilePermissions();

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("No permission to save");
      return;
    }

    setIsSaving(true);
    try {
      const results = await onSave();

      if (results.editor || results.canvas) {
        toast.success("Changes saved");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const hasWindowControls = onWindowModeChange && onActiveComponentChange;

  if (permissionsLoading) {
    return (
      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2a2a2d] flex justify-between items-center bg-white dark:bg-[#1a1a1c] animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-[#2a2a2d] rounded"></div>
        <div className="h-9 w-24 bg-gray-200 dark:bg-[#2a2a2d] rounded"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2a2a2d] flex justify-between items-center bg-white dark:bg-[#1a1a1c]">
      <div className="flex items-center gap-3">
        <Image
          src={"/logo-1.png"}
          alt={"logo"}
          width={32}
          height={32}
          onClick={() => redirect("/dashboard")}
          className="cursor-pointer hover:opacity-80 transition-opacity dark:invert"
        />

        {file && (
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#f0f0f0] truncate max-w-[180px]">
              {file.fileName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                {activeTeam?.name || "Workspace"}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  permissions === "ADMIN"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                    : permissions === "EDIT"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-[#2a2a2d] text-gray-700 dark:text-gray-400"
                }`}
              >
                {permissions}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={!canEdit || isSaving}
          className={`h-9 px-3 gap-2 font-medium transition-all duration-200 ${
            canEdit
              ? "text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528] hover:text-gray-900 dark:hover:text-[#f0f0f0]"
              : "text-gray-400 dark:text-[#707070] cursor-not-allowed opacity-50"
          } ${isSaving ? "animate-pulse" : ""}`}
          title={
            !canEdit ? "View-only mode. No permission to save." : "Save changes"
          }
        >
          <Save className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">
            {isSaving ? "Saving..." : "Save"}
          </span>
        </Button>

        <ShareButton
          fileId={file?.id || ""}
          fileName={file?.fileName || "Untitled"}
          permissions={permissions}
        />

        {hasWindowControls && (
          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-[#2a2a2d] pl-2 ml-1">
            <WindowControlsPopover
              windowMode={windowMode}
              activeComponent={activeComponent}
              onWindowModeChange={onWindowModeChange}
              onActiveComponentChange={onActiveComponentChange}
              currentComponent={currentComponent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
