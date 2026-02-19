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

    const validTypes = [
      "stats",
      "branches",
      "issues",
      "pulls",
      "readme",
      "tree",
    ];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid type parameter: "${type || "undefined"}". Valid types: ${validTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const githubRepo = await prisma.githubRepository.findUnique({
      where: { teamId },
    });

    if (!githubRepo) {
      return NextResponse.json(
        { error: "No GitHub repository connected" },
        { status: 404 },
      );
    }

    const { owner, repo } = githubRepo;
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      console.warn(
        "⚠️ No GITHUB_TOKEN in environment variables. Using unauthenticated requests (rate limited)",
      );
    }

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let data;
    let response;

    try {
      const publicHeaders: HeadersInit = {
        Accept: "application/vnd.github.v3+json",
      };

      switch (type) {
        case "stats":
          if (token) {
            response = await fetch(baseUrl, { headers });
            if (response.ok) {
              data = await response.json();
              break;
            }
          }

          response = await fetch(baseUrl, { headers: publicHeaders });

          if (!response.ok) {
            console.error("❌ Public request failed:", {
              status: response.status,
              statusText: response.statusText,
            });

            if (response.status === 404) {
              throw new Error("Repository not found or is private");
            } else {
              throw new Error(
                `GitHub API error: ${response.status} ${response.statusText}`,
              );
            }
          }
          data = await response.json();
          break;

        case "branches":
          if (token) {
            response = await fetch(`${baseUrl}/branches?per_page=100`, {
              headers,
            });
            if (response.ok) {
              data = await response.json();
              break;
            }
          }

          response = await fetch(`${baseUrl}/branches?per_page=100`, {
            headers: publicHeaders,
          });

          if (!response.ok) {
            console.error("❌ Public request failed:", {
              status: response.status,
              statusText: response.statusText,
            });

            if (response.status === 404) {
              throw new Error("Repository not found or is private");
            } else {
              throw new Error(
                `GitHub API error: ${response.status} ${response.statusText}`,
              );
            }
          }
          data = await response.json();

          if (!Array.isArray(data)) {
            data = [];
          }
          break;

        case "issues":
          if (token) {
            response = await fetch(`${baseUrl}/issues?state=all&per_page=50`, {
              headers,
            });
            if (response.ok) {
              const issuesData = await response.json();
              data = Array.isArray(issuesData)
                ? issuesData.filter((issue: any) => !issue.pull_request)
                : [];
              break;
            }
          }

          response = await fetch(`${baseUrl}/issues?state=all&per_page=50`, {
            headers: publicHeaders,
          });

          if (!response.ok) {
            console.error("❌ Public request failed:", {
              status: response.status,
              statusText: response.statusText,
            });

            if (response.status === 404) {
              throw new Error("Repository not found or is private");
            } else {
              throw new Error(
                `GitHub API error: ${response.status} ${response.statusText}`,
              );
            }
          }
          const issuesData = await response.json();
          data = Array.isArray(issuesData)
            ? issuesData.filter((issue: any) => !issue.pull_request)
            : [];
          break;

        case "pulls":
          if (token) {
            response = await fetch(`${baseUrl}/pulls?state=all&per_page=50`, {
              headers,
            });
            if (response.ok) {
              const pullsData = await response.json();
              data = Array.isArray(pullsData) ? pullsData : [];
              break;
            }
          }

          response = await fetch(`${baseUrl}/pulls?state=all&per_page=50`, {
            headers: publicHeaders,
          });

          if (!response.ok) {
            console.error("❌ Public request failed:", {
              status: response.status,
              statusText: response.statusText,
            });

            if (response.status === 404) {
              throw new Error("Repository not found or is private");
            } else {
              throw new Error(
                `GitHub API error: ${response.status} ${response.statusText}`,
              );
            }
          }
          const pullsData = await response.json();
          data = Array.isArray(pullsData) ? pullsData : [];
          break;

        case "readme":
          const readmeHeaders = {
            ...(token ? headers : publicHeaders),
            Accept: "application/vnd.github.v3.raw",
          };

          response = await fetch(`${baseUrl}/readme`, {
            headers: readmeHeaders,
          });

          if (response.ok) {
            const readmeText = await response.text();
            data = { content: readmeText };
          } else {
            console.error("❌ README request failed:", {
              status: response.status,
              statusText: response.statusText,
            });
            data = { content: null };
          }
          break;

        case "tree":
          const branch = searchParams.get("branch") || "main";

          const branchesToTry = [branch, "main", "master"];
          let treeData = null;

          for (const tryBranch of branchesToTry) {
            try {
              const treeHeaders = token ? headers : publicHeaders;
              response = await fetch(
                `${baseUrl}/git/trees/${tryBranch}?recursive=1`,
                { headers: treeHeaders },
              );

              if (response.ok) {
                treeData = await response.json();
                break;
              }
            } catch (e) {
              console.log(`❌ Failed to fetch tree for branch: ${tryBranch}`);
            }
          }

          if (treeData) {
            data = treeData;
          } else {
            data = { tree: [] };
          }
          break;

        default:
          return NextResponse.json(
            { error: `Unsupported type: ${type}` },
            { status: 400 },
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
    } catch (fetchError: any) {
      console.error(`❌ GitHub API error for ${type}:`, fetchError);

      let fallbackData;
      switch (type) {
        case "stats":
          fallbackData = null;
          break;
        case "branches":
          fallbackData = [];
          break;
        case "issues":
          fallbackData = [];
          break;
        case "pulls":
          fallbackData = [];
          break;
        case "readme":
          fallbackData = { content: null };
          break;
        case "tree":
          fallbackData = { tree: [] };
          break;
        default:
          fallbackData = null;
      }

      return NextResponse.json(
        {
          success: false,
          type,
          data: fallbackData,
          error: fetchError.message,
        },
        { status: 200 },
      );
    }
  } catch (error: any) {
    console.error("❌ GitHub data fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch GitHub data" },
      { status: 500 },
    );
  }
}
