import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🔐 Kinde user:", user);

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    console.log("📋 Fetching versions for file:", fileId);

    const versions = await prisma.documentVersion.findMany({
      where: {
        fileId,
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

    console.log(`✅ Found ${versions.length} versions`);
    return NextResponse.json(versions);
  } catch (error) {
    console.error("❌ Error fetching versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🔐 Kinde user for version creation:", user);

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const body = await request.json();
    const { name, description, content } = body;

    console.log("🆕 Creating version for file:", fileId, {
      name,
      description,
      contentLength: content?.length,
    });

    if (!content) {
      console.log("❌ Missing content");
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      console.log("❌ User not found in database:", user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("👤 Found user in database:", dbUser.id);

    // Отримуємо файл та блокуємо для оновлення
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      console.log("❌ File not found:", fileId);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.log(
      "📄 Found file:",
      file.fileName,
      "current version:",
      file.currentVersion
    );

    // Атомарно оновлюємо версію файлу та створюємо нову версію
    const result = await prisma.$transaction(async (tx) => {
      // Оновлюємо версію файлу
      const updatedFile = await tx.file.update({
        where: { id: fileId },
        data: {
          currentVersion: file.currentVersion + 1,
          version: file.version + 1,
        },
      });

      console.log("✅ File version updated to:", updatedFile.currentVersion);

      // Створюємо нову версію документа
      const newVersion = await tx.documentVersion.create({
        data: {
          version: updatedFile.currentVersion,
          name: name || `Version ${updatedFile.currentVersion}`,
          description: description || "Automatically created version",
          content: content,
          fileId,
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

      console.log("✅ Version created in database:", newVersion.id);
      return newVersion;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error creating version:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      // Обробка помилок Prisma
      if (error.message.includes("P2002")) {
        return NextResponse.json(
          { error: "Version already exists, please try again" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
