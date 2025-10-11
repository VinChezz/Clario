import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🔍 Fetching files for team:", teamId);

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      console.log("❌ Team not found:", teamId);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    console.log("✅ Team found:", team.name);

    const files = await prisma.file.findMany({
      where: { teamId },
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

    console.log(`📁 Found ${files.length} files for team ${team.name}`);
    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching files:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
