import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = kindeUser.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    console.log("🔐 Setting up TOTP for user:", userEmail);

    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!dbUser) {
      console.log("❌ User not found in database:", userEmail);
      return NextResponse.json(
        { error: "User not found in database. Please create profile first." },
        { status: 404 }
      );
    }

    console.log("✅ Found user in database:", dbUser.id);

    const secret = authenticator.generateSecret();
    const appName = "Clario";
    const identifier = userEmail;
    const otpauth = authenticator.keyuri(identifier, appName, secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    await prisma.userSecurity.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        tempTotpSecret: secret,
        tempTotpExpires: new Date(Date.now() + 10 * 60 * 1000),
        backupCodes: [],
        isTwoFactorEnabled: false,
        twoFactorMethod: null,
      },
      update: {
        tempTotpSecret: secret,
        tempTotpExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    console.log("✅ TOTP setup saved for user:", dbUser.id);

    return NextResponse.json({
      qrCode,
      secret,
      otpauth,
      identifier,
      appName,
    });
  } catch (error) {
    console.error("❌ TOTP setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup TOTP", details: String(error) },
      { status: 500 }
    );
  }
}
