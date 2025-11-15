"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import SideNav from "./_components/SideNav";
import { FileListContext } from "@/app/_context/FileListContext";
import {
  useIsLargeTablet,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from "@/hooks/useMediaQuery";
import Dashboard from "./page";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user }: any = useKindeBrowserClient();
  const [fileList_, setFileList_] = useState();
  const [isChecking, setIsChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeTablet = useIsLargeTablet();
  const isDesktop = useIsDesktop();

  const skipTeamCheck = searchParams.get("skipTeamCheck") === "true";

  useEffect(() => {
    if (user) {
      if (!skipTeamCheck) {
        checkTeam();
      } else {
        console.log("⚡ Skipping team check");
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [user, skipTeamCheck]);

  const checkTeam = async () => {
    try {
      setIsChecking(true);
      const resp = await fetch("/api/teams", {
        method: "GET",
        cache: "no-store",
      });

      const result = await resp.json();

      if (Array.isArray(result) && result.length === 0) {
        router.push("/teams/create");
      }
    } catch (err) {
      console.error("❌ Error checking team:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleMenuToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getSidebarWidth = () => {
    if (isMobile) return "w-72";
    if (isTablet) return "w-64";
    if (isLargeTablet) return "w-64";
    return "w-64";
  };

  return (
    <FileListContext.Provider value={{ fileList_, setFileList_ }}>
      <div className="flex h-screen w-full bg-white overflow-hidden">
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-300"
            onClick={handleCloseSidebar}
          />
        )}

        <div
          className={`
            fixed lg:static
            top-0 left-0
            h-screen
            z-50
            transition-all duration-300 ease-in-out
            ${getSidebarWidth()}
            ${
              isSidebarOpen
                ? "translate-x-0 shadow-2xl"
                : "-translate-x-full lg:translate-x-0 lg:shadow-none"
            }
          `}
        >
          <div className="h-full bg-white border-r border-gray-200">
            <SideNav
              onCloseSidebar={handleCloseSidebar}
              isMobileMenuOpen={isSidebarOpen}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Dashboard onMenuToggle={handleMenuToggle} />
          </div>
        </div>
      </div>
    </FileListContext.Provider>
  );
}

export default DashboardLayout;
