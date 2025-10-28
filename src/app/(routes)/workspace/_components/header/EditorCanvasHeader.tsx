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
}: EditorCanvasHeaderProps) {
  const fileTypeLabels = {
    document: "Document",
    whiteboard: "Whiteboard",
  };

  const handleVersionClick = () => {
    onToggleVersionHistory();
    if (!showCommentSidebar) {
      fetchVersions();
    }
  };

  const isFullscreen = windowMode === "fullscreen";
  const showAllElements = isFullscreen;

  const showVersionsButton = !(
    fileType === "whiteboard" && windowMode === "split"
  );

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 h-16">
      {" "}
      {/* Фіксована висота */}
      <div className="flex items-center gap-2 text-gray-600 h-full">
        {" "}
        {/* Додано h-full */}
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
        {" "}
        {/* Додано h-full */}
        {(showAllElements ||
          (fileType === "document" && onToggleCommentSidebar)) && (
          <button
            onClick={onToggleCommentSidebar}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors h-10"
          >
            💬 Comment
            {versions.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-6 flex justify-center">
                {versions.length}
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
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
            {" "}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Online</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center">
              {" "}
              <PresenceIndicator activeUsers={activeUsers} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
