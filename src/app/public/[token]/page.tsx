"use client";

import ShareEditor from "@/app/(routes)/workspace/_components/ShareEditor";
import ShareCanvas from "@/app/(routes)/workspace/_components/ShareCanvas";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Eye, Edit, Square, FileText, Lock, Globe } from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";

const TabbedContent = memo(({ fileData }: { fileData: any }) => {
  const [activeTab, setActiveTab] = useState<"document" | "whiteboard">(
    "document",
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        window.matchMedia("(prefers-color-scheme: dark)").matches ||
        document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => mediaQuery.removeEventListener("change", checkDarkMode);
  }, []);

  const handleSave = useCallback(() => {
    setSaveTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center justify-between border-b ${
          isDarkMode
            ? "bg-[#1e1e1e] border-[#333]"
            : "bg-gray-50/50 border-gray-200"
        }`}
      >
        <div className="flex">
          <button
            onClick={() => setActiveTab("document")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all duration-200 font-medium ${
              activeTab === "document"
                ? isDarkMode
                  ? "border-blue-500 text-blue-400 bg-[#252525]"
                  : "border-blue-500 text-blue-600 bg-white"
                : isDarkMode
                  ? "border-transparent text-gray-400 hover:text-gray-300 hover:bg-[#252525]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab("whiteboard")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all duration-200 font-medium ${
              activeTab === "whiteboard"
                ? isDarkMode
                  ? "border-blue-500 text-blue-400 bg-[#252525]"
                  : "border-blue-500 text-blue-600 bg-white"
                : isDarkMode
                  ? "border-transparent text-gray-400 hover:text-gray-300 hover:bg-[#252525]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Square className="h-4 w-4" />
            <span>Whiteboard</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "document" ? (
          <ShareEditor
            fileId={fileData.id}
            fileData={fileData}
            onSaveTrigger={saveTrigger}
            isPublicAccess={true}
            permissions={fileData.permissions}
          />
        ) : (
          <ShareCanvas
            fileId={fileData.id}
            fileData={fileData}
            onSaveTrigger={saveTrigger}
            isPublicAccess={true}
            permissions={fileData.permissions}
          />
        )}
      </div>
    </div>
  );
});

TabbedContent.displayName = "TabbedContent";

export default function PublicFilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        window.matchMedia("(prefers-color-scheme: dark)").matches ||
        document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => mediaQuery.removeEventListener("change", checkDarkMode);
  }, []);

  const fetchFileData = useCallback(async () => {
    try {
      const { token } = await params;
      const baseUrl = process.env.PUBLIC_URL || "http://localhost:3000";
      const fileRes = await fetch(`${baseUrl}/api/share/${token}`, {
        cache: "no-store",
      });

      if (!fileRes.ok) {
        throw new Error("File not found");
      }

      const data = await fileRes.json();
      console.log("📥 Loaded public file data:", data);
      setFileData(data);
    } catch (error) {
      console.error("Error fetching file data:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchFileData();
  }, [fetchFileData]);

  const getInitials = useCallback((name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-linear-to-br from-gray-900 via-gray-900 to-gray-800"
            : "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div
              className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
                isDarkMode ? "border-blue-500" : "border-blue-600"
              }`}
            ></div>
          </div>
          <p
            className={`text-lg font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading shared document...
          </p>
        </div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-linear-to-br from-gray-900 via-gray-900 to-gray-800"
            : "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        <div className="text-center space-y-4">
          <Lock
            className={`h-16 w-16 mx-auto ${
              isDarkMode ? "text-red-400" : "text-red-500"
            }`}
          />
          <p
            className={`text-xl font-semibold ${
              isDarkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            Document not found
          </p>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            This link may have expired or been revoked
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-3 ${
        isDarkMode
          ? "bg-linear-to-br from-gray-900 via-gray-900 to-gray-800"
          : "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        <Card
          className={`${
            isDarkMode
              ? "bg-[#1e1e1e] border-[#333]"
              : "bg-white border-gray-200"
          } shadow-sm`}
        >
          <div className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div
                  className={`p-3 rounded-xl ${
                    isDarkMode
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Shield className="h-7 w-7" />
                </div>

                <div className="flex-1 min-w-0">
                  <h1
                    className={`text-2xl font-bold mb-2 truncate ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {fileData.fileName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-7 w-7 ring-2 ring-white dark:ring-gray-800">
                        <AvatarImage src={fileData.createdBy?.image} />
                        <AvatarFallback
                          className={`text-xs font-semibold ${
                            isDarkMode
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {getInitials(fileData.createdBy?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {fileData.createdBy?.name ||
                            fileData.team?.name ||
                            "Unknown User"}
                        </p>
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Shared owner
                        </p>
                      </div>
                    </div>

                    <div
                      className={`h-8 w-px ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-300"
                      }`}
                    ></div>

                    <Badge
                      variant={
                        fileData.permissions === "VIEW"
                          ? "secondary"
                          : "default"
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 ${
                        fileData.permissions === "VIEW"
                          ? isDarkMode
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          : isDarkMode
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {fileData.permissions === "VIEW" ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span className="font-medium">View only</span>
                        </>
                      ) : (
                        <>
                          <Edit className="h-3.5 w-3.5" />
                          <span className="font-medium">Can edit</span>
                        </>
                      )}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1.5 px-3 py-1.5 ${
                        isDarkMode
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span className="font-medium">Public link</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {fileData.version && (
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1.5 ${
                    isDarkMode
                      ? "border-gray-700 text-gray-400 bg-gray-800/50"
                      : "border-gray-300 text-gray-600 bg-gray-50"
                  }`}
                >
                  v{fileData.version}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card
          className={`h-[calc(100vh-200px)] flex flex-col overflow-hidden ${
            isDarkMode
              ? "bg-[#1e1e1e] border-[#333]"
              : "bg-white border-gray-200"
          } shadow-sm`}
        >
          <TabbedContent fileData={fileData} />
        </Card>

        <div className="text-center py-2">
          <p
            className={`text-sm flex items-center justify-center gap-2 ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>
              Shared via secure link • {new Date().toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
