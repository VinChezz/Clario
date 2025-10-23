import { useState, useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";

interface CanvasCursorData {
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
  tool:
    | "selection"
    | "rectangle"
    | "ellipse"
    | "arrow"
    | "line"
    | "text"
    | "hand";
  isActive: boolean;
  pressure?: number;
}

export const useRealtimeCanvasCursor = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const [cursors, setCursors] = useState<CanvasCursorData[]>([]);

  useEffect(() => {
    if (!isConnected) {
      setCursors([]);
    }
  }, [isConnected]);

  const sendCursorUpdate = useCallback(
    (cursorData: Omit<CanvasCursorData, "user">) => {
      if (!isConnected || !currentUser) {
        return;
      }

      const fullCursorData = {
        ...cursorData,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
        },
      };

      emitEvent("canvas_cursor_update", {
        cursor: fullCursorData,
      });
    },
    [emitEvent, isConnected, currentUser]
  );

  const subscribeToCursorUpdates = useCallback(() => {
    const unsubscribe = subscribe(
      "canvas_cursor_update",
      (data: CanvasCursorData) => {
        setCursors((prev) => {
          const existingIndex = prev.findIndex((c) => c.userId === data.userId);

          if (existingIndex >= 0) {
            const newCursors = [...prev];
            newCursors[existingIndex] = data;
            return newCursors;
          } else {
            return [...prev, data];
          }
        });
      }
    );

    const unsubscribeUserLeft = subscribe(
      "user_left",
      (data: { userId: string }) => {
        console.log("🗑️ User left, removing cursor:", data.userId);
        setCursors((prev) => prev.filter((c) => c.userId !== data.userId));
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUserLeft();
    };
  }, [subscribe]);

  const removeCursor = useCallback((userId: string) => {
    console.log("🗑️ Removing canvas cursor:", userId);
    setCursors((prev) => prev.filter((c) => c.userId !== userId));
  }, []);

  return {
    cursors,
    sendCursorUpdate,
    subscribeToCursorUpdates,
    removeCursor,
  };
};
