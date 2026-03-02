import { useState, useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";

interface CursorData {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  isActive: boolean;
  userColor: string;
  position: {
    x: number;
    y: number;
  };
  lastActive?: number;
}

export const useRealtimeCursor = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const [cursors, setCursors] = useState<CursorData[]>([]);

  useEffect(() => {
    if (!isConnected) {
      setCursors([]);
    }
  }, [isConnected]);

  const sendCursorUpdate = useCallback(
    (cursorData: Omit<CursorData, "user">) => {
      if (!isConnected || !currentUser) {
        return;
      }

      const position = {
        x: cursorData.position.x ?? 0,
        y: cursorData.position.y ?? 0,
      };

      const fullCursorData = {
        ...cursorData,
        position,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
        },
        lastActive: Date.now(),
      };

      emitEvent("editor_cursor_update", { cursor: fullCursorData });
    },
    [emitEvent, isConnected, currentUser],
  );

  const subscribeToCursorUpdates = useCallback(() => {
    const unsubscribeCursor = subscribe(
      "editor_cursor_update",
      (data: CursorData) => {
        setCursors((prev) => {
          const existingIndex = prev.findIndex((c) => c.userId === data.userId);

          const newCursor = {
            ...data,
            lastActive: Date.now(),
            isActive: true,
            position: {
              x: data.position.x,
              y: data.position.y,
            },
          };

          if (existingIndex >= 0) {
            const newList = [...prev];
            newList[existingIndex] = newCursor;
            return newList;
          } else {
            return [...prev, newCursor];
          }
        });
      },
    );

    const unsubscribeUserLeft = subscribe(
      "user_left",
      (data: { userId: string }) => {
        setCursors((prev) => prev.filter((c) => c.userId !== data.userId));
      },
    );

    return () => {
      unsubscribeCursor();
      unsubscribeUserLeft();
    };
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const INACTIVE_THRESHOLD = 3000;

      setCursors((prev) => {
        const activeCursors = prev.filter(
          (cursor) => now - (cursor.lastActive || 0) < INACTIVE_THRESHOLD,
        );

        return activeCursors;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const removeCursor = useCallback((userId: string) => {
    setCursors((prev) => prev.filter((c) => c.userId !== userId));
  }, []);

  return {
    cursors,
    sendCursorUpdate,
    subscribeToCursorUpdates,
    removeCursor,
  };
};
