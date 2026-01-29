"use client";

import { Button } from "@/components/ui/button";
import { Save, MoreHorizontal, RefreshCw } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { FILE } from "@/shared/types/file.interface";
import { redirect } from "next/navigation";
import { ActiveComponent, WindowMode } from "@/types/window.interface";
import { WindowControlsPopover } from "../window-controls/WindowControlsPopover";
import ShareButton from "../share-button/ShareButton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";
import { useFilePermissions } from "@/hooks/useFilePermissions";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useStorage } from "@/hooks/useStorage";
import { calculateVersionSize } from "@/lib/fileSizeCalculator";

interface WorkspaceHeaderProps {
  file?: FILE;
  onSave: () => Promise<{ editor: boolean; canvas: boolean }>;
  windowMode: WindowMode;
  activeComponent: ActiveComponent;
  onWindowModeChange?: (mode: WindowMode) => void;
  onActiveComponentChange?: (component: ActiveComponent) => void;
  currentComponent: "editor" | "canvas" | "both";
  currentContent?: {
    editor?: string;
    canvas?: string;
  };
}

export default function WorkspaceHeader({
  file,
  onSave,
  windowMode,
  activeComponent,
  onWindowModeChange,
  onActiveComponentChange,
  currentComponent,
  currentContent,
}: WorkspaceHeaderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  const { activeTeam } = useActiveTeam();
  const storageHook = useStorage(activeTeam?.id);

  const {
    permissions,
    canEdit,
    isLoading: permissionsLoading,
  } = useFilePermissions();

  const checkStorageBeforeSave = (): { canSave: boolean; message?: string } => {
    if (!storageHook.data) {
      return { canSave: false, message: "Storage data not loaded" };
    }

    const usedBytes = BigInt(storageHook.data.storage.usedBytes);
    const limitBytes = BigInt(storageHook.data.storage.limitBytes);
    const currentPercentage = storageHook.percentage;

    if (currentPercentage >= 100) {
      return {
        canSave: false,
        message: "Storage is full! Delete files or upgrade plan",
      };
    }

    let estimatedVersionSize = BigInt(75 * 1024 * 1024);

    if (currentContent) {
      if (currentContent.editor) {
        estimatedVersionSize += calculateVersionSize(
          currentContent.editor,
          "document",
        );
      }
      if (currentContent.canvas) {
        estimatedVersionSize += calculateVersionSize(
          currentContent.canvas,
          "whiteboard",
        );
      }
    }

    const newUsedBytes = usedBytes + estimatedVersionSize;
    if (newUsedBytes > limitBytes) {
      const overLimitMB = Number(newUsedBytes - limitBytes) / (1024 * 1024);
      return {
        canSave: false,
        message: `Not enough storage. Need ${Math.ceil(overLimitMB)}MB more`,
      };
    }

    return { canSave: true };
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("No permission to save");
      return;
    }

    const storageCheck = checkStorageBeforeSave();
    if (!storageCheck.canSave) {
      toast.error(storageCheck.message || "Cannot save due to storage limits");
      return;
    }

    setIsSaving(true);
    try {
      const results = await onSave();

      if (results.editor || results.canvas) {
        toast.success("Changes saved");
        storageHook.refresh();
      }
    } catch (error: any) {
      console.error("Error saving:", error);

      if (
        error.message?.includes("storage") ||
        error.message?.includes("limit")
      ) {
        toast.error("Storage limit reached. Cannot save version.");
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (storageHook.data && storageHook.percentage >= 80) {
      const warningMessage =
        storageHook.percentage >= 95
          ? `Storage almost full (${Math.round(storageHook.percentage)}%). Save may fail soon.`
          : `Storage usage high (${Math.round(storageHook.percentage)}%). Consider cleaning up.`;

      const showWarning =
        storageHook.percentage >= 90 ||
        (storageHook.percentage >= 80 &&
          !localStorage.getItem("storageWarningShown"));

      if (showWarning && canEdit) {
        toast.warning(warningMessage, {
          duration: 5000,
        });
        localStorage.setItem("storageWarningShown", "true");
      }
    }
  }, [storageHook.percentage, storageHook.data, canEdit]);

  const getSaveButtonState = () => {
    if (!canEdit) {
      return {
        disabled: true,
        title: "View-only mode. No permission to save.",
        className:
          "text-gray-400 dark:text-[#707070] cursor-not-allowed opacity-50",
      };
    }

    const storageCheck = checkStorageBeforeSave();
    if (!storageCheck.canSave) {
      return {
        disabled: true,
        title: storageCheck.message || "Storage limit reached",
        className:
          "text-red-400 dark:text-red-400 cursor-not-allowed opacity-70",
      };
    }

    return {
      disabled: isSaving,
      title: "Save changes",
      className:
        "text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528] hover:text-gray-900 dark:hover:text-[#f0f0f0]",
    };
  };

  const saveButtonState = getSaveButtonState();
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
              {storageHook.percentage >= 90 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 animate-pulse">
                  {Math.round(storageHook.percentage)}% full
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saveButtonState.disabled}
          className={`h-9 px-3 gap-2 font-medium transition-all duration-200 ${saveButtonState.className} ${
            isSaving ? "animate-pulse" : ""
          }`}
          title={saveButtonState.title}
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

        {storageHook.data && (
          <div className="flex items-center gap-1 text-xs">
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-[#2a2a2d] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  storageHook.percentage >= 90
                    ? "bg-red-500"
                    : storageHook.percentage >= 80
                      ? "bg-amber-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(storageHook.percentage, 100)}%` }}
              />
            </div>
            <span className="text-gray-500 dark:text-[#a0a0a0]">
              {Math.round(storageHook.percentage)}%
            </span>
          </div>
        )}

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
