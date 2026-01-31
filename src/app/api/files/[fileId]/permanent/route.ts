import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🗑️ PERMANENT DELETE request for file:", fileId);

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 },
      );
    }

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: dbUser.id,
              },
            },
          },
        },
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (!existingFile.deletedAt) {
      return NextResponse.json(
        {
          error: "File is not in trash",
          details:
            "Files must be moved to trash before permanent deletion. Use the delete action first.",
        },
        { status: 400 },
      );
    }

    const userMembership = existingFile.team.members[0];
    const isTeamCreator = existingFile.team.createdById === dbUser.id;

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
      const deletionCount = await getPermanentDeletionCount(dbUser.id);

      console.log(
        `📊 FREE plan check: ${deletionCount} permanent deletions, limit: 1`,
      );

      if (deletionCount >= 1) {
        return NextResponse.json(
          {
            error: "Free plan deletion limit reached",
            details:
              "You can only permanently delete 1 file on the FREE plan. Upgrade to PRO for unlimited deletions.",
            maxDeletions: 1,
            currentDeletions: deletionCount,
            upgradeUrl: "/pricing",
          },
          { status: 403 },
        );
      }
    }

    const fileSizeBytes = existingFile.sizeBytes || BigInt(0);
    const teamId = existingFile.teamId;
    const createdById = existingFile.createdById;

    const result = await prisma.$transaction(async (tx) => {
      try {
        await tx.userPresence.deleteMany({
          where: { fileId: fileId },
        });
        console.log("✅ UserPresence records deleted");
      } catch (error) {
        console.log("ℹ️ No UserPresence records to delete");
      }

      try {
        await tx.comment.deleteMany({
          where: { fileId: fileId },
        });
        console.log("✅ Comment records deleted");
      } catch (error) {
        console.log("ℹ️ No Comment records to delete");
      }

      try {
        await tx.documentVersion.deleteMany({
          where: { fileId: fileId },
        });
        console.log("✅ Document versions deleted");
      } catch (error) {
        console.log("ℹ️ No document versions to delete");
      }

      const deletedFile = await tx.file.delete({
        where: { id: fileId },
      });

      if (fileSizeBytes > BigInt(0)) {
        await tx.team.update({
          where: { id: teamId },
          data: {
            storageUsedBytes: {
              decrement: fileSizeBytes,
            },
          },
        });

        await tx.user.update({
          where: { id: createdById },
          data: {
            storageUsedBytes: {
              decrement: fileSizeBytes,
            },
          },
        });

        console.log(`📉 Storage decreased by ${fileSizeBytes} bytes`);
      }

      if (dbUser.plan === "FREE") {
        await incrementPermanentDeletionCount(tx, dbUser.id);
      }

      return deletedFile;
    });

    console.log("✅ File permanently deleted:", fileId);
    return NextResponse.json(
      {
        success: true,
        message: "File permanently deleted",
        fileSize: fileSizeBytes.toString(),
        freedSpace: true,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ Error permanently deleting file:", err);

    if (
      err instanceof Error &&
      err.message.includes("permanent deletion limit")
    ) {
      return NextResponse.json(
        {
          error: "Deletion limit reached",
          details: err.message,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

async function getPermanentDeletionCount(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permanentDeletionsUsed: true },
    });

    if (user?.permanentDeletionsUsed !== undefined) {
      return user.permanentDeletionsUsed;
    }

    const userTeams = await prisma.team.findMany({
      where: {
        OR: [
          { createdById: userId },
          { members: { some: { userId: userId } } },
        ],
      },
      select: { id: true },
    });

    const teamIds = userTeams.map((team) => team.id);

    const deletedFiles = await prisma.file.count({
      where: {
        teamId: { in: teamIds },
        deletedAt: { not: null },
      },
    });

    return deletedFiles > 0 ? 1 : 0;
  } catch (error) {
    console.error("Error getting permanent deletion count:", error);
    return 0;
  }
}

async function incrementPermanentDeletionCount(tx: any, userId: string) {
  try {
    await tx.user.update({
      where: { id: userId },
      data: {
        permanentDeletionsUsed: {
          increment: 1,
        },
      },
    });
    console.log("✅ Permanent deletion counter incremented");
  } catch (error: any) {
    if (
      error.code === "P2003" ||
      error.message?.includes("permanentDeletionsUsed")
    ) {
      console.log(
        "ℹ️ permanentDeletionsUsed field not found, using alternative method",
      );

      try {
        await tx.deletionLog.create({
          data: {
            userId: userId,
            deletedAt: new Date(),
          },
        });
      } catch (logError) {
        console.log("ℹ️ Deletion log table not available");
      }
    } else {
      throw error;
    }
  }
}
