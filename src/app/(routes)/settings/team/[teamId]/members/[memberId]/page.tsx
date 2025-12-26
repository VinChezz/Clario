import { MembersGeneral } from "./_components/MembersGeneral";
import { SettingsGeneral } from "./_components/SettingsGeneral";
import { getTeamMember } from "@/lib/team";
import { notFound } from "next/navigation";
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
  ArrowLeft,
  Mail,
  Calendar,
  Globe,
  User,
  Shield,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function MemberDetailsPage({
  params,
}: {
  params: { teamId: string; memberId: string };
}) {
  const member = await getTeamMember(params.teamId, params.memberId);

  if (!member) {
    notFound();
  }

  const isCurrentUser = false;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/settings/team/${params.teamId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isCurrentUser && (
            <>
              <Button variant="outline">Edit Permissions</Button>
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
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Joined</span>
                  </div>
                  <p className="font-medium">
                    {new Date(member.joinedAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Last Active</span>
                  </div>
                  <p className="font-medium">
                    {member.user.lastLoginAt
                      ? new Date(member.user.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="h-4 w-4" />
                    <span>Timezone</span>
                  </div>
                  <p className="font-medium">{member.user.timezone || "UTC"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4" />
                    <span>Files Created</span>
                  </div>
                  <p className="font-medium">{member.user.totalCreatedFiles}</p>
                </div>
              </div>

              <Separator />

              {/* Общая информация */}
              <MembersGeneral member={member} />
            </CardContent>
          </Card>

          {/* Настройки */}
          <Card>
            <CardHeader>
              <CardTitle>Member Settings</CardTitle>
              <CardDescription>
                Configure permissions and access for this member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsGeneral member={member} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      member.user.availabilityStatus === "AVAILABLE"
                        ? "bg-green-500"
                        : member.user.availabilityStatus === "FOCUS"
                        ? "bg-yellow-500"
                        : member.user.availabilityStatus === "MEETING"
                        ? "bg-purple-500"
                        : member.user.availabilityStatus === "OOO"
                        ? "bg-gray-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <span className="text-sm">
                    {member.user.availabilityStatus || "Available"}
                  </span>
                </div>
                {member.user.customStatus && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "{member.user.customStatus}"
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Presence</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.user.showPresence ? "Visible to team" : "Invisible"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Опасная зона */}
          {!isCurrentUser && (
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  Transfer Ownership
                </Button>
                <Button variant="destructive" className="w-full">
                  Remove from Team
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  Suspend Access
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/settings/team/${params.teamId}/files?user=${member.userId}`}
                className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
              >
                View user's files
              </Link>
              <Link
                href={`/settings/team/${params.teamId}/activity?user=${member.userId}`}
                className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
              >
                View activity log
              </Link>
              <Link
                href={`/settings/team/${params.teamId}/comments?user=${member.userId}`}
                className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
              >
                View comments
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
