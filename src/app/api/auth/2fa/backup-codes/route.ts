import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔑 Generating backup codes for:", kindeUser.email);

    const dbUser = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      include: { userSecurity: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    await prisma.userSecurity.upsert({
      where: { userId: dbUser.id },
      update: {
        backupCodes,
      },
      create: {
        userId: dbUser.id,
        backupCodes,
        isTwoFactorEnabled: false,
      },
    });

    console.log("✅ Backup codes generated for user:", dbUser.email);

    return NextResponse.json({
      success: true,
      codes: backupCodes,
    });
  } catch (error) {
    console.error("❌ Backup codes generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate backup codes" },
      { status: 500 }
    );
  }
}
