"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import dynamic from "next/dynamic";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { useFileData } from "../../_context/FileDataContext";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useLoading } from "@/app/_context/LoadingContext";
import Virgil from "next/font/local";
import { useTheme } from "@/app/_context/AppearanceContext";
import { useTeamData } from "@/hooks/useTeamData";
import { useSocket } from "@/hooks/useSocket";

const Header = dynamic(() => import("./_components/Header"), {
  ssr: false,
  loading: () => <div className="h-16 animate-pulse bg-gray-100" />,
});

const FileList = dynamic(() => import("./_components/FileList"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading files...</p>
      </div>
    </div>
  ),
});

const virgil = Virgil({
  src: "../../fonts/Virgil.woff2",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial", "sans-serif"],
});
interface DashboardProps {
  onMenuToggle?: () => void;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  gradient,
  iconColor,
  id,
}: any) => (
  <div
    id={id}
    className="bg-white dark:bg-[#1a1a1c] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2a2a2d] hover:shadow-md transition-all duration-300 group"
  >
    <div className="flex items-center gap-3 sm:gap-4">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br ${gradient} rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}
      >
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">
          {title}
        </p>
        <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${iconColor}`}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default function Dashboard({ onMenuToggle }: DashboardProps) {
  const { user, isLoading: authLoading } = useKindeBrowserClient();
  const { activeTeam } = useActiveTeam();
  const { fontSize } = useTheme();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { updateFromFileList, fileCount } = useFileData();
  const { setDashboardReady } = useLoading();
  const { isConnected } = useSocket("", user, false);

  const {
    files,
    teamMembers,
    storagePercentage,
    isLoading: dataLoading,
    error,
    refresh,
  } = useTeamData(activeTeam?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        window.location.href =
          "/api/auth/login?post_login_redirect_url=/dashboard";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!dataLoading) {
      const timer = setTimeout(() => {
        setDashboardReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dataLoading, setDashboardReady]);

  useEffect(() => {
    if (files.length > 0) {
      updateFromFileList(files);
    } else if (!dataLoading && files.length === 0) {
      console.log("📁 No files, resetting FileDataContext");
      updateFromFileList([]);
    }
  }, [files, dataLoading, updateFromFileList, isConnected]);

  const handleFileUpdate = useCallback(
    (updatedFiles: any[]) => {
      console.log("📝 File update received:", updatedFiles.length);
      updateFromFileList(updatedFiles);
      refresh();
    },
    [updateFromFileList, refresh],
  );

  const getPaddingClasses = useMemo(() => {
    if (fontSize === "LARGE") {
      if (isMobile) return "px-6";
      if (isTablet) return "px-8";
      return "px-10";
    }
    if (fontSize === "SMALL") return "";
    return "px-1";
  }, [fontSize, isMobile, isTablet]);

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a1a1c] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">
            Error loading data
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-white dark:bg-[#1a1a1c] shadow-xl border-r border-gray-200 dark:border-[#2a2a2d] transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${getPaddingClasses}`}
    >
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuToggle={onMenuToggle} onTeamUpdate={refresh} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1
                className={`${virgil.className} text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-[#f0f0f0] mb-1 sm:mb-2`}
              >
                Welcome back,
                <span
                  className={`${virgil.className} text-indigo-500 dark:text-[#3b82f6]`}
                >
                  {user?.given_name ? ` ${user.given_name}` : ""}!
                </span>
              </h1>
              <p className="text-gray-600 dark:text-[#a0a0a0] text-sm sm:text-sm lg:text-lg">
                Here are your recent files and documents
              </p>
            </div>

            <div
              className={`grid gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 ${
                isMobile
                  ? "grid-cols-1"
                  : isTablet
                    ? "grid-cols-2"
                    : "grid-cols-3"
              }`}
            >
              <StatCard
                id="total-files-card"
                icon={FileTextIcon}
                title="Total Files"
                value={dataLoading ? "0" : fileCount || 0}
                gradient="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                id="team-members-card"
                icon={UsersIcon}
                title="Team Members"
                value={dataLoading ? "0" : teamMembers || 0}
                gradient="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
                iconColor="text-green-600 dark:text-green-400"
              />
              <StatCard
                id="storage-card"
                icon={CloudIcon}
                title="Storage Used"
                value={
                  dataLoading ? "0%" : `${Math.round(storagePercentage || 0)}%`
                }
                gradient="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
                iconColor="text-purple-600 dark:text-purple-400"
              />
            </div>

            <div
              className="bg-white dark:bg-[#1a1a1c] rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2a2d] p-4 sm:p-6 lg:p-8"
              id="file-list-container"
            >
              <FileList
                key={`filelist-${activeTeam?.id}`}
                files={files}
                onFileUpdate={handleFileUpdate}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const CloudIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z"
    />
  </svg>
);
