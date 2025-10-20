import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
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
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const activeUsers = await prisma.userPresence.findMany({
      where: {
        fileId,
        lastActive: {
          gte: new Date(Date.now() - 2 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { lastActive: "desc" },
    });

    return NextResponse.json(activeUsers, { status: 200 });
  } catch (error) {
    console.error("Error fetching presence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, cursor, status } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
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
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const presence = await prisma.userPresence.upsert({
      where: {
        userId_fileId: {
          userId: dbUser.id,
          fileId,
        },
      },
      update: {
        cursor,
        status: status || "VIEWING",
        lastActive: new Date(),
      },
      create: {
        userId: dbUser.id,
        fileId,
        cursor,
        status: status || "VIEWING",
        lastActive: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(presence);
  } catch (error) {
    console.error("Error updating presence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
