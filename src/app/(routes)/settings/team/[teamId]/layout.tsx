import { TeamStorageProvider } from "@/app/_context/TeamStorageContext";
import React from "react";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <TeamStorageProvider teamId={teamId}>
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-10">{children}</div>
    </TeamStorageProvider>
  );
}
