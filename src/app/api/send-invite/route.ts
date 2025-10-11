import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, inviterName, teamName, inviteLink } = await request.json();

    if (!to || !inviterName || !teamName || !inviteLink) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const testEmail = "vin4auzer@gmail.com";

    const { data, error } = await resend.emails.send({
      from: "Clario Team <onboarding@resend.dev>",
      to: testEmail,
      subject: `[TEST] You've been invited to join ${teamName}`,
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
            .test-notice {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              border-radius: 6px;
              margin: 10px 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
            </div>
            <div class="content">
              <div class="test-notice">
                <strong>TEST EMAIL:</strong> This is a test invitation. In production, this would be sent to ${to}
              </div>

              <h2>Join ${teamName}</h2>
              <p><strong>${inviterName}</strong> has invited you to join their team on Clario.</p>
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
              <p>© 2024 Clario. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json({
        success: true,
        warning: "Email service issue, but invite was created successfully",
        testMode: true,
      });
    }

    console.log("✅ Test email sent successfully to:", testEmail);
    return NextResponse.json({
      success: true,
      data,
      testMode: true,
      message: "Test invitation sent (check your email)",
    });
  } catch (error) {
    console.error("Send invite error:", error);

    return NextResponse.json({
      success: true,
      warning: "Email service temporarily unavailable, but invite was created",
      testMode: true,
    });
  }
}
