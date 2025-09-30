import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(request: Request) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email) {
      // create redirect to login page
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      fileName,
      teamId,
      archive = Boolean(false),
      document = "",
      whiteboard = "",
    } = await request.json();

    if (!fileName || !teamId) {
      return NextResponse.json(
        { error: "File name and team ID are required" },
        { status: 400 }
      );
    }

    const file = await prisma.file.create({
      data: {
        fileName,
        archive,
        document,
        whiteboard,
        teamId,
        createdById: user.id,
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
    const { getUser } = await getKindeServerSession();
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

    const files = await prisma.file.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: true },
    });

    return NextResponse.json(files, { status: 200 });
  } catch (err) {
    console.log("Error fetchinng files: ", err);
    return NextResponse.json(err, { status: 500 });
  }
}
