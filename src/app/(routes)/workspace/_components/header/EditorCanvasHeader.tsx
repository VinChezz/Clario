import { MessageCircleMore } from "lucide-react";
import { PresenceIndicator } from "../PresenceIndicator";

interface EditorCanvasHeaderProps {
  permissions: "ADMIN" | "VIEW" | "EDIT";
  fileType: "document" | "whiteboard";
  activeUsers: any[];
  versions: any[];
  versionsLoading: boolean;
  onToggleVersionHistory: () => void;
  onToggleCommentSidebar?: () => void;
  showCommentSidebar?: boolean;
  fetchVersions: () => void;
  windowMode?: "split" | "fullscreen";
  activeComponent?: "editor" | "canvas";
  commentsCount?: number;
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
  commentsCount = 0,
}: EditorCanvasHeaderProps) {
  const fileTypeLabels = {
    document: "Document",
    whiteboard: "Whiteboard",
  };

  const handleVersionClick = () => {
    onToggleVersionHistory();
    fetchVersions();
  };

  const isFullscreen = windowMode === "fullscreen";
  const showAllElements = isFullscreen;

  const showVersionsButton = !(
    fileType === "whiteboard" && windowMode === "split"
  );
  const showCommentsButton = onToggleCommentSidebar !== undefined;

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 h-16">
      <div className="flex items-center gap-2 text-gray-600 h-full">
        <span className="flex items-center gap-2 text-sm">
          {permissions === "VIEW" ? (
            <p className="flex items-center gap-1">
              <span>Viewing only •</span>
              <span className="text-amber-600">no editing permissions</span>
            </p>
          ) : (
            <span>
              Manual save available •{" "}
              {isFullscreen
                ? `${fileTypeLabels[fileType]} (${
                    activeComponent === "editor"
                      ? "Fullscreen"
                      : "Fullscreen Canvas"
                  })`
                : fileTypeLabels[fileType]}
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 h-full">
        {showCommentsButton && (
          <button
            onClick={onToggleCommentSidebar}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors h-10"
          >
            <MessageCircleMore className="w-4 h-4" /> Comment
            {commentsCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-6 flex justify-center">
                {commentsCount}
              </span>
            )}
          </button>
        )}
        {showVersionsButton && (
          <button
            onClick={handleVersionClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-10"
            disabled={versionsLoading}
          >
            <svg
              className="w-4 h-4"
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
            Versions
            {versions.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-6 flex justify-center">
                {versions.length}
              </span>
            )}
          </button>
        )}
        {(showAllElements || fileType === "whiteboard") && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm h-10">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Online</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center">
              <PresenceIndicator activeUsers={activeUsers} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
