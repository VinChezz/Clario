import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string; userId: string }> },
) {
  try {
    const { teamId, userId } = await params;

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "User not found in team" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      role: teamMember.role,
    });
  } catch (error) {
    console.error("❌ Failed to fetch user role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 },
    );
  }
}
