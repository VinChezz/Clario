import { useState, useCallback, useRef } from "react";
import { throttle } from "lodash";
import { useSocket } from "./useSocket";

export const useRealtimeContent = (fileId: string, currentUser: any) => {
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

      console.log("🚀📤 EDITOR THROTTLED SEND:", {
        blocks: content?.blocks?.length || 0,
        user: currentUser.name,
      });

      lastSentContent.current = contentString;

      emitEvent("editor_content_update", {
        fileId,
        content,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        },
      });
      return true;
    }, 30),
    [emitEvent, isConnected, currentUser, fileId]
  );

  const sendContentUpdateImmediate = useCallback(
    (content: any) => {
      if (!isConnected || !currentUser) return false;

      const contentString = JSON.stringify(content);
      if (contentString === lastSentContent.current) {
        return false;
      }

      console.log("⚡📤 EDITOR IMMEDIATE SEND:", {
        blocks: content?.blocks?.length || 0,
        user: currentUser.name,
      });

      lastSentContent.current = contentString;

      emitEvent("editor_content_update", {
        fileId,
        content,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        },
      });
      return true;
    },
    [emitEvent, isConnected, currentUser, fileId]
  );

  const subscribeToContentUpdates = useCallback(
    (callback: (content: any, user: any) => void) => {
      console.log("📡 EDITOR SUBSCRIBING to editor_content_update");

      return subscribe(
        "editor_content_update",
        (data: { content: any; user: any }) => {
          console.log("🎉 EDITOR RECEIVED content update:", {
            from: data.user?.name,
            blocks: data.content?.blocks?.length || 0,
          });

          if (data.user?.id === currentUser?.id) {
            console.log("🔄 EDITOR Ignoring own content");
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
      console.log("📡 EDITOR SUBSCRIBING to editor_content_sync");

      return subscribe("editor_content_sync", (content: any) => {
        console.log(
          "🔄 EDITOR RECEIVED content sync:",
          content?.blocks?.length || 0
        );
        setRemoteContent(content);
        callback(content);
      });
    },
    [subscribe]
  );

  const resetLastSentContent = useCallback(() => {
    lastSentContent.current = "";
  }, []);

  return {
    remoteContent,
    sendContentUpdate: sendContentUpdateThrottled,
    sendContentUpdateImmediate,
    subscribeToContentUpdates,
    subscribeToContentSync,
    resetLastSentContent,
  };
};
