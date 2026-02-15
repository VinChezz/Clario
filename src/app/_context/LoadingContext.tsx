"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface LoadingContextType {
  sideNavReady: boolean;
  dashboardReady: boolean;
  areAllComponentsReady: boolean;
  setSideNavReady: (ready: boolean) => void;
  setDashboardReady: (ready: boolean) => void;
  reset: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [sideNavReady, setSideNavReady] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);

  const reset = useCallback(() => {
    setSideNavReady(false);
    setDashboardReady(false);
  }, []);

  const areAllComponentsReady = sideNavReady && dashboardReady;

  return (
    <LoadingContext.Provider
      value={{
        sideNavReady,
        dashboardReady,
        areAllComponentsReady,
        setSideNavReady,
        setDashboardReady,
        reset,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
