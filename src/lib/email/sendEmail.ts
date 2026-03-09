import nodemailer from "nodemailer";
import { emailConfig } from "./config";

export function createTransporter() {
  console.log("📧 Nodemailer configuration:", {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    user: emailConfig.auth.user ? "***" : "not set",
    from: emailConfig.from,
  });

  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.auth.user,
      pass: emailConfig.auth.pass,
    },
  });

  return transporter;
}

const transporter = createTransporter();

export function createCalendarLink(data: any): string {
  const startTime = new Date(`${data.preferredDate}T${data.preferredTime}:00`);
  const endTime = new Date(startTime.getTime() + 45 * 60000);

  const formatDateForCalendar = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Clario Demo: ${data.company}`,
    dates: `${formatDateForCalendar(startTime)}/${formatDateForCalendar(endTime)}`,
    details: `
      Demo Details:
      • Client: ${data.firstName} ${data.lastName}
      • Email: ${data.email}
      • Company: ${data.company}
      • Demo Type: ${getDemoTypeLabel(data.demoType)}
      • Timezone: ${data.timezone}
      • Duration: ${getDemoDuration(data.demoType)}
      • Attendees: ${data.attendees}
      • Goals: ${data.goals || "Not specified"}

      Meeting Host:
      Alex Morgan — Senior Solutions Engineer
      demo@clario.com
      +1 (555) 987-6543
    `.trim(),
    add: data.email,
    sprop: "name:Clario Demo Scheduler",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getDemoTypeLabel(demoType: string): string {
  const labels: Record<string, string> = {
    platform: "Platform Overview",
    enterprise: "Enterprise Solution",
    technical: "Technical Deep Dive",
    security: "Security & Compliance",
  };
  return labels[demoType] || demoType;
}

function getDemoDuration(demoType: string): string {
  const durations: Record<string, string> = {
    platform: "45 minutes",
    enterprise: "60 minutes",
    technical: "60 minutes",
    security: "30 minutes",
  };
  return durations[demoType] || "45 minutes";
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.log("📨 DEV MODE - Email would be sent:");
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("HTML preview:", options.html.substring(0, 200) + "...");

      const match = options.html.match(
        /https:\/\/calendar\.google\.com\/[^\s"]+/,
      );
      if (match) {
        console.log("📅 Calendar Link:", match[0]);
      }

      return { success: true, messageId: "simulated-in-dev" };
    }

    const mailOptions = {
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      cc: options.cc,
      bcc: options.bcc,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

export const emailTemplates = {
  contactSales: (data: any) => {
    const appUrl = process.env.PUBLIC_URL || "http://localhost:3000";

    return {
      subject: `Thank you for contacting Clario Sales Team - ${data.company}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sales Inquiry Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 560px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: #0f172a;
            padding: 40px 32px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .logo span {
            background: linear-gradient(135deg, #60a5fa, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            padding: 8px 20px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .greeting-light {
            font-weight: 400;
            color: #64748b;
          }
          .message {
            color: #475569;
            margin-bottom: 32px;
            font-size: 16px;
            line-height: 1.7;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat-card {
            background: #f8fafc;
            border-radius: 20px;
            padding: 20px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #0f172a;
          }
          .stat-note {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .details-card {
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #e2e8f0;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
          }
          .details-row:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }
          .details-label {
            color: #64748b;
            font-size: 15px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .details-label::before {
            content: '•';
            color: #3b82f6;
            font-size: 20px;
            line-height: 1;
          }
          .details-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 15px;
          }
          .chip {
            background: #f1f5f9;
            color: #334155;
            padding: 6px 12px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'SF Mono', 'Monaco', monospace;
            border: 1px solid #e2e8f0;
          }
          .badge {
            background: #dbeafe;
            color: #1e40af;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .button-primary {
            display: inline-block;
            background: #0f172a;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.2s;
            border: 1px solid #1e293b;
          }
          .button-primary:hover {
            background: #1e293b;
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -10px #0f172a;
          }
          .features {
            background: #f8fafc;
            border-radius: 20px;
            padding: 24px;
            margin: 32px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
          }
          .feature-item::before {
            content: '✓';
            color: #3b82f6;
            font-weight: 700;
            font-size: 16px;
          }
          .footer {
            padding: 32px;
            text-align: center;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
          }
          .copyright {
            color: #94a3b8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              Clario<span>.</span>
            </div>
            <div class="success-badge">
              <span>📬 Inquiry Received</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">
              Thanks for reaching out, ${data.firstName}! <span class="greeting-light">👋</span>
            </div>

            <div class="message">
              We've received your inquiry and our sales team will get back to you within <strong>24 hours</strong>.
              We're excited to learn more about how we can help <strong>${data.company}</strong> succeed.
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Company</div>
                <div class="stat-value">${data.company}</div>
                <div class="stat-note">${data.companySize}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Help Type</div>
                <div class="stat-value">${data.helpType}</div>
                <div class="stat-note">${data.country}</div>
              </div>
            </div>

            <!-- Contact Details -->
            <div class="details-card">
              <div class="details-row">
                <span class="details-label">Contact Name</span>
                <span class="details-value">${data.firstName} ${data.lastName}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Email</span>
                <span class="chip">${data.email}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Phone</span>
                <span class="details-value">${data.phone || "Not provided"}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Status</span>
                <span class="badge">⏳ Awaiting Response</span>
              </div>
            </div>

            <!-- Message Section -->
            <div class="features">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                📝 Your Message
              </h3>
              <div class="feature-item">
                <span>${data.message}</span>
              </div>
            </div>

            <!-- What's Next Section -->
            <div class="features">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                ⏳ What happens next?
              </h3>
              <div class="feature-item">
                <span>A sales representative will contact you within 24 hours</span>
              </div>
              <div class="feature-item">
                <span>We'll schedule a personalized consultation</span>
              </div>
              <div class="feature-item">
                <span>You'll receive tailored solutions for your needs</span>
              </div>
            </div>

            <!-- Quick Links -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="${appUrl}/book-demo" class="button-primary">
                📅 Book a Demo
              </a>
            </div>
            <p style="text-align: center; margin-top: 16px;">
              <a href="${appUrl}/pricing" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                View Pricing →
              </a>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="copyright">
              © ${new Date().getFullYear()} Clario. All rights reserved.
            </div>
            <div style="margin-top: 16px; color: #94a3b8; font-size: 12px;">
              123 Innovation Drive, San Francisco, CA 94107
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      Thanks for reaching out, ${data.firstName}!

      We've received your inquiry and our sales team will get back to you within 24 hours.

      ──────────────────────
      INQUIRY DETAILS
      ──────────────────────
      Company: ${data.company}
      Company Size: ${data.companySize}
      Help Type: ${data.helpType}
      Country: ${data.country}
      Contact: ${data.firstName} ${data.lastName}
      Email: ${data.email}
      Phone: ${data.phone || "Not provided"}

      Message: ${data.message}

      ──────────────────────
      WHAT HAPPENS NEXT?
      ──────────────────────
      • A sales representative will contact you within 24 hours
      • We'll schedule a personalized consultation
      • You'll receive tailored solutions for your needs

      Book a demo: ${appUrl}/book-demo
      View pricing: ${appUrl}/pricing

      ──────────────────────
      Clario - ${appUrl}
      support@clario.com
    `,
    };
  },

  bookDemo: (data: any, calendarLink: string) => {
    const appUrl = process.env.PUBLIC_URL || "http://localhost:3000";

    return {
      subject: `Your Clario Demo Confirmation — ${getDemoTypeLabel(data.demoType)}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 560px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: #0f172a;
            padding: 40px 32px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981, #059669, #047857);
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .logo span {
            background: linear-gradient(135deg, #34d399, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            padding: 8px 20px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .greeting-light {
            font-weight: 400;
            color: #64748b;
          }
          .message {
            color: #475569;
            margin-bottom: 32px;
            font-size: 16px;
            line-height: 1.7;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat-card {
            background: #f8fafc;
            border-radius: 20px;
            padding: 20px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
          }
          .stat-note {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .details-card {
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #e2e8f0;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
          }
          .details-row:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }
          .details-label {
            color: #64748b;
            font-size: 15px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .details-label::before {
            content: '•';
            color: #10b981;
            font-size: 20px;
            line-height: 1;
          }
          .details-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 15px;
          }
          .chip {
            background: #f1f5f9;
            color: #334155;
            padding: 6px 12px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 500;
            border: 1px solid #e2e8f0;
          }
          .badge-success {
            background: #d1fae5;
            color: #065f46;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .badge-warning {
            background: #fef3c7;
            color: #92400e;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
          }
          .button-primary {
            display: inline-block;
            background: #10b981;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.2s;
            border: 1px solid #059669;
          }
          .button-primary:hover {
            background: #059669;
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -10px #10b981;
          }
          .features {
            background: #f8fafc;
            border-radius: 20px;
            padding: 24px;
            margin: 32px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
          }
          .feature-item::before {
            content: '✓';
            color: #10b981;
            font-weight: 700;
            font-size: 16px;
          }
          .footer {
            padding: 32px;
            text-align: center;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
          }
          .copyright {
            color: #94a3b8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              Clario<span>.</span>
            </div>
            <div class="success-badge">
              <span>🎉 Demo Confirmed</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">
              Hi ${data.firstName}! <span class="greeting-light">👋</span>
            </div>

            <div class="message">
              Your demo has been successfully scheduled. We're excited to show how Clario can help
              <strong>${data.company}</strong> achieve its goals.
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Demo Type</div>
                <div class="stat-value">${getDemoTypeLabel(data.demoType)}</div>
                <div class="stat-note">${getDemoDuration(data.demoType)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Attendees</div>
                <div class="stat-value">${data.attendees}</div>
                <div class="stat-note">Including you</div>
              </div>
            </div>

            <!-- Demo Details -->
            <div class="details-card">
              <div class="details-row">
                <span class="details-label">Date</span>
                <span class="details-value">${new Date(
                  data.preferredDate,
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Time</span>
                <span class="details-value">${data.preferredTime} (${data.timezone})</span>
              </div>
              <div class="details-row">
                <span class="details-label">Host</span>
                <span class="details-value">Alex Morgan</span>
              </div>
              <div class="details-row">
                <span class="details-label">Status</span>
                <span class="badge-success">✓ Confirmed</span>
              </div>
            </div>

            <!-- Calendar Link -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${calendarLink}" class="button-primary">
                📅 Add to Google Calendar
              </a>
            </div>

            <!-- Meeting Information -->
            <div class="features">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                💡 Google Meet Information
              </h3>
              <div class="feature-item">
                <span>A Meet link will be generated when you save to calendar</span>
              </div>
              <div class="feature-item">
                <span>The link will appear in the calendar event details</span>
              </div>
              <div class="feature-item">
                <span>Click the event at scheduled time to join</span>
              </div>
            </div>

            <!-- Preparation Checklist -->
            <div class="features">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                📋 Preparation Checklist
              </h3>
              <div class="feature-item">
                <span>Test your microphone and camera</span>
              </div>
              <div class="feature-item">
                <span>Prepare your questions</span>
              </div>
              <div class="feature-item">
                <span>Add event to calendar</span>
              </div>
            </div>

            <!-- Goals Section -->
            ${
              data.goals
                ? `
              <div class="features">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                  🎯 Your Goals
                </h3>
                <div class="feature-item">
                  <span>${data.goals}</span>
                </div>
              </div>
            `
                : ""
            }

            <!-- Reschedule -->
            <p style="text-align: center; margin-top: 24px; color: #64748b;">
              Need to reschedule? <a href="${appUrl}/book-demo" style="color: #10b981; text-decoration: none;">Click here</a>
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="copyright">
              © ${new Date().getFullYear()} Clario. All rights reserved.
            </div>
            <div style="margin-top: 16px; color: #94a3b8; font-size: 12px;">
              123 Innovation Drive, San Francisco, CA 94107
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      Hi ${data.firstName}!

      Your demo has been successfully scheduled.

      ──────────────────────
      DEMO DETAILS
      ──────────────────────
      Type: ${getDemoTypeLabel(data.demoType)}
      Duration: ${getDemoDuration(data.demoType)}
      Date: ${new Date(data.preferredDate).toLocaleDateString()}
      Time: ${data.preferredTime} (${data.timezone})
      Attendees: ${data.attendees}
      Host: Alex Morgan

      Add to Calendar: ${calendarLink}

      ──────────────────────
      GOOGLE MEET INFO
      ──────────────────────
      • A Meet link will be generated when you save to calendar
      • The link will appear in the calendar event details
      • Click the event at scheduled time to join

      ──────────────────────
      PREPARATION
      ──────────────────────
      • Test your microphone and camera
      • Prepare your questions
      • Add event to calendar

      ${data.goals ? `Your goals: ${data.goals}` : ""}

      Need to reschedule? ${appUrl}/book-demo

      ──────────────────────
      Clario - ${appUrl}
      support@clario.com
    `,
      calendarLink: calendarLink,
    };
  },

  adminNotification: (data: any, calendarLink?: string) => {
    const isContactSales = data.type === "contact-sales";
    const isBookDemo = data.type === "book-demo";

    return {
      subject: `New ${data.type === "contact-sales" ? "Sales Inquiry" : "Demo Request"} - ${data.formData.company}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Notification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 560px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: #0f172a;
            padding: 40px 32px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .logo span {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            padding: 8px 20px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            border: 1px solid rgba(245, 158, 11, 0.2);
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .submission-time {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 32px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat-card {
            background: #f8fafc;
            border-radius: 20px;
            padding: 20px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
          }
          .stat-note {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .details-card {
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #e2e8f0;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
          }
          .details-row:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }
          .details-label {
            color: #64748b;
            font-size: 15px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .details-label::before {
            content: '•';
            color: #f59e0b;
            font-size: 20px;
            line-height: 1;
          }
          .details-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 15px;
          }
          .chip {
            background: #f1f5f9;
            color: #334155;
            padding: 6px 12px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 500;
            border: 1px solid #e2e8f0;
          }
          .badge-type {
            background: ${isContactSales ? "#dbeafe" : "#d1fae5"};
            color: ${isContactSales ? "#1e40af" : "#065f46"};
            padding: 4px 12px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 600;
          }
          .features {
            background: #f8fafc;
            border-radius: 20px;
            padding: 24px;
            margin: 32px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
          }
          .feature-item::before {
            content: '→';
            color: #f59e0b;
            font-weight: 700;
            font-size: 16px;
          }
          .action-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin: 32px 0;
            flex-wrap: wrap;
          }
          .button {
            display: inline-block;
            background: #0f172a;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            border: 1px solid #1e293b;
          }
          .button:hover {
            background: #1e293b;
          }
          .button-green {
            background: #10b981;
            border-color: #059669;
          }
          .button-green:hover {
            background: #059669;
          }
          .button-purple {
            background: #8b5cf6;
            border-color: #7c3aed;
          }
          .button-purple:hover {
            background: #7c3aed;
          }
          .footer {
            padding: 32px;
            text-align: center;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
          }
          .copyright {
            color: #94a3b8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              Clario<span>.</span>
            </div>
            <div class="badge">
              <span>👑 Admin Notification</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">
              New ${isContactSales ? "Sales Inquiry" : "Demo Request"}!
            </div>
            <div class="submission-time">
              Submitted at ${new Date().toLocaleString()}
            </div>

            <!-- Type Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
              <span class="badge-type">${isContactSales ? "📧 Sales Inquiry" : "📅 Demo Request"}</span>
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Company</div>
                <div class="stat-value">${data.formData.company}</div>
                <div class="stat-note">${data.formData.companySize || ""}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Contact</div>
                <div class="stat-value">${data.formData.firstName}</div>
                <div class="stat-note">${data.formData.lastName}</div>
              </div>
            </div>

            <!-- Contact Details -->
            <div class="details-card">
              <div class="details-row">
                <span class="details-label">Full Name</span>
                <span class="details-value">${data.formData.firstName} ${data.formData.lastName}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Email</span>
                <span class="chip">${data.formData.email}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Phone</span>
                <span class="details-value">${data.formData.phone || "Not provided"}</span>
              </div>
              ${
                data.formData.country
                  ? `
                <div class="details-row">
                  <span class="details-label">Country</span>
                  <span class="details-value">${data.formData.country}</span>
                </div>
              `
                  : ""
              }
            </div>

            ${
              isBookDemo
                ? `
              <!-- Demo Details -->
              <div class="details-card">
                <div class="details-row">
                  <span class="details-label">Demo Type</span>
                  <span class="details-value">${getDemoTypeLabel(data.formData.demoType)}</span>
                </div>
                <div class="details-row">
                  <span class="details-label">Date & Time</span>
                  <span class="details-value">${data.formData.preferredDate} at ${data.formData.preferredTime}</span>
                </div>
                <div class="details-row">
                  <span class="details-label">Timezone</span>
                  <span class="details-value">${data.formData.timezone}</span>
                </div>
                <div class="details-row">
                  <span class="details-label">Attendees</span>
                  <span class="details-value">${data.formData.attendees}</span>
                </div>
              </div>
            `
                : ""
            }

            ${
              data.formData.message || data.formData.goals
                ? `
              <!-- Message/Goals -->
              <div class="features">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                  ${isContactSales ? "📝 Message" : "🎯 Goals"}
                </h3>
                <div class="feature-item">
                  <span>${data.formData.message || data.formData.goals}</span>
                </div>
              </div>
            `
                : ""
            }

            <!-- Action Buttons -->
            <div class="action-buttons">
              <a href="mailto:${data.formData.email}" class="button">
                ✉️ Reply via Email
              </a>
              ${
                isBookDemo && calendarLink
                  ? `
                <a href="${calendarLink}" class="button button-green">
                  📅 View Calendar
                </a>
              `
                  : ""
              }
              ${
                data.formData.phone
                  ? `
                <a href="tel:${data.formData.phone}" class="button button-purple">
                  📞 Call Customer
                </a>
              `
                  : ""
              }
            </div>

            <!-- Metadata -->
            <div style="margin-top: 32px; padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
              <p style="margin: 4px 0; color: #64748b; font-size: 12px;">
                <strong>Submission ID:</strong> ${Date.now()}
              </p>
              <p style="margin: 4px 0; color: #64748b; font-size: 12px;">
                <strong>Meet Status:</strong> Client will get Meet from Google Calendar
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="copyright">
              © ${new Date().getFullYear()} Clario Admin System
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      New ${isContactSales ? "Sales Inquiry" : "Demo Request"} - ${data.formData.company}
      Submitted at: ${new Date().toLocaleString()}

      ──────────────────────
      CONTACT INFORMATION
      ──────────────────────
      Name: ${data.formData.firstName} ${data.formData.lastName}
      Email: ${data.formData.email}
      Phone: ${data.formData.phone || "Not provided"}
      Company: ${data.formData.company}
      ${data.formData.companySize ? `Company Size: ${data.formData.companySize}` : ""}
      ${data.formData.country ? `Country: ${data.formData.country}` : ""}

      ${
        isBookDemo
          ? `
      ──────────────────────
      DEMO DETAILS
      ──────────────────────
      Type: ${getDemoTypeLabel(data.formData.demoType)}
      Date: ${data.formData.preferredDate}
      Time: ${data.formData.preferredTime}
      Timezone: ${data.formData.timezone}
      Attendees: ${data.formData.attendees}
      ${data.formData.goals ? `Goals: ${data.formData.goals}` : ""}
      `
          : ""
      }

      ${
        isContactSales && data.formData.message
          ? `
      ──────────────────────
      MESSAGE
      ──────────────────────
      ${data.formData.message}
      `
          : ""
      }

      ──────────────────────
      ACTIONS
      ──────────────────────
      Reply: mailto:${data.formData.email}
      ${isBookDemo && calendarLink ? `Calendar: ${calendarLink}` : ""}
      ${data.formData.phone ? `Call: ${data.formData.phone}` : ""}

      Submission ID: ${Date.now()}
    `,
    };
  },

  paymentSuccess: (data: {
    customerName: string;
    planName: string;
    amount: string;
    date: string;
    transactionId: string;
    downloadLink?: string;
  }) => {
    const {
      customerName,
      planName,
      amount,
      date,
      transactionId,
      downloadLink,
    } = data;
    const appUrl = process.env.PUBLIC_URL || "http://localhost:3000";

    return {
      subject: `🎉 Payment Confirmed - Your ${planName} is now active!`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 560px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: #0f172a;
            padding: 40px 32px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .logo span {
            background: linear-gradient(135deg, #60a5fa, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            padding: 8px 20px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
            border: 1px solid rgba(34, 197, 94, 0.2);
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .greeting-light {
            font-weight: 400;
            color: #64748b;
          }
          .message {
            color: #475569;
            margin-bottom: 32px;
            font-size: 16px;
            line-height: 1.7;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat-card {
            background: #f8fafc;
            border-radius: 20px;
            padding: 20px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #0f172a;
          }
          .stat-note {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .details-card {
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #e2e8f0;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
          }
          .details-row:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }
          .details-label {
            color: #64748b;
            font-size: 15px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .details-label::before {
            content: '•';
            color: #3b82f6;
            font-size: 20px;
            line-height: 1;
          }
          .details-value {
            font-weight: 600;
            color: #0f172a;
            font-size: 15px;
          }
          .amount-large {
            font-size: 32px;
            font-weight: 700;
            color: #3b82f6;
            letter-spacing: -0.5px;
          }
          .chip {
            background: #f1f5f9;
            color: #334155;
            padding: 6px 12px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 500;
            font-family: 'SF Mono', 'Monaco', monospace;
            border: 1px solid #e2e8f0;
          }
          .badge-paid {
            background: #22c55e;
            color: white;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .badge-paid::before {
            content: '✓';
            font-size: 16px;
          }
          .button-primary {
            display: inline-block;
            background: #0f172a;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.2s;
            border: 1px solid #1e293b;
          }
          .button-primary:hover {
            background: #1e293b;
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -10px #0f172a;
          }
          .features {
            background: #f8fafc;
            border-radius: 20px;
            padding: 24px;
            margin: 32px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
          }
          .feature-item::before {
            content: '✨';
            font-size: 16px;
          }
          .footer {
            padding: 32px;
            text-align: center;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
          }
          .footer-links {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-bottom: 16px;
          }
          .footer-links a {
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
          }
          .footer-links a:hover {
            color: #0f172a;
          }
          .copyright {
            color: #94a3b8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              Clario<span>.</span>
            </div>
            <div class="success-badge">
              <span>✅ Payment Successful</span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">
              Hey ${customerName}! <span class="greeting-light">👋</span>
            </div>

            <div class="message">
              Great news! Your payment has been processed and your account is now upgraded to
              <strong style="color: #0f172a;">${planName}</strong>. You're all set to enjoy all premium features.
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Paid</div>
                <div class="stat-value">${amount}</div>
                <div class="stat-note">One-time payment</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Plan Type</div>
                <div class="stat-value">${planName}</div>
                <div class="stat-note">Active now</div>
              </div>
            </div>

            <!-- Transaction Details -->
            <div class="details-card">
              <div class="details-row">
                <span class="details-label">Transaction ID</span>
                <span class="chip">${transactionId}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Date</span>
                <span class="details-value">${date}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Payment Method</span>
                <span class="details-value">Visa •••• 4242</span>
              </div>
              <div class="details-row">
                <span class="details-label">Status</span>
                <span class="badge-paid">Paid</span>
              </div>
            </div>

            <!-- What's Next Section -->
            <div class="features">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">
                🚀 What's next?
              </h3>
              <div class="feature-item">
                <span>Access to all premium features</span>
              </div>
              <div class="feature-item">
                <span>Priority support with 24h response time</span>
              </div>
              <div class="feature-item">
                <span>Unlimited team members and collaborations</span>
              </div>
              <div class="feature-item">
                <span>Advanced security & SSO</span>
              </div>
            </div>

            <!-- Download Receipt Button -->
            ${
              downloadLink
                ? `
              <div style="text-align: center;">
                <a href="${downloadLink}" class="button-primary">
                  📄 Download Receipt (PDF)
                </a>
              </div>
              <p style="text-align: center; color: #64748b; font-size: 14px; margin: 16px 0 0 0;">
                You can also find this receipt in your dashboard
              </p>
            `
                : ""
            }

            <!-- Dashboard Link -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="${appUrl}/dashboard" style="color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 15px;">
                Go to Dashboard →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">=
            <div class="copyright">
              © ${new Date().getFullYear()} Clario. All rights reserved.
            </div>
            <div style="margin-top: 16px; color: #94a3b8; font-size: 12px;">
              123 Innovation Drive, San Francisco, CA 94107
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      🎉 PAYMENT SUCCESSFUL!

      Hey ${customerName},

      Great news! Your payment has been processed and your account is now upgraded to ${planName}.

      ──────────────────────
      TRANSACTION DETAILS
      ──────────────────────
      Amount: ${amount}
      Plan: ${planName}
      Transaction ID: ${transactionId}
      Date: ${date}
      Status: ✓ Paid

      ──────────────────────
      WHAT'S NEXT?
      ──────────────────────
      • Access to all premium features
      • Priority support with 24h response time
      • Unlimited team members and collaborations
      • Advanced security & SSO

      ${downloadLink ? `Download your receipt: ${downloadLink}` : ""}

      Dashboard: ${appUrl}/dashboard

      ──────────────────────
      Clario - ${appUrl}
      support@clario.com
    `,
    };
  },
};
