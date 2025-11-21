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
  useWindowHeight,
} from "@/hooks/useMediaQuery";
import Image from "next/image";

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
  const windowHeight = useWindowHeight();

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
      return "h-screen";
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
      {(isMobile || isCollapsibleTablet) && isMobileMenuOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 bg-black/40 backdrop-blur-lg z-40 lg:hidden animate-in fade-in duration-300"
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 bg-white shadow-xl border-r border-gray-200 z-50 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 flex flex-col",
          getSidebarWidth(),
          getSidebarHeight(),
          getSidebarVisibility(),
          isDesktop && "fixed lg:relative"
        )}
        style={
          (isMobile || isCollapsibleTablet) && windowHeight
            ? { height: `${windowHeight}px` }
            : {}
        }
      >
        <div
          className={cn(
            "flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-sm shrink-0",
            "p-3"
          )}
        >
          <div className="flex items-center gap-2 px-2">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Image
                src={"/logo-1.png"}
                alt={"logo"}
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Clario
            </div>
          </div>

          {(isMobile || isCollapsibleTablet) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseSidebar}
              className="h-8 w-8"
            >
              {!isLargeTablet && <X className="h-4 w-4 text-gray-600" />}
            </Button>
          )}
        </div>

        {isCollapsibleTablet && !isMobileMenuOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="fixed top-4 left-4 z-40 h-9 w-9 bg-white shadow-lg border border-gray-200 hover:bg-gray-50 lg:hidden"
          >
            <Menu className="h-4 w-4 text-gray-700" />
          </Button>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className={cn("flex-1 overflow-y-auto", getPadding())}>
            <SideNavTopSection
              user={user}
              setActiveTeamInfo={setActiveTeam}
              onItemClick={onCloseSidebar}
              isMobile={isMobile}
              isTablet={isCollapsibleTablet}
              fileList_={fileList_}
            />
          </div>

          <div
            className={cn(
              "border-t border-gray-100 bg-white shrink-0",
              getPadding()
            )}
          >
            <SideNavBottomSection
              totalFiles={totalFiles}
              onFileCreate={onFileCreate}
              isLoading={isLoading}
              onAction={onCloseSidebar}
              isMobile={isMobile}
              isTablet={isCollapsibleTablet}
              windowHeight={windowHeight}
            />
          </div>
        </div>
      </div>
    </>
  );
}
