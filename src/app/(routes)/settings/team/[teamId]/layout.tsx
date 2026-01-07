import { TeamStorageProvider } from "@/app/_context/TeamStorageContext";
import NotFound from "@/app/not-found";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import React from "react";

export default async function TeamSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  const session = await getKindeServerSession();
  const user = await session?.getUser();
  const userId = user?.id;

  const isMember = team?.members.some((m) => m.userId === userId);

  if (!team || !isMember) {
    return <NotFound />;
  }

  return (
    <TeamStorageProvider teamId={teamId}>
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-10">{children}</div>
    </TeamStorageProvider>
  );
}
