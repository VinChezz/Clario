import { requestManager } from "@/lib/requestManager";
import { useState, useEffect, useRef } from "react";

interface StorageStats {
  usedBytes: bigint;
  limitBytes: bigint;
  percentage: number;
  remainingBytes: bigint;
  usedFormatted: string;
  limitFormatted: string;
  remainingFormatted: string;
}

interface TeamStorage {
  id: string;
  name: string;
  storageUsedBytes: string;
  storageUsedFormatted: string;
  storageLimitBytes: string | null;
  storageLimitFormatted: string | null;
}

export interface StorageData {
  user: {
    id: string;
    email: string;
    name: string;
    plan: string;
    totalCreatedFiles: number;
  };
  storage: {
    usedBytes: string;
    usedFormatted: string;
    limitBytes: string;
    limitFormatted: string;
    percentage: number;
    remainingBytes: string;
    remainingFormatted: string;
    dbUsedBytes?: string;
    dbUsedFormatted?: string;
    difference?: string;
  };
  files: {
    activeCount: number;
    totalCount: number;
    versionsCount: number;
    calculatedSizeBytes: string;
    calculatedSizeFormatted: string;
    statsByType: {
      documents: number;
      whiteboards: number;
      mixed: number;
      totalFiles: number;
      totalVersions: number;
    };
  };
  teamStorage?: {
    teamId: string;
    teamName: string;
    usedBytes: string;
    limitBytes: string;
    percentage: number;
    creatorPlan: string;
    creatorName: string;
    filesCount: number;
    membersCount: number;
    usedFormatted: string;
    limitFormatted: string;
    availableFormatted: string;
  };
  teams: TeamStorage[];
  requiresUpgrade: boolean;
}

export function useStorage(teamId?: string, includeTrash: boolean = true) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchStorageData = async (force = false) => {
    try {
      setLoading(true);

      const cacheKey = teamId ? `storage-${teamId}` : `storage-user`;

      const storageData = await requestManager.fetch(
        cacheKey,
        "storage",
        async () => {
          const url = teamId
            ? `/api/users/storage?teamId=${teamId}&includeTrash=true`
            : `/api/users/storage?includeTrash=true`;

          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        },
        force,
      );

      setData(storageData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch storage data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchStorageData();
    }
  }, [teamId, includeTrash]);

  const canUploadFile = (fileSizeBytes: number): boolean => {
    if (!data) return false;

    const usedBytes = BigInt(data.storage.usedBytes);
    const limitBytes = BigInt(data.storage.limitBytes);
    const fileSize = BigInt(fileSizeBytes);

    return usedBytes + fileSize <= limitBytes;
  };

  const getRemainingGB = (): number => {
    if (!data) return 0;
    const remainingBytes = BigInt(data.storage.remainingBytes);
    return Number(remainingBytes) / 1024 ** 3;
  };

  const getUsedGB = (): number => {
    if (!data) return 0;
    const usedBytes = BigInt(data.storage.usedBytes);
    return Number(usedBytes) / 1024 ** 3;
  };

  const getLimitGB = (): number => {
    if (!data) return 0;
    const limitBytes = BigInt(data.storage.limitBytes);
    return Number(limitBytes) / 1024 ** 3;
  };

  const canCreateVersion = (versionSizeBytes: number): boolean => {
    if (!data) return false;

    const usedBytes = BigInt(data.storage.usedBytes);
    const limitBytes = BigInt(data.storage.limitBytes);
    const versionSize = BigInt(versionSizeBytes);

    return usedBytes + versionSize <= limitBytes;
  };

  const canCreateFile = (fileSizeBytes: number = 75 * 1024 * 1024): boolean => {
    if (!data) return false;

    const usedBytes = BigInt(data.storage.usedBytes);
    const limitBytes = BigInt(data.storage.limitBytes);
    const fileSize = BigInt(fileSizeBytes);

    return usedBytes + fileSize <= limitBytes;
  };

  return {
    data,
    loading,
    error,
    refresh: fetchStorageData,
    canUploadFile,
    getRemainingGB,
    getUsedGB,
    getLimitGB,
    percentage: teamId
      ? data?.teamStorage?.percentage || 0
      : data?.storage.percentage || 0,
    requiresUpgrade: data?.requiresUpgrade || false,
    teamStorage: data?.teamStorage,
    canCreateVersion,
    canCreateFile,
  };
}
