import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        team: true,
      },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: "Invalid invitation link" },
        { status: 404 }
      );
    }

    if (shareLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    if (shareLink.used) {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 }
      );
    }

    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: shareLink.teamId,
        userId: dbUser.id,
      },
    });

    if (existingMember) {
      await prisma.shareLink.update({
        where: { token },
        data: {
          used: true,
          usedAt: new Date(),
          usedBy: dbUser.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "You are already a member of this team",
        redirectUrl: `/team/${shareLink.teamId}`,
      });
    }

    await prisma.teamMember.create({
      data: {
        teamId: shareLink.teamId,
        userId: dbUser.id,
        role: shareLink.permissions === "EDIT" ? "EDIT" : "VIEW",
      },
    });

    await prisma.shareLink.update({
      where: { token },
      data: {
        used: true,
        usedAt: new Date(),
        usedBy: dbUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the team!",
      redirectUrl: `/dashboard`,
      teamId: shareLink.teamId,
    });
  } catch (error) {
    console.error("Join team error:", error);
    return NextResponse.json(
      {
        error: "Failed to join team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
