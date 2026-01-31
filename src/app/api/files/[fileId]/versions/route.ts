import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateVersionSize, formatBytes } from "@/lib/fileSizeCalculator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        OR: [
          { createdById: dbUser.id },
          {
            team: {
              members: {
                some: { userId: dbUser.id },
              },
            },
          },
        ],
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: {
        fileId: fileId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        version: "desc",
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const {
      name,
      description,
      content,
      type = "document",
    } = await request.json();

    console.log(`🎯 Creating ${type} version for file ${fileId}`, {
      contentLength: content?.length,
      name,
    });

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
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
        OR: [
          { createdById: dbUser.id },
          {
            team: {
              members: {
                some: { userId: dbUser.id },
              },
            },
          },
        ],
      },
      include: {
        team: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const storageResponse = await fetch(
      `${process.env.APP_URL || "http://localhost:3000"}/api/users/storage?teamId=${file.teamId}`,
    );

    if (storageResponse.ok) {
      const storageData = await storageResponse.json();
      const usedBytes = BigInt(storageData.storage.usedBytes);
      const limitBytes = BigInt(storageData.storage.limitBytes);

      const versionSize = calculateVersionSize(content, type);

      if (usedBytes + versionSize > limitBytes) {
        return NextResponse.json(
          {
            error: "Storage limit exceeded",
            details: "Cannot save version due to storage limits",
            usedBytes: storageData.storage.usedFormatted,
            limitBytes: storageData.storage.limitFormatted,
            requiredBytes: formatBytes(versionSize),
          },
          { status: 403 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const lastVersion = await tx.documentVersion.findFirst({
        where: {
          fileId,
          type,
        },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      const newVersionNumber = (lastVersion?.version || 0) + 1;

      console.log(
        `📝 Creating ${type} version ${newVersionNumber} for file ${fileId}`,
      );

      const existingVersion = await tx.documentVersion.findUnique({
        where: {
          fileId_type_version: {
            fileId,
            type,
            version: newVersionNumber,
          },
        },
      });

      if (existingVersion) {
        console.error(
          `❌ Version ${newVersionNumber} already exists for ${type} in file ${fileId}`,
        );
        throw new Error(
          `Version ${newVersionNumber} already exists for ${type}`,
        );
      }

      const newVersion = await tx.documentVersion.create({
        data: {
          version: newVersionNumber,
          name:
            name ||
            `${
              type === "whiteboard" ? "Whiteboard" : "Document"
            } Version ${newVersionNumber}`,
          description: description || "",
          content: content,
          type: type,
          fileId: fileId,
          authorId: dbUser.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      console.log(
        `✅ Successfully created ${type} version ${newVersionNumber}`,
      );
      return newVersion;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error creating version:", error);

    if (error instanceof Error) {
      if ("code" in error && error.code === "P2002") {
        return NextResponse.json(
          { error: "Version already exists. Please try again." },
          { status: 400 },
        );
      }

      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
