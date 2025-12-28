import { Plan } from "@prisma/client";

export type PlanLimits = {
  maxFiles: number;
  maxTeams: number;
  maxStorage: number;
  slotsNeverDecrease: boolean;
  features: string[];
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.FREE]: {
    maxFiles: Infinity,
    maxTeams: 1,
    maxStorage: 2 * 1024 * 1024 * 1024, // 2GB
    slotsNeverDecrease: true,
    features: [
      "Unlimited files",
      "1 team only",
      "Basic collaboration",
      "2GB storage",
      "Standard support",
    ],
  },
  [Plan.PRO]: {
    maxFiles: Infinity,
    maxTeams: 5,
    maxStorage: 10 * 1024 ** 3, // 10GB
    slotsNeverDecrease: false,
    features: [
      "Unlimited files",
      "Up to 5 teams",
      "Advanced collaboration",
      "10GB storage",
      "Priority support",
    ],
  },
  [Plan.ENTERPRISE]: {
    maxFiles: Infinity,
    maxTeams: 50,
    maxStorage: 20 * 1024 ** 3, // 20GB
    slotsNeverDecrease: false,
    features: [
      "Everything in Pro",
      "Up to 50 teams",
      "Enterprise features",
      "20GB storage",
      "Dedicated support",
    ],
  },
};

export const getPlanLimit = (plan: Plan = Plan.FREE): PlanLimits => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS[Plan.FREE];
};

export const canCreateTeam = (
  userPlan: Plan,
  currentTeamsCount: number
): boolean => {
  const limits = getPlanLimit(userPlan);
  return currentTeamsCount < limits.maxTeams;
};

export const canUseStorage = (
  userPlan: Plan,
  currentStorageUsed: bigint,
  additionalSize: bigint
): boolean => {
  const limits = getPlanLimit(userPlan);
  const totalAfterAddition = currentStorageUsed + additionalSize;
  return totalAfterAddition <= limits.maxStorage;
};

export const hasStorageSpace = (
  userPlan: Plan,
  currentStorageUsed: bigint,
  requiredBytes: bigint
): boolean => {
  const limits = getPlanLimit(userPlan);
  return currentStorageUsed + requiredBytes <= limits.maxStorage;
};

export const canCreateFile = (
  userPlan: Plan,
  currentStorageUsed: bigint,
  fileSizeBytes: bigint
): boolean => {
  return hasStorageSpace(userPlan, currentStorageUsed, fileSizeBytes);
};

export function formatBytes(bytes: bigint | number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const bytesNumber = typeof bytes === "bigint" ? Number(bytes) : bytes;
  const i = Math.floor(Math.log(bytesNumber) / Math.log(k));

  return (
    parseFloat((bytesNumber / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  );
}
