import { useState, useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";

export const useRealtimeTyping = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const [typingCursors, setTypingCursors] = useState<any[]>([]);

  const sendTypingUpdate = useCallback(
    (typingData: any) => {
      if (isConnected && currentUser) {
        if (!typingData || typeof typingData.isTyping === "undefined") {
          console.error("❌ Invalid typing data:", typingData);
          return;
        }

        emitEvent("typing_update", {
          typing: {
            userId: currentUser.id,
            userColor:
              typingData.userColor || generateUserColor(currentUser.id),
            position: typingData.position || { x: 0, y: 0 },
            isTyping: Boolean(typingData.isTyping),
          },
        });
      }
    },
    [emitEvent, isConnected, currentUser]
  );

  const subscribeToTypingUpdates = useCallback(() => {
    console.log("📡 SUBSCRIBING to typing_update");

    return subscribe("typing_update", (data: any) => {
      console.log("⌨️ RECEIVED typing_update:", {
        from: data.user?.name,
        position: data.position,
        isTyping: data.isTyping,
      });

      if (data.user?.id === currentUser?.id) {
        console.log("🔄 Ignoring own typing update");
        return;
      }

      setTypingCursors((prev) => {
        const filtered = prev.filter(
          (cursor) => cursor.user?.id !== data.user?.id
        );

        if (!data.isTyping) {
          return filtered;
        }

        return [...filtered, data];
      });
    });
  }, [subscribe, currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingCursors((prev) => {
        const now = Date.now();
        return prev.filter((cursor) => {
          return true;
        });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    typingCursors,
    sendTypingUpdate,
    subscribeToTypingUpdates,
  };
};

function generateUserColor(userId: string): string {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];
  const index =
    userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}
