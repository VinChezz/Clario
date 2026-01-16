"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, TeamMember, Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Mail,
  Calendar,
  Shield,
  User as UserIcon,
  EyeOff,
  Eye,
  Lock,
  Zap,
  Coffee,
  Users as UsersIcon,
  Plane,
  MessageSquare,
} from "lucide-react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface TeamMembersProps {
  members: (TeamMember & { user: User })[];
  teamId: string;
  currentUserRole?: Role;
  isCurrentUserCreator?: boolean;
}

export function TeamMembers({
  members,
  teamId,
  currentUserRole = "VIEW",
  isCurrentUserCreator = false,
}: TeamMembersProps) {
  const router = useRouter();
  const { user: currentUser } = useKindeBrowserClient();
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  const roleColors: Record<Role, string> = {
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    EDIT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    VIEW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  const statusConfig: Record<
    string,
    {
      color: string;
      icon: React.ReactNode;
      gradient: string;
      label: string;
    }
  > = {
    AVAILABLE: {
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      icon: <Zap className="h-3 w-3" />,
      gradient: "from-green-400 to-emerald-500",
      label: "Available",
    },
    FOCUS: {
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      icon: <Coffee className="h-3 w-3" />,
      gradient: "from-purple-500 to-violet-600",
      label: "Focus mode",
    },
    MEETING: {
      color:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      icon: <UsersIcon className="h-3 w-3" />,
      gradient: "from-blue-500 to-cyan-500",
      label: "In a meeting",
    },
    OOO: {
      color:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      icon: <Plane className="h-3 w-3" />,
      gradient: "from-red-500 to-orange-500",
      label: "Out of office",
    },
    CUSTOM: {
      color:
        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700",
      icon: <MessageSquare className="h-3 w-3" />,
      gradient: "from-gray-500 to-slate-600",
      label: "Custom",
    },
  };

  const getStatusLabel = (status: string, customStatusText?: string) => {
    const labels: Record<string, string> = {
      AVAILABLE: "Available",
      FOCUS: "Focus mode",
      MEETING: "In a meeting",
      OOO: "Out of office",
      CUSTOM: customStatusText || "Custom",
    };
    return labels[status] || status.toLowerCase().replace("_", " ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500";
      case "FOCUS":
        return "bg-yellow-500";
      case "MEETING":
        return "bg-purple-500";
      case "OOO":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const isCurrentUserMember = (userEmail: string) => {
    return currentUser?.email === userEmail;
  };

  const canViewMemberDetails = (member: TeamMember & { user: User }) => {
    if (isCurrentUserMember(member.user.email)) {
      return true;
    }

    if (currentUserRole === "ADMIN" || isCurrentUserCreator) {
      return true;
    }

    return false;
  };

  const handleMemberClick = (member: TeamMember & { user: User }) => {
    if (!canViewMemberDetails(member)) {
      return;
    }

    if (isCurrentUserMember(member.user.email)) {
      return;
    }

    router.push(`/settings/team/${teamId}/members/${member.userId}`);
  };

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isHovered = hoveredMemberId === member.userId;
        const isSelf = isCurrentUserMember(member.user.email);
        const canView = canViewMemberDetails(member);
        const isInteractive = canView && !isSelf;

        const availabilityStatus =
          member.user.availabilityStatus || "AVAILABLE";
        const customStatusText = member.user.customStatus || "";
        const config =
          statusConfig[availabilityStatus] || statusConfig.AVAILABLE;
        const displayText = getStatusLabel(
          availabilityStatus,
          customStatusText
        );

        return (
          <div
            key={member.id}
            className="group relative"
            onMouseEnter={() => setHoveredMemberId(member.userId)}
            onMouseLeave={() => setHoveredMemberId(null)}
          >
            <div
              className={`
              p-4 rounded-lg transition-all duration-200
              ${
                isHovered && isInteractive
                  ? "bg-gray-50 dark:bg-gray-800/50 shadow-sm border border-gray-200 dark:border-gray-700"
                  : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
              }
              ${!isInteractive ? "cursor-default" : "cursor-pointer"}
            `}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-4 flex-1 ${
                    isInteractive ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() => isInteractive && handleMemberClick(member)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-900">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>
                        <UserIcon className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(
                        member.user.availabilityStatus
                      )} rounded-full border-2 border-white dark:border-gray-900`}
                    />
                    {isSelf && (
                      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <EyeOff className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {!canView && !isSelf && (
                      <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                        <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {member.user.name}
                        {isSelf && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                          >
                            You
                          </Badge>
                        )}
                      </h4>
                      <Badge
                        className={`text-xs px-2 py-0 ${
                          roleColors[member.role]
                        }`}
                      >
                        {member.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${config.color} px-2 flex items-center gap-1 text-xs backdrop-blur-sm border`}
                      >
                        <div
                          className={`p-0.5 rounded-full bg-linear-to-r ${config.gradient} text-white`}
                        >
                          {config.icon}
                        </div>
                        <span className="font-medium capitalize">
                          {displayText}
                        </span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{member.user.email}</span>
                      </div>

                      {member.user.customStatus && canView && (
                        <span className="text-gray-500 text-sm truncate">
                          • {member.user.customStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isHovered && isInteractive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleMemberClick(member)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                      {canView ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>Joined</span>
                              </div>
                              <p className="text-sm font-medium">
                                {new Date(member.joinedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Shield className="h-3 w-3" />
                                <span>Permissions</span>
                              </div>
                              <p className="text-sm font-medium">
                                {member.role === "ADMIN"
                                  ? "Full access"
                                  : member.role === "EDIT"
                                  ? "Can edit"
                                  : "View only"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <div
                                  className={`p-0.5 rounded-full bg-linear-to-r ${config.gradient}`}
                                >
                                  {config.icon}
                                </div>
                                <span>Status</span>
                              </div>
                              <p className="text-sm font-medium">
                                {displayText}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">
                                Last Active
                              </p>
                              <p className="text-sm font-medium">
                                {member.user.lastLoginAt
                                  ? new Date(
                                      member.user.lastLoginAt
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Never"}
                              </p>
                            </div>
                          </div>

                          {!isSelf && (
                            <div className="pt-4 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => handleMemberClick(member)}
                              >
                                View Full Details
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                          <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Restricted Access
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Only team admins can view member details
                            </p>
                          </div>
                        </div>
                      )}

                      {isSelf && (
                        <div className="pt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <EyeOff className="h-4 w-4" />
                            <span>
                              <a
                                href="/settings/profile"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                personal settings {""}
                              </a>
                              to manage your account.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
