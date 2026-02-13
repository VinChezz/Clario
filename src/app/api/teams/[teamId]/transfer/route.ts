import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { teamId } = await params;
    const { newOwnerId } = await request.json();

    if (!newOwnerId) {
      return NextResponse.json(
        { error: "New owner ID is required" },
        { status: 400 },
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.createdById !== dbUser.id) {
      return NextResponse.json(
        { error: "Only the team owner can transfer ownership" },
        { status: 403 },
      );
    }

    const newOwnerMember = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId,
        userId: newOwnerId,
      },
    });

    if (!newOwnerMember) {
      return NextResponse.json(
        { error: "Selected user is not a team member" },
        { status: 400 },
      );
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        createdById: newOwnerId,
      },
    });

    await Promise.all([
      prisma.teamMember.updateMany({
        where: {
          teamId: teamId,
          userId: dbUser.id,
        },
        data: {
          role: "EDIT",
        },
      }),

      prisma.teamMember.updateMany({
        where: {
          teamId: teamId,
          userId: newOwnerId,
        },
        data: {
          role: "ADMIN",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    console.error("❌ Error transferring ownership:", error);
    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 },
    );
  }
}
