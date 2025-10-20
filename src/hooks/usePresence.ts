import { useState, useCallback, useEffect, useRef } from "react";

interface PresenceUser {
  id: string;
  userId: string;
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
  status: "VIEWING" | "EDITING" | "COMMENTING" | "IDLE";
  lastActive: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

export function usePresence(fileId: string) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const updateIntervalRef = useRef<NodeJS.Timeout>(null);

  const fetchPresence = useCallback(async () => {
    if (!fileId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/presence?fileId=${fileId}`);
      if (!response.ok) throw new Error("Failed to fetch presence");
      const data = await response.json();
      setActiveUsers(data);
    } catch (error) {
      console.error("Error fetching presence:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  const updatePresence = useCallback(
    async (data: {
      cursor?: { position: number; selection?: { start: number; end: number } };
      status?: "VIEWING" | "EDITING" | "COMMENTING" | "IDLE";
    }) => {
      if (!fileId) return;

      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, fileId }),
        });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    },
    [fileId]
  );

  const startPresenceUpdates = useCallback(
    (interval: number = 5000) => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      updatePresence({ status: "VIEWING" });
      fetchPresence();

      updateIntervalRef.current = setInterval(() => {
        updatePresence({ status: "VIEWING" });
        fetchPresence();
      }, interval);

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    },
    [updatePresence, fetchPresence]
  );

  const stopPresenceUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPresenceUpdates();
    };
  }, [stopPresenceUpdates]);

  return {
    activeUsers,
    isLoading,
    fetchPresence,
    updatePresence,
    startPresenceUpdates,
    stopPresenceUpdates,
  };
}
