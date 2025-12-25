import { QuickTeamSettings } from "./_components/QuiickTeamSettings";
import { TeamMembers } from "./_components/TeamMembers";
import { TeamStorage } from "./_components/TeamStorage";
import { getTeamWithMembers } from "@/lib/team";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Database } from "lucide-react";
import { AnimatedHeader } from "./_components/AnimatedHeader";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await getTeamWithMembers(teamId);

  return (
    <div className="space-y-8">
      <AnimatedHeader teamName={team.name} teamId={teamId} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.members.length}</div>
            <p className="text-xs text-gray-500">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Files</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.files?.length || 0}</div>
            <p className="text-xs text-gray-500">Documents & boards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.storageUsage?.toFixed(1) || "0"} GB
            </div>
            <p className="text-xs text-gray-500">
              of {team.createdBy.maxFiles} GB used
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Active team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMembers members={team.members} teamId={team.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Overview</CardTitle>
              <CardDescription>
                {team.createdBy.plan} plan • {team.createdBy.maxFiles} GB total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamStorage
                currentUsage={team.storageUsage || 0}
                maxStorage={team.createdBy.maxFiles}
                plan={team.createdBy.plan}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickTeamSettings teamId={team.id} teamName={team.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
