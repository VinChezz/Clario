import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("🔍 API Teams - User:", user?.email);

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      console.log("ℹ️ User not found in database, returning empty teams");
      return NextResponse.json([]);
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { createdById: dbUser.id },
          { members: { some: { userId: dbUser.id } } },
        ],
      },
      include: {
        _count: {
          select: { members: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("✅ Teams found:", teams.length);
    return NextResponse.json(teams);
  } catch (error: any) {
    console.error("❌ API Teams Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    try {
      let dbUser = await prisma.user.findUnique({
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
      }

      const team = await prisma.team.create({
        data: {
          name: trimmedName,
          createdById: dbUser.id,
          members: {
            create: {
              userId: dbUser.id,
              role: "ADMIN",
            },
          },
        },
        include: {
          _count: { select: { members: true } },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      return NextResponse.json(team);
    } catch (dbError: any) {
      console.error("❌ Database error:", dbError);

      if (dbError.code === "P1001") {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create team due to database issues" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Create team error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
