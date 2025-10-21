import { useState, useCallback } from "react";
import { useSocket } from "./useSocket";

export const useRealtimeContent = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe } = useSocket(fileId, currentUser);
  const [remoteContent, setRemoteContent] = useState<any>(null);

  const sendContentUpdate = useCallback(
    (content: any) => {
      console.log("🚀📤 SENDING CONTENT UPDATE:", {
        blocks: content?.blocks?.length || 0,
        hasText: content?.blocks?.some((block: any) => block.data?.text),
        content,
      });
      emitEvent("content_update", {
        content,
      });
    },
    [emitEvent]
  );

  const subscribeToContentUpdates = useCallback(
    (callback: (content: any, user: any) => void) => {
      console.log("📡 Subscribing to content updates for file:", fileId);

      return subscribe(
        "content_update",
        (data: { content: any; user: any }) => {
          console.log("🎯📨 RECEIVED CONTENT UPDATE:", {
            from: data.user?.name,
            blocks: data.content?.blocks?.length || 0,
            hasText: data.content?.blocks?.some(
              (block: any) => block.data?.text
            ),
            content: data.content,
          });

          setRemoteContent(data.content);
          callback(data.content, data.user);
        }
      );
    },
    [subscribe, fileId]
  );

  const subscribeToContentSync = useCallback(
    (callback: (content: any) => void) => {
      return subscribe("content_sync", (content: any) => {
        console.log("🔄 Received initial content sync:", content);
        setRemoteContent(content);
        callback(content);
      });
    },
    [subscribe]
  );

  return {
    remoteContent,
    sendContentUpdate,
    subscribeToContentUpdates,
    subscribeToContentSync,
  };
};
