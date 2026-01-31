import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

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

    const deletedCount = await prisma.file.count({
      where: {
        deletedAt: { not: null },
        teamId: teamId || undefined,
      },
    });

    return NextResponse.json({
      count: deletedCount,
      plan: dbUser.plan,
      maxDeletions: dbUser.plan === "FREE" ? 1 : null,
    });
  } catch (error) {
    console.error("Error counting trash:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
