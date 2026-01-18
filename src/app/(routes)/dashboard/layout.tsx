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
import { TourProvider } from "../../_context/TourContext";
import GettingStartedTour from "./_components/GettingStartedTour";
import { FileDataProvider } from "../../_context/FileDataContext";
import { GithubProvider, useGithub } from "@/app/_context/GithubContext";
import { CodeViewerModal } from "./_components/github-modal/_components/CodeViewer";
import { SidebarProvider, useSidebar } from "@/app/_context/SidebarContext";
import GradientLoader from "@/app/_loaders/GradientLoader";
import { FavoritesProvider } from "@/app/_context/FavoritesContext";

function GlobalCodeViewer() {
  const { codeViewerState, setCodeViewerState } = useGithub();

  if (!codeViewerState?.open) return null;

  return (
    <CodeViewerModal
      open={codeViewerState.open}
      onOpenChange={(open) => {
        if (!open) {
          setCodeViewerState({
            open: false,
            filePath: codeViewerState.filePath,
            fileName: codeViewerState.fileName,
            repoUrl: codeViewerState.repoUrl,
            branch: codeViewerState.branch,
            teamId: codeViewerState.teamId,
          });
        }
      }}
      filePath={codeViewerState.filePath}
      fileName={codeViewerState.fileName}
      repoUrl={codeViewerState.repoUrl}
      branch={codeViewerState.branch}
      teamId={codeViewerState.teamId}
    />
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useKindeBrowserClient();
  const [fileList_, setFileList_] = useState();
  const [isChecking, setIsChecking] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeTablet = useIsLargeTablet();
  const isDesktop = useIsDesktop();

  const { isSidebarOpen, closeSidebar } = useSidebar();

  const skipTeamCheck = searchParams.get("skipTeamCheck") === "true";

  useEffect(() => {
    if (user) {
      check2FAStatus();
    } else {
      setIsChecking(false);
      setPageLoading(false);
    }
  }, [user]);

  const check2FAStatus = async () => {
    try {
      const resp = await fetch("/api/auth/2fa/status", {
        method: "GET",
        cache: "no-store",
      });

      const securityStatus = await resp.json();
      console.log("2FA Status:", securityStatus);

      if (securityStatus.isEnabled) {
        setIsChecking(false);
      } else {
        if (!skipTeamCheck) {
          await checkTeam();
        } else {
          console.log("⚡ Skipping team check");
          setIsChecking(false);
        }
      }
    } catch (err) {
      console.error("❌ Error checking 2FA status:", err);

      if (!skipTeamCheck) {
        await checkTeam();
      } else {
        setIsChecking(false);
      }
    }
  };

  const checkTeam = async () => {
    try {
      setIsChecking(true);
      const resp = await fetch("/api/teams", {
        method: "GET",
        cache: "no-store",
      });

      const result = await resp.json();

      if (Array.isArray(result) && result.length === 0) {
        console.log("⚠️ No team found, redirecting to create team");
        router.push("/teams/create");
      } else {
        setIsChecking(false);
        setPageLoading(false);
      }
    } catch (err) {
      console.error("❌ Error checking team:", err);
      setIsChecking(false);
      setPageLoading(false);
    }
  };

  const getSidebarWidth = () => {
    if (isMobile) return "w-72";
    if (isTablet) return "w-64";
    if (isLargeTablet) return "w-64";
    return "w-64";
  };

  if (authLoading || pageLoading) {
    return (
      <div className="w-full bg-white dark:bg-[#1a1a1c]">
        <GradientLoader />
      </div>
    );
  }

  return (
    <TourProvider>
      <FileDataProvider>
        <GithubProvider>
          <FavoritesProvider>
            <FileListContext.Provider value={{ fileList_, setFileList_ }}>
              <div className="flex min-h-screen w-full bg-background overflow-hidden">
                {isMobile && isSidebarOpen && (
                  <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={closeSidebar}
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
                  <div className="h-full bg-background border-r border-gray-200">
                    <SideNav
                      onCloseSidebar={closeSidebar}
                      isMobileMenuOpen={isSidebarOpen}
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <GettingStartedTour />
                    {children}
                  </div>
                </div>
                <GlobalCodeViewer />
              </div>
            </FileListContext.Provider>
          </FavoritesProvider>
        </GithubProvider>
      </FileDataProvider>
    </TourProvider>
  );
}

export default function DashboardLayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SidebarProvider>
  );
}
