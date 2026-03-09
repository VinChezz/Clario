import { transporter } from "./nodemailer";
import nodemailer from "nodemailer";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const appName = process.env.APP_NAME || "Clario";
  const appUrl = process.env.PUBLIC_URL || "http://localhost:3000";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@clario.com";
  const currentYear = new Date().getFullYear();

  const fromEmail = process.env.SMTP_FROM || "noreply@clario.com";
  const fromName = process.env.SMTP_FROM_NAME || appName;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Your ${appName} Verification Code: ${code}`,
      text: `Your verification code is: ${code}. This code will expire in 5 minutes.`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

            body {
              margin: 0;
              padding: 0;
              background: #f9fafb;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            }

            .email-container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .header {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }

            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 10px;
              letter-spacing: -0.5px;
            }

            .subtitle {
              font-size: 16px;
              opacity: 0.9;
              font-weight: 400;
              margin: 0;
            }

            .content {
              padding: 40px 30px;
            }

            .welcome-text {
              font-size: 16px;
              color: #374151;
              line-height: 1.6;
              margin-bottom: 30px;
              text-align: center;
            }

            .code-container {
              background: #f8fafc;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
              border: 1px solid #e5e7eb;
            }

            .code-label {
              font-size: 14px;
              color: #6B7280;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
              font-weight: 600;
            }

            .code {
              font-size: 48px;
              font-weight: 700;
              letter-spacing: 8px;
              color: #111827;
              margin: 0;
              font-family: 'Monaco', 'Menlo', monospace;
              background: white;
              padding: 20px;
              border-radius: 12px;
              display: inline-block;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }

            .expiry {
              color: #6B7280;
              font-size: 14px;
              margin-top: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }

            .instructions {
              background: #fef3c7;
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              border-left: 4px solid #f59e0b;
            }

            .instructions-title {
              color: #92400e;
              font-weight: 600;
              margin: 0 0 10px;
              font-size: 16px;
            }

            .instructions-list {
              margin: 0;
              padding-left: 20px;
              color: #92400e;
            }

            .instructions-list li {
              margin-bottom: 8px;
              font-size: 14px;
            }

            .security-note {
              text-align: center;
              color: #6B7280;
              font-size: 14px;
              margin: 30px 0;
              padding: 20px;
              background: #f9fafb;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }

            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }

            .app-info {
              color: #6B7280;
              font-size: 14px;
              margin-bottom: 20px;
            }

            .support {
              color: #6B7280;
              font-size: 14px;
              margin: 10px 0;
            }

            .support a {
              color: #4F46E5;
              text-decoration: none;
            }

            .copyright {
              color: #9CA3AF;
              font-size: 12px;
              margin-top: 20px;
            }

            @media (max-width: 600px) {
              .email-container {
                margin: 20px;
                border-radius: 12px;
              }

              .header {
                padding: 30px 20px;
              }

              .content {
                padding: 30px 20px;
              }

              .code {
                font-size: 36px;
                letter-spacing: 6px;
                padding: 15px;
              }

              .title {
                font-size: 24px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header with Gradient -->
            <div class="header">
              <h1 class="title">Security Verification</h1>
              <p class="subtitle">Secure access to your ${appName} account</p>
            </div>

            <!-- Main Content -->
            <div class="content">
              <p class="welcome-text">
                Hello! To complete your sign-in, please use the verification code below:
              </p>

              <!-- OTP Code Display -->
              <div class="code-container">
                <div class="code-label">Verification Code</div>
                <p class="code">${code}</p>
                <div class="expiry">
                  <svg class="expiry-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Expires in 5 minutes
                </div>
              </div>

              <!-- Instructions -->
              <div class="instructions">
                <h3 class="instructions-title">Important Security Information</h3>
                <ul class="instructions-list">
                  <li>Never share this code with anyone</li>
                  <li>${appName} will never ask for your password or verification code</li>
                  <li>This code is valid for one-time use only</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>

              <!-- Security Note -->
              <div class="security-note">
                <strong>Why did I receive this email?</strong><br>
                You received this email because a sign-in attempt was made for your ${appName} account.
                If this wasn't you, we recommend changing your password immediately.
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="app-info">
                <strong>${appName}</strong> • Secure Authentication System
              </div>
              <div class="support">
                Need help? <a href="mailto:${supportEmail}">Contact our support team</a>
              </div>
              <div class="copyright">
                © ${currentYear} ${appName}. All rights reserved.<br>
                This is an automated message, please do not reply.
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (process.env.NODE_ENV === "development") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("📧 Email preview URL:", previewUrl);
      }
    }

    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
}
