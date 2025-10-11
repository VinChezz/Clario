import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) return NextResponse.json(null);

    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      try {
        dbUser = await prisma.user.create({
          data: {
            name:
              user.given_name || user.family_name || user.email.split("@")[0],
            email: user.email,
            image: user.picture ?? "",
          },
        });
      } catch (createError) {
        console.warn("❌ Cannot create user in database, returning mock user");
        dbUser = {
          id: "temp-user-id",
          name: user.given_name || user.family_name || user.email.split("@")[0],
          email: user.email,
          image: user.picture ?? "",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("❌ Auth callback error:", error);

    return NextResponse.json(null);
  }
}
