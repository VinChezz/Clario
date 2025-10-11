import { prisma } from "@/lib/prisma";

export async function hasTeamAccess(userId: string, teamId: string) {
  const teamAccess = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { createdById: userId },
        {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      ],
    },
  });

  return !!teamAccess;
}

export async function hasEditAccess(userId: string, teamId: string) {
  const teamAccess = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { createdById: userId },
        {
          members: {
            some: {
              userId: userId,
              role: { in: ["EDIT"] },
            },
          },
        },
      ],
    },
  });

  return !!teamAccess;
}
