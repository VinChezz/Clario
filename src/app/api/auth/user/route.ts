import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Getting user data for:", user.email);

    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name:
              user.given_name +
              (user.family_name ? ` ${user.family_name}` : ""),
            image: user.picture,
          },
        });
        console.log("✅ Created new user in database:", dbUser.id);
      }
    } catch (dbError: any) {
      if (dbError.code === "P1001") {
        console.warn("❌ Database unavailable, returning basic user info");
        return NextResponse.json({
          id: user.id,
          email: user.email,
          name:
            user.given_name + (user.family_name ? ` ${user.family_name}` : ""),
          image: user.picture,
        });
      }
      throw dbError;
    }

    console.log("✅ User data loaded successfully");
    return NextResponse.json(dbUser);
  } catch (error: any) {
    console.error("❌ Get user error:", error);

    return NextResponse.json(null);
  }
}
