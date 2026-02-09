import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const file = await prisma.file.findFirst({
      where: {
        shareToken: token,
        isPublic: true,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            image: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    let parsedDocument = null;
    if (file.document && typeof file.document === "string") {
      try {
        parsedDocument = JSON.parse(file.document);
      } catch (err) {
        console.error("Error parsing document:", err);
      }
    } else {
      parsedDocument = file.document;
    }

    return NextResponse.json({
      id: file.id,
      fileName: file.fileName,
      document: parsedDocument,
      whiteboard: file.whiteboard,
      permissions: file.permissions,
      createdBy: file.createdBy,
      team: file.team,
    });
  } catch (err) {
    console.error("Error accessing public file:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
