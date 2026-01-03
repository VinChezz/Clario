import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { JoinTeamClient } from "./JoinTeamClient";

interface JoinTeamPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function JoinTeamPage({ params }: JoinTeamPageProps) {
  const { token } = await params;
  const { getUser, isAuthenticated } = getKindeServerSession();
  const user = await getUser();
  const authenticated = await isAuthenticated();

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      team: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
      creator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!shareLink) {
    notFound();
  }

  const now = new Date();
  if (shareLink.expiresAt < now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <JoinTeamClient
          status="expired"
          teamName={shareLink.team.name}
          expiresAt={shareLink.expiresAt}
          token={token}
        />
      </div>
    );
  }

  if (shareLink.used) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <JoinTeamClient
          status="used"
          teamName={shareLink.team.name}
          usedAt={shareLink.usedAt}
          token={token}
        />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <JoinTeamClient
          status="unauthenticated"
          teamName={shareLink.team.name}
          teamMembers={shareLink.team._count.members}
          creator={shareLink.creator}
          expiresAt={shareLink.expiresAt}
          permissions={shareLink.permissions}
          token={token}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <JoinTeamClient
        status="authenticated"
        teamName={shareLink.team.name}
        teamMembers={shareLink.team._count.members}
        creator={shareLink.creator}
        expiresAt={shareLink.expiresAt}
        permissions={shareLink.permissions}
        token={token}
        user={{
          name:
            user?.given_name || user?.family_name
              ? `${user?.given_name || ""} ${user?.family_name || ""}`.trim()
              : undefined,
          email: user?.email || "",
        }}
      />
    </div>
  );
}
