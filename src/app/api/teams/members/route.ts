import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function PATCH(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, teamId, role } = await request.json();

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        role: "ADMIN",
      },
    });

    const isTeamCreator = await prisma.team.findFirst({
      where: {
        id: teamId,
        createdById: dbUser.id,
      },
    });

    if (!userMembership && !isTeamCreator) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only ADMIN can manage roles." },
        { status: 403 }
      );
    }

    const targetMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: teamId,
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (role === "ADMIN" && !isTeamCreator) {
      return NextResponse.json(
        { error: "Only team creator can assign ADMIN role" },
        { status: 403 }
      );
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, teamId } = await request.json();

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        role: "ADMIN",
      },
    });

    const isTeamCreator = await prisma.team.findFirst({
      where: {
        id: teamId,
        createdById: dbUser.id,
      },
    });

    if (!userMembership && !isTeamCreator) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only ADMIN can remove members." },
        { status: 403 }
      );
    }

    const targetMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: teamId,
      },
      include: {
        user: true,
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.userId === dbUser.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from team" },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
