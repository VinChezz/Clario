import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    console.log("🔍 Accepting invite - User:", user.email, "Token:", token);

    let invite;
    try {
      invite = await prisma.invite.findFirst({
        where: {
          token,
          status: "PENDING",
          expiresAt: { gt: new Date() },
          NOT: {
            inviteeId: {
              startsWith: "kp_",
            },
          },
        },
        include: {
          team: true,
          invitee: true,
        },
      });
    } catch (dbError: any) {
      if (dbError.code === "P1001") {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbError;
    }

    if (!invite) {
      console.log("❌ Invalid or expired invite");
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    console.log("🔍 Invite found:", {
      id: invite.id,
      inviteeId: invite.inviteeId,
      inviteeEmail: invite.invitee?.email,
      currentUserEmail: user.email,
    });

    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name:
              user.given_name +
              (user.family_name ? ` ${user.family_name}` : ""),
            image: user.picture,
          },
        });
        console.log("✅ Created new user in database:", dbUser.id);
      }
    } catch (dbError: any) {
      if (dbError.code === "P1001") {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      throw dbError;
    }

    const isInviteForUser =
      invite.inviteeId === dbUser.id ||
      (invite.inviteeId?.startsWith("kp_") && invite.inviteeId === user.id) ||
      invite.invitee?.email === user.email;

    console.log("🔍 Detailed invite check:", {
      inviteeId: invite.inviteeId,
      currentUserDbId: dbUser.id,
      currentUserKindeId: user.id,
      inviteeEmail: invite.invitee?.email,
      currentUserEmail: user.email,
      isDatabaseIdMatch: invite.inviteeId === dbUser.id,
      isKindeIdMatch:
        invite.inviteeId?.startsWith("kp_") && invite.inviteeId === user.id,
      isEmailMatch: invite.invitee?.email === user.email,
      finalResult: isInviteForUser,
    });

    if (!isInviteForUser) {
      console.log("❌ Invite not for this user");
      return NextResponse.json(
        { error: "This invite is not for you" },
        { status: 403 }
      );
    }

    try {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: invite.teamId,
          userId: dbUser.id,
        },
      });

      if (existingMember) {
        console.log("ℹ️ User is already a team member");
        await prisma.invite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        });

        return NextResponse.json({
          success: true,
          team: invite.team,
          message: `You are already a member of ${invite.team.name}`,
        });
      }

      await prisma.teamMember.create({
        data: {
          userId: dbUser.id,
          teamId: invite.teamId,
          role: invite.role,
        },
      });

      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });

      console.log("✅ Successfully joined team:", invite.team.name);

      return NextResponse.json({
        success: true,
        team: invite.team,
        message: `You have joined ${invite.team.name}`,
      });
    } catch (dbError: any) {
      if (dbError.code === "P1001") {
        return NextResponse.json(
          {
            error:
              "Failed to join team due to service issues. Please try again later.",
          },
          { status: 503 }
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("❌ Accept invite error:", error);

    if (error.code === "P1001") {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
