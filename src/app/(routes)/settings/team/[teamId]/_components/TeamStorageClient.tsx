"use client";

import { useStorage } from "@/hooks/useStorage";

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
  const storageHook = useStorage(teamId);

  const realUsedBytes = teamId
    ? storageHook?.teamStorage?.usedBytes
      ? Number(storageHook.teamStorage.usedBytes)
      : 0
    : storageHook?.data?.files?.calculatedSizeBytes
    ? Number(storageHook.data.files.calculatedSizeBytes)
    : 0;

  const realUsedGB = realUsedBytes / 1024 ** 3;

  const formatGB = (gb: number): string => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    if (gb < 0.1 && gb > 0) return `${(gb * 1024).toFixed(1)} MB`;
    if (gb === 0) return "0 GB";
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="text-2xl font-bold">
      {formatGB(realUsedGB)}
      <p className="text-xs text-gray-500">
        of {planLimitGB.toFixed(0)} GB used
      </p>
    </div>
  );
}
