import { useCallback, useRef } from "react";
import { useRealtimePresence } from "./useRealtimePresence";

export function useLightweightPresence(fileId: string, currentUser: any) {
  const { updateRealtimePresence } = useRealtimePresence(fileId, currentUser);
  const lastUpdateRef = useRef<number>(0);
  const lastStatusRef = useRef<string>("");
  const updateCooldown = 1000;

  const updateLightPresence = useCallback(
    (status: string, cursor?: any) => {
      const now = Date.now();

      if (
        now - lastUpdateRef.current < updateCooldown &&
        lastStatusRef.current === status
      ) {
        return;
      }

      lastUpdateRef.current = now;
      lastStatusRef.current = status;

      updateRealtimePresence(status, cursor);
    },
    [updateRealtimePresence]
  );

  return {
    updateLightPresence,
  };
}
