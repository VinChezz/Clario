"use server";

import { prisma } from "@/lib/prisma";

export async function checkTeamAccess(teamId: string, userEmail: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        id: true,
      },
    });

    if (!dbUser) {
      return false;
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
      },
      select: {
        role: true,
      },
    });

    return teamMember?.role === "ADMIN";
  } catch (error) {
    console.error("Server-side access check error:", error);
    return false;
  }
}
