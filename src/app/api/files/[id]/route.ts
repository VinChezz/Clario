import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

interface UpdateBody {
  document?: string;
  whiteboard?: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { document, whiteboard }: UpdateBody = await req.json();
    const { id } = await params;

    console.log("🔄 API PATCH request for file:", id);
    console.log("📦 Document data received:", document ? "present" : "missing");

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const existingFile = await prisma.file.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (document !== undefined) {
      updateData.document = document;
      console.log("💾 Updating document data");
    }
    if (whiteboard !== undefined) updateData.whiteboard = whiteboard;

    const updatedFile = await prisma.file.update({
      where: { id },
      data: updateData,
    });

    console.log("✅ File updated successfully");
    return NextResponse.json(updatedFile, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating file:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🔍 Fetching file by ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id },
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
            createdById: true,
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      console.log("❌ File not found:", id);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.isPublic) {
      console.log("✅ Public file accessed:", id);
      return NextResponse.json(file, { status: 200 });
    }

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasAccess =
      file.createdById === dbUser.id ||
      file.team.createdById === dbUser.id ||
      file.team.members.some((member) => member.userId === dbUser.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this file" },
        { status: 403 }
      );
    }

    console.log("✅ File accessed successfully:", id);
    return NextResponse.json(file, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching file:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
