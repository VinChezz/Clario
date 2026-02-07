import { useStorage } from "@/hooks/useStorage";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useState, useEffect } from "react";

export type StorageStatus =
  | "ok"
  | "warning"
  | "full"
  | "no-permission"
  | "no-team";

export interface StorageStatusInfo {
  status: StorageStatus;
  canCreate: boolean;
  message: string;
  percentage: number;
  remainingGB: number;
  usedGB: number;
  limitGB: number;
  showUpgrade: boolean;
  plan: string;
}

export function useStorageStatus(teamId?: string) {
  const { user } = useKindeBrowserClient();
  const { activeTeam } = useActiveTeam();
  const [userRole, setUserRole] = useState<"ADMIN" | "EDIT" | "VIEW">("VIEW");
  const [loadingRole, setLoadingRole] = useState(true);

  const storageHook = useStorage(teamId || activeTeam?.id, true);

  const fetchUserRole = async () => {
    if (!user || !activeTeam?.id) {
      setUserRole("VIEW");
      setLoadingRole(false);
      return;
    }

    try {
      setLoadingRole(true);
      const response = await fetch(
        `/api/teams/${activeTeam.id}/members/${user.id}/role`,
      );

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role || "VIEW");
      } else {
        setUserRole("VIEW");
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setUserRole("VIEW");
    } finally {
      setLoadingRole(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user, activeTeam?.id]);

  const canCreateFiles = userRole !== "VIEW";

  const calculateStatus = (): StorageStatusInfo => {
    if (!activeTeam?.id && !teamId) {
      return {
        status: "no-team",
        canCreate: false,
        message: "Please select a team first",
        percentage: 0,
        remainingGB: 0,
        usedGB: 0,
        limitGB: 0,
        showUpgrade: false,
        plan: "FREE",
      };
    }

    if (!canCreateFiles) {
      return {
        status: "no-permission",
        canCreate: false,
        message: "You don't have permission to create files",
        percentage: 0,
        remainingGB: 0,
        usedGB: 0,
        limitGB: 0,
        showUpgrade: false,
        plan: storageHook.data?.user?.plan || "FREE",
      };
    }

    if (!storageHook.data || storageHook.loading || loadingRole) {
      return {
        status: "ok",
        canCreate: true,
        message: "Checking storage...",
        percentage: 0,
        remainingGB: 0,
        usedGB: 0,
        limitGB: 0,
        showUpgrade: false,
        plan: "FREE",
      };
    }

    const usedGB = storageHook.getUsedGB();
    const limitGB = storageHook.getLimitGB();

    let percentage = 0;
    if (teamId || activeTeam?.id) {
      if (storageHook.data?.teamStorage?.percentage !== undefined) {
        percentage = storageHook.data.teamStorage.percentage;
      } else {
        percentage = limitGB > 0 ? (usedGB / limitGB) * 100 : 0;
      }
    } else {
      percentage = storageHook.data?.storage?.percentage || 0;
    }

    const remainingGB = limitGB - usedGB;
    const fileSizeGB = 75 / 1024; // 75MB в GB
    const plan = storageHook.data.user?.plan || "FREE";

    const canCreateFile = storageHook.canCreateFile(75 * 1024 * 1024);

    if (!canCreateFile || percentage >= 100) {
      return {
        status: "full",
        canCreate: false,
        message: `Storage full (${percentage.toFixed(0)}%). Need ${fileSizeGB.toFixed(2)}GB, but only ${remainingGB.toFixed(2)}GB available.`,
        percentage,
        remainingGB,
        usedGB,
        limitGB,
        showUpgrade: true,
        plan,
      };
    } else if (percentage >= 90) {
      return {
        status: "warning",
        canCreate: true,
        message: `${remainingGB.toFixed(2)} GB left - almost full (${percentage.toFixed(0)}%)`,
        percentage,
        remainingGB,
        usedGB,
        limitGB,
        showUpgrade: true,
        plan,
      };
    } else if (percentage >= 80) {
      return {
        status: "warning",
        canCreate: true,
        message: `${remainingGB.toFixed(2)} GB left (${percentage.toFixed(0)}% full)`,
        percentage,
        remainingGB,
        usedGB,
        limitGB,
        showUpgrade: true,
        plan,
      };
    } else {
      return {
        status: "ok",
        canCreate: true,
        message: `${remainingGB.toFixed(2)} GB free (${percentage.toFixed(0)}% used)`,
        percentage,
        remainingGB,
        usedGB,
        limitGB,
        showUpgrade: false,
        plan,
      };
    }
  };

  const statusInfo = calculateStatus();

  return {
    ...statusInfo,
    loading: storageHook.loading || loadingRole,
    refresh: storageHook.refresh,
    storageData: storageHook.data,
  };
}
