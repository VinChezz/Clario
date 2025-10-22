import { useState, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";

export const useRealtimeCanvasContent = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const [remoteContent, setRemoteContent] = useState<any>(null);
  const lastSentContent = useRef<any>(null);
  const pendingUpdate = useRef<any>(null);

  const sendContentUpdate = useCallback(
    (content: any, immediate: boolean = false) => {
      if (!isConnected || !currentUser) return false;

      const contentString = JSON.stringify(content);
      if (contentString === JSON.stringify(lastSentContent.current)) {
        return false;
      }

      console.log(`🎯 ${immediate ? "FAST" : "NORMAL"} SEND:`, {
        elements: content?.length || 0,
        user: currentUser.name,
      });

      lastSentContent.current = content;

      if (immediate) {
        emitEvent("canvas_content_update", { content });
      } else {
        if (pendingUpdate.current) {
          clearTimeout(pendingUpdate.current);
        }
        pendingUpdate.current = setTimeout(() => {
          emitEvent("canvas_content_update", { content });
          pendingUpdate.current = null;
        }, 30);
      }

      return true;
    },
    [emitEvent, isConnected, currentUser]
  );

  const subscribeToContentUpdates = useCallback(
    (callback: (content: any, user: any) => void) => {
      console.log("📡 SUBSCRIBING to canvas_content_update");

      return subscribe(
        "canvas_content_update",
        (data: { content: any; user: any }) => {
          console.log("🎉 RECEIVED canvas_content_update:", {
            from: data.user?.name,
            elements: data.content?.length || 0,
          });

          // Не обрабатываем свои же обновления
          if (data.user?.id === currentUser?.id) {
            console.log("🔄 Ignoring own content");
            return;
          }

          setRemoteContent(data.content);
          callback(data.content, data.user);
        }
      );
    },
    [subscribe, currentUser]
  );

  const subscribeToContentSync = useCallback(
    (callback: (content: any) => void) => {
      console.log("📡 SUBSCRIBING to canvas_content_sync");

      return subscribe("canvas_content_sync", (content: any) => {
        console.log("🔄 RECEIVED canvas_content_sync:", content?.length || 0);
        setRemoteContent(content);
        callback(content);
      });
    },
    [subscribe]
  );

  const forceSendContent = useCallback(
    (content: any) => {
      lastSentContent.current = null;
      return sendContentUpdate(content);
    },
    [sendContentUpdate]
  );

  return {
    remoteContent,
    sendContentUpdate,
    subscribeToContentUpdates,
    subscribeToContentSync,
    forceSendContent,
  };
};
