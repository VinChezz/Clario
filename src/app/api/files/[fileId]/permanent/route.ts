import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🗑️ PERMANENT DELETE request for file:", fileId);

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: dbUser.id,
              },
            },
          },
        },
      },
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const userMembership = existingFile.team.members[0];
    const isTeamCreator = existingFile.team.createdById === dbUser.id;

    const canDelete =
      userMembership?.role === "ADMIN" ||
      userMembership?.role === "EDIT" ||
      isTeamCreator;

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only EDIT and ADMIN roles can delete files.",
        },
        { status: 403 }
      );
    }

    try {
      await prisma.userPresence.deleteMany({
        where: { fileId: fileId },
      });
      console.log("✅ UserPresence records deleted");
    } catch (error) {
      console.log("ℹ️ No UserPresence records to delete or table not found");
    }

    try {
      await prisma.comment.deleteMany({
        where: { fileId: fileId },
      });
      console.log("✅ Comment records deleted");
    } catch (error) {
      console.log("ℹ️ No Comment records to delete or table not found");
    }

    await prisma.file.delete({
      where: { id: fileId },
    });

    console.log("✅ File permanently deleted:", fileId);
    return NextResponse.json(
      { message: "File permanently deleted" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error permanently deleting file:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
