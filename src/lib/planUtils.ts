import { Plan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: {
    maxFiles: 10,
    maxTeams: 1,
    maxStorage: 2 * 1024 * 1024 * 1024, // 2GB
    slotsNeverDecrease: true,
    features: [
      "Up to 10 files",
      "1 team only",
      "Basic collaboration",
      "2GB storage",
      "Standard support",
    ],
  },
  PRO: {
    maxFiles: 1000,
    maxTeams: 5,
    maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
    slotsNeverDecrease: false,
    features: [
      "Unlimited files",
      "Up to 5 teams",
      "Advanced collaboration",
      "100GB storage",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    maxFiles: 10000,
    maxTeams: 50,
    maxStorage: 1024 * 1024 * 1024 * 1024, // 1TB
    slotsNeverDecrease: false,
    features: [
      "Everything in Pro",
      "Up to 50 teams",
      "Enterprise features",
      "Unlimited storage",
      "Dedicated support",
    ],
  },
};

export const getPlanLimit = (plan: Plan = Plan.FREE) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
};

export const canCreateTeam = (
  userPlan: Plan,
  currentTeamsCount: number
): boolean => {
  const limits = getPlanLimit(userPlan);
  return currentTeamsCount < limits.maxTeams;
};

export const canCreateFile = (
  userPlan: Plan,
  totalCreatedFiles: number,
  actualFileCount: number
): boolean => {
  const limits = getPlanLimit(userPlan);

  if (userPlan === Plan.FREE) {
    return totalCreatedFiles < limits.maxFiles;
  } else {
    return actualFileCount < limits.maxFiles;
  }
};
