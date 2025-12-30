import { TeamStorageProvider } from "@/app/_context/TeamStorageContext";
import React from "react";

export default function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { teamId: string };
}) {
  return (
    <TeamStorageProvider teamId={params.teamId}>
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-10">{children}</div>
    </TeamStorageProvider>
  );
}
