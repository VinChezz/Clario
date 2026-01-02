export const runtime = "nodejs";

import { getTeamWithSettings } from "@/lib/team";
import { TeamDetailedSettings } from "../_components/TeamSettings";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import NotFound from "@/app/not-found";
import { checkTeamAccess } from "@/lib/teamAccess";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.email) {
    console.log("TeamSettingsPage: No authenticated user or email");
    return <NotFound />;
  }

  const hasAccess = await checkTeamAccess(teamId, user.email);

  if (!hasAccess) {
    console.log("TeamSettingsPage: Access denied for user:", user.email);
    return <NotFound />;
  }

  const team = await getTeamWithSettings(teamId);

  if (!team) {
    return <NotFound />;
  }

  return (
    <div className="space-y-8">
      <TeamDetailedSettings team={team} hasAdminAccess={hasAccess} />
    </div>
  );
}
