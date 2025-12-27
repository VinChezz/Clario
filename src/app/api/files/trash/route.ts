import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { serializeBigInt } from "@/lib/serializeBigInt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🗑️ Fetching trash for team:", teamId);

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deletedFiles = await prisma.file.findMany({
      where: {
        deletedAt: { not: null },
        teamId: teamId || undefined,
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
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
    });

    console.log(
      `✅ Found ${deletedFiles.length} deleted files for team ${teamId}`
    );
    return NextResponse.json(serializeBigInt(deletedFiles), { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching deleted files:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
