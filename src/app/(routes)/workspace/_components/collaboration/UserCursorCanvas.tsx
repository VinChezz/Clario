"use client";

import React, { useEffect, useRef, useState } from "react";

interface CanvasCursor {
  userId: string;
  user: { id: string; name: string; email: string; image: string };
  userColor: string;
  position: { x: number; y: number };
  tool?: string;
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
  const [hoveredCursor, setHoveredCursor] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Храним время последнего движения для каждого курсора
  const lastMoveTimeRef = useRef<Record<string, number>>({});
  // Храним последнюю позицию для сравнения
  const lastPositionRef = useRef<Record<string, { x: number; y: number }>>({});
  // Храним активных пользователей (с таймером)
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () =>
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef]);

  // Следим за изменением позиций курсоров
  useEffect(() => {
    cursors.forEach((cursor) => {
      if (!cursor.user || !cursor.isActive) return;

      const lastPos = lastPositionRef.current[cursor.userId];
      const hasMoved =
        !lastPos ||
        lastPos.x !== cursor.position.x ||
        lastPos.y !== cursor.position.y;

      if (hasMoved) {
        lastPositionRef.current[cursor.userId] = cursor.position;
        lastMoveTimeRef.current[cursor.userId] = Date.now();

        // Показываем курсор
        setActiveUserIds((prev) => new Set(prev).add(cursor.userId));

        if (timeoutsRef.current[cursor.userId]) {
          clearTimeout(timeoutsRef.current[cursor.userId]);
        }

        timeoutsRef.current[cursor.userId] = setTimeout(() => {
          setActiveUserIds((prev) => {
            const next = new Set(prev);
            next.delete(cursor.userId);
            return next;
          });
        }, 1500);
      }
    });
  }, [cursors]);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const validCursors = cursors.filter(
    (cursor) =>
      cursor.user &&
      activeUserIds.has(cursor.userId) &&
      typeof cursor.position?.x === "number" &&
      typeof cursor.position?.y === "number" &&
      !isNaN(cursor.position.x) &&
      !isNaN(cursor.position.y) &&
      cursor.position.x > 0 &&
      cursor.position.y > 0,
  );

  if (!validCursors.length) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {validCursors.map((cursor) => {
        const MARGIN = 40;
        if (
          containerSize.width > 0 &&
          (cursor.position.x > containerSize.width + MARGIN ||
            cursor.position.y > containerSize.height + MARGIN)
        ) {
          return null;
        }

        return (
          <CanvasCursorPin
            key={cursor.userId}
            cursor={cursor}
            isHovered={hoveredCursor === cursor.userId}
            onHover={setHoveredCursor}
          />
        );
      })}
    </div>
  );
};

const CanvasCursorPin = React.memo(
  ({
    cursor,
    isHovered,
    onHover,
  }: {
    cursor: CanvasCursor;
    isHovered: boolean;
    onHover: (id: string | null) => void;
  }) => (
    <div
      style={{
        position: "absolute",
        left: cursor.position.x,
        top: cursor.position.y,
        transform: "translate(-4px, -4px)",
        pointerEvents: "auto",
        transition: "left 60ms linear, top 60ms linear",
        willChange: "left, top",
      }}
      onMouseEnter={() => onHover(cursor.userId)}
      onMouseLeave={() => onHover(null)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 118 118"
          fill="none"
          style={{
            filter: "drop-shadow(1px 1px 3px rgba(0,0,0,0.35))",
            flexShrink: 0,
          }}
        >
          <path
            d="M34.5886 96.815C42.9777 95.9679 48.8335 82.4952 55.7265 78.2871C58.4419 76.6292 60.8491 78.3131 62.5498 80.5271L79.0059 101.946C81.8728 105.678 83.8921 106.789 88.2153 104.576C94.8616 101.173 101.178 94.8479 104.575 88.2138C106.789 83.8921 105.678 81.8723 101.947 79.0059L80.5271 62.5498C78.3131 60.8486 76.6297 58.4419 78.2876 55.7265C82.4952 48.8334 95.9684 42.9776 96.815 34.5885C98.3043 19.2974 26.7317 5.37326 16.0518 16.0518C5.3732 26.7316 19.2973 98.3038 34.5886 96.815Z"
            fill={cursor.userColor}
            fillOpacity={0.15}
            stroke={cursor.userColor}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          style={{
            padding: "2px 8px",
            fontSize: 12,
            color: "white",
            borderRadius: 6,
            fontWeight: 500,
            whiteSpace: "nowrap",
            backgroundColor: cursor.userColor,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            opacity: isHovered ? 1 : 0.85,
            transition: "opacity 150ms",
          }}
        >
          {cursor.user.name}
        </div>
      </div>
    </div>
  ),
);

CanvasCursorPin.displayName = "CanvasCursorPin";
