import { useState, useCallback, useEffect, useRef } from "react";

interface PresenceUser {
  id: string;
  userId: string;
  cursor?: any;
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
  const [error, setError] = useState<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isInitializedRef = useRef(false);

  const lastUpdateRef = useRef<number>(0);
  const updateCooldown = 2000;
  const pendingUpdateRef = useRef<any>(null);

  const fetchPresence = useCallback(async () => {
    if (!fileId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/presence?fileId=${fileId}`);

      if (!response.ok) {
        console.warn("Presence API returned error:", response.status);
        retryCountRef.current++;
        if (retryCountRef.current >= maxRetries) {
          setError("Presence service temporarily unavailable");
        }
        return;
      }

      const data = await response.json();
      setActiveUsers(data);
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Error fetching presence:", error);
      retryCountRef.current++;
      if (retryCountRef.current >= maxRetries) {
        setError("Failed to connect to presence service");
      }
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  const updatePresence = useCallback(
    async (data: {
      cursor?: any;
      status?: "VIEWING" | "EDITING" | "COMMENTING" | "IDLE";
    }) => {
      if (!fileId) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < updateCooldown) {
        pendingUpdateRef.current = data;
        return;
      }

      lastUpdateRef.current = now;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            fileId,
            lastActive: new Date().toISOString(),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn("Failed to update presence:", response.status);
          return;
        }

        retryCountRef.current = 0;

        if (pendingUpdateRef.current) {
          setTimeout(() => {
            const pendingData = pendingUpdateRef.current;
            pendingUpdateRef.current = null;
            if (pendingData) {
              updatePresence(pendingData);
            }
          }, updateCooldown);
        }
      } catch (error) {
        if (error === "AbortError") {
          console.warn("Presence update timeout");
        } else {
          console.error("Error updating presence:", error);
        }
      }
    },
    [fileId],
  );

  const startPresenceUpdates = useCallback(
    (interval: number = 30000) => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }

      updatePresence({ status: "VIEWING" }).catch(console.error);
      fetchPresence().catch(console.error);

      updateIntervalRef.current = setInterval(() => {
        updatePresence({ status: "VIEWING" }).catch(console.error);
        fetchPresence().catch(console.error);
      }, interval);

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    },
    [updatePresence, fetchPresence],
  );

  const stopPresenceUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!fileId || isInitializedRef.current) return;

    isInitializedRef.current = true;
    const cleanup = startPresenceUpdates(30000);

    return () => {
      cleanup();
      stopPresenceUpdates();
    };
  }, [fileId, startPresenceUpdates, stopPresenceUpdates]);

  return {
    activeUsers,
    isLoading,
    error,
    fetchPresence,
    updatePresence,
    startPresenceUpdates,
    stopPresenceUpdates,
  };
}
