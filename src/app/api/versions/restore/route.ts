import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("🧪 RESTORE VIA QUERY PARAMS WITH AUTH");

  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const versionId = searchParams.get("versionId");

    console.log("📋 Query parameters:", { fileId, versionId });

    if (!fileId || !versionId) {
      return NextResponse.json(
        { error: "fileId and versionId are required" },
        { status: 400 }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 User:", user.email);

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔍 Finding version...");
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        file: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    console.log("Version result:", version ? "Found" : "Not found");

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Перевіряємо доступ
    const hasAccess =
      version.file.team.members.some(
        (member: any) => member.userId === dbUser.id
      ) || version.file.createdById === dbUser.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (version.fileId !== fileId) {
      return NextResponse.json(
        { error: "Version does not belong to this file" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        version: version.version,
        name: version.name,
        content: version.content,
        contentLength: version.content.length,
      },
      file: {
        id: version.file.id,
        fileName: version.file.fileName,
      },
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      {
        error: "Restore failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
