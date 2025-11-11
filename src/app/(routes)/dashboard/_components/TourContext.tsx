"use client";

import React, { createContext, useContext, useState } from "react";

interface TourContextType {
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);

  return (
    <TourContext.Provider value={{ isTourActive, setIsTourActive }}>
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
