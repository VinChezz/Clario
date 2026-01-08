import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { calculateFileSize } from "@/lib/fileSizeCalculator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        user: { email: user.email },
      },
    });

    if (!userMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const files = await prisma.file.findMany({
      where: {
        teamId,
        ...(userId && { createdById: userId }),
        deletedAt: null,
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
      },
      orderBy: { createdAt: "desc" },
    });

    const filesWithSize = await Promise.all(
      files.map(async (file) => {
        const fileSize = calculateFileSize(
          file.document || undefined,
          file.whiteboard || undefined
        );

        const versions = await prisma.documentVersion.findMany({
          where: { fileId: file.id },
        });

        let versionsSize = BigInt(0);
        versions.forEach((version) => {
          const versionSize = calculateFileSize(
            version.type === "document" ? version.content : undefined,
            version.type === "whiteboard" ? version.content : undefined
          );
          versionsSize += versionSize;
        });

        const totalSize = fileSize + versionsSize;

        return {
          id: file.id,
          name: file.fileName,
          size: Number(totalSize),
          type: file.document ? "document" : "whiteboard",
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
          owner: {
            id: file.createdBy.id,
            name: file.createdBy.name || "Unknown",
            email: file.createdBy.email,
            image: file.createdBy.image,
          },
          versionsCount: versions.length,
        };
      })
    );

    return NextResponse.json({
      files: filesWithSize,
      count: filesWithSize.length,
    });
  } catch (error) {
    console.error("Error fetching user files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
