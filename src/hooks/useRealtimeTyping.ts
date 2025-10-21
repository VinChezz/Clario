import { useState, useCallback } from "react";
import { useSocket } from "./useSocket";

interface TypingCursor {
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

export const useRealtimeTyping = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe } = useSocket(fileId, currentUser);
  const [typingCursors, setTypingCursors] = useState<TypingCursor[]>([]);

  const sendTypingUpdate = useCallback(
    (cursorData: Omit<TypingCursor, "user">) => {
      console.log("📤 Sending typing update:", cursorData);
      emitEvent("typing_update", {
        typing: cursorData,
      });
    },
    [emitEvent]
  );

  const subscribeToTypingUpdates = useCallback(() => {
    return subscribe("typing_update", (data: any) => {
      console.log("📨 Received raw typing data:", data);

      // ВРЕМЕННЫЙ FALLBACK - если нет user данных, создаем базовые
      const processedData: TypingCursor = {
        userId: data.userId,
        user: data.user || {
          id: data.userId,
          name: `User-${data.userId.slice(0, 4)}`,
          email: "",
          image: "",
        },
        userColor: data.userColor,
        position: data.position,
        isTyping: data.isTyping,
      };

      console.log("📨 Processed typing data:", processedData);

      setTypingCursors((prev) => {
        const existing = prev.find((c) => c.userId === processedData.userId);
        if (existing) {
          return prev.map((c) =>
            c.userId === processedData.userId ? processedData : c
          );
        } else {
          return [...prev, processedData];
        }
      });
    });
  }, [subscribe]);

  const removeTypingCursor = useCallback((userId: string) => {
    console.log("🗑️ Removing typing cursor:", userId);
    setTypingCursors((prev) => prev.filter((c) => c.userId !== userId));
  }, []);

  return {
    typingCursors,
    sendTypingUpdate,
    subscribeToTypingUpdates,
    removeTypingCursor,
  };
};
