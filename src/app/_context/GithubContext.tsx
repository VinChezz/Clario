"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface GithubContextType {
  connectedRepo: any;
  setConnectedRepo: (repo: any) => void;
  checkRepoConnection: (teamId: string) => Promise<void>;
}

const GithubContext = createContext<GithubContextType | undefined>(undefined);

export function GithubProvider({ children }: { children: ReactNode }) {
  const [connectedRepo, setConnectedRepo] = useState<any>(null);

  const checkRepoConnection = async (teamId: string) => {
    try {
      const response = await fetch(`/api/github/connect?teamId=${teamId}`);
      const result = await response.json();

      if (result.connected && result.data) {
        setConnectedRepo(result.data);
      } else {
        setConnectedRepo(null);
      }
    } catch (error) {
      console.error("Failed to check repo connection:", error);
      setConnectedRepo(null);
    }
  };

  return (
    <GithubContext.Provider
      value={{ connectedRepo, setConnectedRepo, checkRepoConnection }}
    >
      {children}
    </GithubContext.Provider>
  );
}

export function useGithub() {
  const context = useContext(GithubContext);
  if (context === undefined) {
    throw new Error("useGithub must be used within a GithubProvider");
  }
  return context;
}
