import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface UpdateBody {
  document?: string;
  whiteboard?: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { document, whiteboard }: UpdateBody = await req.json();
    const { id } = params;

    if (!id)
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );

    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        document,
        whiteboard,
      },
    });

    return NextResponse.json(updatedFile, { status: 200 });
  } catch (err) {
    console.error("Error updating file:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id)
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        createdBy: true,
        team: true,
      },
    });
    return NextResponse.json(file, { status: 200 });
  } catch (err) {
    console.log("Error getting file by ID: ", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
