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

export function generateGoogleMeetLink(): { link: string; meetingId: string } {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const parts = [3, 4, 3];

  const meetingId = parts
    .map((length) => {
      let part = "";
      for (let i = 0; i < length; i++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return part;
    })
    .join("-");

  return {
    link: `https://meet.google.com/${meetingId}`,
    meetingId: meetingId,
  };
}

export function createCalendarLink(data: any, meetLink: string): string {
  const startTime = new Date(`${data.preferredDate}T${data.preferredTime}:00`);
  const endTime = new Date(startTime.getTime() + 45 * 60000); // 45 минут

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
      • Goals: ${data.goals || "Not specified"}

      Join Google Meet: ${meetLink}
      Meeting ID: ${meetLink.split("/").pop()}
    `.trim(),
    location: meetLink,
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
        /https:\/\/meet\.google\.com\/[a-z0-9-]+/,
      );
      if (match) {
        console.log("🎥 Generated Google Meet Link:", match[0]);
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
  contactSales: (data: any) => ({
    subject: `Thank you for contacting Clario Sales Team - ${data.company}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { color: #667eea; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .contact-info { background: white; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank You, ${data.firstName}!</h1>
          <p>We've received your inquiry</p>
        </div>
        <div class="content">
          <p>Dear <span class="highlight">${data.firstName} ${data.lastName}</span>,</p>

          <p>Thank you for reaching out to our Sales Team at <span class="highlight">${data.company}</span>. We're excited to learn more about your needs and how we can help you succeed.</p>

          <h3>What happens next?</h3>
          <ul>
            <li>Our sales representative will contact you within <span class="highlight">24 hours</span></li>
            <li>We'll schedule a personalized consultation at your convenience</li>
            <li>You'll receive tailored solutions based on your requirements</li>
          </ul>

          <h3>Your Inquiry Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.company}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Company Size:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.companySize}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Help Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.helpType}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.message}</td></tr>
          </table>

          <div class="contact-info">
            <h3>📞 Our Contact Information</h3>
            <p><strong>Email:</strong> clario-sales@clario.com</p>
            <p><strong>Phone:</strong> +1 (888) 123-4567 (Mon-Fri, 9am-6pm EST)</p>
            <p><strong>Address:</strong> 123 Innovation Drive, San Francisco, CA 94107</p>
            <p><strong>Emergency Support:</strong> +1 (888) 999-0000 (24/7)</p>
          </div>

          <h3>🔗 Quick Links:</h3>
          <p style="margin-top: 30px;">
            <a href="http://localhost:3000/book-demo"
              style="
                background:#111827;
                color:#ffffff;
                padding:12px 22px;
                border-radius:6px;
                text-decoration:none;
                font-weight:600;
                display:inline-block;
              ">
              📅 Book Another Demo
            </a>

            <a href="http://localhost:3000/pricing"
              style="
                background:#10b981;
                color:#ffffff;
                padding:12px 22px;
                border-radius:6px;
                text-decoration:none;
                font-weight:600;
                display:inline-block;
                margin-left:10px;
              ">
              💲 View Pricing
            </a>
          </p>

          <div class="footer">
            <p>Best regards,<br>The Sales Team<br>Clario</p>
            <p>Email: clario-sales@clario.com<br>Phone: +1 (888) 123-4567</p>
            <p style="font-size: 10px; color: #999;">
              This email was sent to ${data.email}. If you didn't request this, please ignore this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Thank you for contacting our Sales Team!

Dear ${data.firstName} ${data.lastName},

Thank you for reaching out to our Sales Team at ${data.company}.
We're excited to learn more about your needs and how we can help you succeed.

What happens next?
- Our sales representative will contact you within 24 hours
- We'll schedule a personalized consultation at your convenience
- You'll receive tailored solutions based on your requirements

Your Inquiry Details:
Company: ${data.company}
Company Size: ${data.companySize}
Help Type: ${data.helpType}
Message: ${data.message}

Our Contact Information:
Email: clario-sales@clario.com
Phone: +1 (888) 123-4567 (Mon-Fri, 9am-6pm EST)
Address: 123 Innovation Drive, San Francisco, CA 94107
Emergency Support: +1 (888) 999-0000 (24/7)

Quick Links:
- Book Another Demo: http://localhost:3000/book-demo
- View Pricing: http://localhost:3000/pricing

Best regards,
The Sales Team
Clario
    `,
  }),

  bookDemo: (data: any) => {
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const meetInfo = generateGoogleMeetLink();
    const calendarLink = createCalendarLink(data, meetInfo.link);

    return {
      subject: `Your Clario Demo Confirmation — ${getDemoTypeLabel(data.demoType)}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { color: #059669; font-weight: bold; }
          .card { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px; margin: 15px 0; }
          .meeting-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 10px; border: 1px solid #86efac; }
          .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>

        <div class="header">
          <h1>Demo Confirmed 🎉</h1>
          <p>Your Clario demo is scheduled</p>
        </div>

        <div class="content">
          <p>Hi <span class="highlight">${data.firstName}</span>,</p>

          <p>
            Your demo has been successfully scheduled.
            We're excited to show how <strong>Clario</strong> can help
            <span class="highlight">${data.company}</span>.
          </p>

          <div class="card">
            <h3>📅 Demo Details</h3>
            <table width="100%" style="border-collapse: collapse;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(data.preferredDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.preferredTime} (${data.timezone})</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${getDemoTypeLabel(data.demoType)}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Duration:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${getDemoDuration(data.demoType)}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Attendees:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.attendees}</td></tr>
              <tr><td style="padding: 8px 0;"><strong>Host:</strong></td><td style="padding: 8px 0;">Alex Morgan — Senior Solutions Engineer</td></tr>
            </table>
          </div>

          <div class="card">
            <div class="meeting-badge">🎥 Live Google Meet Meeting</div>
            <h3>Join the Demo Now</h3>

            <div class="details-box">
              <p><strong>Meeting Link:</strong> <a href="${meetInfo.link}" style="color: #059669; font-weight: bold;">${meetInfo.link}</a></p>
              <p style="margin-top: 8px; color: #3b82f6;">
                📅 <a href="${calendarLink}" style="color: #3b82f6;">Add to Google Calendar</a>
              </p>
            </div>

            <a href="${meetInfo.link}" class="button" style="background: #059669; font-size: 16px;">
              🚀 Join Demo Meeting
            </a>

            <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:8px; padding:12px; margin:12px 0;">
              <p style="color:#92400e; margin:0; font-weight:600;">💡 Important Information</p>
              <p style="color:#92400e; margin:4px 0 0 0; font-size:14px;">
                • Meeting ID: <code>${meetInfo.meetingId}</code>
              </p>
              <p style="color:#92400e; margin:4px 0 0 0; font-size:14px;">
                • Click "Add to Google Calendar" above to save the event
              </p>
              <p style="color:#92400e; margin:4px 0 0 0; font-size:14px;">
                • Host will join 5 minutes before scheduled time
              </p>
            </div>

            <div class="info-box">
              <p><strong>💡 How to join:</strong></p>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Click the button above or the meeting link</li>
                <li>Join 5 minutes before the scheduled time</li>
                <li>Test your microphone and camera beforehand</li>
                <li>Save this email with meeting details</li>
              </ul>
            </div>
          </div>

          <div class="card">
            <h3>📋 Preparation Checklist</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>✅ Test your microphone and camera</li>
              <li>✅ Have a stable internet connection</li>
              <li>✅ Prepare questions about your workflow</li>
              <li>✅ Invite your team members if needed</li>
              <li>✅ Save this email with meeting details</li>
            </ul>
          </div>

          <div class="card">
            <h3>📞 Need to reschedule?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Reply to this email at least 24 hours in advance</li>
              <li>Call us at +1 (555) 987-6543</li>
              <li>Visit: <a href="${appUrl}/book-demo">Reschedule Demo</a></li>
            </ul>
          </div>

          <h3>⚡ Quick links</h3>
          <p style="margin: 20px 0;">
            <a href="${appUrl}/contact-sales"
              style="
                background:#4f46e5;
                color:#ffffff;
                padding:12px 22px;
                border-radius:6px;
                text-decoration:none;
                font-weight:600;
                display:inline-block;
              ">
              Contact Sales
            </a>

            <a href="${appUrl}/pricing"
              style="
                background:#f3f4f6;
                color:#111827;
                padding:12px 22px;
                border-radius:6px;
                text-decoration:none;
                font-weight:600;
                display:inline-block;
                margin-left:10px;
                border:1px solid #e5e7eb;
              ">
              View Pricing
            </a>
          </p>

          <div class="footer">
            <p style="margin: 5px 0;">
              Best regards,<br />
              <strong>Alex Morgan</strong><br />
              Senior Solutions Engineer — Clario
            </p>
            <p style="margin: 5px 0;">
              📧 <a href="mailto:demo@clario.com">demo@clario.com</a><br />
              📞 +1 (555) 987-6543 (Mon-Fri, 9am-6pm EST)
            </p>
            <p style="font-size:10px;color:#999; margin-top: 20px;">
              This email was sent to ${data.email}
            </p>
          </div>
        </div>

      </body>
      </html>
      `,
      text: `
        DEMO CONFIRMED 🎉

        Hi ${data.firstName},

        Your Clario demo has been successfully scheduled.

        📅 DEMO DETAILS
        Date: ${new Date(data.preferredDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        Time: ${data.preferredTime} (${data.timezone})
        Type: ${getDemoTypeLabel(data.demoType)}
        Duration: ${getDemoDuration(data.demoType)}
        Attendees: ${data.attendees}
        Host: Alex Morgan — Senior Solutions Engineer

        🎥 JOIN THE DEMO
        Meeting Link: ${meetInfo.link}
        Meeting ID: ${meetInfo.meetingId}
        Add to Calendar: ${calendarLink}

        💡 IMPORTANT
        • Click the calendar link above to save the event
        • Host will join 5 minutes before scheduled time
        • Test your microphone and camera beforehand

        📋 PREPARATION CHECKLIST
        • Test your microphone and camera
        • Have a stable internet connection
        • Prepare questions about your workflow
        • Invite your team members if needed
        • Save this email with meeting details

        📞 NEED TO RESCHEDULE?
        • Reply to this email at least 24 hours in advance
        • Call us at +1 (555) 987-6543
        • Visit: ${appUrl}/book-demo

        ⚡ QUICK LINKS
        View Pricing: ${appUrl}/pricing
        Contact Sales: ${appUrl}/contact-sales

        Best regards,
        Alex Morgan
        Senior Solutions Engineer — Clario
        demo@clario.com
        +1 (555) 987-6543

        This email was sent to ${data.email}
      `,
    };
  },

  adminNotification: (data: any) => {
    const meetInfo = generateGoogleMeetLink();

    return {
      subject: `New ${data.type} Submission - ${data.formData.company}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f0f0f0; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
          .highlight { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px; }
          .meeting-info { background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>New ${data.type === "contact-sales" ? "Sales Inquiry" : "Demo Request"}</h2>
          <p>Submitted at ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
          <h3>👤 Contact Information:</h3>
          <div class="highlight">
            <p><strong>Name:</strong> ${data.formData.firstName} ${data.formData.lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.formData.email}">${data.formData.email}</a></p>
            <p><strong>Company:</strong> ${data.formData.company}</p>
            <p><strong>Phone:</strong> ${data.formData.phone || "Not provided"}</p>
          </div>

          ${
            data.type === "book-demo"
              ? `
            <div class="meeting-info">
              <h4>🎥 Google Meet Generated</h4>
              <p><strong>Meeting Link:</strong> <a href="${meetInfo.link}">${meetInfo.link}</a></p>
              <p><strong>Meeting ID:</strong> ${meetInfo.meetingId}</p>
              <p><strong>Action Required:</strong> Please join the meeting as host 5 minutes before scheduled time</p>
            </div>

            <h3>📅 Demo Details:</h3>
            <div class="highlight">
              <p><strong>Demo Type:</strong> ${data.formData.demoType}</p>
              <p><strong>Scheduled Date:</strong> ${data.formData.preferredDate}</p>
              <p><strong>Scheduled Time:</strong> ${data.formData.preferredTime}</p>
              <p><strong>Timezone:</strong> ${data.formData.timezone}</p>
              <p><strong>Attendees:</strong> ${data.formData.attendees}</p>
              <p><strong>Goals:</strong> ${data.formData.goals || "Not specified"}</p>
            </div>
          `
              : data.type === "contact-sales"
                ? `
            <h3>📝 Inquiry Details:</h3>
            <div class="highlight">
              <p><strong>Help Type:</strong> ${data.formData.helpType}</p>
              <p><strong>Company Size:</strong> ${data.formData.companySize}</p>
              <p><strong>Country:</strong> ${data.formData.country}</p>
              <p><strong>Message:</strong> ${data.formData.message}</p>
            </div>
          `
                : ""
          }

          <h3>🚀 Quick Actions:</h3>
          <div>
            <a href="mailto:${data.formData.email}" class="button">✉️ Reply via Email</a>
            ${
              data.type === "book-demo"
                ? `<a href="${meetInfo.link}" class="button" style="background: #10b981;">✅ Join Meeting</a>`
                : ""
            }
            <a href="tel:${data.formData.phone || ""}" class="button" style="background: #8b5cf6;">📞 Call Customer</a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p><strong>Submission ID:</strong> ${Date.now()}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      New ${data.type === "contact-sales" ? "Sales Inquiry" : "Demo Request"}

      Contact Information:
      Name: ${data.formData.firstName} ${data.formData.lastName}
      Email: ${data.formData.email}
      Company: ${data.formData.company}
      Phone: ${data.formData.phone || "Not provided"}

      ${
        data.type === "book-demo"
          ? `
      Meeting Details:
      Google Meet Link: ${meetInfo.link}
      Meeting ID: ${meetInfo.meetingId}
      Action: Host needs to join 5 minutes before scheduled time

      Demo Details:
      Demo Type: ${data.formData.demoType}
      Scheduled Date: ${data.formData.preferredDate}
      Scheduled Time: ${data.formData.preferredTime}
      Timezone: ${data.formData.timezone}
      Attendees: ${data.formData.attendees}
      Goals: ${data.formData.goals || "Not specified"}
      `
          : data.type === "contact-sales"
            ? `
      Inquiry Details:
      Help Type: ${data.formData.helpType}
      Company Size: ${data.formData.companySize}
      Country: ${data.formData.country}
      Message: ${data.formData.message}
      `
            : ""
      }

      Submission ID: ${Date.now()}
      Timestamp: ${new Date().toLocaleString()}

      ---
      Clario Admin System
    `,
    };
  },
};
