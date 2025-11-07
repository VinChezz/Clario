"use client";

import { MessageCircleMore, History } from "lucide-react";
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
        return "Document";
      } else if (activeComponent === "canvas") {
        return "Whiteboard";
      } else {
        return fileTypeLabels[fileType];
      }
    }
  };

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 h-14">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {getActiveComponentLabel()}
          </span>
          {permissions === "VIEW" ? (
            <span className="text-xs text-amber-600 font-medium">
              View only • No editing permissions
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              {windowMode === "fullscreen" ? "Fullscreen" : "Editing"}
            </span>
          )}
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-700 font-medium">Unsaved</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showCommentsButton && (
          <button
            onClick={onToggleCommentSidebar}
            className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
          >
            <MessageCircleMore className="w-4 h-4" />
            {commentsCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {commentsCount}
              </div>
            )}
            <span className="hidden sm:inline">Comments</span>
          </button>
        )}

        {showVersionsButton && (
          <button
            onClick={handleVersionClick}
            disabled={versionsLoading || !fetchVersions}
            className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <History className="w-4 h-4" />
            {versions.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                {versions.length}
              </div>
            )}
            <span className="hidden sm:inline">Versions</span>
          </button>
        )}

        {(showAllElements || fileType === "whiteboard") && (
          <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
            <div className="flex items-center gap-2">
              <PresenceIndicator activeUsers={activeUsers} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
