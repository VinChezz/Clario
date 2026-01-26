import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  emailTemplates,
  createCalendarLink,
} from "@/lib/email/sendEmail";
import { adminEmails } from "@/lib/email/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type, formData } = body;

    if (!to || !type || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let emailContent;
    let calendarLink: string | undefined;

    switch (type) {
      case "contact-sales":
        emailContent = emailTemplates.contactSales(formData);
        break;
      case "book-demo":
        const demoData = {
          ...formData,
          demoTypeLabel:
            formData.demoType === "platform"
              ? "Platform Overview"
              : formData.demoType === "enterprise"
                ? "Enterprise Solution"
                : formData.demoType === "technical"
                  ? "Technical Deep Dive"
                  : "Security & Compliance",
          demoDuration:
            formData.demoType === "platform"
              ? "45 minutes"
              : formData.demoType === "security"
                ? "30 minutes"
                : "60 minutes",
        };

        calendarLink = createCalendarLink(demoData);
        console.log("📅 Generated Calendar Link:", calendarLink);

        emailContent = emailTemplates.bookDemo(demoData, calendarLink);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 },
        );
    }

    const userEmailResult = await sendEmail({
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    try {
      const adminEmailContent = emailTemplates.adminNotification(
        {
          type,
          formData,
        },
        calendarLink,
      );

      await sendEmail({
        to: adminEmails,
        subject: adminEmailContent.subject,
        html: adminEmailContent.html,
        text: adminEmailContent.text,
      });
    } catch (adminError) {
      console.warn("Failed to send admin notification:", adminError);
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      messageId: userEmailResult.messageId,
      calendarLink: calendarLink,
    });
  } catch (error) {
    console.error("Error in send-email API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: errorMessage,
        debug:
          process.env.NODE_ENV === "development"
            ? {
                hasUser: !!process.env.SMTP_USER,
                hasPass: !!process.env.SMTP_PASS,
                from: process.env.SMTP_FROM,
              }
            : undefined,
      },
      { status: 500 },
    );
  }
}
