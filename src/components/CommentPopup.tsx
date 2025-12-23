import { MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

const useSelectionPosition = (selection: { text: string } | null) => {
  const [position, setPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!selection?.text) {
      setPosition(null);
      return;
    }

    const getSelectionRect = () => {
      const sel = window.getSelection();

      if (!sel || sel.rangeCount === 0) {
        return null;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        const container = range.startContainer;
        if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
          return container.parentElement.getBoundingClientRect();
        }
      }

      return rect;
    };

    const rect = getSelectionRect();

    if (rect) {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      setPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [selection?.text]);

  return position;
};

export const CommentPopup: React.FC<{
  selection: { text: string } | null;
  permissions: string;
  isDark: boolean;
  onAddComment: (text: string) => void;
  onClose: () => void;
}> = ({ selection, permissions, isDark, onAddComment, onClose }) => {
  const position = useSelectionPosition(selection);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!position) return;

    const calculatePosition = () => {
      const viewportHeight = window.innerHeight;
      const offset = 20;

      let top = position.y + position.height + offset;
      let left = position.x;

      if (top + 150 > viewportHeight) {
        top = Math.max(position.y - 150, 60);
      }

      const maxWidth = 250;
      if (left + maxWidth / 2 > window.innerWidth) {
        left = window.innerWidth - maxWidth / 2 - 10;
      }

      if (left - maxWidth / 2 < 10) {
        left = maxWidth / 2 + 10;
      }

      setPopupStyle({
        top: `${top}px`,
        left: `${left}px`,
        transform: "translateX(-50%)",
        position: "fixed" as const,
        zIndex: 100,
      });
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [position]);

  if (!selection?.text || permissions !== "EDIT" || !position) {
    return null;
  }

  return (
    <div className="animate-fadeIn" style={popupStyle}>
      <div
        className={`relative rounded-lg shadow-xl ${
          isDark
            ? "bg-[#252528] border border-[#2a2a2d]"
            : "bg-white border border-gray-200"
        }`}
      >
        <div
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent"
          style={{
            borderBottomColor: isDark ? "#252528" : "#ffffff",
          }}
        />

        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span
              className={`text-sm font-medium truncate max-w-[180px] ${
                isDark ? "text-[#e0e0e0]" : "text-gray-800"
              }`}
            >
              "
              {selection.text.length > 25
                ? `${selection.text.substring(0, 25)}...`
                : selection.text}
              "
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAddComment("Comment on selected text")}
              className={`flex-1 text-white py-2 px-3 rounded text-sm font-medium ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Comment
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded ${
                isDark
                  ? "hover:bg-[#2a2a2d] text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
