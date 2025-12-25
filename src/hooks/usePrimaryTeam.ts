"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePrimaryTeam() {
  const router = useRouter();

  useEffect(() => {
    const primaryTeamId = localStorage.getItem("primary_team_id");
    const primaryTeamName = localStorage.getItem("primary_team_name");

    if (primaryTeamId && primaryTeamName) {
      console.log(`Primary team detected: ${primaryTeamName}`);
    }
  }, [router]);

  const getPrimaryTeam = () => {
    const teamId = localStorage.getItem("primary_team_id");
    const teamName = localStorage.getItem("primary_team_name");

    return teamId ? { id: teamId, name: teamName || "Primary Team" } : null;
  };

  const setPrimaryTeam = (teamId: string, teamName: string) => {
    localStorage.setItem("primary_team_id", teamId);
    localStorage.setItem("primary_team_name", teamName);
  };

  const clearPrimaryTeam = () => {
    localStorage.removeItem("primary_team_id");
    localStorage.removeItem("primary_team_name");
  };

  return {
    getPrimaryTeam,
    setPrimaryTeam,
    clearPrimaryTeam,
  };
}
