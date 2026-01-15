"use client";

import { useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Header from "./_components/Header";
import FileList from "./_components/FileList";
import GradientLoader from "@/app/_loaders/GradientLoader";
import {
  ContentLoader,
  StaggeredLoader,
  StaggeredItem,
} from "./_components/ContentLoader";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { useFileData } from "../../_context/FileDataContext";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import Virgil from "next/font/local";
import { useTheme } from "@/app/_context/AppearanceContext";
import { getTeamWithMembers } from "@/lib/team";

const virgil = Virgil({
  src: "../../fonts/Virgil.woff2",
});

interface DashboardProps {
  onMenuToggle?: () => void;
}

export default function Dashboard({ onMenuToggle }: DashboardProps) {
  const { user, isLoading } = useKindeBrowserClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [storagePercentage, setStoragePercentage] = useState<number>(0);

  const { updateFromFileList, fileCount } = useFileData();
  const { activeTeam } = useActiveTeam();
  const { fontSize } = useTheme();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href =
        "/api/auth/login?post_login_redirect_url=/dashboard";
      return;
    }

    if (user) {
      fetch("/api/auth/[kindeAuth]/kinde_callback")
        .then((res) => res.json())
        .then((data) => {
          setDbUser(data);
          setTimeout(() => setContentLoaded(true), 1000);
        })
        .catch((error) => {
          console.error("Failed to load user:", error);
          setContentLoaded(true);
        });
    }
  }, [user, isLoading]);

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        if (!activeTeam?.id) {
          console.log("❌ No active team found");
          setTeamMembersCount(0);
          setStoragePercentage(0);

          return;
        }

        console.log("🔄 Loading team data for team:", activeTeam.id);

        const teamResponse = await fetch(
          `/api/teams/${activeTeam.id}/members`,
          {
            method: "GET",
          }
        );

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeamMembersCount(teamData.members?.length || 0);
        }

        const storageResponse = await fetch(
          `/api/teams/${activeTeam.id}/storage`
        );

        if (storageResponse.ok) {
          const storageData = await storageResponse.json();

          const usedBytes = Number(storageData.storage?.usedBytes || 0);
          const limitBytes = Number(
            storageData.storage?.limitBytes || 10 * 1024 * 1024 * 1024
          );

          const percentage =
            limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;

          setStoragePercentage(Math.min(percentage, 100));
        }
      } catch (error) {
        console.error("❌ Failed to load team data:", error);
        setTeamMembersCount(0);
        setStoragePercentage(0);
      }
    };

    if (user && activeTeam?.id) {
      loadTeamData();
    } else {
      setTeamMembersCount(0);
      setStoragePercentage(0);
    }
  }, [user, activeTeam?.id]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        if (!activeTeam?.id) {
          console.log("❌ No active team found");
          setFileList([]);
          updateFromFileList([]);
          return;
        }

        console.log("🔄 Loading files for team:", activeTeam.id);

        const response = await fetch(
          `/api/files?teamId=${activeTeam.id}&includeTrashed=false`
        );

        console.log("📡 API Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const files = await response.json();
        console.log("📁 Raw files response:", files);

        const filesArray = Array.isArray(files) ? files : [];

        const activeFiles = Array.isArray(files)
          ? files.filter((file) => !file.deletedAt)
          : [];

        setFileList(activeFiles);
        updateFromFileList(activeFiles);

        console.log("✅ Files loaded successfully:", filesArray.length);
      } catch (error) {
        console.error("❌ Failed to load files:", error);

        setFileList([]);
        updateFromFileList([]);
      }
    };

    if (user && activeTeam?.id) {
      loadFiles();
    } else {
      setFileList([]);
      updateFromFileList([]);
    }
  }, [user, activeTeam?.id, updateFromFileList]);

  const handleFileUpdate = (updatedFiles: any[]) => {
    setFileList(updatedFiles);
    updateFromFileList(updatedFiles);
  };

  const handleTeamUpdate = () => {
    console.log("Team updated");
  };

  const getPaddingClasses = () => {
    const baseClasses = "px-8";

    if (fontSize === "LARGE") {
      if (isMobile) {
        return "px-6";
      } else if (isTablet) {
        return "px-8";
      } else {
        return "px-10";
      }
    } else if (fontSize === "SMALL") {
      if (isMobile) {
        return "";
      } else {
        return "";
      }
    }

    return baseClasses;
  };

  const paddingClasses = getPaddingClasses();

  return (
    <div
      className={`min-h-screen bg-white dark:bg-[#1a1a1c] shadow-xl border-r border-gray-200 dark:border-[#2a2a2d] transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${paddingClasses}`}
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuToggle={onMenuToggle} onTeamUpdate={handleTeamUpdate} />

          <main
            className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto"
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            <ContentLoader>
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
            </ContentLoader>

            <StaggeredLoader>
              <div
                className={`
                grid gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8
                ${isMobile ? "grid-cols-1" : ""}
                ${isTablet ? "grid-cols-2" : ""}
                ${!isMobile && !isTablet ? "grid-cols-3" : ""}
              `}
              >
                <StaggeredItem>
                  <div
                    className="bg-white dark:bg-[#1a1a1c] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2a2a2d] hover:shadow-md transition-all duration-300 group"
                    id="total-files-card"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">
                          Total Files
                        </p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {fileCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggeredItem>

                <StaggeredItem>
                  <div
                    className="bg-white dark:bg-[#1a1a1c] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2a2a2d] hover:shadow-md transition-all duration-300 group"
                    id="team-members-card"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">
                          Team Members
                        </p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                          {teamMembersCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggeredItem>

                <StaggeredItem>
                  <div
                    className={`
                    bg-white dark:bg-[#1a1a1c] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-[#2a2a2d] hover:shadow-md transition-all duration-300 group
                    ${isMobile ? "col-span-1" : ""}
                    ${isTablet ? "col-span-2" : ""}
                    ${!isMobile && !isTablet ? "col-span-1" : ""}
                  `}
                    id="storage-card"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">
                          Storage Used
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Math.round(storagePercentage)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggeredItem>
              </div>
            </StaggeredLoader>

            <ContentLoader>
              <div
                className="bg-white dark:bg-[#1a1a1c] rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2a2d] p-4 sm:p-6 lg:p-8"
                id="file-list-container"
              >
                <FileList files={fileList} onFileUpdate={handleFileUpdate} />
              </div>
            </ContentLoader>

            {isMobile && (
              <div className="fixed bottom-6 right-6 z-30">
                <button className="w-14 h-14 bg-linear-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95">
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const FileText = ({ className }: { className?: string }) => (
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

const Users = ({ className }: { className?: string }) => (
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

const Cloud = ({ className }: { className?: string }) => (
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

const Plus = ({ className }: { className?: string }) => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);
