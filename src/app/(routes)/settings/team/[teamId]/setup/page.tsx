import { AnimatedHeader } from "../_components/AnimatedHeader";
import { getTeamWithSettings } from "@/lib/team";
import { TeamDetailedSettings } from "../_components/TeamSettings";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await getTeamWithSettings(teamId);

  return (
    <div className="space-y-8">
      <TeamDetailedSettings team={team} />
    </div>
  );
}
