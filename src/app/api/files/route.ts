import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { canCreateFile, getPlanLimit, formatBytes } from "@/lib/planUtils";
import { Plan } from "@prisma/client";
import { serializeBigInt } from "@/lib/serializeBigInt";

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
          { members: { some: { userId: dbUser.id } } },
        ],
      },
      include: {
        members: { where: { userId: dbUser.id } },
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

    const fileSize = calculateFileSize(document, whiteboard);

    const userStorageLimit = getPlanLimit(dbUser.plan as Plan).maxStorage;

    if (
      !canCreateFile(dbUser.plan as Plan, dbUser.storageUsedBytes, fileSize)
    ) {
      const limits = getPlanLimit(dbUser.plan as Plan);
      return NextResponse.json(
        {
          error: `Storage limit exceeded. Your ${dbUser.plan.toLowerCase()} plan has ${formatBytes(
            limits.maxStorage
          )} limit.`,
          errorCode: "STORAGE_LIMIT_EXCEEDED",
          currentPlan: dbUser.plan,
          storageUsed: dbUser.storageUsedBytes.toString(),
          storageLimit: limits.maxStorage,
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    if (
      team.storageLimitBytes &&
      team.storageUsedBytes + fileSize > team.storageLimitBytes
    ) {
      return NextResponse.json(
        {
          error: "Team storage limit exceeded",
          errorCode: "TEAM_STORAGE_LIMIT_EXCEEDED",
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
        sizeBytes: fileSize,
      },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: dbUser.id },
        data: {
          totalCreatedFiles: { increment: 1 },
          storageUsedBytes: { increment: fileSize },
        },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: {
          storageUsedBytes: { increment: fileSize },
        },
      }),
    ]);

    console.log("✅ File created successfully:", file.id);
    return NextResponse.json(serializeBigInt(file), { status: 201 });
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

    return NextResponse.json(serializeBigInt(files), { status: 200 });
  } catch (err) {
    console.log("Error fetching files: ", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export function calculateFileSize(
  document?: string,
  whiteboard?: string
): bigint {
  const BASE_WEIGHT = 75 * 1024 * 1024; // 75 MB

  const TEXT_WEIGHT_PER_1000_CHARS = 25 * 1024 * 1024; // 25 MB
  const WHITEBOARD_ELEMENT_WEIGHT = 10 * 1024 * 1024; // 10 MB
  const IMAGE_WEIGHT_MULTIPLIER = 2.5;
  const WHITEBOARD_BASE_WEIGHT = 25 * 1024 * 1024; // 25 MB

  let totalWeight = BASE_WEIGHT;

  if (document) {
    const charCount = document.length;
    const thousandsOfChars = Math.ceil(charCount / 1000);
    totalWeight += thousandsOfChars * TEXT_WEIGHT_PER_1000_CHARS;

    console.log(
      `📄 Document weight: ${charCount} chars = ${thousandsOfChars * 25} MB`
    );
  }

  if (whiteboard) {
    try {
      const whiteboardData = JSON.parse(whiteboard);

      totalWeight += WHITEBOARD_BASE_WEIGHT;

      if (whiteboardData.elements && Array.isArray(whiteboardData.elements)) {
        const elementCount = whiteboardData.elements.length;
        totalWeight += elementCount * WHITEBOARD_ELEMENT_WEIGHT;

        console.log(
          `🎨 Whiteboard elements: ${elementCount} = ${elementCount * 10} MB`
        );

        whiteboardData.elements.forEach((element: any) => {
          if (element.type === "image" && element.dataUrl) {
            const base64Data = element.dataUrl.split(",")[1];
            if (base64Data) {
              const imageSize = Math.ceil(base64Data.length * 0.75);
              totalWeight += imageSize * IMAGE_WEIGHT_MULTIPLIER;
            }
          }
        });
      }
    } catch (e) {
      const charCount = whiteboard.length;
      const thousandsOfChars = Math.ceil(charCount / 1000);
      totalWeight += thousandsOfChars * TEXT_WEIGHT_PER_1000_CHARS;
    }
  }

  const weightInMB = Math.ceil(totalWeight / (1024 * 1024));
  console.log(`⚖️ Total file weight: ${weightInMB} MB`);

  return BigInt(totalWeight);
}
