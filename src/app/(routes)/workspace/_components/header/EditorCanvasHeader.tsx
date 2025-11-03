"use client";

import { MessageCircleMore } from "lucide-react";
import { PresenceIndicator } from "../PresenceIndicator";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Badge } from "@/components/ui/badge";

interface EditorCanvasHeaderProps {
  permissions: "ADMIN" | "VIEW" | "EDIT";
  fileType: "document" | "whiteboard";
  activeUsers: any[];
  versions: any[];
  versionsLoading: boolean;
  onToggleVersionHistory: () => void;
  onToggleCommentSidebar?: () => void;
  showCommentSidebar?: boolean;
  fetchVersions?: () => void;
  windowMode?: "split" | "fullscreen";
  activeComponent?: "editor" | "canvas" | "both";
  currentComponent?: "editor" | "canvas" | "both";
  commentsCount?: number;
  hasUnsavedChanges?: boolean;
}

export function EditorCanvasHeader({
  permissions,
  fileType,
  activeUsers,
  versions,
  versionsLoading,
  onToggleVersionHistory,
  onToggleCommentSidebar,
  showCommentSidebar,
  fetchVersions,
  windowMode = "split",
  activeComponent = "editor",
  currentComponent = "editor",
  commentsCount = 0,
  hasUnsavedChanges = false,
}: EditorCanvasHeaderProps) {
  const isMobile = useIsMobile();
  const fileTypeLabels = {
    document: "Document",
    whiteboard: "Whiteboard",
  };

  const handleVersionClick = () => {
    onToggleVersionHistory();
    if (fetchVersions) {
      fetchVersions();
    }
  };

  const isFullscreen = windowMode === "fullscreen";
  const showAllElements = isFullscreen;

  const showVersionsButton =
    (windowMode === "split" && fileType === "document") ||
    (windowMode === "fullscreen" &&
      ((fileType === "document" && activeComponent === "editor") ||
        (fileType === "whiteboard" && activeComponent === "canvas")));

  const showCommentsButton = onToggleCommentSidebar !== undefined;

  const getActiveComponentLabel = () => {
    if (windowMode === "split") {
      return fileTypeLabels[fileType];
    } else {
      if (activeComponent === "editor") {
        return "Document (Fullscreen)";
      } else if (activeComponent === "canvas") {
        return "Whiteboard (Fullscreen)";
      } else {
        return fileTypeLabels[fileType];
      }
    }
  };

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 h-14 sm:h-16">
      <div className="flex items-center gap-2 text-gray-600 h-full">
        <span className="flex items-center gap-2 text-xs sm:text-sm">
          {permissions === "VIEW" ? (
            <p className="flex items-center gap-1 flex-wrap">
              <span>Viewing only •</span>
              <span className="text-amber-600 text-xs">
                no editing permissions
              </span>
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm">
                {getActiveComponentLabel()}
              </span>
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                >
                  Unsaved
                </Badge>
              )}
            </div>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 h-full">
        {showCommentsButton && (
          <button
            onClick={onToggleCommentSidebar}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors h-8 sm:h-10"
          >
            <MessageCircleMore className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Comment</span>
            {commentsCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full min-w-5 sm:min-w-6 flex justify-center">
                {commentsCount}
              </span>
            )}
          </button>
        )}

        {showVersionsButton && (
          <button
            onClick={handleVersionClick}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-8 sm:h-10"
            disabled={versionsLoading || !fetchVersions}
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M16 13H8M16 17H8M10 9H8M14 2H8.8C7.11984 2 6.27976 2 5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803C4 4.27976 4 5.11984 4 6.8V17.2C4 18.8802 4 19.7202 4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673C6.27976 22 7.11984 22 8.8 22H15.2C16.8802 22 17.7202 22 18.362 21.673C18.9265 21.3854 19.3854 20.9265 19.673 20.362C20 19.7202 20 18.8802 20 17.2V8L14 2Z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Versions</span>
            {versions.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full min-w-5 sm:min-w-6 flex justify-center">
                {versions.length}
              </span>
            )}
          </button>
        )}

        {(showAllElements || fileType === "whiteboard") && (
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm h-8 sm:h-10">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">
                Online
              </span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-gray-300"></div>
            <div className="flex items-center">
              <PresenceIndicator activeUsers={activeUsers} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
