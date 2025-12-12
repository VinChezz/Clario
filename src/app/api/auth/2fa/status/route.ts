import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json(
        {
          isEnabled: false,
          method: null,
          error: "No user found",
        },
        { status: 401 }
      );
    }

    console.log("🔐 Checking 2FA status for:", user.email);

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { userSecurity: true },
    });

    if (!dbUser) {
      console.log("⚠️ User not found in database");
      return NextResponse.json(
        {
          isEnabled: false,
          method: null,
          error: "User not found in database",
        },
        { status: 404 }
      );
    }

    if (!dbUser.userSecurity) {
      console.log("⚠️ No security record found");
      return NextResponse.json({
        isEnabled: false,
        method: null,
      });
    }

    const is2FAEnabled = dbUser.userSecurity.isTwoFactorEnabled;
    const method = dbUser.userSecurity.twoFactorMethod?.toLowerCase() || null;

    console.log("📋 2FA Status:", {
      isEnabled: is2FAEnabled,
      method: method,
      userId: dbUser.id,
    });

    return NextResponse.json({
      isEnabled: is2FAEnabled,
      method: method,
    });
  } catch (error) {
    console.error("❌ Error checking 2FA status:", error);
    return NextResponse.json(
      {
        isEnabled: false,
        method: null,
        error: "Failed to check 2FA status",
      },
      { status: 500 }
    );
  }
}
