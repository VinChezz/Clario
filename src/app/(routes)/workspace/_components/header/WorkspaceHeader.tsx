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

interface WorkspaceHeaderProps {
  file?: FILE;
  onSave: () => void;
  windowMode: WindowMode;
  activeComponent: ActiveComponent;
  onWindowModeChange?: (mode: WindowMode) => void;
  onActiveComponentChange?: (component: ActiveComponent) => void;
  currentComponent: "editor" | "canvas";
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

  const handleSave = () => {
    if (!canEdit) {
      console.log("❌ No permission to save");
      return;
    }
    onSave();
  };

  const hasWindowControls = onWindowModeChange && onActiveComponentChange;

  return (
    <div className="p-3 border-b flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <Image
          src={"/logo-1.png"}
          alt={"logo"}
          width={50}
          height={50}
          onClick={() => redirect("/dashboard")}
          className="cursor-pointer"
        />
        {file && (
          <h2 className="ml-1 text-xl font-semibold">{file.fileName}</h2>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button
          className="h-8 text-[12px] gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!canEdit}
        >
          <Save className="h-4 w-4" />
          Save
          {!canEdit && <span className="text-xs">(No permission)</span>}
        </Button>
        <ShareButton
          fileId={file?.id || ""}
          fileName={file?.fileName || "Untitled"}
          permissions={permissions}
        />

        {hasWindowControls && (
          <div className="border-r pr-4 mr-2">
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
