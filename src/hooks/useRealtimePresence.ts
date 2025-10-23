import { useState, useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";

export function useRealtimePresence(fileId: string, currentUser: any) {
  const { subscribe, isConnected, emitEvent } = useSocket(fileId, currentUser);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  const updateRealtimePresence = useCallback(
    (status: string, cursor?: any) => {
      if (isConnected && currentUser && fileId) {
        console.log("🔄 Sending realtime presence:", { status, cursor });

        emitEvent("presence_update", {
          fileId,
          status,
          cursor,
          userId: currentUser.id,
        });
      }
    },
    [emitEvent, isConnected, currentUser, fileId]
  );

  const subscribeToPresenceUpdates = useCallback(() => {
    console.log("📡 Subscribing to realtime presence updates");

    const unsubscribeRoomState = subscribe(
      "room_presence_state",
      (users: any[]) => {
        console.log("🏠 Received room presence state:", users.length, "users");
        setActiveUsers(users);
      }
    );

    const unsubscribeJoined = subscribe("user_joined_presence", (data: any) => {
      console.log(
        "👋 User joined via WebSocket:",
        data.user?.name,
        data.status
      );

      setActiveUsers((prev) => {
        const exists = prev.find((u) => u.user?.id === data.user?.id);
        if (exists) {
          return prev.map((u) =>
            u.user?.id === data.user?.id
              ? {
                  ...data,
                  id: data.user?.id,
                  lastActive: data.lastActive || new Date().toISOString(),
                }
              : u
          );
        }
        return [
          ...prev,
          {
            ...data,
            id: data.user?.id,
            lastActive: data.lastActive || new Date().toISOString(),
          },
        ];
      });
    });

    const unsubscribeLeft = subscribe(
      "user_left_presence",
      (data: { userId: string }) => {
        console.log("👋 User left via WebSocket:", data.userId);
        setActiveUsers((prev) =>
          prev.filter((u) => u.user?.id !== data.userId)
        );
      }
    );

    const unsubscribePresence = subscribe("presence_updated", (data: any) => {
      console.log(
        "🔄 Presence updated via WebSocket:",
        data.user?.name,
        data.status
      );

      setActiveUsers((prev) => {
        const exists = prev.find((u) => u.user?.id === data.user?.id);
        if (exists) {
          return prev.map((u) =>
            u.user?.id === data.user?.id
              ? {
                  ...data,
                  id: data.user?.id,
                  lastActive: data.lastActive || new Date().toISOString(),
                }
              : u
          );
        }
        return [
          ...prev,
          {
            ...data,
            id: data.user?.id,
            lastActive: data.lastActive || new Date().toISOString(),
          },
        ];
      });
    });

    return () => {
      unsubscribeRoomState();
      unsubscribeJoined();
      unsubscribeLeft();
      unsubscribePresence();
    };
  }, [subscribe]);

  useEffect(() => {
    if (isConnected && currentUser && fileId) {
      const unsubscribe = subscribeToPresenceUpdates();
      return unsubscribe;
    }
  }, [isConnected, currentUser, fileId, subscribeToPresenceUpdates]);

  useEffect(() => {
    if (!isConnected) {
      setActiveUsers([]);
    }
  }, [isConnected]);

  return {
    activeUsers,
    updateRealtimePresence,
    subscribeToPresenceUpdates,
  };
}
