import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { serializeBigInt } from "@/lib/serializeBigInt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🗑️ Fetching trash for team:", teamId);

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deletedFiles = await prisma.file.findMany({
      where: {
        deletedAt: { not: null },
        teamId: teamId || undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    });

    console.log(
      `✅ Found ${deletedFiles.length} deleted files for team ${teamId}`,
    );

    const responseData = {
      files: serializeBigInt(deletedFiles),
      limits: {
        plan: dbUser.plan,
        maxTrashFiles: dbUser.plan === "FREE" ? 5 : null,
        maxPermanentDeletions: dbUser.plan === "FREE" ? 1 : null,
        currentTrashFiles: deletedFiles.length,
      },
      warnings: [] as Array<{ type: string; message: string; action: string }>,
    };

    if (dbUser.plan === "FREE") {
      if (deletedFiles.length >= 5) {
        responseData.warnings.push({
          type: "TRASH_FULL",
          message:
            "Trash is full (5 file limit). Delete files permanently to make space.",
          action: "upgrade_or_clean",
        });
      }

      const permanentlyDeletedCount = await prisma.file.count({
        where: {
          deletedAt: { not: null },
          teamId: teamId || undefined,
        },
      });

      if (permanentlyDeletedCount >= 1) {
        responseData.warnings.push({
          type: "DELETION_LIMIT",
          message:
            "You have used your 1 permanent deletion. Restore files to delete more.",
          action: "restore_files",
        });
      }
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching deleted files:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    const teamId = searchParams.get("teamId");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        teamId: teamId || undefined,
        deletedAt: null,
      },
      include: {
        team: {
          include: {
            members: {
              where: { userId: dbUser.id },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const userMembership = file.team.members[0];
    const isTeamCreator = file.team.createdById === dbUser.id;

    const canDelete =
      userMembership?.role === "ADMIN" ||
      userMembership?.role === "EDIT" ||
      isTeamCreator;

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only EDIT and ADMIN roles can delete files.",
        },
        { status: 403 },
      );
    }

    if (dbUser.plan === "FREE") {
      const filesInTrash = await prisma.file.count({
        where: {
          deletedAt: { not: null },
          teamId: file.teamId,
        },
      });

      console.log(
        `📊 FREE plan trash check: ${filesInTrash} files in trash, limit: 5`,
      );

      if (filesInTrash >= 5) {
        return NextResponse.json(
          {
            error: "Trash limit reached",
            details:
              "FREE plan allows only 5 files in trash at a time. Please delete some files permanently or upgrade to PRO.",
            maxTrashFiles: 5,
            currentTrashFiles: filesInTrash,
            upgradeUrl: "/pricing",
          },
          { status: 403 },
        );
      }
    }

    const deletedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
      },
    });

    console.log(`✅ File moved to trash: ${fileId}`);

    return NextResponse.json(
      {
        success: true,
        message: "File moved to trash",
        file: serializeBigInt(deletedFile),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error moving file to trash:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
