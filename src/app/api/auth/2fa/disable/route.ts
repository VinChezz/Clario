import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Disabling 2FA for user:", kindeUser.email);

    const dbUser = await prisma.user.findUnique({
      where: { email: kindeUser.email },
    });

    if (!dbUser) {
      console.log("❌ User not found in database");
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log("✅ Found user in database:", dbUser.id);

    const existingSecurity = await prisma.userSecurity.findUnique({
      where: { userId: dbUser.id },
    });

    if (existingSecurity) {
      await prisma.userSecurity.update({
        where: { userId: dbUser.id },
        data: {
          isTwoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorMethod: null,
          backupCodes: [],
          tempCode: null,
          tempExpires: null,
          tempTotpSecret: null,
          tempTotpExpires: null,
        },
      });
      console.log("✅ Updated existing security record");
    } else {
      await prisma.userSecurity.create({
        data: {
          userId: dbUser.id,
          isTwoFactorEnabled: false,
          backupCodes: [],
        },
      });
      console.log("✅ Created new security record");
    }

    const response = NextResponse.json({ success: true });

    response.cookies.delete("2fa_verified");

    response.cookies.set({
      name: "2fa_verified",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    console.log("✅ 2FA disabled successfully");
    return response;
  } catch (error) {
    console.error("❌ Error disabling 2FA:", error);

    const response = NextResponse.json(
      {
        error: "Failed to disable 2FA",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
    response.cookies.delete("2fa_verified");
    return response;
  }
}
