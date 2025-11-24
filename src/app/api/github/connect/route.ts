import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, teamId } = await req.json();

    if (!owner || !repo || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const githubResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!githubResponse.ok) {
      return NextResponse.json(
        { error: "Repository not found or inaccessible" },
        { status: 404 }
      );
    }

    const fullUrl = `https://github.com/${owner}/${repo}`;

    const githubRepo = await prisma.githubRepository.upsert({
      where: { teamId },
      update: {
        owner,
        repo,
        fullUrl,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        teamId,
        owner,
        repo,
        fullUrl,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: githubRepo,
    });
  } catch (error: any) {
    console.error("GitHub connect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect repository" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    const githubRepo = await prisma.githubRepository.findUnique({
      where: { teamId },
    });

    return NextResponse.json({
      success: true,
      data: githubRepo,
      connected: !!githubRepo,
    });
  } catch (error: any) {
    console.error("GitHub fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch repository" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    await prisma.githubRepository.delete({
      where: { teamId },
    });

    return NextResponse.json({
      success: true,
      message: "Repository disconnected",
    });
  } catch (error: any) {
    console.error("GitHub disconnect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect repository" },
      { status: 500 }
    );
  }
}
