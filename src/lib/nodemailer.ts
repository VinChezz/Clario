import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

const getEmailConfig = (): EmailConfig => {
  const isDev = process.env.NODE_ENV === "development";

  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    from:
      process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@clario.com",
    fromName: process.env.SMTP_FROM_NAME || "Clario Team",
  };

  if (isDev && (!config.auth.user || !config.auth.pass)) {
    console.log("⚠️ Using ethereal.email for development");
  }

  return config;
};

export function createTransporter() {
  const config = getEmailConfig();

  console.log("📧 Nodemailer configuration:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user ? "***" : "not set",
    from: config.from,
    environment: process.env.NODE_ENV,
  });

  const transporterConfig = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: false,
    },
  };

  const transporter = nodemailer.createTransport(transporterConfig);

  if (config.auth.user && config.auth.pass) {
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP connection error:", error);
        if (error.message.includes("Invalid login")) {
          console.error(
            "   → Invalid credentials. Check SMTP_USER and SMTP_PASS",
          );
        } else if (error.message.includes("connect ETIMEDOUT")) {
          console.error(
            "   → Connection timeout. Check SMTP_HOST and SMTP_PORT",
          );
        }
      } else {
        console.log("✅ SMTP server is ready to take messages");
      }
    });
  } else {
    console.warn(
      "⚠️ SMTP credentials not configured. Email sending will fail.",
    );
  }

  return transporter;
}

export const transporter = createTransporter();

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}) {
  const config = getEmailConfig();

  if (!config.auth.user || !config.auth.pass) {
    const links = options.html.match(/https?:\/\/[^\s"<]+/g) || [];
    links.forEach((link, i) => console.log(`Link ${i + 1}:`, link));

    return {
      success: true,
      messageId: "simulated-in-dev",
      simulated: true,
    };
  }

  try {
    const mailOptions = {
      from: `"${config.fromName}" <${config.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      cc: options.cc,
      bcc: options.bcc,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);

    if (error.code === "EAUTH") {
      console.error("   → Authentication failed. Check SMTP credentials.");
    } else if (error.code === "ESOCKET") {
      console.error("   → Socket error. Check network/firewall settings.");
    } else if (error.response) {
      console.error("   → Server response:", error.response);
    }

    throw error;
  }
}

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
