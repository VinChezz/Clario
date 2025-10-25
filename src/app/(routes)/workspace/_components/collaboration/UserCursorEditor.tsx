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
  eventId: string;
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
          key={`cursor-${cursor.eventId || cursor.userId}`}
          className="absolute pointer-events-none transition-all duration-150 ease-out"
          style={{
            left: `${cursor.position.x}px`,
            top: `${cursor.position.y}px`,
            transform: "translate(8px, 0px)",
          }}
          onMouseEnter={() => setHoveredCursor(cursor.userId)}
          onMouseLeave={() => setHoveredCursor(null)}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg
                width="24"
                height="24"
                viewBox="0 0 16 28"
                fill="none"
                style={{
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.4))",
                }}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 4.31792L6.74906 3.31513C5.72149 2.49139 4.42087 2 3 2C2.44772 2 2 2.44772 2 3C2 3.55228 2.44772 4 3 4C5.20914 4 7 5.79086 7 8V20C7 22.2091 5.20914 24 3 24C2.44772 24 2 24.4477 2 25C2 25.5523 2.44772 26 3 26C4.42087 26 5.72149 25.5086 6.74906 24.6849L8 23.6821L9.25094 24.6849C10.2785 25.5086 11.5791 26 13 26C13.5523 26 14 25.5523 14 25C14 24.4477 13.5523 24 13 24C10.7909 24 9 22.2091 9 20V8C9 5.79086 10.7909 4 13 4C13.5523 4 14 3.55228 14 3C14 2.44772 13.5523 2 13 2C11.5791 2 10.2785 2.49139 9.25094 3.31513L8 4.31792ZM8 1.75463C6.6304 0.656719 4.89189 0 3 0C1.34315 0 0 1.34315 0 3C0 4.65685 1.34315 6 3 6C4.10457 6 5 6.89543 5 8V20C5 21.1046 4.10457 22 3 22C1.34315 22 0 23.3431 0 25C0 26.6569 1.34315 28 3 28C4.89189 28 6.6304 27.3433 8 26.2454C9.3696 27.3433 11.1081 28 13 28C14.6569 28 16 26.6569 16 25C16 23.3431 14.6569 22 13 22C11.8954 22 11 21.1046 11 20V8C11 6.89543 11.8954 6 13 6C14.6569 6 16 4.65685 16 3C16 1.34315 14.6569 0 13 0C11.1081 0 9.3696 0.656719 8 1.75463Z"
                  fill={cursor.userColor}
                  stroke="white"
                  strokeWidth="0.5"
                />
              </svg>
            </div>

            <div
              className="px-2 py-1 text-xs text-white rounded-md font-medium whitespace-nowrap shadow-lg backdrop-blur-sm transition-all duration-200"
              style={{
                backgroundColor: cursor.userColor,
                opacity: hoveredCursor === cursor.userId ? 1 : 0.8,
              }}
            >
              {cursor.user.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
