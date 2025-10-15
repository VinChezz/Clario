import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, teamId, role } = await request.json();

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        OR: [{ role: "EDIT" }, { team: { createdById: dbUser.id } }],
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: true,
        team: true,
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, teamId } = await request.json();

    if (!memberId || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        OR: [{ role: "EDIT" }, { team: { createdById: dbUser.id } }],
      },
      include: {
        team: true,
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const memberToRemove = await prisma.teamMember.findFirst({
      where: { id: memberId },
      include: {
        user: true,
        team: true,
      },
    });

    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (memberToRemove.userId === dbUser.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the team" },
        { status: 400 }
      );
    }

    if (memberToRemove.userId === memberToRemove.team.createdById) {
      return NextResponse.json(
        { error: "Cannot remove team owner" },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    try {
      await resend.emails.send({
        from: "Your App <notifications@yourdomain.com>",
        to: memberToRemove.user.email,
        subject: `You've been removed from ${memberToRemove.team.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { background: #ef4444; padding: 40px 20px; text-align: center; color: white; }
              .content { padding: 40px 30px; color: #333; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background: #f8f9fa; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Team Update</h1>
              </div>
              <div class="content">
                <h2>You've been removed from ${memberToRemove.team.name}</h2>
                <p>Your access to the team <strong>${memberToRemove.team.name}</strong> has been removed.</p>
                <p>If you believe this was a mistake, please contact the team owner.</p>
              </div>
              <div class="footer">
                <p>© 2024 Your App. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send removal email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
