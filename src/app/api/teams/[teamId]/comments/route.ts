import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        user: { email: user.email },
      },
    });

    if (!userMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        authorId: userId,
        file: {
          teamId: teamId,
        },
      },
      include: {
        file: {
          select: {
            id: true,
            fileName: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      replies: comment.replies.length,
      status: comment.status,
      file: {
        id: comment.file.id,
        name: comment.file.fileName,
        type: "document",
      },
      isEdited: comment.createdAt.getTime() !== comment.updatedAt.getTime(),
    }));

    return NextResponse.json({
      comments: formattedComments,
      count: comments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
