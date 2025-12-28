"use client";

import React, { useContext, useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import { FileListContext } from "@/app/_context/FileListContext";
import SideNavTopSection, { TEAM } from "./SideNavTopSection";
import SideNavBottomSection from "./SideNavBottomSection";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useIsMobile,
  useIsTablet,
  useIsLargeTablet,
  useIsDesktop,
} from "@/hooks/useMediaQuery";

interface SideNavProps {
  onCloseSidebar?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function SideNav({
  onCloseSidebar,
  isMobileMenuOpen,
  onToggleSidebar,
}: SideNavProps) {
  const { user }: any = useKindeBrowserClient();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const { fileList_, setFileList_ } = useContext(FileListContext);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeTablet = useIsLargeTablet();
  const isDesktop = useIsDesktop();

  const isCollapsibleTablet = isTablet || isLargeTablet;

  useEffect(() => {
    if (activeTeam) getFiles();
    else {
      setFileList_([]);
      setTotalFiles(0);
    }
  }, [activeTeam]);

  const getFiles = async () => {
    if (!activeTeam || !user) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/teams/${activeTeam.id}/files`, {
        method: "GET",
      });
      if (!resp.ok) throw new Error("Failed to fetch files");
      const result = await resp.json();
      setFileList_(result);
      setTotalFiles(result?.length || 0);
    } catch (err) {
      toast.error("Error fetching files");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onFileCreate = async (fileName: string) => {
    if (!activeTeam || !user)
      return toast.error("No team selected or user not authenticated");

    try {
      const resp = await fetch("/api/files/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, teamId: activeTeam.id }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.error || "Error creating file");
        return;
      }

      toast.success("File created successfully!");
      getFiles();
      onCloseSidebar?.();
    } catch (err) {
      console.error(err);
      toast.error("Error creating file");
    }
  };

  const getSidebarWidth = () => {
    if (isMobile) return "w-80";
    if (isCollapsibleTablet) return "w-68";
    return "w-78";
  };

  const getSidebarHeight = () => {
    if (isMobile || isCollapsibleTablet) {
      return "h-[100dvh]";
    }
    return "h-screen";
  };

  const getPadding = () => {
    return "p-3";
  };

  const getSidebarVisibility = () => {
    if (isMobile) {
      return isMobileMenuOpen ? "translate-x-0" : "-translate-x-full";
    }
    if (isCollapsibleTablet) {
      return isMobileMenuOpen ? "translate-x-0" : "-translate-x-full";
    }
    return "translate-x-0";
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 bg-white dark:bg-[#1a1a1c] shadow-xl border-r border-gray-200 dark:border-[#2a2a2d] z-60 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 flex flex-col w-80",
          getSidebarWidth(),
          getSidebarHeight(),
          getSidebarVisibility(),
          isDesktop && "fixed lg:relative"
        )}
        style={{
          height: isMobile ? "100dvh" : "100vh",
          maxHeight: isMobile ? "-webkit-fill-available" : "none",
        }}
      >
        <div
          className={cn(
            "flex items-center justify-between border-gray-100 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c]/95 backdrop-blur-sm shrink-0",
            "p-4",

            isMobile && "pt-[env(safe-area-inset-top,20px)]"
          )}
        >
          <div className="flex items-center gap-3 pt-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img
                src={"/logo-1.png"}
                alt={"logo"}
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-[#f0f0f0]">
              Clario
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseSidebar}
            className="h-8 w-8 lg:hidden text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#2a2a2d]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <SideNavTopSection
              user={user}
              setActiveTeamInfo={setActiveTeam}
              onItemClick={onCloseSidebar}
              fileList_={fileList_}
            />
          </div>

          <div
            className="dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] shrink-0 p-4"
            style={{
              paddingBottom: isMobile
                ? "calc(1rem + env(safe-area-inset-bottom, 20px))"
                : "1rem",
            }}
          >
            <SideNavBottomSection
              totalFiles={totalFiles}
              onFileCreate={onFileCreate}
              onAction={onCloseSidebar}
            />
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 bg-black/40 backdrop-blur-lg z-40 lg:hidden animate-in fade-in duration-300"
        />
      )}
    </>
  );
}
