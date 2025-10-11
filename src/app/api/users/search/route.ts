import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    console.log("🔍 Searching users for query:", query);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        NOT: {
          id: user.id,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10,
    });

    console.log("✅ Found users:", users.length);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Search error:", error);

    return NextResponse.json({ users: [] }, { status: 200 });
  }
}
