import { PresenceIndicator } from "../PresenceIndicator";

interface EditorCanvasHeaderProps {
  permissions: "VIEW" | "EDIT";
  fileType: "document" | "whiteboard";
  activeUsers: any[];
  versions: any[];
  versionsLoading: boolean;
  onToggleVersionHistory: () => void;
  onToggleCommentSidebar?: () => void;
  showCommentSidebar?: boolean;
  fetchVersions: () => void;
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

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 text-gray-600">
        <span className="flex items-center gap-2 text-sm">
          {permissions === "VIEW" ? (
            <p className="flex items-center gap-1">
              <span>Viewing only •</span>
              <span className="text-amber-600">no editing permissions</span>
            </p>
          ) : (
            <span>Manual save available • {fileTypeLabels[fileType]}</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Online Users - только для whiteboard */}
        {fileType === "whiteboard" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm w-32">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm font-medium text-gray-700 truncate">
                Online
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300 flex-shrink-0"></div>
            <div className="flex-shrink-0">
              <PresenceIndicator activeUsers={activeUsers} />
            </div>
          </div>
        )}

        {/* Comment Button - только для document */}
        {fileType === "document" && onToggleCommentSidebar && (
          <button
            onClick={onToggleCommentSidebar}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            💬 Comment
            {versions.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-6 flex justify-center">
                {versions.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={handleVersionClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}
