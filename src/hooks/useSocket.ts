import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

declare global {
  interface Window {
    debugSocket?: Socket;
  }
}

export const useSocket = (fileId: string, currentUser: any) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  console.log("🔌 [DEBUG] useSocket called", {
    hasUser: !!currentUser,
    userId: currentUser?.id,
    fileId,
  });

  useEffect(() => {
    console.log("🔌 [DEBUG] useEffect running", {
      currentUser: currentUser?.name,
      currentUserId: currentUser?.id,
    });

    if (!currentUser?.id) {
      console.log("⏳ [DEBUG] No user ID, skipping socket creation");
      return;
    }

    if (socketRef.current?.connected) {
      console.log("ℹ️ [DEBUG] Socket already connected");
      return;
    }

    console.log("🚀 [DEBUG] Creating new socket connection");

    try {
      const socket = io("http://localhost:4000", {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        timeout: 10000,
        transports: ["websocket"],
        forceNew: true,
        auth: {
          userId: currentUser.id,
        },
        query: {
          userId: currentUser.id,
          fileId: fileId,
        },
      });

      socketRef.current = socket;

      window.debugSocket = socket;

      const onConnect = () => {
        console.log("✅✅✅ [DEBUG] SOCKET CONNECTED! ID:", socket.id);
        setIsConnected(true);
        setReconnectAttempts(0);

        console.log("📤 [DEBUG] Emitting join_room");
        socket.emit("join_room", { fileId });
      };

      const onDisconnect = (reason: string) => {
        console.log("❌ [DEBUG] Disconnected:", reason);
        setIsConnected(false);
      };

      const onConnectError = (error: Error) => {
        console.error("💥 [DEBUG] Connect Error:", error);
        console.error("💥 Error details:", error.message);
        setIsConnected(false);
        setReconnectAttempts((prev) => prev + 1);
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("connect_error", onConnectError);

      const statusTimer = setTimeout(() => {
        console.log("⏰ [DEBUG] Socket status after 5s:", {
          connected: socket.connected,
          id: socket.id,
          disconnected: socket.disconnected,
        });

        if (!socket.connected) {
          console.log("⚠️ [DEBUG] Socket still not connected after 5s");
        }
      }, 5000);

      return () => {
        console.log("🧹 [DEBUG] Cleaning up socket");
        clearTimeout(statusTimer);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);

        if (socket.connected) {
          socket.disconnect();
        }
      };
    } catch (error) {
      console.error("💥 [DEBUG] Error creating socket:", error);
    }
  }, [fileId, currentUser]);

  const emitEvent = useCallback(
    (event: string, data: any) => {
      console.log(`📤 [DEBUG] Emit attempt: ${event}`, {
        isConnected,
        socketExists: !!socketRef.current,
        socketConnected: socketRef.current?.connected,
      });

      if (socketRef.current?.connected) {
        console.log(`✅ [DEBUG] Emitting: ${event}`, data);
        socketRef.current.emit(event, { fileId, ...data });
      } else {
        console.warn(`⚠️ [DEBUG] Cannot emit ${event} - not connected`);
      }
    },
    [fileId, isConnected]
  );

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      console.log(`📡 [DEBUG] Subscribing to: ${event}`);

      if (socketRef.current) {
        socketRef.current.on(event, callback);
        return () => {
          socketRef.current?.off(event, callback);
        };
      }

      console.warn(`⚠️ [DEBUG] Cannot subscribe to ${event} - no socket`);
      return () => {};
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
