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
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    const limits = getPlanLimit(dbUser.plan as Plan);

    return NextResponse.json({
      user: {
        id: dbUser.id,
        plan: dbUser.plan,
        totalCreatedFiles: dbUser.totalCreatedFiles,
        maxFiles: limits.maxFiles,
      },
      storage: {
        usedSlots: dbUser.totalCreatedFiles,
        maxSlots: limits.maxFiles,
        actualFileCount,
        filesInTrash: dbUser.totalCreatedFiles - actualFileCount,
        usagePercentage: Math.min(
          (dbUser.totalCreatedFiles / limits.maxFiles) * 100,
          100
        ),
        isFull: dbUser.totalCreatedFiles >= limits.maxFiles,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching storage data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
