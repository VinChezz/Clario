"use client";

import { useEffect, useState } from "react";

interface TeamStorageClientProps {
  plan: string;
  planLimitGB: number;
  teamId?: string;
}

export function TeamStorageClient({
  plan,
  planLimitGB,
  teamId,
}: TeamStorageClientProps) {
  const [storageData, setStorageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorageData = async () => {
      if (!teamId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/users/storage?teamId=${teamId}&includeTrash=true`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStorageData(data);

        console.log("📊 TeamStorageClient data:", {
          usedBytes: data.storage?.usedBytes,
          percentage: data.storage?.percentage,
          filesInTrash: data.files?.inTrash,
        });
      } catch (error) {
        console.error("Failed to fetch storage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageData();
  }, [teamId]);

  const formatGB = (bytes: number): string => {
    if (!bytes) return "0 GB";

    const gb = bytes / 1024 ** 3;
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    if (gb < 0.1 && gb > 0) return `${(gb * 1024).toFixed(1)} MB`;
    return `${gb.toFixed(1)} GB`;
  };

  const usedBytes = storageData?.storage?.usedBytes
    ? Number(storageData.storage.usedBytes)
    : 0;

  const percentage = storageData?.storage?.percentage || 0;

  if (loading) {
    return (
      <div className="text-2xl font-bold animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-2xl font-bold">{formatGB(usedBytes)}</div>
      <p className="text-xs text-gray-500">
        {Math.round(percentage)}% of {planLimitGB.toFixed(0)} GB used
        {storageData?.files?.inTrash > 0 && (
          <span className="text-amber-500 ml-1">
            • {storageData.files.inTrash} in trash
          </span>
        )}
      </p>
    </div>
  );
}
