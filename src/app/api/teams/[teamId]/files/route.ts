import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createFileWithTeamCheck } from "@/lib/fileOperations";

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
    return NextResponse.json(serializeBigInt(files), { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching files:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = params.teamId;
    const body = await request.json();

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await createFileWithTeamCheck({
      fileName: body.fileName,
      teamId,
      userId: dbUser.id,
      document: body.document,
      whiteboard: body.whiteboard,
      archive: body.archive || false,
      isPublic: body.isPublic || false,
      permissions: body.permissions || "VIEW",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, teamStorage: result.teamStorageInfo },
        { status: result.error?.includes("insufficient") ? 400 : 403 }
      );
    }

    return NextResponse.json({
      success: true,
      file: result.file,
      teamStorage: result.teamStorageInfo,
    });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}
