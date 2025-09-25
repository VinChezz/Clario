import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(req: Request) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamName } = await req.json();

    if (!teamName || teamName.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Upsert пользователя по email
    const prismaUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        id: user.id,
        name: (user as any).name || "",
        image: (user as any).image || "",
      },
      create: {
        id: user.id,
        email: user.email,
        name: (user as any).name || "",
        image: (user as any).image || "",
      },
    });

    // Создаём команду
    const team = await prisma.team.create({
      data: {
        name: teamName,
        createdById: prismaUser.id,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (e) {
    console.error("Error creating team:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
