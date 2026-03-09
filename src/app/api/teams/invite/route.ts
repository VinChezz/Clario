import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      users = [],
      teamId,
      role = "VIEW",
      type = "EMAIL",
    } = await request.json();

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 },
      );
    }

    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        OR: [{ role: "ADMIN" }, { team: { createdById: dbUser.id } }],
      },
      include: { team: true },
    });

    if (!teamMembership) {
      return NextResponse.json(
        {
          error:
            "Team not found or you do not have permission to invite members",
        },
        { status: 403 },
      );
    }

    if (type === "telegram") {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invite = await prisma.invite.create({
        data: {
          token,
          teamId,
          inviterId: dbUser.id,
          type: type.toUpperCase(),
          role,
          status: "PENDING",
          expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        inviteToken: token,
        expiresAt: invite.expiresAt,
        type,
        message: `${type} invite link created successfully`,
      });
    }

    if (type === "email") {
      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: "At least one user is required for email invites" },
          { status: 400 },
        );
      }

      const invites = [];
      const emailResults = [];

      for (const userId of users) {
        try {
          const inviteeUser = await prisma.user.findFirst({
            where: { id: userId },
          });
          if (!inviteeUser) {
            console.log(`❌ User not found: ${userId}`);
            continue;
          }

          const existingInvite = await prisma.invite.findFirst({
            where: {
              teamId,
              inviteeId: userId,
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
          });

          if (existingInvite) {
            invites.push(existingInvite);
            continue;
          }

          const token = randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          const invite = await prisma.invite.create({
            data: {
              token,
              teamId,
              inviterId: dbUser.id,
              inviteeId: inviteeUser.id,
              type: "EMAIL",
              role,
              status: "PENDING",
              expiresAt,
            },
          });

          invites.push(invite);

          const inviteLink = `${
            process.env.PUBLIC_URL || "http://localhost:3000"
          }/invite/accept?token=${token}`;

          try {
            await transporter.sendMail({
              from: `"${process.env.SMTP_FROM_NAME || "Clario Team"}" <${
                process.env.SMTP_FROM || "noreply@clario.com"
              }>`,
              to: inviteeUser.email,
              subject: `🎉 You're invited to join ${teamMembership.team.name}`,
              html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Invitation</title>
                  <style>
                    body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      background-color: #f4f6fa;
                      margin: 0;
                      padding: 0;
                    }
                    .container {
                      max-width: 600px;
                      margin: 30px auto;
                      background: #fff;
                      border-radius: 12px;
                      overflow: hidden;
                      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      text-align: center;
                      padding: 40px 20px;
                    }
                    .header h1 {
                      margin: 0;
                      font-size: 28px;
                    }
                    .content {
                      padding: 30px 20px;
                      color: #333;
                    }
                    .content h2 {
                      font-size: 22px;
                      margin-top: 0;
                    }
                    .content p {
                      line-height: 1.6;
                      font-size: 16px;
                    }
                    .button {
                      display: inline-block;
                      padding: 16px 30px;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white !important;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;
                      margin: 20px 0;
                    }
                    .footer {
                      text-align: center;
                      padding: 20px;
                      font-size: 14px;
                      color: #888;
                      background: #f0f1f5;
                    }
                    @media (max-width: 480px) {
                      .content, .header {
                        padding: 20px 15px;
                      }
                      .button {
                        padding: 14px 20px;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>You're Invited!</h1>
                    </div>
                    <div class="content">
                      <h2>Join ${teamMembership.team.name}</h2>
                      <p><strong>${dbUser.name}</strong> has invited you to join their team on Clario.</p>
                      <p>Collaborate on documents, whiteboards, and projects together.</p>
                      <div style="text-align: center;">
                        <a href="${inviteLink}" class="button">Accept Invitation</a>
                      </div>
                      <p style="font-size: 14px; color: #666;">
                        This invitation will expire in 7 days. If the button doesn’t work, copy and paste this link into your browser:
                      </p>
                      <p style="word-break: break-all; background: #f0f1f5; padding: 12px; border-radius: 6px;">${inviteLink}</p>
                    </div>
                    <div class="footer">
                      <p>© 2025 Clario. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
                `,
            });

            console.log(`✅ Email sent to ${inviteeUser.email}`);
            emailResults.push({ email: inviteeUser.email, success: true });
          } catch (emailError: any) {
            console.error(
              `❌ Email error for ${inviteeUser.email}:`,
              emailError,
            );
            emailResults.push({
              email: inviteeUser.email,
              success: false,
              error: emailError.message || "Email service error",
            });
          }
        } catch (userError: any) {
          console.error(`❌ Error processing user ${userId}:`, userError);
        }
      }

      return NextResponse.json({
        success: true,
        invites,
        emailResults,
        message: `Successfully created ${invites.length} email invite(s)`,
      });
    }

    return NextResponse.json(
      { error: `Unsupported invite type: ${type}` },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("❌ Invite error:", error);
    if (error.code === "P1001") {
      return NextResponse.json(
        { error: "Database temporarily unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
