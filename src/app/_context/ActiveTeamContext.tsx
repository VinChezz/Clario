"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { TEAM } from "../(routes)/dashboard/_components/SideNavTopSection";

interface ActiveTeamContextType {
  activeTeam: TEAM | undefined;
  setActiveTeam: (team: TEAM | undefined) => void;
}

const ActiveTeamContext = createContext<ActiveTeamContextType | undefined>(
  undefined
);

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const [activeTeam, setActiveTeam] = useState<TEAM>();

  return (
    <ActiveTeamContext.Provider value={{ activeTeam, setActiveTeam }}>
      {children}
    </ActiveTeamContext.Provider>
  );
}

export function useActiveTeam() {
  const context = useContext(ActiveTeamContext);
  if (context === undefined) {
    throw new Error("useActiveTeam must be used within an ActiveTeamProvider");
  }
  return context;
}
