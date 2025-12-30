// context/TeamStorageContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useStorage } from "@/hooks/useStorage";

interface TeamStorageContextType {
  teamStorage: any | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  percentage: number;
  canUploadFile: (size: number) => boolean;
}

const TeamStorageContext = createContext<TeamStorageContextType | undefined>(
  undefined
);

export function TeamStorageProvider({
  teamId,
  children,
}: {
  teamId: string;
  children: ReactNode;
}) {
  const storage = useStorage(teamId);

  const value = {
    teamStorage: storage.data?.teamStorage || null,
    loading: storage.loading,
    error: storage.error,
    refresh: storage.refresh || (() => {}),
    percentage: storage.percentage,
    canUploadFile: (size: number) => storage.canUploadFile?.(size) || false,
  };

  return (
    <TeamStorageContext.Provider value={value}>
      {children}
    </TeamStorageContext.Provider>
  );
}

export function useTeamStorageContext() {
  const context = useContext(TeamStorageContext);
  if (!context) {
    throw new Error(
      "useTeamStorageContext must be used within TeamStorageProvider"
    );
  }
  return context;
}
