import { QuickTeamSettings } from "./_components/QuiickTeamSettings";
import { TeamMembers } from "./_components/TeamMembers";
import { TeamStorageClient } from "./_components/TeamStorageClient";
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
import { Plan } from "@prisma/client";
import { formatBytes, getPlanLimit } from "@/lib/planUtils";
import { TeamStorage } from "./_components/TeamStorage";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import NotFound from "@/app/not-found";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.email) {
    console.log("No authenticated user or email");
    return <NotFound />;
  }

  const team = await getTeamWithMembers(teamId);

  if (!team) {
    return <NotFound />;
  }

  const planLimits = getPlanLimit(team.createdBy.plan as Plan);
  const planLimitGB = planLimits.maxStorage / 1024 ** 3;

  const currentUserMember = team.members.find(
    (m) => m.user.email === user.email
  );
  const currentUserRole = currentUserMember?.role || "VIEW";
  const isCurrentUserCreator = team.createdById === currentUserMember?.userId;

  const hasAdminRights = currentUserRole === "ADMIN" || isCurrentUserCreator;

  return (
    <div className="space-y-8">
      <AnimatedHeader
        teamName={team.name}
        teamId={teamId}
        currentUserRole={currentUserRole}
        isCurrentUserCreator={isCurrentUserCreator}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.members.length}</div>
            <p className="text-xs text-gray-500 font-bold">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Files</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.files?.length || 0}</div>
            <p className="text-xs text-gray-500 font-bold">
              Documents & boards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <TeamStorageClient
              plan={team.createdBy.plan}
              planLimitGB={planLimitGB}
              teamId={teamId}
            />
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
              <TeamMembers
                members={team.members}
                teamId={team.id}
                currentUserRole={currentUserRole}
                isCurrentUserCreator={isCurrentUserCreator}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Overview</CardTitle>
              <CardDescription>
                {team.createdBy.plan} plan •{" "}
                {formatBytes(planLimits.maxStorage)} {""}
                total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamStorage
                plan={team.createdBy.plan}
                teamId={teamId}
                autoFetch={true}
                showRealSize={false}
                currentUserRole={currentUserRole}
                isCurrentUserCreator={isCurrentUserCreator}
              />
            </CardContent>
          </Card>

          {hasAdminRights && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickTeamSettings teamId={team.id} teamName={team.name} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
