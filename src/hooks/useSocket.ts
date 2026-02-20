import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;
let globalConnectionAttempts = 0;
const MAX_GLOBAL_ATTEMPTS = 3;

export const useSocket = (
  fileId: string,
  currentUser: any,
  enabled: boolean = true,
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isActiveRef = useRef(false);

  const connectSocket = useCallback(() => {
    if (!fileId || !currentUser?.id || !enabled) {
      return;
    }

    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      setSocket(globalSocket);
      setIsConnected(true);

      globalSocket.emit("join_room", { fileId });
      return;
    }

    if (globalConnectionAttempts >= MAX_GLOBAL_ATTEMPTS) {
      setIsError(true);
      return;
    }

    if (socketRef.current) {
      return;
    }

    try {
      globalConnectionAttempts++;

      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

      const newSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        upgrade: true,
        forceNew: false,
        timeout: 5000,
        auth: {
          userId: currentUser.id,
        },
        query: {
          fileId,
          userId: currentUser.id,
        },

        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on("connect", () => {
        globalSocket = newSocket;
        socketRef.current = newSocket;
        setSocket(newSocket);
        setIsConnected(true);
        setIsError(false);
        globalConnectionAttempts = 0;

        newSocket.emit("join_room", { fileId });
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);

        if (reason === "io server disconnect") {
          globalSocket = null;
          socketRef.current = null;
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("💥 Socket connection error:", error);
        setIsConnected(false);
        setIsError(true);
      });

      newSocket.on("reconnect", () => {
        setIsConnected(true);
        setIsError(false);

        newSocket.emit("join_room", { fileId });
      });
    } catch (error) {
      console.error("💥 Error creating Socket.IO connection:", error);
      setIsError(true);
    }
  }, [fileId, currentUser, enabled]);

  useEffect(() => {
    if (enabled && fileId && currentUser?.id) {
      isActiveRef.current = true;
      connectSocket();
    }

    return () => {
      isActiveRef.current = false;

      if (socketRef.current?.connected && fileId) {
        socketRef.current.emit("leave_room", { fileId });
      }

      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [fileId, currentUser, enabled, connectSocket]);

  const emitEvent = useCallback(
    (event: string, data: any) => {
      if (socketRef.current?.connected && isActiveRef.current) {
        socketRef.current.emit(event, {
          ...data,
          fileId,
        });
      }
    },
    [fileId],
  );

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (!socketRef.current) {
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
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isError,
    emitEvent,
    subscribe,
    disconnect,
    reconnect: connectSocket,
  };
};
