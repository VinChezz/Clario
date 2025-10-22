"use client";

import React, { useEffect, useState } from "react";

interface CanvasCursor {
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
  isActive: boolean;
}

interface CanvasCursorOverlayProps {
  cursors: CanvasCursor[];
  containerRef: React.RefObject<HTMLElement | null>;
}

export const CanvasCursorOverlay: React.FC<CanvasCursorOverlayProps> = ({
  cursors,
  containerRef,
}) => {
  const [visibleCursors, setVisibleCursors] = useState<CanvasCursor[]>([]);

  // Фильтруем и обновляем курсоры с задержкой для плавности
  useEffect(() => {
    const activeCursors = cursors.filter(
      (cursor) =>
        cursor.user &&
        cursor.position &&
        typeof cursor.position.x === "number" &&
        typeof cursor.position.y === "number" &&
        cursor.isActive &&
        cursor.position.x > 0 &&
        cursor.position.y > 0
    );

    console.log("👁️ Rendering cursors:", activeCursors.length);

    setVisibleCursors(activeCursors);
  }, [cursors]);

  if (visibleCursors.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {visibleCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none transition-all duration-100 ease-linear"
          style={{
            left: `${cursor.position.x}px`,
            top: `${cursor.position.y}px`,
            transform: "translate(-50%, -50%)",
            opacity: cursor.isActive ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg
                width="28"
                height="28"
                viewBox="0 0 118 118"
                fill="none"
                style={{
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))",
                }}
              >
                <path
                  d="M34.5886 96.815C42.9777 95.9679 48.8335 82.4952 55.7265 78.2871C58.4419 76.6292 60.8491 78.3131 62.5498 80.5271L79.0059 101.946C81.8728 105.678 83.8921 106.789 88.2153 104.576C94.8616 101.173 101.178 94.8479 104.575 88.2138C106.789 83.8921 105.678 81.8723 101.947 79.0059L80.5271 62.5498C78.3131 60.8486 76.6297 58.4419 78.2876 55.7265C82.4952 48.8334 95.9684 42.9776 96.815 34.5885C98.3043 19.2974 26.7317 5.37326 16.0518 16.0518C5.3732 26.7316 19.2973 98.3038 34.5886 96.815Z"
                  stroke={cursor.userColor}
                  strokeWidth="8.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div
              className="px-2 py-1 text-xs text-white rounded font-medium whitespace-nowrap shadow-md backdrop-blur-sm"
              style={{ backgroundColor: cursor.userColor }}
            >
              {cursor.user.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
