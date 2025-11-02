"use client";

import { Button } from "@/components/ui/button";
import { Link, Maximize2, Save, Share, Split } from "lucide-react";
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
  onSave: () => void;
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
      await onSave();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasWindowControls = onWindowModeChange && onActiveComponentChange;

  return (
    <div className="p-2 sm:p-3 border-b flex justify-between items-center">
      <div className="flex gap-1 sm:gap-2 items-center">
        <Image
          src={"/logo-1.png"}
          alt={"logo"}
          width={isMobile ? 40 : 50}
          height={isMobile ? 40 : 50}
          onClick={() => redirect("/dashboard")}
          className="cursor-pointer"
        />
        {file && (
          <h2 className="ml-1 text-lg sm:text-xl font-semibold truncate max-w-[150px] sm:max-w-none">
            {file.fileName}
          </h2>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          className="h-8 sm:h-8 text-[10px] sm:text-[12px] gap-1 sm:gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!canEdit || isSaving}
        >
          <Save className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">
            {isSaving ? "Saving..." : "Save"}
          </span>
          {!canEdit && (
            <span className="text-xs hidden sm:inline">(No permission)</span>
          )}
        </Button>

        <ShareButton
          fileId={file?.id || ""}
          fileName={file?.fileName || "Untitled"}
          permissions={permissions}
        />

        {hasWindowControls && (
          <div className="border-r pr-2 sm:pr-4 mr-1 sm:mr-2">
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
