import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.teamId;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            createdById: true,
          },
        },
      },
    });

    const isCreator = membership?.team.createdById === dbUser.id;
    const canInvite = isCreator || membership?.role === "EDIT";

    return NextResponse.json({
      canInvite,
      isCreator,
      role: membership?.role,
      team: membership?.team,
    });
  } catch (error) {
    console.error("Permissions check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
