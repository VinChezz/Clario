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
import GettingStartedTour from "./_components/GettingStartedTour";
import { TourProvider } from "./_components/TourContext";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";

interface DashboardProps {
  onMenuToggle?: () => void;
}

export default function Dashboard({ onMenuToggle }: DashboardProps) {
  const { user, isLoading } = useKindeBrowserClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

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
        });
    }
  }, [user, isLoading]);

  if (isLoading || !contentLoaded) {
    return <GradientLoader />;
  }

  return (
    <TourProvider>
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30">
        <GettingStartedTour />

        <div className="flex flex-col min-h-screen">
          <div className="flex-1 flex flex-col min-w-0">
            <Header onMenuToggle={onMenuToggle} />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
              <ContentLoader>
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Welcome back{user?.given_name ? `, ${user.given_name}` : ""}
                    !
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-lg">
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Total Files
                          </p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                            24
                          </p>
                        </div>
                      </div>
                    </div>
                  </StaggeredItem>

                  <StaggeredItem>
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Team Members
                          </p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                            8
                          </p>
                        </div>
                      </div>
                    </div>
                  </StaggeredItem>

                  <StaggeredItem>
                    <div
                      className={`
                      bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300
                      ${isMobile ? "col-span-1" : ""}
                      ${isTablet ? "col-span-2" : ""}
                      ${!isMobile && !isTablet ? "col-span-1" : ""}
                    `}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                          <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Storage Used
                          </p>
                          <div className="flex items-center gap-3">
                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                              65%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </StaggeredItem>
                </div>
              </StaggeredLoader>

              <ContentLoader>
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
                  <FileList />
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
    </TourProvider>
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
