import { canCreateTeam, getPlanLimit } from "@/lib/planUtils";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Plan } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        teams: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canCreate = canCreateTeam(dbUser.plan, dbUser.teams.length);
    const limits = getPlanLimit(dbUser.plan);

    return NextResponse.json({
      canCreate,
      currentPlan: dbUser.plan,
      currentTeams: dbUser.teams.length,
      maxTeams: limits.maxTeams,
      requiresUpgrade: !canCreate && dbUser.plan === Plan.FREE,
    });
  } catch (error) {
    console.error("Error checking team limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
