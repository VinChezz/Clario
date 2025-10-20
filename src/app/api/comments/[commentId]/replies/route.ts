import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await params;
    const { content, mentions } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId },
      include: { file: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const fileAccess = await prisma.file.findFirst({
      where: {
        id: comment.fileId,
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
    });

    if (!fileAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const reply = await prisma.commentReply.create({
      data: {
        content,
        authorId: dbUser.id,
        commentId,
        mentions: mentions?.length
          ? {
              create: mentions.map((userId: string) => ({
                userId,
                position: 0,
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        mentions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(reply, { status: 200 });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
