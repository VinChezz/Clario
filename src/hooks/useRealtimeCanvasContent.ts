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

      lastSentContent.current = contentString;
      emitEvent("canvas_content_update", { content });
      return true;
    }, 100),
    [emitEvent, isConnected, currentUser],
  );

  const sendContentUpdateImmediate = useCallback(
    (content: any) => {
      if (!isConnected || !currentUser) return false;

      const contentString = JSON.stringify(content);
      if (contentString === lastSentContent.current) {
        return false;
      }

      lastSentContent.current = contentString;
      emitEvent("canvas_content_update", { content });
      return true;
    },
    [emitEvent, isConnected, currentUser],
  );

  const subscribeToContentUpdates = useCallback(
    (callback: (content: any, user: any) => void) => {
      return subscribe(
        "canvas_content_update",
        (data: { content: any; user: any }) => {
          if (data.user?.id === currentUser?.id) {
            return;
          }

          setRemoteContent(data.content);
          callback(data.content, data.user);
        },
      );
    },
    [subscribe, currentUser],
  );

  const subscribeToContentSync = useCallback(
    (callback: (content: any) => void) => {
      return subscribe("canvas_content_sync", (content: any) => {
        setRemoteContent(content);
        callback(content);
      });
    },
    [subscribe],
  );

  return {
    remoteContent,
    sendContentUpdate: sendContentUpdateThrottled,
    sendContentUpdateImmediate,
    subscribeToContentUpdates,
    subscribeToContentSync,
  };
};
