import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getPlanLimit } from "@/lib/planUtils";
import { Plan } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let actualFileCount = 0;
    let totalFiles = 0;

    if (teamId) {
      const teamAccess = await prisma.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { createdById: dbUser.id },
            { members: { some: { userId: dbUser.id } } },
          ],
        },
      });

      if (!teamAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      actualFileCount = await prisma.file.count({
        where: {
          teamId: teamId,
          deletedAt: null,
        },
      });

      totalFiles = await prisma.file.count({
        where: {
          teamId: teamId,
        },
      });
    } else {
      actualFileCount = await prisma.file.count({
        where: {
          createdById: dbUser.id,
          deletedAt: null,
        },
      });

      totalFiles = await prisma.file.count({
        where: {
          createdById: dbUser.id,
        },
      });
    }

    const limits = getPlanLimit(dbUser.plan as Plan);

    return NextResponse.json({
      user: {
        id: dbUser.id,
        plan: dbUser.plan,
        email: dbUser.email,
        totalCreatedFiles: dbUser.totalCreatedFiles,
      },
      storage: {
        usedSlots: dbUser.totalCreatedFiles,
        maxSlots: limits.maxFiles,
        actualFileCount: actualFileCount,
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
