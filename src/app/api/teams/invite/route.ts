// app/api/teams/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    console.log("📨 Invite request:", {
      users,
      teamId,
      role,
      type,
      user: user.email,
    });

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Находим пользователя в базе
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: dbUser.id,
        OR: [{ role: "EDIT" }, { team: { createdById: dbUser.id } }],
      },
      include: { team: true },
    });

    if (!teamMembership) {
      return NextResponse.json(
        {
          error:
            "Team not found or you do not have permission to invite members",
        },
        { status: 403 }
      );
    }

    if (type === "telegram" || type === "discord") {
      console.log(`🔗 Creating ${type} link invite`);

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

      console.log(`✅ Created ${type} link invite: ${invite.id}`);

      return NextResponse.json({
        success: true,
        inviteToken: token,
        expiresAt: invite.expiresAt,
        type: type,
        message: `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } invite link created successfully`,
      });
    }

    if (type === "email") {
      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: "At least one user is required for email invites" },
          { status: 400 }
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

          // Проверяем существующий инвайт
          const existingInvite = await prisma.invite.findFirst({
            where: {
              teamId,
              inviteeId: userId,
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
          });

          if (existingInvite) {
            console.log(`⚠️ Active invite already exists for user ${userId}`);
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

          console.log(
            `✅ Created email invite for user ${userId}: ${invite.id}`
          );
          invites.push(invite);

          try {
            const inviteLink = `${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/invite/accept?token=${token}`;

            const { data, error } = await resend.emails.send({
              from: "Clario Team <onboarding@resend.dev>",
              to: inviteeUser.email,
              subject: `You've been invited to join ${teamMembership.team.name}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      margin: 0;
                      padding: 0;
                      background-color: #f6f9fc;
                    }
                    .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background: #ffffff;
                      border-radius: 12px;
                      overflow: hidden;
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      padding: 40px 20px;
                      text-align: center;
                      color: white;
                    }
                    .content {
                      padding: 40px 30px;
                      color: #333;
                    }
                    .button {
                      display: inline-block;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 16px 32px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;
                      margin: 20px 0;
                    }
                    .footer {
                      padding: 20px;
                      text-align: center;
                      color: #666;
                      font-size: 14px;
                      background: #f8f9fa;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 You're Invited!</h1>
                    </div>
                    <div class="content">
                      <h2>Join ${teamMembership.team.name}</h2>
                      <p><strong>${dbUser.name}</strong> has invited you to join their team on Clario.</p>
                      <p>Collaborate on documents, whiteboards, and projects together.</p>

                      <div style="text-align: center;">
                        <a href="${inviteLink}" class="button">Accept Invitation</a>
                      </div>

                      <p style="color: #666; font-size: 14px;">
                        This invitation will expire in 7 days. If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="background: #f8f9fa; padding: 12px; border-radius: 6px; word-break: break-all;">
                        ${inviteLink}
                      </p>
                    </div>
                    <div class="footer">
                      <p>© 2025 Clario. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });

            if (error) {
              console.error(
                `❌ Failed to send email to ${inviteeUser.email}:`,
                error
              );
              emailResults.push({
                email: inviteeUser.email,
                success: false,
                error: error.message,
              });
            } else {
              console.log(`✅ Email sent to ${inviteeUser.email}`);
              emailResults.push({
                email: inviteeUser.email,
                success: true,
              });
            }
          } catch (emailError) {
            console.error(
              `❌ Email error for ${inviteeUser.email}:`,
              emailError
            );
            emailResults.push({
              email: inviteeUser.email,
              success: false,
              error: "Email service error",
            });
          }
        } catch (userError: any) {
          console.error(`❌ Error processing user ${userId}:`, userError);
        }
      }

      if (invites.length === 0 && users.length > 0) {
        return NextResponse.json(
          { error: "Failed to create any invites" },
          { status: 400 }
        );
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
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ Invite error:", error);

    if (error.code === "P1001") {
      return NextResponse.json(
        { error: "Database temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
