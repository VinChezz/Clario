import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();

    if (!isAuth || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: {
        email: user.email!,
      },
      select: {
        id: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    const hasAdminAccess = teamMember?.role === "ADMIN";

    console.log("🔐 Access check result:", {
      kindeEmail: user.email,
      dbUserId: dbUser.id,
      teamId,
      role: teamMember?.role,
      hasAdminAccess,
    });

    return NextResponse.json({ hasAdminAccess });
  } catch (error) {
    console.error("❌ Check access error:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 },
    );
  }
}
