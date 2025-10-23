import { useState, useCallback, useRef } from "react";
import { throttle } from "lodash";
import { useSocket } from "./useSocket";

export const useRealtimeCanvasContent = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const [remoteContent, setRemoteContent] = useState<any>(null);
  const lastSentContent = useRef<string>("");

  const sendContentUpdateThrottled = useCallback(
    throttle((content: any) => {
      if (!isConnected || !currentUser) return false;

      const contentString = JSON.stringify(content);
      if (contentString === lastSentContent.current) {
        return false;
      }

      console.log("🚀📤 THROTTLED SEND:", {
        elements: content?.length || 0,
        user: currentUser.name,
      });

      lastSentContent.current = contentString;
      emitEvent("canvas_content_update", { content });
      return true;
    }, 100),
    [emitEvent, isConnected, currentUser]
  );

  const sendContentUpdateImmediate = useCallback(
    (content: any) => {
      if (!isConnected || !currentUser) return false;

      const contentString = JSON.stringify(content);
      if (contentString === lastSentContent.current) {
        return false;
      }

      console.log("⚡📤 IMMEDIATE SEND:", {
        elements: content?.length || 0,
        user: currentUser.name,
      });

      lastSentContent.current = contentString;
      emitEvent("canvas_content_update", { content });
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

  return {
    remoteContent,
    sendContentUpdate: sendContentUpdateThrottled,
    sendContentUpdateImmediate,
    subscribeToContentUpdates,
    subscribeToContentSync,
  };
};
