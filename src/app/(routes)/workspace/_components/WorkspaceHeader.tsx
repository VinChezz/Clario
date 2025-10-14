"use client";

import { Button } from "@/components/ui/button";
import { Link, Save, Share } from "lucide-react";
import Image from "next/image";
import React from "react";
import { FILE } from "@/shared/types/file.interface";
import { redirect } from "next/navigation";
import ShareButton from "./share-button/ShareButton";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useEffect, useState } from "react";

interface WorkspaceHeaderProps {
  file?: FILE;
  onSave: () => void;
}

export default function WorkspaceHeader({
  file,
  onSave,
}: WorkspaceHeaderProps) {
  const { activeTeam } = useActiveTeam();
  const [permissions, setPermissions] = useState<"VIEW" | "EDIT">("VIEW");

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

        console.log("🔐 WorkspaceHeader Permissions:", {
          isCreator,
          isEditor,
          permissions: isCreator || isEditor ? "EDIT" : "VIEW",
        });
      } catch (err) {
        console.error("Error determining permissions:", err);
        setPermissions("VIEW");
      }
    };
    determinePermissions();
  }, [activeTeam]);

  const canEdit = permissions === "EDIT";

  const handleSave = () => {
    if (!canEdit) {
      console.log("❌ No permission to save");
      return;
    }
    onSave();
  };

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
      </div>
    </div>
  );
}
