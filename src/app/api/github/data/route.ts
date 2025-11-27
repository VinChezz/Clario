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
    const type = searchParams.get("type");

    if (!teamId) {
      return NextResponse.json({ error: "Team ID required" }, { status: 400 });
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
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    let data;

    switch (type) {
      case "branches":
        const branchesResponse = await fetch(
          `${baseUrl}/branches?per_page=100`,
          {
            headers,
          }
        );
        data = await branchesResponse.json();
        break;

      case "issues":
        const issuesResponse = await fetch(
          `${baseUrl}/issues?state=all&per_page=50`,
          {
            headers,
          }
        );
        const issuesData = await issuesResponse.json();
        data = issuesData.filter((issue: any) => !issue.pull_request);
        break;

      case "pulls":
        const pullsResponse = await fetch(
          `${baseUrl}/pulls?state=all&per_page=50`,
          {
            headers,
          }
        );
        data = await pullsResponse.json();
        break;

      case "readme":
        const readmeResponse = await fetch(`${baseUrl}/readme`, {
          headers: {
            ...headers,
            Accept: "application/vnd.github.v3.raw",
          },
        });

        if (readmeResponse.ok) {
          const readmeText = await readmeResponse.text();
          data = { content: readmeText };
        } else {
          data = { content: null, error: "README not found" };
        }
        break;

      case "tree":
        const branch = searchParams.get("branch") || "master";
        const treeResponse = await fetch(
          `${baseUrl}/git/trees/${branch}?recursive=1`,
          {
            headers,
          }
        );

        if (treeResponse.ok) {
          data = await treeResponse.json();
        } else {
          const mainResponse = await fetch(
            `${baseUrl}/git/trees/main?recursive=1`,
            {
              headers,
            }
          );
          data = await mainResponse.json();
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }

    await prisma.githubRepository.update({
      where: { teamId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      type,
      data,
    });
  } catch (error: any) {
    console.error("GitHub data fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}
