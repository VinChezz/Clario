import { Team, User, Plan } from "@prisma/client";
import { formatBytes, getPlanLimit } from "@/lib/planUtils";
import { calculateFileSize } from "@/lib/fileSizeCalculator";

export interface TeamStorageInfo {
  teamId: string;
  teamName: string;
  usedBytes: bigint;
  limitBytes: bigint;
  availableBytes: bigint;
  percentage: number;
  creatorPlan: Plan;
  creatorName: string;
  filesCount: number;
  membersCount: number;

  realUsedBytes: bigint;
  weightMultiplier: number;

  usedFormatted: string;
  limitFormatted: string;
  availableFormatted: string;
  realUsedFormatted: string;
}

export async function getTeamStorageInfo(
  team: Team & {
    createdBy: User;
    files: {
      document?: string | null;
      whiteboard?: string | null;
      sizeBytes: bigint;
    }[];
    members?: any[];
  }
): Promise<TeamStorageInfo> {
  if (!team.createdBy) {
    throw new Error("Team creator not found");
  }

  const creatorPlan = team.createdBy.plan;
  const planLimits = getPlanLimit(creatorPlan);
  const limitBytes = BigInt(planLimits.maxStorage);

  let weightedUsedBytes = BigInt(0);
  let realUsedBytes = BigInt(0);

  for (const file of team.files) {
    const weightedSize = calculateFileSize(file.document, file.whiteboard);
    weightedUsedBytes += weightedSize;

    realUsedBytes += file.sizeBytes || BigInt(0);
  }

  const availableBytes =
    limitBytes > weightedUsedBytes ? limitBytes - weightedUsedBytes : BigInt(0);

  const percentage =
    limitBytes > 0 ? Number((weightedUsedBytes * BigInt(100)) / limitBytes) : 0;

  const weightMultiplier =
    realUsedBytes > BigInt(0)
      ? Number(weightedUsedBytes) / Number(realUsedBytes)
      : 1;

  return {
    teamId: team.id,
    teamName: team.name,
    usedBytes: weightedUsedBytes,
    limitBytes,
    availableBytes,
    percentage,
    creatorPlan,
    creatorName: team.createdBy.name,
    filesCount: team.files?.length || 0,
    membersCount: team.members?.length || 0,
    realUsedBytes,
    weightMultiplier,
    usedFormatted: formatBytes(Number(weightedUsedBytes)),
    limitFormatted: formatBytes(Number(limitBytes)),
    availableFormatted: formatBytes(Number(availableBytes)),
    realUsedFormatted: formatBytes(Number(realUsedBytes)),
  };
}
