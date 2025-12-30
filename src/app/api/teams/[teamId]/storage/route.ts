import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { calculateFileSize } from "@/lib/fileSizeCalculator";
import { formatBytes, getPlanLimit } from "@/lib/planUtils";
import { Plan } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        createdBy: true,
        files: {
          where: { deletedAt: null },
          include: {
            versions: {
              select: {
                id: true,
                content: true,
                type: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isMember = team.members.some(
      (member) => member.user.email === user.email
    );

    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("📊 Team storage calculation for:", team.name);
    console.log("📁 Files count:", team.files.length);

    let totalCalculatedSize = BigInt(0);
    let realUsedBytes = BigInt(0);

    team.files.forEach((file) => {
      const fileSize = calculateFileSize(
        file.document || undefined,
        file.whiteboard || undefined
      );
      totalCalculatedSize += fileSize;
      realUsedBytes += file.sizeBytes || BigInt(0);
    });

    let totalVersions = 0;
    team.files.forEach((file) => {
      file.versions.forEach((version) => {
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
        totalVersions++;
      });
    });

    console.log(`📋 Total versions: ${totalVersions}`);

    const planLimits = getPlanLimit(team.createdBy.plan as Plan);
    const limitBytes = BigInt(planLimits.maxStorage);

    const availableBytes =
      limitBytes > totalCalculatedSize
        ? limitBytes - totalCalculatedSize
        : BigInt(0);

    const percentage =
      limitBytes > BigInt(0)
        ? Number((totalCalculatedSize * BigInt(100)) / limitBytes)
        : 0;

    const weightMultiplier =
      realUsedBytes > BigInt(0)
        ? Number(totalCalculatedSize) / Number(realUsedBytes)
        : 1;

    const formatGB = (bytes: bigint): string => {
      const gb = Number(bytes) / 1024 ** 3;
      if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
      if (gb < 0.1 && gb > 0) return `${(gb * 1024).toFixed(1)} MB`;
      return `${gb.toFixed(1)} GB`;
    };

    const userName =
      user.given_name && user.family_name
        ? `${user.given_name} ${user.family_name}`
        : user.given_name || user.email?.split("@")[0] || "User";

    const statsByType = {
      documents: team.files.filter((f) => f.document && !f.whiteboard).length,
      whiteboards: team.files.filter((f) => f.whiteboard && !f.document).length,
      mixed: team.files.filter((f) => f.document && f.whiteboard).length,
      totalFiles: team.files.length,
      totalVersions,
    };

    return NextResponse.json({
      user: {
        id: user.id || "",
        email: user.email,
        name: userName,
        plan: team.createdBy.plan,
        totalCreatedFiles: 0,
      },
      storage: {
        usedBytes: totalCalculatedSize.toString(),
        usedFormatted: formatBytes(totalCalculatedSize),
        usedFormattedGB: formatGB(totalCalculatedSize),

        dbUsedBytes: realUsedBytes.toString(),
        dbUsedFormatted: formatBytes(realUsedBytes),
        dbUsedFormattedGB: formatGB(realUsedBytes),

        limitBytes: limitBytes.toString(),
        limitFormatted: formatBytes(limitBytes),
        limitFormattedGB: formatGB(limitBytes),

        percentage,
        remainingBytes: availableBytes.toString(),
        remainingFormatted: formatBytes(availableBytes),
        remainingFormattedGB: formatGB(availableBytes),

        difference: formatBytes(totalCalculatedSize - realUsedBytes),
        weightMultiplier: weightMultiplier.toFixed(2),
      },
      files: {
        activeCount: team.files.length,
        totalCount: team.files.length,
        versionsCount: totalVersions,
        calculatedSizeBytes: totalCalculatedSize.toString(),
        calculatedSizeFormatted: formatBytes(totalCalculatedSize),
        calculatedSizeFormattedGB: formatGB(totalCalculatedSize),
        statsByType,
      },
      teamStorage: {
        teamId: team.id,
        teamName: team.name,
        usedBytes: totalCalculatedSize.toString(),
        limitBytes: limitBytes.toString(),
        percentage,
        creatorPlan: team.createdBy.plan,
        creatorName: team.createdBy.name,
        filesCount: team.files.length,
        membersCount: team.members.length,

        usedFormatted: formatBytes(totalCalculatedSize),
        usedFormattedGB: formatGB(totalCalculatedSize),
        limitFormatted: formatBytes(limitBytes),
        limitFormattedGB: formatGB(limitBytes),
        availableFormatted: formatBytes(availableBytes),
        availableFormattedGB: formatGB(availableBytes),
        realUsedFormatted: formatBytes(realUsedBytes),
        realUsedFormattedGB: formatGB(realUsedBytes),
        weightMultiplier: weightMultiplier.toFixed(2),
      },
      requiresUpgrade: percentage > 90,
    });
  } catch (error) {
    console.error("Error fetching team storage:", error);
    return NextResponse.json(
      { error: "Failed to fetch team storage" },
      { status: 500 }
    );
  }
}
