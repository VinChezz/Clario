"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FILE } from "@/shared/types/file.interface";

interface TeamData {
  files: FILE[];
  teamMembers: number;
  storagePercentage: number;
  isLoading: boolean;
  error: string | null;
}

export function useTeamData(teamId: string | undefined) {
  const [data, setData] = useState<TeamData>({
    files: [],
    teamMembers: 0,
    storagePercentage: 0,
    isLoading: true,
    error: null,
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (force = false) => {
      if (!teamId) {
        if (mountedRef.current) {
          setData((prev) => ({ ...prev, isLoading: false }));
        }
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (mountedRef.current) {
          setData((prev) => ({ ...prev, isLoading: true, error: null }));
        }

        console.log("🚀 Fetching team data for:", teamId);

        const [teamResponse, storageResponse, filesResponse] =
          await Promise.all([
            fetch(`/api/teams/${teamId}/members`, {
              signal: controller.signal,
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
            }),
            fetch(`/api/users/storage?teamId=${teamId}&includeTrash=true`, {
              signal: controller.signal,
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
            }),
            fetch(`/api/files?teamId=${teamId}&includeTrashed=false`, {
              signal: controller.signal,
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
            }),
          ]);

        const [teamData, storageData, filesData] = await Promise.all([
          teamResponse.ok ? teamResponse.json() : null,
          storageResponse.ok ? storageResponse.json() : null,
          filesResponse.ok ? filesResponse.json() : [],
        ]);

        const membersCount = Array.isArray(teamData)
          ? teamData.length
          : teamData?.members?.length || 0;

        const activeFiles = Array.isArray(filesData)
          ? filesData.filter((f: FILE) => !f.deletedAt)
          : [];

        const newData: TeamData = {
          files: activeFiles,
          teamMembers: membersCount,
          storagePercentage: Math.min(
            storageData?.storage?.percentage || 0,
            100,
          ),
          isLoading: false,
          error: null,
        };

        if (mountedRef.current) {
          setData(newData);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Request aborted for team:", teamId);
          return;
        }
        console.error("❌ Failed to load team data:", error);
        if (mountedRef.current) {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
        }
      }
    },
    [teamId],
  );

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [teamId, fetchData]);

  useEffect(() => {
    if (teamId) {
      fetchData(true);
    }
  }, []);
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    ...data,
    refresh,
  };
}
