import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serializeBigInt";

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    console.log("🔍 Processing invite acceptance:", {
      token,
      user: user.email,
    });

    const invite = await prisma.invite.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    let dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email as string,
          name:
            user.given_name + (user.family_name ? ` ${user.family_name}` : ""),
          image: user.picture,
        },
      });
      console.log("✅ Created new user in database:", dbUser.id);
    }

    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        teamId: invite.teamId,
        userId: dbUser.id,
      },
    });

    if (existingMembership) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          inviteeId: dbUser.id,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        team: serializeBigInt(invite.team),
        message: "You are already a member of this team",
      });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: dbUser.id,
        teamId: invite.teamId,
        role: invite.role,
        joinedAt: new Date(),
      },
    });

    console.log("✅ Created team member:", teamMember.id);

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        inviteeId: dbUser.id,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Invite accepted successfully");

    return NextResponse.json({
      success: true,
      team: serializeBigInt(invite.team),
      message: `You have successfully joined ${invite.team.name}!`,
    });
  } catch (error: any) {
    console.error("❌ Error accepting invite:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    if (error.code === "P1001") {
      return NextResponse.json(
        { error: "Database temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
