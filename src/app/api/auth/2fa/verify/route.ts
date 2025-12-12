import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { authenticator } from "otplib";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, method = "email" } = await req.json();

    if (!code) {
      console.log("ERROR: No code provided");
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      console.log("ERROR: Code not 6 digits");
      return NextResponse.json(
        { error: "Code must be a 6-digit number" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      include: { userSecurity: true },
    });

    console.log("User found:", user?.id);

    if (!user) {
      console.log("ERROR: User not found");
      return NextResponse.json(
        {
          error: "User not found. Please complete your profile first.",
          email: kindeUser.email,
        },
        { status: 404 }
      );
    }

    let security = user.userSecurity;
    if (!security) {
      console.log("WARNING: No security record found, creating one");

      security = await prisma.userSecurity.create({
        data: {
          userId: user.id,
          tempCode: null,
          tempExpires: null,
          tempTotpSecret: null,
          tempTotpExpires: null,
          backupCodes: [],
          isTwoFactorEnabled: false,
        },
      });

      console.log("Created security record:", security.id);
    }

    console.log("Security record found:", {
      id: security.id,
      hasTempCode: !!security.tempCode,
      hasTempTotpSecret: !!security.tempTotpSecret,
      tempExpires: security.tempExpires,
      tempTotpExpires: security.tempTotpExpires,
    });

    let isValid = false;

    if (method === "email") {
      console.log("Processing EMAIL verification...");

      if (!security.tempCode || !security.tempExpires) {
        console.log("ERROR: No temp code or expires date for email");
        return NextResponse.json(
          { error: "Verification code not sent. Please request a new code." },
          { status: 400 }
        );
      }

      if (security.tempExpires < new Date()) {
        console.log("ERROR: Email code expired");
        return NextResponse.json(
          {
            error: "Verification code has expired. Please request a new code.",
          },
          { status: 400 }
        );
      }

      if (security.tempCode !== code) {
        console.log(
          `ERROR: Email code mismatch: input "${code}" vs stored "${security.tempCode}"`
        );
        return NextResponse.json(
          { error: "Invalid verification code. Please try again." },
          { status: 400 }
        );
      }

      isValid = true;
      console.log("✅ Email code verification successful!");
    } else if (method === "totp") {
      console.log("Processing TOTP verification...");

      if (!security.tempTotpSecret || !security.tempTotpExpires) {
        console.log("ERROR: No TOTP setup found");
        return NextResponse.json(
          { error: "TOTP setup not completed. Please scan QR code first." },
          { status: 400 }
        );
      }

      if (security.tempTotpExpires < new Date()) {
        console.log("ERROR: TOTP setup expired");
        return NextResponse.json(
          { error: "TOTP setup session expired. Please start over." },
          { status: 400 }
        );
      }

      try {
        isValid = authenticator.verify({
          token: code,
          secret: security.tempTotpSecret,
        });

        if (!isValid) {
          console.log("ERROR: TOTP code invalid");
          return NextResponse.json(
            { error: "Invalid verification code. Please try again." },
            { status: 400 }
          );
        }

        console.log("✅ TOTP code verification successful!");
      } catch (error) {
        console.error("TOTP verification error:", error);
        return NextResponse.json(
          { error: "Failed to verify TOTP code" },
          { status: 400 }
        );
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification method" },
        { status: 400 }
      );
    }

    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        isTwoFactorEnabled: true,
        twoFactorSecret: method === "totp" ? security.tempTotpSecret : null,
        tempCode: null,
        tempExpires: null,
        tempTotpSecret: null,
        tempTotpExpires: null,
        backupCodes,
        twoFactorMethod: method,
      },
    });

    console.log("✅ 2FA enabled successfully for user:", user.email);
    console.log("Method:", method);
    console.log("Generated backup codes:", backupCodes);

    const response = NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
      backupCodes,
      method,
    });

    response.cookies.set({
      name: "2fa_verified",
      value: "true",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("❌ 2FA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
