import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serializeBigInt";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { teamId } = params;

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        role: "ADMIN",
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "No permission to update this team" },
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { name, description, logo } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (name !== existingTeam.name) {
      const nameExists = await prisma.team.findFirst({
        where: {
          name: name.trim(),
          id: { not: teamId },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Team name already taken" },
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        logo: logo || null,
      },
    });

    console.log(`✅ Team updated: ${teamId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Team updated successfully",
        team: serializeBigInt(updatedTeam),
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Team update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update team",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
