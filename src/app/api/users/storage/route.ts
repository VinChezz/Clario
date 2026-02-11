import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getPlanLimit, formatBytes } from "@/lib/planUtils";
import { Plan } from "@prisma/client";
import {
  calculateFileSize,
  calculateFullVersionSize,
} from "@/lib/fileSizeCalculator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            storageUsedBytes: true,
            storageLimitBytes: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planLimits = getPlanLimit(dbUser.plan as Plan);

    let storageLimit = BigInt(planLimits.maxStorage);
    let totalCalculatedSize = BigInt(0);
    let teamFiles = [];
    let teamVersions = [];
    let teamStorageInfo = null;

    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: { userId: dbUser.id },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
            },
          },
        },
      });

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const isMember =
        team.members.length > 0 || team.createdById === dbUser.id;
      if (!isMember) {
        return NextResponse.json(
          { error: "Not a team member" },
          { status: 403 },
        );
      }

      const creatorPlanLimits = getPlanLimit(team.createdBy.plan as Plan);
      const creatorStorageLimit = BigInt(creatorPlanLimits.maxStorage);

      teamFiles = await prisma.file.findMany({
        where: { teamId },
        select: {
          id: true,
          document: true,
          whiteboard: true,
          sizeBytes: true,
          deletedAt: true,
          teamId: true,
          createdById: true,
        },
      });

      teamVersions = await prisma.documentVersion.findMany({
        where: {
          file: {
            teamId: teamId,
          },
        },
        select: {
          id: true,
          content: true,
          type: true,
          sizeBytes: true,
        },
      });

      teamFiles.forEach((file) => {
        const fileSize = calculateFileSize(
          file.document || undefined,
          file.whiteboard || undefined,
        );
        totalCalculatedSize += fileSize;
      });

      teamVersions.forEach((version) => {
        if (version.sizeBytes && version.sizeBytes > 0) {
          totalCalculatedSize += version.sizeBytes;
        } else {
          let versionSize: bigint;

          if (version.type === "document") {
            versionSize = calculateFullVersionSize(version.content, "document");
          } else if (version.type === "whiteboard") {
            versionSize = calculateFullVersionSize(
              version.content,
              "whiteboard",
            );
          } else {
            try {
              JSON.parse(version.content);
              versionSize = calculateFullVersionSize(
                version.content,
                "whiteboard",
              );
            } catch {
              versionSize = calculateFullVersionSize(
                version.content,
                "document",
              );
            }
          }

          totalCalculatedSize += versionSize;
        }
      });

      storageLimit = creatorStorageLimit;

      const teamMembersCount = await prisma.teamMember.count({
        where: { teamId },
      });

      teamStorageInfo = {
        teamId: team.id,
        teamName: team.name,
        usedBytes: totalCalculatedSize.toString(),
        limitBytes: storageLimit.toString(),
        percentage:
          storageLimit > BigInt(0)
            ? parseFloat(
                ((totalCalculatedSize * BigInt(100)) / storageLimit).toString(),
              )
            : 0,
        creatorPlan: team.createdBy.plan,
        creatorName: team.createdBy.name || team.createdBy.email,
        filesCount: teamFiles.length,
        membersCount: teamMembersCount,
        usedFormatted: formatBytes(totalCalculatedSize),
        limitFormatted: formatBytes(storageLimit),
        availableFormatted: formatBytes(storageLimit - totalCalculatedSize),
      };
    } else {
      const userFiles = await prisma.file.findMany({
        where: { createdById: dbUser.id },
        select: {
          id: true,
          document: true,
          whiteboard: true,
          sizeBytes: true,
          deletedAt: true,
          teamId: true,
          createdById: true,
        },
      });

      teamVersions = await prisma.documentVersion.findMany({
        where: {
          authorId: dbUser.id,
        },
        select: {
          id: true,
          content: true,
          type: true,
          sizeBytes: true,
        },
      });

      teamFiles = userFiles;

      teamFiles.forEach((file) => {
        const fileSize = calculateFileSize(
          file.document || undefined,
          file.whiteboard || undefined,
        );
        totalCalculatedSize += fileSize;
      });

      teamVersions.forEach((version) => {
        if (version.sizeBytes && version.sizeBytes > 0) {
          totalCalculatedSize += version.sizeBytes;
        } else {
          let versionSize: bigint;

          if (version.type === "document") {
            versionSize = calculateFullVersionSize(version.content, "document");
          } else if (version.type === "whiteboard") {
            versionSize = calculateFullVersionSize(
              version.content,
              "whiteboard",
            );
          } else {
            try {
              JSON.parse(version.content);
              versionSize = calculateFullVersionSize(
                version.content,
                "whiteboard",
              );
            } catch {
              versionSize = calculateFullVersionSize(
                version.content,
                "document",
              );
            }
          }

          totalCalculatedSize += versionSize;
        }
      });
    }

    const activeFiles = teamFiles.filter((file) => !file.deletedAt);
    const trashFiles = teamFiles.filter((file) => file.deletedAt);
    const activeFilesCount = activeFiles.length;

    const statsByType = {
      documents: teamFiles.filter((f) => f.document && !f.whiteboard).length,
      whiteboards: teamFiles.filter((f) => f.whiteboard && !f.document).length,
      mixed: teamFiles.filter((f) => f.document && f.whiteboard).length,
      totalFiles: teamFiles.length,
      totalVersions: teamVersions.length,
    };

    const storageUsed = totalCalculatedSize;

    const percentage =
      storageLimit > BigInt(0)
        ? Number((storageUsed * BigInt(100)) / storageLimit)
        : 0;

    const response: any = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        plan: dbUser.plan,
        totalCreatedFiles: dbUser.totalCreatedFiles,
      },
      storage: {
        usedBytes: storageUsed.toString(),
        usedFormatted: formatBytes(storageUsed),
        limitBytes: storageLimit.toString(),
        limitFormatted: formatBytes(storageLimit),
        percentage: parseFloat(percentage.toFixed(1)),
        remainingBytes: (storageLimit - storageUsed).toString(),
        remainingFormatted: formatBytes(storageLimit - storageUsed),
        includesTrash: true,
      },
      files: {
        activeCount: activeFilesCount,
        totalCount: teamFiles.length,
        versionsCount: teamVersions.length,
        calculatedSizeBytes: storageUsed.toString(),
        calculatedSizeFormatted: formatBytes(storageUsed),
        statsByType,
        inTrash: trashFiles.length,
      },
      requiresUpgrade: storageUsed >= (storageLimit * BigInt(90)) / BigInt(100),
    };

    if (teamStorageInfo) {
      response.teamStorage = teamStorageInfo;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error calculating storage data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
