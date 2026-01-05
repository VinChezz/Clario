import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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
    const { teamId, ...settingsData } = data;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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
        { error: "You don't have permission to update this team" },
        { status: 403 }
      );
    }

    const existingSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
    });

    if (existingSettings) {
      return NextResponse.json(
        { error: "Team settings already exist. Use PUT method to update." },
        { status: 400 }
      );
    }

    const processedData = {
      ...settingsData,
      sessionTimeout: settingsData.sessionTimeout || 0,
    };

    const teamSettings = await prisma.teamSettings.create({
      data: {
        ...processedData,
        team: {
          connect: {
            id: teamId,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team settings created successfully",
      settings: teamSettings,
    });
  } catch (error) {
    console.error("Create team settings error:", error);

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create team settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserInAPI();

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { teamId, ...settingsData } = data;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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
        { error: "You don't have permission to update this team" },
        { status: 403 }
      );
    }

    const existingSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
    });

    const processedData = {
      ...settingsData,
      sessionTimeout: settingsData.sessionTimeout || 0,
    };

    let teamSettings;
    let message;

    if (existingSettings) {
      teamSettings = await prisma.teamSettings.update({
        where: { teamId },
        data: processedData,
      });
      message = "Team settings updated successfully";
    } else {
      teamSettings = await prisma.teamSettings.create({
        data: {
          ...processedData,
          team: {
            connect: {
              id: teamId,
            },
          },
        },
      });
      message = "Team settings created successfully";
    }

    return NextResponse.json({
      success: true,
      message,
      settings: teamSettings,
    });
  } catch (error) {
    console.error("Update team settings error:", error);

    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update team settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
