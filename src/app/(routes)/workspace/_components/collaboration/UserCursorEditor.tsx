"use client";

import React, { useState } from "react";

interface Cursor {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  userColor: string;
  position: {
    x: number;
    y: number;
  };
  isTyping: boolean;
}

interface UserCursorEditorProps {
  cursors: Cursor[];
  containerRef: React.RefObject<HTMLElement | null>;
}

export const UserCursorEditor: React.FC<UserCursorEditorProps> = ({
  cursors,
  containerRef,
}) => {
  const [hoveredCursor, setHoveredCursor] = useState<string | null>(null);

  const validCursors = cursors.filter(
    (cursor) =>
      cursor.user &&
      cursor.position &&
      typeof cursor.position.x === "number" &&
      typeof cursor.position.y === "number"
  );

  if (validCursors.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {validCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none transition-all duration-100 ease-out"
          style={{
            left: `${cursor.position.x}px`,
            top: `${cursor.position.y}px`,
          }}
          onMouseEnter={() => setHoveredCursor(cursor.userId)}
          onMouseLeave={() => setHoveredCursor(null)}
        >
          <div className="flex items-start">
            <div
              className="w-0.5 h-5 relative"
              style={{ backgroundColor: cursor.userColor }}
            >
              <div
                className="absolute inset-0 bg-current opacity-70 animate-pulse"
                style={{ animationDuration: "2s" }}
              />
            </div>

            {(hoveredCursor === cursor.userId || cursor.isTyping) && (
              <div
                className="ml-2 px-2 py-1 text-xs text-white rounded shadow-sm whitespace-nowrap"
                style={{ backgroundColor: cursor.userColor }}
              >
                <div className="flex items-center gap-1">
                  <span>{cursor.user.name}</span>
                  {cursor.isTyping && (
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                      <div
                        className="w-1 h-1 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-1 h-1 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
