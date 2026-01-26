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

  bookDemo: (data: any, calendarLink: string) => {
    const appUrl = process.env.APP_URL || "http://localhost:3000";

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
          .calendar-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 10px; border: 1px solid #86efac; }
          .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .meet-note { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin: 15px 0; color: #92400e; }
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
            <div class="calendar-badge">📅 Add to Google Calendar</div>
            <h3>Save Your Demo Appointment</h3>

            <div class="details-box">
              <p><strong>Calendar Link:</strong> <a href="${calendarLink}" style="color: #059669; font-weight: bold;">${calendarLink}</a></p>
              <p style="margin-top: 8px; color: #3b82f6;">
                ✅ Click to add this event to your Google Calendar
              </p>
            </div>

            <a href="${calendarLink}" class="button" style="background: #059669; font-size: 16px;">
              📅 Add to Google Calendar
            </a>

            <div class="meet-note">
              <p style="color:#92400e; margin:0; font-weight:600;">💡 Google Meet Information</p>
              <p style="color:#92400e; margin:8px 0 0 0; font-size:14px;">
                • Google will automatically generate a Meet link when you save this event
              </p>
              <p style="color:#92400e; margin:4px 0 0 0; font-size:14px;">
                • The Meet link will appear in the calendar event details
              </p>
              <p style="color:#92400e; margin:4px 0 0 0; font-size:14px;">
                • Simply click the event in your calendar to join the meeting
              </p>
            </div>

            <div class="info-box">
              <p><strong>💡 How to join the demo:</strong></p>
              <ol style="margin: 8px 0; padding-left: 20px;">
                <li>Click "Add to Google Calendar" above</li>
                <li>Save the event to your calendar</li>
                <li>Google will automatically add a Meet link</li>
                <li>Join the meeting from your calendar at the scheduled time</li>
              </ol>
            </div>
          </div>

          <div class="card">
            <h3>📋 Preparation Checklist</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>✅ Test your microphone and camera</li>
              <li>✅ Have a stable internet connection</li>
              <li>✅ Prepare questions about your workflow</li>
              <li>✅ Invite your team members if needed</li>
              <li>✅ Add this event to your calendar</li>
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

        📅 ADD TO CALENDAR
        Calendar Link: ${calendarLink}

        💡 GOOGLE MEET INFORMATION
        • Google will automatically generate a Meet link when you save this event
        • The Meet link will appear in the calendar event details
        • Simply click the event in your calendar to join the meeting

        📋 HOW TO JOIN:
        1. Click the calendar link above
        2. Save the event to your Google Calendar
        3. Google will automatically add a Meet link
        4. Join the meeting from your calendar at the scheduled time

        📋 PREPARATION CHECKLIST
        • Test your microphone and camera
        • Have a stable internet connection
        • Prepare questions about your workflow
        • Invite your team members if needed
        • Add this event to your calendar

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
      calendarLink: calendarLink,
    };
  },

  adminNotification: (data: any, calendarLink?: string) => {
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
          .calendar-info { background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .meet-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 10px; margin: 10px 0; color: #856404; }
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
            <div class="calendar-info">
              <h4>📅 Google Calendar Event</h4>
              <p><strong>Calendar Link:</strong> <a href="${calendarLink}">${calendarLink}</a></p>
              <p><strong>Action Required:</strong> You need to create the Google Meet manually</p>

              <div class="meet-note">
                <p><strong>💡 Important Note:</strong></p>
                <p>Client was instructed to:</p>
                <ol style="margin: 5px 0; padding-left: 20px;">
                  <li>Add the event to their Google Calendar</li>
                  <li>Google will automatically generate a Meet link</li>
                  <li>They will join from their calendar</li>
                </ol>
                <p><strong>You should:</strong></p>
                <ol style="margin: 5px 0; padding-left: 20px;">
                  <li>Create your own Google Meet for this demo</li>
                  <li>Or wait for client to share their calendar event</li>
                </ol>
              </div>
            </div>

            <h3>📅 Demo Details:</h3>
            <div class="highlight">
              <p><strong>Demo Type:</strong> ${getDemoTypeLabel(data.formData.demoType)}</p>
              <p><strong>Scheduled Date:</strong> ${data.formData.preferredDate}</p>
              <p><strong>Scheduled Time:</strong> ${data.formData.preferredTime}</p>
              <p><strong>Timezone:</strong> ${data.formData.timezone}</p>
              <p><strong>Duration:</strong> ${getDemoDuration(data.formData.demoType)}</p>
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
              data.type === "book-demo" && calendarLink
                ? `<a href="${calendarLink}" class="button" style="background: #10b981;">📅 View Calendar</a>`
                : ""
            }
            <a href="tel:${data.formData.phone || ""}" class="button" style="background: #8b5cf6;">📞 Call Customer</a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p><strong>Submission ID:</strong> ${Date.now()}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Meet Status:</strong> Client will get Meet from Google Calendar</p>
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
      Demo Details:
      Demo Type: ${getDemoTypeLabel(data.formData.demoType)}
      Scheduled Date: ${data.formData.preferredDate}
      Scheduled Time: ${data.formData.preferredTime}
      Timezone: ${data.formData.timezone}
      Duration: ${getDemoDuration(data.formData.demoType)}
      Attendees: ${data.formData.attendees}
      Goals: ${data.formData.goals || "Not specified"}

      Calendar Information:
      Calendar Link: ${calendarLink}

      IMPORTANT NOTE:
      Client was instructed to:
      1. Add the event to their Google Calendar
      2. Google will automatically generate a Meet link
      3. They will join from their calendar

      You should:
      1. Create your own Google Meet for this demo
      2. Or wait for client to share their calendar event
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
      Meet Status: Client will get Meet from Google Calendar

      ---
      Clario Admin System
    `,
    };
  },
};
