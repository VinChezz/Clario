import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string; replyId: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId, replyId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reply = await prisma.commentReply.findFirst({
      where: {
        id: replyId,
        commentId: commentId,
      },
      include: {
        comment: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const canDelete =
      reply.authorId === dbUser.id ||
      reply.comment.authorId === dbUser.id ||
      (await prisma.file.findFirst({
        where: {
          id: reply.comment.fileId,
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

    await prisma.commentReply.delete({
      where: { id: replyId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
