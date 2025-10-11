import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      fileName,
      teamId,
      archive = false,
      document = "",
      whiteboard = "",
    } = await request.json();

    if (!fileName || !teamId) {
      return NextResponse.json(
        { error: "File name and team ID are required" },
        { status: 400 }
      );
    }

    const userName =
      user.given_name || user.family_name || user.email.split("@")[0];
    const userImage = user.picture || "";

    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: userName,
        image: userImage,
      },
      create: {
        id: user.id,
        email: user.email,
        name: userName,
        image: userImage,
      },
    });

    const teamAccess = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { createdById: dbUser.id },
          {
            members: {
              some: {
                userId: dbUser.id,
                role: { in: ["EDIT"] },
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

    const file = await prisma.file.create({
      data: {
        fileName,
        archive,
        document,
        whiteboard,
        teamId,
        createdById: dbUser.id,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (err) {
    console.error("Error creating file:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
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
      where: { teamId },
      orderBy: { createdAt: "desc" },
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
    });

    return NextResponse.json(files, { status: 200 });
  } catch (err) {
    console.log("Error fetching files: ", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
