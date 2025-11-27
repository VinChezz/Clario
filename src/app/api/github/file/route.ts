import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const path = searchParams.get("path");
    const branch = searchParams.get("branch") || "main";

    if (!teamId || !path) {
      return NextResponse.json(
        { error: "Team ID and path required" },
        { status: 400 }
      );
    }

    const githubRepo = await prisma.githubRepository.findUnique({
      where: { teamId },
    });

    if (!githubRepo) {
      return NextResponse.json(
        { error: "No GitHub repository connected" },
        { status: 404 }
      );
    }

    const { owner, repo } = githubRepo;
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(fileUrl, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: "File not found or inaccessible" },
        { status: 404 }
      );
    }

    const data = await response.json();

    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return NextResponse.json({
      success: true,
      content,
      size: data.size,
      sha: data.sha,
    });
  } catch (error: any) {
    console.error("GitHub file fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch file" },
      { status: 500 }
    );
  }
}
