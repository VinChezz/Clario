import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (fileId: string, currentUser: any) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectSocket = useCallback(() => {
    if (!fileId || !currentUser?.id) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

      const newSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        upgrade: true,
        forceNew: true,
        timeout: 10000,
        auth: {
          userId: currentUser.id,
        },
        query: {
          fileId,
          userId: currentUser.id,
        },
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        setIsError(false);
        reconnectAttempts.current = 0;

        newSocket.emit("join_room", { fileId });
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);

        if (reason === "io server disconnect") {
          newSocket.connect();
        }
      });

      newSocket.on("connect_error", (error) => {
        setIsConnected(false);
        setIsError(true);

        reconnectAttempts.current += 1;
        if (reconnectAttempts.current <= maxReconnectAttempts) {
          setTimeout(() => {
            connectSocket();
          }, 2000 * reconnectAttempts.current);
        } else {
          console.error("🚨 Max reconnection attempts reached");
        }
      });

      newSocket.on("reconnect", (attemptNumber) => {
        setIsConnected(true);
        setIsError(false);
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 Socket.IO reconnection attempt ${attemptNumber}`);
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("💥 Socket.IO reconnection error:", error);
      });

      newSocket.on("reconnect_failed", () => {
        console.error("🚨 Socket.IO reconnection failed");
        setIsError(true);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error("💥 Error creating Socket.IO connection:", error);
      setIsError(true);
    }
  }, [fileId, currentUser]);

  useEffect(() => {
    connectSocket();

    return () => {
      setIsConnected(false);
    };
  }, [connectSocket]);

  const emitEvent = useCallback(
    (event: string, data: any) => {
      if (socketRef.current && isConnected) {
        try {
          socketRef.current.emit(event, {
            ...data,
            fileId,
          });
        } catch (error) {
          console.error(`💥 Error emitting ${event}:`, error);
        }
      } else {
        console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      }
    },
    [fileId, isConnected],
  );

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (!socketRef.current) {
        console.warn(`⚠️ Cannot subscribe to ${event}: socket not initialized`);
        return () => {};
      }

      socketRef.current.on(event, callback);

      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    [],
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connectSocket();
  }, [connectSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    isError,
    emitEvent,
    subscribe,
    disconnect,
    reconnect,
  };
};
