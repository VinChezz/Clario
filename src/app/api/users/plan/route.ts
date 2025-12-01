import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getPlanLimit } from "@/lib/planUtils";
import { Plan } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            createdById: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planLimits = getPlanLimit(dbUser.plan as Plan);

    const userTeams = await prisma.team.findMany({
      where: {
        OR: [
          { createdById: dbUser.id },
          { members: { some: { userId: dbUser.id } } },
        ],
      },
      select: { id: true },
    });

    const teamIds = userTeams.map((team) => team.id);

    const actualFileCount = await prisma.file.count({
      where: {
        teamId: { in: teamIds },
        deletedAt: null,
      },
    });

    const userCreatedTeams = dbUser.teams.filter(
      (team) => team.createdById === dbUser.id
    );
    const canCreateTeam = userCreatedTeams.length < planLimits.maxTeams;

    const canCreateFile = dbUser.totalCreatedFiles < planLimits.maxFiles;

    const response = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        plan: dbUser.plan,
        totalCreatedFiles: dbUser.totalCreatedFiles,
        maxFiles: dbUser.maxFiles,
        maxTeams: dbUser.maxTeams,
      },
      limits: planLimits,
      usage: {
        teams: {
          current: userCreatedTeams.length,
          max: planLimits.maxTeams,
          canCreate: canCreateTeam,
        },
        files: {
          current: dbUser.totalCreatedFiles,
          active: actualFileCount,
          max: planLimits.maxFiles,
          canCreate: canCreateFile,
          inTrash: dbUser.totalCreatedFiles - actualFileCount,
        },
        storage: {
          current: 0,
          max: planLimits.maxStorage,
        },
      },
      requiresUpgrade:
        dbUser.plan === Plan.FREE &&
        (dbUser.totalCreatedFiles >= planLimits.maxFiles ||
          userCreatedTeams.length >= planLimits.maxTeams),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching user plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH endpoint для обновления плана пользователя (для админа или системы оплаты)
export async function PATCH(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, maxFiles, maxTeams } = await request.json();

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (plan && Object.values(Plan).includes(plan as Plan)) {
      updateData.plan = plan;

      const planLimits = getPlanLimit(plan as Plan);
      updateData.maxFiles = planLimits.maxFiles;
      updateData.maxTeams = planLimits.maxTeams;
    }

    if (maxFiles !== undefined) updateData.maxFiles = maxFiles;
    if (maxTeams !== undefined) updateData.maxTeams = maxTeams;

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        totalCreatedFiles: true,
        maxFiles: true,
        maxTeams: true,
      },
    });

    return NextResponse.json(
      {
        message: "User plan updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating user plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
