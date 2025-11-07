"use client";

import { Button } from "@/components/ui/button";
import { Save, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import React from "react";
import { FILE } from "@/shared/types/file.interface";
import { redirect } from "next/navigation";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useEffect, useState } from "react";
import { ActiveComponent, WindowMode } from "@/types/window.interface";
import { WindowControlsPopover } from "../window-controls/WindowControlsPopover";
import ShareButton from "../share-button/ShareButton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";

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
  const { activeTeam } = useActiveTeam();
  const [permissions, setPermissions] = useState<"ADMIN" | "VIEW" | "EDIT">(
    "VIEW"
  );
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

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

  const canEdit = permissions === "ADMIN" || permissions === "EDIT";

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

  return (
    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
      <div className="flex items-center gap-3">
        <Image
          src={"/logo-1.png"}
          alt={"logo"}
          width={32}
          height={32}
          onClick={() => redirect("/dashboard")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />

        {file && (
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
              {file.fileName}
            </h2>
            <span className="text-xs text-gray-500">
              {activeTeam?.name || "Workspace"}
            </span>
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
              ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              : "text-gray-400"
          } ${isSaving ? "animate-pulse" : ""}`}
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
          <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-1">
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
