"use client";

import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { FileListContext } from "@/app/_context/FileListContext";
import SideNavTopSection, { TEAM } from "./SideNavTopSection";
import SideNavBottomSection from "./SideNavBottomSection";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";

export default function SideNav() {
  const { user }: any = useKindeBrowserClient();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const { fileList_, setFileList_ } = useContext(FileListContext);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTeam) {
      getFiles();
    } else {
      setFileList_([]);
      setTotalFiles(0);
    }
  }, [activeTeam]);

  const onFileCreate = async (fileName: string) => {
    if (!activeTeam || !user) {
      toast.error("No team selected or user not authenticated");
      return;
    }

    try {
      const resp = await fetch("/api/files/", {
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
      console.error("File creation error:", err);
      toast.error("Error while creating file");
    }
  };

  const getFiles = async () => {
    if (!activeTeam || !user) {
      console.log("No active team or user");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔄 Fetching files for team:", activeTeam.id);

      const resp = await fetch(`/api/teams/${activeTeam.id}/files`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      console.log("📡 Response status:", resp.status);

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.error("❌ Failed to fetch files:", resp.status, errorData);

        if (resp.status === 401) {
          toast.error("Please log in to access files");
        } else if (resp.status === 404) {
          toast.error("Team not found or access denied");
        } else {
          toast.error(errorData.error || "Failed to load files");
        }
        return;
      }

      const result = await resp.json();
      console.log("✅ Files fetched successfully:", result.length, "files");

      setFileList_(result);
      setTotalFiles(result?.length || 0);
    } catch (err) {
      console.error("💥 Error fetching files:", err);
      toast.error("Network error while loading files");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen fixed w-72 border-r border-[1px] p-6 flex flex-col">
      <div className="flex-1">
        <SideNavTopSection user={user} setActiveTeamInfo={setActiveTeam} />
      </div>
      <div>
        <SideNavBottomSection
          totalFiles={totalFiles}
          onFileCreate={onFileCreate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
