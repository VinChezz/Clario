import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      users,
      teamId,
      role = "VIEW",
      type = "EMAIL",
    } = await request.json();

    console.log("📨 Invite request:", {
      users,
      teamId,
      role,
      type,
      user: user.email,
    });

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    let dbUser, teamMembership;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email as string },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      teamMembership = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: dbUser.id,
          OR: [{ role: "EDIT" }, { team: { createdById: dbUser.id } }],
        },
        include: { team: true },
      });
    } catch (dbError: any) {
      if (dbError.code === "P1001") {
        return NextResponse.json(
          {
            error: "Database temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }
      throw dbError;
    }

    if (!teamMembership) {
      return NextResponse.json(
        {
          error:
            "Team not found or you do not have permission to invite members",
        },
        { status: 403 }
      );
    }

    const invites = [];

    for (const userId of users) {
      try {
        const inviteeUser = await prisma.user.findFirst({
          where: {
            id: userId,
          },
        });

        if (!inviteeUser) {
          console.log(`❌ User not found: ${userId}`);
          continue;
        }

        const existingInvite = await prisma.invite.findFirst({
          where: {
            teamId,
            inviteeId: userId,
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        });

        if (existingInvite) {
          console.log(`⚠️ Active invite already exists for user ${userId}`);
          invites.push(existingInvite);
          continue;
        }

        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const invite = await prisma.invite.create({
          data: {
            token,
            teamId,
            inviterId: dbUser.id,
            inviteeId: inviteeUser.id,
            type,
            role,
            status: "PENDING",
            expiresAt,
          },
        });

        console.log(`✅ Created invite for user ${userId}: ${invite.id}`);
        invites.push(invite);
      } catch (userError: any) {
        if (userError.code === "P1001") {
          console.log(`❌ Database issue with user ${userId}, skipping`);
          continue;
        }
        throw userError;
      }
    }

    if (invites.length === 0 && users.length > 0) {
      return NextResponse.json(
        { error: "Failed to create invites due to database issues" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      invites,
      message: `Successfully created ${invites.length} invite(s)`,
    });
  } catch (error: any) {
    console.error("❌ Invite error:", error);

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
