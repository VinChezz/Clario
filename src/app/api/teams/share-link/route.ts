import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { v4 as uuidv4 } from "uuid";

async function getAuthenticatedUserInAPI() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    return user;
  } catch (error) {
    console.error("Error getting user in API route:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserInAPI();

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { teamId, expiresIn = "7d", permissions = "VIEW" } = data;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
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

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        role: "ADMIN",
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to generate share links for this team",
        },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const shareToken = uuidv4();

    const expiresAt = new Date();
    if (expiresIn === "1d") {
      expiresAt.setDate(expiresAt.getDate() + 1);
    } else if (expiresIn === "7d") {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (expiresIn === "30d") {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const shareLinkRecord = await prisma.shareLink.create({
      data: {
        token: shareToken,
        teamId: team.id,
        creatorId: dbUser.id,
        permissions,
        expiresAt,
        used: false,
      },
    });

    const shareLink = `${
      process.env.PUBLIC_URL || "http://localhost:3000"
    }/join/${shareToken}`;

    return NextResponse.json({
      success: true,
      message: "Share link generated successfully",
      shareLink,
      shareToken,
      expiresAt: expiresAt.toISOString(),
      permissions,
    });
  } catch (error) {
    console.error("Generate share link error:", error);

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate share link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
