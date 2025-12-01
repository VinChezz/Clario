import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { canCreateTeam, getPlanLimit } from "@/lib/planUtils";
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
        createdById: dbUser.id,
      },
    });

    const canCreate = canCreateTeam(dbUser.plan as Plan, userTeams.length);
    const limits = getPlanLimit(dbUser.plan as Plan);

    return NextResponse.json({
      canCreate,
      currentPlan: dbUser.plan,
      currentTeams: userTeams.length,
      maxTeams: limits.maxTeams,
      requiresUpgrade: !canCreate && dbUser.plan === Plan.FREE,
    });
  } catch (error) {
    console.error("❌ Error checking team limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
