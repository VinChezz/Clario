"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { TEAM } from "../(routes)/dashboard/_components/SideNavTopSection";

interface ActiveTeamContextType {
  activeTeam: TEAM | undefined;
  setActiveTeam: (team: TEAM | undefined) => void;
  isLoading: boolean;
  error: string | null;
}

const ActiveTeamContext = createContext<ActiveTeamContextType | undefined>(
  undefined
);

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const [activeTeam, setActiveTeam] = useState<TEAM>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActiveTeam = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const savedTeam = localStorage.getItem("activeTeam");
        if (savedTeam) {
          const team = JSON.parse(savedTeam);
          setActiveTeam(team);
        }
      } catch (err) {
        setError("Failed to load active team");
        console.error("Error loading active team:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveTeam();
  }, []);

  const setActiveTeamWithPersist = (team: TEAM | undefined) => {
    if (team) {
      localStorage.setItem("activeTeam", JSON.stringify(team));
    } else {
      localStorage.removeItem("activeTeam");
    }
    setActiveTeam(team);
  };

  return (
    <ActiveTeamContext.Provider
      value={{
        activeTeam,
        setActiveTeam: setActiveTeamWithPersist,
        isLoading,
        error,
      }}
    >
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
