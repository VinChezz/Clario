import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getPlanLimit, formatBytes } from "@/lib/planUtils";
import { Plan } from "@prisma/client";
import { calculateFileSize } from "@/lib/fileSizeCalculator";

export async function GET(request: NextRequest) {
  try {
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

    const userFiles = await prisma.file.findMany({
      where: {
        createdById: dbUser.id,
      },
      select: {
        id: true,
        document: true,
        whiteboard: true,
        sizeBytes: true,
        deletedAt: true,
      },
    });

    const userVersions = await prisma.documentVersion.findMany({
      where: {
        authorId: dbUser.id,
      },
      select: {
        id: true,
        content: true,
        type: true,
      },
    });

    let totalCalculatedSize = BigInt(0);

    userFiles.forEach((file) => {
      const fileSize = calculateFileSize(
        file.document || undefined,
        file.whiteboard || undefined
      );
      totalCalculatedSize += fileSize;
    });

    userVersions.forEach((version) => {
      let versionSize: bigint;

      if (version.type === "document") {
        versionSize = calculateFileSize(version.content, undefined);
      } else if (version.type === "whiteboard") {
        versionSize = calculateFileSize(undefined, version.content);
      } else {
        try {
          JSON.parse(version.content);
          versionSize = calculateFileSize(undefined, version.content);
        } catch {
          versionSize = calculateFileSize(version.content, undefined);
        }
      }

      totalCalculatedSize += versionSize;
    });

    const activeFiles = userFiles.filter((file) => !file.deletedAt);
    const activeFilesCount = activeFiles.length;

    const statsByType = {
      documents: userFiles.filter((f) => f.document && !f.whiteboard).length,
      whiteboards: userFiles.filter((f) => f.whiteboard && !f.document).length,
      mixed: userFiles.filter((f) => f.document && f.whiteboard).length,
      totalFiles: userFiles.length,
      totalVersions: userVersions.length,
    };

    const storageUsed = totalCalculatedSize;
    const storageLimit = BigInt(planLimits.maxStorage);

    const percentage =
      storageLimit > BigInt(0)
        ? Number((storageUsed * BigInt(100)) / storageLimit)
        : 0;

    const response = {
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

        dbUsedBytes: dbUser.storageUsedBytes?.toString() || "0",
        dbUsedFormatted: formatBytes(dbUser.storageUsedBytes || BigInt(0)),
        difference: (
          Number(storageUsed) - Number(dbUser.storageUsedBytes || 0)
        ).toString(),
      },
      files: {
        activeCount: activeFilesCount,
        totalCount: userFiles.length,
        versionsCount: userVersions.length,
        calculatedSizeBytes: storageUsed.toString(),
        calculatedSizeFormatted: formatBytes(storageUsed),
        statsByType,
      },
      teams: dbUser.teams.map((team) => ({
        id: team.id,
        name: team.name,
        storageUsedBytes: team.storageUsedBytes?.toString() || "0",
        storageUsedFormatted: formatBytes(team.storageUsedBytes || BigInt(0)),
        storageLimitBytes: team.storageLimitBytes?.toString() || null,
        storageLimitFormatted: team.storageLimitBytes
          ? formatBytes(team.storageLimitBytes)
          : null,
      })),
      requiresUpgrade: storageUsed >= (storageLimit * BigInt(90)) / BigInt(100),
    };

    console.log("📊 Storage calculation:", {
      files: userFiles.length,
      versions: userVersions.length,
      calculatedSize: formatBytes(storageUsed),
      dbSize: formatBytes(dbUser.storageUsedBytes || BigInt(0)),
      difference: formatBytes(
        Number(storageUsed) - Number(dbUser.storageUsedBytes || 0)
      ),
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error calculating storage data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
