"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { FileListContext } from "@/app/_context/FileListContext";
import {
  useIsLargeTablet,
  useIsMobile,
  useIsTablet,
} from "@/hooks/useMediaQuery";
import { TourProvider } from "../../_context/TourContext";
import { FileDataProvider } from "../../_context/FileDataContext";
import { GithubProvider, useGithub } from "@/app/_context/GithubContext";
import { SidebarProvider, useSidebar } from "@/app/_context/SidebarContext";
import { LoadingProvider, useLoading } from "@/app/_context/LoadingContext";
import GradientLoader from "@/app/_loaders/GradientLoader";
import { FavoritesProvider } from "@/app/_context/FavoritesContext";
import { ApperanceProvider } from "@/app/_context/AppearanceContext";
import { cn } from "@/lib/utils";
import { requestManager } from "@/lib/requestManager";
import { Plan } from "@prisma/client";
import { toast } from "sonner";

const SideNav = dynamic(() => import("./_components/SideNav"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-white dark:bg-[#1a1a1c] border-r border-gray-200 dark:border-[#2a2a2d] p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    </div>
  ),
});

const GettingStartedTour = dynamic(
  () => import("./_components/GettingStartedTour"),
  {
    ssr: false,
    loading: () => null,
  },
);

const CodeViewerModal = dynamic(
  () =>
    import("./_components/github-modal/_components/CodeViewer").then((mod) => ({
      default: mod.CodeViewerModal,
    })),
  { ssr: false, loading: () => null },
);

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

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useKindeBrowserClient();
  const [fileList_, setFileList_] = useState();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { setSideNavReady, setDashboardReady, areAllComponentsReady } =
    useLoading();
  const skipTeamCheck = searchParams.get("skipTeamCheck") === "true";
  const pathname = usePathname();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeTablet = useIsLargeTablet();

  const isSuccessPage = pathname === "/dashboard/success";

  useEffect(() => {
    if (!user || skipTeamCheck || isSetupComplete) return;

    let mounted = true;

    const checkSetup = async () => {
      if (requestManager.hasValidCache("auth-setup", "setup")) {
        const setupData = requestManager.getCached("auth-setup") as {
          security: { isEnabled: boolean };
          teams: unknown[];
        };
        if (!mounted || !setupData) return;

        if (
          !setupData.security.isEnabled &&
          Array.isArray(setupData.teams) &&
          setupData.teams.length === 0
        ) {
          router.push("/teams/create");
          return;
        }

        setIsSetupComplete(true);
        return;
      }

      try {
        const setupData = await requestManager.fetch(
          "auth-setup",
          "setup",
          async () => {
            const [securityResp, teamsResp] = await Promise.all([
              fetch("/api/auth/2fa/status"),
              fetch("/api/teams"),
            ]);
            return {
              security: await securityResp.json(),
              teams: await teamsResp.json(),
            };
          },
        );

        if (!mounted) return;

        if (
          !setupData.security.isEnabled &&
          Array.isArray(setupData.teams) &&
          setupData.teams.length === 0
        ) {
          router.push("/teams/create");
          return;
        }

        setIsSetupComplete(true);
      } catch (error) {
        console.error("❌ Setup check failed:", error);
        setIsSetupComplete(true);
      }
    };

    checkSetup();

    return () => {
      mounted = false;
    };
  }, [user, skipTeamCheck, router, isSetupComplete]);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (user) {
        try {
          const res = await fetch("/api/users/subscription-status");
          const data = await res.json();

          if (
            data.plan === Plan.FREE &&
            data.message === "Your subscription has expired"
          ) {
            toast.info(
              "Your subscription has expired. Upgrade to continue using Pro features.",
            );
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        }
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  useEffect(() => {
    if (isSetupComplete && !authLoading) {
      const timer = setTimeout(() => {
        setDashboardReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSetupComplete, authLoading, setDashboardReady]);

  const getSidebarWidth = () => {
    if (isMobile) return "w-72";
    if (isTablet) return "w-64";
    if (isLargeTablet) return "w-64";
    return "w-64";
  };

  if (isSuccessPage) {
    return <>{children}</>;
  }

  if (authLoading || !isSetupComplete) {
    return (
      <div className="w-full bg-white dark:bg-[#1a1a1c]">
        <GradientLoader />
      </div>
    );
  }

  return (
    <FileListContext.Provider value={{ fileList_, setFileList_ }}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-300"
            onClick={closeSidebar}
          />
        )}

        <div
          className={cn(
            "fixed lg:static top-0 left-0 h-screen z-50 transition-all duration-500 ease-in-out",
            getSidebarWidth(),
            isSidebarOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full lg:translate-x-0 lg:shadow-none",
            !areAllComponentsReady && "opacity-0",
            areAllComponentsReady && "opacity-100",
          )}
        >
          <div className="h-full bg-background border-r border-gray-200">
            <Suspense
              fallback={
                <div className="h-full w-full bg-white dark:bg-[#1a1a1c] border-r border-gray-200 dark:border-[#2a2a2d] p-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                  </div>
                </div>
              }
            >
              <SideNav
                onCloseSidebar={closeSidebar}
                isMobileMenuOpen={isSidebarOpen}
              />
            </Suspense>
          </div>
        </div>

        <div
          className={cn(
            "flex-1 flex flex-col h-screen overflow-hidden transition-opacity duration-500 ease-in-out",
            !areAllComponentsReady && "opacity-0",
            areAllComponentsReady && "opacity-100",
          )}
        >
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={null}>
              <GettingStartedTour />
            </Suspense>
            {children}
          </div>
        </div>

        <Suspense fallback={null}>
          <GlobalCodeViewer />
        </Suspense>
      </div>
    </FileListContext.Provider>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApperanceProvider>
      <TourProvider>
        <FileDataProvider>
          <GithubProvider>
            <FavoritesProvider>
              <LoadingProvider>
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
              </LoadingProvider>
            </FavoritesProvider>
          </GithubProvider>
        </FileDataProvider>
      </TourProvider>
    </ApperanceProvider>
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
