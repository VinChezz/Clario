import { useState, useCallback } from "react";
import { useSocket } from "./useSocket";

interface CursorData {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  userColor: string;
  cursor: {
    x: number;
    y: number;
  };
}

export const useRealtimeCursor = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe } = useSocket(fileId, currentUser);
  const [cursors, setCursors] = useState<CursorData[]>([]);

  const sendCursorUpdate = useCallback(
    (cursorData: CursorData) => {
      emitEvent("cursor_update", {
        cursor: cursorData,
      });
    },
    [emitEvent]
  );

  const subscribeToCursorUpdates = useCallback(() => {
    return subscribe("cursor_update", (data: CursorData) => {
      setCursors((prev) => {
        const existing = prev.find((c) => c.userId === data.userId);
        if (existing) {
          return prev.map((c) => (c.userId === data.userId ? data : c));
        } else {
          return [...prev, data];
        }
      });
    });
  }, [subscribe]);

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
