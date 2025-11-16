"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface TourContextType {
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  startTour: () => void;
  completeTour: (teamId: string) => void;
  hasCompletedTour: (teamId: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);

  const startTour = useCallback(() => {
    setIsTourActive(true);
  }, []);

  const completeTour = useCallback((teamId: string) => {
    localStorage.setItem(`getting-started-tour-completed-${teamId}`, "true");
    setIsTourActive(false);
  }, []);

  const hasCompletedTour = useCallback((teamId: string): boolean => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem(`getting-started-tour-completed-${teamId}`) ===
      "true"
    );
  }, []);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        setIsTourActive,
        startTour,
        completeTour,
        hasCompletedTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
