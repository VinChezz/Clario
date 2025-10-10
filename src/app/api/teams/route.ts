import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("API Teams GET - User:", {
      id: user?.id,
      email: user?.email,
      name: user?.given_name,
    });

    if (!user || !user.id || !user.email) {
      console.log("API Teams GET - Unauthorized: missing user data");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Находим пользователя в базе по email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    console.log("API Teams GET - DB User found:", !!dbUser);

    if (!dbUser) {
      console.log("API Teams GET - User not found in database");
      return NextResponse.json([], { status: 200 });
    }

    const teams = await prisma.team.findMany({
      where: { createdById: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    console.log("API Teams GET - Teams found:", teams.length);

    return NextResponse.json(teams, { status: 200 });
  } catch (e) {
    console.error("API Teams GET - Error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    console.log("API Teams POST - User:", {
      id: user?.id,
      email: user?.email,
      name: user?.given_name,
    });

    if (!user || !user.id || !user.email) {
      console.log("API Teams POST - Unauthorized: missing user data");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamName } = await req.json();

    if (!teamName || teamName.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Проверяем, не превышает ли пользователь лимит команд
    const userTeamsCount = await prisma.team.count({
      where: { createdById: user.id },
    });

    // Например, ограничим максимум 5 команд на пользователя
    if (userTeamsCount >= 5) {
      return NextResponse.json(
        { error: "Maximum team limit reached (5 teams per user)" },
        { status: 400 }
      );
    }

    const userName =
      user.given_name || user.family_name || user.email.split("@")[0];
    const userImage = user.picture || "";

    // Upsert пользователя по email
    const prismaUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: userName,
        image: userImage,
      },
      create: {
        id: user.id,
        email: user.email,
        name: userName,
        image: userImage,
      },
    });

    // Проверяем, нет ли уже команды с таким именем у этого пользователя
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: teamName,
        createdById: prismaUser.id,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "You already have a team with this name" },
        { status: 400 }
      );
    }

    // Создаём команду
    const team = await prisma.team.create({
      data: {
        name: teamName,
        createdById: prismaUser.id,
      },
    });

    console.log("API Teams POST - Team created:", team.id);

    return NextResponse.json(team, { status: 201 });
  } catch (e) {
    console.error("API Teams POST - Error creating team:", e);

    // Проверяем, является ли ошибка уникальным constraint violation
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Team with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
