import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (fileId: string, currentUser: any) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) {
      console.log("⏳ Waiting for currentUser to load...", { currentUser });
      return;
    }

    console.log("🔌 Initializing socket connection...", {
      fileId,
      user: currentUser.name,
    });

    const socket = io("http://localhost:4000", {
      autoConnect: true,
      reconnection: true,
      auth: {
        userId: currentUser.id,
      },
      query: {
        userId: currentUser.id,
      },
    });

    socketRef.current = socket;

    const onConnect = () => {
      console.log("✅ Connected to server, joining room:", fileId);
      setIsConnected(true);

      console.log("📤 Emitting join_room:", { fileId });
      socket.emit("join_room", { fileId });
    };

    const onDisconnect = (reason: string) => {
      console.log("❌ Disconnected from server. Reason:", reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
      setReconnectAttempts((prev) => prev + 1);
    };

    const onReconnectAttempt = (attempt: number) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    };

    const onReconnect = (attempt: number) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    const onReconnectError = (error: Error) => {
      console.error("Reconnection error:", error);
    };

    const onReconnectFailed = () => {
      console.error("❌ Reconnection failed after all attempts");
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("reconnect_attempt", onReconnectAttempt);
    socket.on("reconnect", onReconnect);
    socket.on("reconnect_error", onReconnectError);
    socket.on("reconnect_failed", onReconnectFailed);

    return () => {
      console.log("🧹 Cleaning up socket connection");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("reconnect_attempt", onReconnectAttempt);
      socket.off("reconnect", onReconnect);
      socket.off("reconnect_error", onReconnectError);
      socket.off("reconnect_failed", onReconnectFailed);
      socket.disconnect();
    };
  }, [fileId, currentUser]); // ДОБАВЬТЕ currentUser В ЗАВИСИМОСТИ

  const emitEvent = useCallback(
    (event: string, data: any) => {
      if (socketRef.current && isConnected) {
        console.log(`📤 Emitting ${event}:`, data);
        socketRef.current.emit(event, { fileId, ...data });
      } else {
        console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      }
    },
    [fileId, isConnected]
  );

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      console.log(`📡 Subscribing to ${event}`);
      socketRef.current?.on(event, callback);

      return () => {
        console.log(`📡 Unsubscribing from ${event}`);
        socketRef.current?.off(event, callback);
      };
    },
    []
  );

  return {
    emitEvent,
    subscribe,
    isConnected,
    reconnectAttempts,
    socket: socketRef.current,
  };
};

const generateUserColor = (userId: string): string => {
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
};
