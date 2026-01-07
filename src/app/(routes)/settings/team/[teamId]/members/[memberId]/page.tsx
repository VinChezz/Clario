import { MembersGeneral } from "./_components/MembersGeneral";
import { SettingsGeneral } from "./_components/SettingsGeneral";
import { getTeamMember, getTeamWithMembers } from "@/lib/team";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Calendar,
  FileText,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  HardDrive,
  AlertTriangle,
  Users,
  UserX,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Mail,
  Shield,
  Zap,
  UserIcon,
} from "lucide-react";

import Link from "next/link";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Plan } from "@prisma/client";

export default async function MemberDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string; memberId: string }>;
}) {
  const { teamId, memberId } = await params;

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    redirect("/api/auth/login");
  }

  const [team, member] = await Promise.all([
    getTeamWithMembers(teamId),
    getTeamMember(teamId, memberId),
  ]);

  if (!member || !team) {
    notFound();
  }

  const currentUserMember = team.members.find(
    (m) => m.user.email === user.email
  );

  const canViewMember = () => {
    if (member.user.email === user.email) {
      return true;
    }

    if (!currentUserMember) {
      return false;
    }

    if (
      currentUserMember.role === "ADMIN" ||
      team.createdById === currentUserMember.userId
    ) {
      return true;
    }

    return false;
  };

  if (!canViewMember()) {
    notFound();
  }

  const isCurrentUser = member.user.email === user.email;
  const isCurrentUserAdmin =
    currentUserMember?.role === "ADMIN" ||
    team.createdById === currentUserMember?.userId;

  const getPlanInfo = (plan: Plan) => {
    switch (plan) {
      case Plan.ENTERPRISE:
        return {
          color:
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
          icon: <Shield className="h-4 w-4" />,
        };

      case Plan.PRO:
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
          icon: <Zap className="h-4 w-4" />,
        };
      case Plan.FREE:
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
          icon: <UserIcon className="h-4 w-4" />,
        };
    }
  };

  const planInfo = getPlanInfo(member.user.plan);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/settings/team/${teamId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isCurrentUser && isCurrentUserAdmin && (
            <>
              <Button variant="destructive">Remove from Team</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback className="text-2xl">
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {member.user.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {member.user.email}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <Badge
                    className={`${planInfo.color} font-medium text-base`}
                    variant={"secondary"}
                  >
                    <span className="font-medium text-base">
                      {planInfo.icon}
                    </span>
                    <p className="capitalize">
                      {member.user.plan.toLowerCase()}
                    </p>
                  </Badge>
                  <Badge
                    variant={
                      member.role === "ADMIN"
                        ? "destructive"
                        : member.role === "EDIT"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {member.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <MembersGeneral member={member} />
          </Card>

          {isCurrentUserAdmin && !isCurrentUser && (
            <Card>
              <CardHeader>
                <CardTitle>Member Settings</CardTitle>
                <CardDescription>
                  Configure permissions and access for this member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsGeneral
                  member={member}
                  currentUserRole={currentUserMember?.role || "VIEW"}
                  teamId={teamId}
                  currentUserId={user.id}
                  isCurrentUserTeamCreator={team.createdById === user.id}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-gray-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Access user-specific information quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/settings/team/${teamId}/user-files?user=${member.userId}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">View Files</p>
                  <p className="text-xs text-gray-500">
                    Browse user's created files
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href={`/settings/team/${teamId}/user-activity?user=${member.userId}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Activity Log</p>
                  <p className="text-xs text-gray-500">
                    View user's recent actions
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href={`/settings/team/${teamId}/user-comments?user=${member.userId}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50">
                  <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Comments</p>
                  <p className="text-xs text-gray-500">
                    Review user's comments
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href={`/settings/team/${teamId}/user-storage?user=${member.userId}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50">
                  <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Storage Usage</p>
                  <p className="text-xs text-gray-500">
                    Check storage consumption
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
