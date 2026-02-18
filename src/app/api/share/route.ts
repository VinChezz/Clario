import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    const url = new URL(req.url);
    const fileId = url.searchParams.get("fileId");

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
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
                some: {
                  userId: dbUser.id,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        fileName: true,
        isPublic: true,
        shareToken: true,
        permissions: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (err) {
    console.error("Error getting share info:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileId, isPublic, permissions = "VIEW" } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
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
      },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const isCreator = file.createdById === dbUser.id;
    const hasEditPermission = file.team?.members.some(
      (m) =>
        m.userId === dbUser.id && (m.role === "EDIT" || m.role === "ADMIN"),
    );

    if (!isCreator && !hasEditPermission) {
      return NextResponse.json(
        { error: "You don't have permission to change share settings" },
        { status: 403 },
      );
    }

    const updateData: any = {
      isPublic,
      permissions,
    };

    if (isPublic && !file.shareToken) {
      updateData.shareToken = generateShareToken();
    }

    if (!isPublic) {
      updateData.shareToken = null;
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: updateData,
      select: {
        id: true,
        fileName: true,
        isPublic: true,
        shareToken: true,
        permissions: true,
      },
    });

    return NextResponse.json(updatedFile);
  } catch (err) {
    console.error("Error updating share settings:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

function generateShareToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
