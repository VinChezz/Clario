import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Эндпоинт для работы с шарингом конкретного файла
export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    // Получаем fileId из query параметров
    const url = new URL(req.url);
    const fileId = url.searchParams.get("fileId");

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const file = await prisma.file.findFirst({
      where: { 
        id: fileId,
        createdById: user.id 
      },
      select: {
        id: true,
        fileName: true,
        isPublic: true,
        shareToken: true,
        permissions: true
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (err) {
    console.error("Error getting share info:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, isPublic, permissions = "VIEW" } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Проверяем что пользователь владеет файлом
    const file = await prisma.file.findFirst({
      where: { 
        id: fileId,
        createdById: user.id 
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const updateData: any = {
      isPublic,
      permissions
    };

    // Генерируем токен если делаем публичным
    if (isPublic && !file.shareToken) {
      updateData.shareToken = generateShareToken();
    }

    // Если доступ закрываем - очищаем токен
    if (!isPublic) {
      updateData.shareToken = null;
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: updateData
    });

    return NextResponse.json(updatedFile);
  } catch (err) {
    console.error("Error updating share settings:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}