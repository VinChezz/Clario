"use client";

import { useEffect, useState } from "react";
import {
  useKindeBrowserClient,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs";
import Header from "./_components/Header";
import { HeaderProps } from "@/types/header";
import { TextProps } from "@/types/common";
import FileList from "./_components/FileList";
import GradientLoader from "@/app/_loaders/GradientLoader";
import {
  ContentLoader,
  StaggeredLoader,
  StaggeredItem,
} from "./_components/ContentLoader";

export default function Dashboard({
  variant = "light",
}: HeaderProps & TextProps) {
  const { user, isLoading } = useKindeBrowserClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <div className="flex-1 min-w-0">
          <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

          <main className="p-6 lg:p-8 max-w-7xl mx-auto">
            <ContentLoader>
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back{user?.given_name ? `, ${user.given_name}` : ""}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Here are your recent files and documents
                </p>
              </div>
            </ContentLoader>

            <StaggeredLoader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StaggeredItem>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Files
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          24
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggeredItem>

                <StaggeredItem>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Team Members
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          8
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggeredItem>

                <StaggeredItem>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Cloud className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Storage Used
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          65%
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggeredItem>
              </div>
            </StaggeredLoader>

            <ContentLoader>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
                <FileList />
              </div>
            </ContentLoader>
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
