import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        createdBy: true,
        team: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(file, { status: 200 });
  } catch (err) {
    console.log("Error getting file by ID: ", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
