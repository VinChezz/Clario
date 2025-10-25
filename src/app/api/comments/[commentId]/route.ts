import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
    const { status, content } = await request.json();

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

    const canEdit =
      comment.authorId === dbUser.id ||
      (await prisma.file.findFirst({
        where: {
          id: comment.fileId,
          OR: [
            { createdById: dbUser.id },
            {
              team: {
                members: {
                  some: {
                    userId: dbUser.id,
                    role: "EDIT",
                  },
                },
              },
            },
          ],
        },
      }));

    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        ...(status && { status }),
        ...(content && { content }),
        updatedAt: new Date(), // 👈 Добавляем обновление времени
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        selection: true,
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
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

    return NextResponse.json(updatedComment, { status: 200 });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId },
      include: {
        file: true,
        replies: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const canDelete =
      comment.authorId === dbUser.id ||
      (await prisma.file.findFirst({
        where: {
          id: comment.fileId,
          OR: [
            { createdById: dbUser.id },
            {
              team: {
                members: {
                  some: {
                    userId: dbUser.id,
                    role: "EDIT",
                  },
                },
              },
            },
          ],
        },
      }));

    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
