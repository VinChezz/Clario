"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

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
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => forceUpdate((n) => n + 1);
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => container.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  const validCursors = cursors.filter(
    (cursor) =>
      cursor?.user &&
      typeof cursor.position?.x === "number" &&
      typeof cursor.position?.y === "number" &&
      !isNaN(cursor.position.x) &&
      !isNaN(cursor.position.y),
  );

  if (!validCursors.length) return null;

  const container = containerRef.current;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: container ? container.scrollWidth : "100%",
        height: container ? container.scrollHeight : "100%",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "visible",
      }}
    >
      {validCursors.map((cursor) => {
        if (container) {
          const visibleTop = container.scrollTop;
          const visibleBottom = container.scrollTop + container.clientHeight;
          const visibleLeft = container.scrollLeft;
          const visibleRight = container.scrollLeft + container.clientWidth;

          const MARGIN = 60;
          const inViewport =
            cursor.position.y >= visibleTop - MARGIN &&
            cursor.position.y <= visibleBottom + MARGIN &&
            cursor.position.x >= visibleLeft - MARGIN &&
            cursor.position.x <= visibleRight + MARGIN;

          if (!inViewport) return null;
        }

        return (
          <CursorPin
            key={cursor.eventId ?? cursor.userId}
            cursor={cursor}
            isHovered={hoveredUser === cursor.userId}
            onHover={setHoveredUser}
          />
        );
      })}
    </div>
  );
};

const CursorPin = React.memo(
  ({
    cursor,
    isHovered,
    onHover,
  }: {
    cursor: Cursor;
    isHovered: boolean;
    onHover: (id: string | null) => void;
  }) => (
    <div
      style={{
        position: "absolute",
        left: cursor.position.x,
        top: cursor.position.y,
        pointerEvents: "auto",
        transition: "left 80ms linear, top 80ms linear",
        willChange: "left, top",
      }}
      onMouseEnter={() => onHover(cursor.userId)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CursorSvg color={cursor.userColor} />

        <div
          style={{
            padding: "2px 8px",
            fontSize: 12,
            color: "white",
            borderRadius: 6,
            fontWeight: 500,
            whiteSpace: "nowrap",
            backgroundColor: cursor.userColor,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            opacity: isHovered ? 1 : 0.9,
            transition: "opacity 150ms",
          }}
        >
          {cursor.user.name}
        </div>
      </div>
    </div>
  ),
);

CursorPin.displayName = "CursorPin";

const CursorSvg = ({ color }: { color: string }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 16 28"
    fill="none"
    style={{
      filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.4))",
    }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 1.75C6.63.66 4.89 0 3 0 1.34 0 0 1.34 0 3s1.34 3 3 3c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2-1.66 0-3 1.34-3 3s1.34 3 3 3c1.89 0 3.63-.66 5-1.75 1.37 1.09 3.11 1.75 5 1.75 1.66 0 3-1.34 3-3s-1.34-3-3-3c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2 1.66 0 3-1.34 3-3S14.66 0 13 0c-1.89 0-3.63.66-5 1.75Z"
      fill={color}
      stroke="white"
      strokeWidth="0.5"
    />
  </svg>
);
