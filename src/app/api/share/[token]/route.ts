import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const file = await prisma.file.findFirst({
      where: { 
        shareToken: token,
        isPublic: true 
      },
      include: {
        createdBy: {
          select: {
            name: true,
            image: true
          }
        },
        team: {
          select: {
            name: true
          }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: file.id,
      fileName: file.fileName,
      document: file.document,
      whiteboard: file.whiteboard,
      permissions: file.permissions,
      createdBy: file.createdBy,
      team: file.team
    });
  } catch (err) {
    console.error("Error accessing public file:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}