export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function DELETE(request: NextRequest) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();
    const isAuth = await isAuthenticated();

    if (!isAuth || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        role: "ADMIN",
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { logo: true },
    });

    if (team?.logo && team.logo.startsWith("/uploads/team-logos/")) {
      const filePath = join(process.cwd(), "public", team.logo);
      try {
        await unlink(filePath);
      } catch (error) {
        console.warn("Logo file not found or already deleted:", error);
      }
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { logo: null },
    });

    return NextResponse.json({
      success: true,
      message: "Logo removed successfully",
    });
  } catch (error) {
    console.error("Remove logo error:", error);
    return NextResponse.json(
      { error: "Failed to remove logo" },
      { status: 500 }
    );
  }
}
