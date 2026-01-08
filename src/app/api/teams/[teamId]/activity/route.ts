import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const determineAction = (operation: string): string => {
  switch (operation) {
    case "create":
      return "file_created";
    case "update":
      return "file_edited";
    case "view":
      return "file_viewed";
    default:
      return operation;
  }
};

const generateDetails = (action: string, fileName: string): string => {
  const actions: Record<string, string> = {
    file_created: `Created file "${fileName}"`,
    file_edited: `Edited file "${fileName}"`,
    file_viewed: `Viewed file "${fileName}"`,
    comment_added: `Added comment to file "${fileName}"`,
    comment_edited: `Edited comment in file "${fileName}"`,
    comment_replied: `Replied to comment in file "${fileName}"`,
    team_joined: `Joined the team`,
    invite_sent: `Sent invitation`,
  };

  return actions[action] || `Performed action: ${action}`;
};

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

    const activities: any[] = [];

    const files = await prisma.file.findMany({
      where: {
        teamId,
        createdById: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        fileName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    files.forEach((file) => {
      activities.push({
        id: `file_create_${file.id}`,
        action: determineAction("create"),
        details: generateDetails("file_created", file.fileName),
        timestamp: file.createdAt.toISOString(),
        resource: {
          type: "file",
          name: file.fileName,
          id: file.id,
        },
      });

      if (file.updatedAt > file.createdAt) {
        activities.push({
          id: `file_update_${file.id}_${file.updatedAt.getTime()}`,
          action: determineAction("update"),
          details: generateDetails("file_edited", file.fileName),
          timestamp: file.updatedAt.toISOString(),
          resource: {
            type: "file",
            name: file.fileName,
            id: file.id,
          },
        });
      }
    });

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
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    comments.forEach((comment) => {
      activities.push({
        id: `comment_${comment.id}`,
        action: "comment_added",
        details: generateDetails("comment_added", comment.file.fileName),
        timestamp: comment.createdAt.toISOString(),
        resource: {
          type: "comment",
          name: comment.file.fileName,
          id: comment.file.id,
        },
      });

      if (comment.updatedAt > comment.createdAt) {
        activities.push({
          id: `comment_update_${comment.id}`,
          action: "comment_edited",
          details: generateDetails("comment_edited", comment.file.fileName),
          timestamp: comment.updatedAt.toISOString(),
          resource: {
            type: "comment",
            name: comment.file.fileName,
            id: comment.file.id,
          },
        });
      }
    });

    const commentReplies = await prisma.commentReply.findMany({
      where: {
        authorId: userId,
        comment: {
          file: {
            teamId: teamId,
          },
        },
      },
      include: {
        comment: {
          include: {
            file: {
              select: {
                id: true,
                fileName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    commentReplies.forEach((reply) => {
      activities.push({
        id: `reply_${reply.id}`,
        action: "comment_replied",
        details: generateDetails(
          "comment_replied",
          reply.comment.file.fileName
        ),
        timestamp: reply.createdAt.toISOString(),
        resource: {
          type: "comment_reply",
          name: reply.comment.file.fileName,
          id: reply.comment.file.id,
        },
      });
    });

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: userId,
      },
      select: {
        joinedAt: true,
      },
    });

    if (teamMember) {
      activities.push({
        id: `team_join_${userId}_${teamId}`,
        action: "team_joined",
        details: "Joined the team",
        timestamp: teamMember.joinedAt.toISOString(),
        resource: {
          type: "team",
          name: "Team",
          id: teamId,
        },
      });
    }

    const invites = await prisma.invite.findMany({
      where: {
        teamId,
        inviterId: userId,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    invites.forEach((invite) => {
      activities.push({
        id: `invite_${invite.id}`,
        action: "invite_sent",
        details: `Sent invitation to ${invite.email}`,
        timestamp: invite.createdAt.toISOString(),
        resource: {
          type: "invite",
          name: `Invitation for ${invite.email}`,
          id: invite.id,
        },
      });
    });

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const recentActivities = activities.slice(0, 100);

    return NextResponse.json({
      activities: recentActivities,
      count: recentActivities.length,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
