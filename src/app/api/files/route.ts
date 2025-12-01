import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { canCreateFile, getPlanLimit } from "@/lib/planUtils";
import { Plan } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, teamId, document, whiteboard } = await req.json();

    if (!fileName?.trim()) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdById: dbUser.id },
          {
            members: {
              some: {
                userId: dbUser.id,
              },
            },
          },
        ],
      },
      include: {
        members: {
          where: {
            userId: dbUser.id,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const userMembership = team.members[0];
    const isTeamCreator = team.createdById === dbUser.id;

    const canCreate =
      userMembership?.role === "ADMIN" ||
      userMembership?.role === "EDIT" ||
      isTeamCreator;

    if (!canCreate) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only EDIT and ADMIN roles can create files.",
        },
        { status: 403 }
      );
    }

    const actualFileCount = await prisma.file.count({
      where: {
        teamId: teamId,
        deletedAt: null,
      },
    });

    if (
      !canCreateFile(
        dbUser.plan as Plan,
        dbUser.totalCreatedFiles,
        actualFileCount
      )
    ) {
      const limits = getPlanLimit(dbUser.plan as Plan);

      return NextResponse.json(
        {
          error: `Your ${dbUser.plan.toLowerCase()} plan is limited to ${
            limits.maxFiles
          } files`,
          errorCode: "FILE_LIMIT_EXCEEDED",
          currentPlan: dbUser.plan,
          totalCreatedFiles: dbUser.totalCreatedFiles,
          maxFiles: limits.maxFiles,
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    const file = await prisma.file.create({
      data: {
        fileName: fileName.trim(),
        teamId: teamId,
        createdById: dbUser.id,
        document: document || "",
        whiteboard: whiteboard || "",
        version: 1,
        currentVersion: 1,
        autoVersioning: true,
        isPublic: false,
        permissions: "VIEW",
        archive: false,
      },
    });

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        totalCreatedFiles: {
          increment: 1,
        },
      },
    });

    console.log("✅ File created successfully:", file.id);
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");

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
      return NextResponse.json([], { status: 200 });
    }

    const teamAccess = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdById: dbUser.id },
          {
            members: {
              some: {
                userId: dbUser.id,
                role: { in: ["VIEW", "EDIT", "ADMIN"] },
              },
            },
          },
        ],
      },
    });

    if (!teamAccess) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    const files = await prisma.file.findMany({
      where: {
        teamId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(files, { status: 200 });
  } catch (err) {
    console.log("Error fetching files: ", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
