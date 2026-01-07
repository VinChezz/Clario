"use client";

import { TeamMember, User } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Globe,
  FileText,
  User as UserIcon,
} from "lucide-react";

interface MembersGeneralProps {
  member: TeamMember & { user: User };
}

export function MembersGeneral({ member }: MembersGeneralProps) {
  const user = member.user;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const getLastActiveText = () => {
    if (!user.lastLoginAt) return "Never";

    const lastActive = new Date(user.lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatShortDate(lastActive);
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-500">
                    Joined Team
                  </h4>
                </div>
                <p className="font-medium">{formatDate(member.joinedAt)}</p>
              </div>

              <div className="py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-500">
                    Last Active
                  </h4>
                </div>
                <p className="font-medium">{getLastActiveText()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-500">
                    Files Created
                  </h4>
                </div>
                <p className="font-medium text-2xl">
                  {user.totalCreatedFiles || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-500">
                    Timezone
                  </h4>
                </div>
                <p className="font-medium">{user.timezone || "UTC"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-medium text-lg mb-3">About</h3>
          {user.bio ? (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {user.bio}
            </p>
          ) : (
            <p className="text-gray-500 italic">No bio provided</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
