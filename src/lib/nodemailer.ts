import nodemailer from "nodemailer";

export function createTransporter() {
  console.log("📧 Nodemailer configuration:", {
    nodeEnv: process.env.NODE_ENV,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER ? "***" : "not set",
    smtpFrom: process.env.SMTP_FROM,
  });

  if (process.env.NODE_ENV === "development") {
    console.log("🛠️ Using Ethereal test email");
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.error("❌ SMTP connection error:", error);
    } else {
      console.log("✅ SMTP server is ready to take messages");
    }
  });

  return transporter;
}

export const transporter = createTransporter();
