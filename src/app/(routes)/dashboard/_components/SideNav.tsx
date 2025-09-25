"use client";

import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { FileListContext } from "@/app/_context/FileListContext";
import SideNavTopSection, { TEAM } from "./SideNavTopSection";
import SideNavBottomSection from "./SideNavBottomSection";

export default function SideNav() {
  const { user }: any = useKindeBrowserClient();
  const [activeTeam, setActiveTeam] = useState<TEAM | any>();
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const { fileList_, setFileList_ } = useContext(FileListContext);

  useEffect(() => {
    if (activeTeam) getFiles();
  }, [activeTeam]);

  const onFileCreate = async (fileName: string) => {
    if (!activeTeam) return;
    try {
      const resp = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          teamId: activeTeam.id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.error || "Error while creating file");
        return;
      }

      toast.success("File created successfully!");
      getFiles();
    } catch (err) {
      console.error(err);
      toast.error("Error while creating file");
    }
  };

  const getFiles = async () => {
    if (!activeTeam) return;
    try {
      const resp = await fetch(`/api/files?teamId=${activeTeam.id}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!resp.ok) {
        console.error("Failed to fetch files");
        return;
      }
      const result = await resp.json();
      setFileList_(result);
      setTotalFiles(result?.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen fixed w-72 border-r border-[1px] p-6 flex flex-col">
      <div className="flex-1">
        <SideNavTopSection
          user={user}
          setActiveTeamInfo={(team: TEAM) => setActiveTeam(team)}
        />
      </div>
      <div>
        <SideNavBottomSection
          totalFiles={totalFiles}
          onFileCreate={onFileCreate}
        />
      </div>
    </div>
  );
}
