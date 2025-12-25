import { prisma } from "@/lib/prisma";

export async function getTeamWithMembers(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          plan: true,
          maxFiles: true,
        },
      },
      files: {
        where: { deletedAt: null },
        select: { id: true },
      },
      teamSettings: true,
      githubRepo: true,
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  const storageUsage = team.files.length * 0.1;

  return {
    ...team,
    storageUsage,
  };
}

export async function getTeamMember(teamId: string, memberId: string) {
  return await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId: memberId,
        teamId: teamId,
      },
    },
    include: {
      user: true,
      team: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getTeamWithSettings(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      teamSettings: true,
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  return team;
}
