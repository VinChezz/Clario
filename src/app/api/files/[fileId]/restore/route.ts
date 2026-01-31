import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { serializeBigInt } from "@/lib/serializeBigInt";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        deletedAt: { not: null },
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
      include: {
        team: {
          include: {
            members: {
              where: { userId: dbUser.id },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found in trash" },
        { status: 404 },
      );
    }

    const userMembership = file.team.members[0];
    const isTeamCreator = file.team.createdById === dbUser.id;

    const canRestore =
      userMembership?.role === "ADMIN" ||
      userMembership?.role === "EDIT" ||
      isTeamCreator;

    if (!canRestore) {
      return NextResponse.json(
        { error: "Insufficient permissions to restore file" },
        { status: 403 },
      );
    }

    const restoredFile = await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null },
    });

    console.log("✅ File restored:", fileId);

    return NextResponse.json({
      success: true,
      message: "File restored successfully",
      file: serializeBigInt(restoredFile),
    });
  } catch (error) {
    console.error("❌ Error restoring file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
