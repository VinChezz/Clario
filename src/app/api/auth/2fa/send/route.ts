import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { generateOTP, sendOTPEmail } from "@/lib/2fa";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== 2FA SEND START ===");
    console.log("Kinde user email:", kindeUser.email);

    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
    });

    console.log("User found:", user?.id);

    if (!user) {
      console.log("ERROR: User not found in database");
      return NextResponse.json(
        {
          error: "User not found. Please complete your profile first.",
          email: kindeUser.email,
        },
        { status: 404 }
      );
    }

    const code = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    console.log("Generated code:", code);
    console.log("Expires at:", expires);
    console.log("Current time:", new Date());

    const security = await prisma.userSecurity.upsert({
      where: { userId: user.id },
      update: {
        tempCode: code,
        tempExpires: expires,
      },
      create: {
        userId: user.id,
        tempCode: code,
        tempExpires: expires,
        backupCodes: [],
        isTwoFactorEnabled: false,
      },
    });

    console.log("Security record updated:", {
      id: security.id,
      tempCode: security.tempCode,
      tempExpires: security.tempExpires,
    });

    const verifyRecord = await prisma.userSecurity.findUnique({
      where: { userId: user.id },
    });

    console.log("Verification check:", {
      storedCode: verifyRecord?.tempCode,
      storedExpires: verifyRecord?.tempExpires,
    });

    try {
      console.log("Sending email via Nodemailer to:", user.email);
      await sendOTPEmail(user.email, code);
      console.log("✅ Email sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send email via Nodemailer:", emailError);
      return NextResponse.json(
        {
          error: "Failed to send email. Please try again.",
          details:
            process.env.NODE_ENV === "development"
              ? String(emailError)
              : undefined,
        },
        { status: 500 }
      );
    }

    console.log("=== 2FA SEND COMPLETE ===");

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      debug: {
        code: process.env.NODE_ENV === "development" ? code : undefined,
        expires: expires.toISOString(),
      },
    });
  } catch (e) {
    console.error("❌ Error in /api/auth/2fa/send:", e);
    return NextResponse.json(
      {
        error: "Failed to send verification code",
        details: process.env.NODE_ENV === "development" ? String(e) : undefined,
      },
      { status: 500 }
    );
  }
}
