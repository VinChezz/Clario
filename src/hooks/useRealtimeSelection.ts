import { useState, useCallback } from "react";
import { useSocket } from "./useSocket";

interface SelectionData {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  userColor: string;
  selection: {
    start: number;
    end: number;
    text: string;
  };
}

export const useRealtimeSelection = (fileId: string, currentUser: any) => {
  const { emitEvent, subscribe } = useSocket(fileId, currentUser);
  const [selections, setSelections] = useState<SelectionData[]>([]);

  const sendSelectionUpdate = useCallback(
    (selectionData: Omit<SelectionData, "user">) => {
      console.log("📤 Sending selection update:", {
        text: selectionData.selection.text,
        length: selectionData.selection.text.length,
      });
      emitEvent("selection_update", {
        selection: selectionData,
      });
    },
    [emitEvent]
  );

  const subscribeToSelectionUpdates = useCallback(() => {
    console.log("📡 Subscribing to selection updates");

    return subscribe("selection_update", (data: SelectionData) => {
      console.log("📨 Received selection update:", {
        from: data.user?.name,
        text: data.selection.text,
        length: data.selection.text.length,
      });

      setSelections((prev) => {
        const existing = prev.find((s) => s.userId === data.userId);
        if (existing) {
          return prev.map((s) => (s.userId === data.userId ? data : s));
        } else {
          return [...prev, data];
        }
      });
    });
  }, [subscribe]);

  const removeSelection = useCallback((userId: string) => {
    setSelections((prev) => prev.filter((s) => s.userId !== userId));
  }, []);

  return {
    selections,
    sendSelectionUpdate,
    subscribeToSelectionUpdates,
    removeSelection,
  };
};
