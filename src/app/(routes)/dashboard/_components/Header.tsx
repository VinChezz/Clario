"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  Send,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Crown,
  Menu,
  Moon,
  Sun,
  Bell,
  Settings,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import InviteModal from "./invite-button/InviteModal";
import { TeamMember } from "./SideNavTopSection";
import { toast } from "sonner";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useTour } from "./TourContext";
import { useIsMobile } from "@/hooks/useIsMobile";

interface HeaderProps {
  onTeamUpdate?: () => void;
  onMenuToggle?: () => void;
}

export default function Header({ onTeamUpdate, onMenuToggle }: HeaderProps) {
  const { user }: any = useKindeBrowserClient();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isMobile = useIsMobile();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const currentTheme = savedTheme || systemTheme;

    setTheme(currentTheme);
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    if (user?.email) {
      fetch("/api/auth/user")
        .then((res) => res.json())
        .then((data) => setDbUser(data))
        .catch((error) => console.error("Failed to load user:", error));
    }
  }, [user]);

  useEffect(() => {
    if (activeTeam?.members) {
      setTeamMembers(activeTeam.members);
    } else {
      setTeamMembers([]);
    }
  }, [activeTeam]);

  const currentUserMember = teamMembers.find(
    (member) => member.userId === dbUser?.id
  );
  const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

  const canInvite = currentUserMember?.role === "ADMIN";

  const displayedMembers = isMobile
    ? teamMembers.slice(0, 1)
    : teamMembers.slice(0, 3);
  const extraMembersCount = teamMembers.length - displayedMembers.length;

  const updateMemberRole = async (
    memberId: string,
    newRole: "VIEW" | "EDIT" | "ADMIN"
  ) => {
    if (newRole === "ADMIN" && !isCurrentUserCreator) {
      toast.error("Only team creator can assign ADMIN role");
      return;
    }

    try {
      const response = await fetch("/api/teams/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          role: newRole,
          teamId: activeTeam?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update role");
        return;
      }

      toast.success(`Member role updated to ${newRole}`);
      onTeamUpdate?.();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${memberName} from the team?`)
    ) {
      return;
    }

    try {
      const response = await fetch("/api/teams/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          teamId: activeTeam?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
        return;
      }

      toast.success(`Member removed from team`);
      onTeamUpdate?.();
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleMenuClick = () => {
    console.log("📱 Header: Menu button clicked");
    console.log("📱 Header: onMenuToggle function:", onMenuToggle);
    if (onMenuToggle) {
      onMenuToggle();
    } else {
      console.error("❌ Header: onMenuToggle is undefined!");
    }
  };

  const getRoleText = (role: "VIEW" | "EDIT" | "ADMIN") => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "EDIT":
        return "Editor";
      case "VIEW":
        return "Viewer";
      default:
        return "Viewer";
    }
  };

  const getRoleColor = (role: "VIEW" | "EDIT" | "ADMIN") => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100/80 text-red-700 border-red-200/50 backdrop-blur-sm";
      case "EDIT":
        return "bg-blue-100/80 text-blue-700 border-blue-200/50 backdrop-blur-sm";
      case "VIEW":
        return "bg-gray-100/80 text-gray-700 border-gray-200/50 backdrop-blur-sm";
      default:
        return "bg-gray-100/80 text-gray-700 border-gray-200/50 backdrop-blur-sm";
    }
  };

  return (
    <header className="sticky top-0 backdrop-blur-xl bg-white/10 transition-all duration-300 z-30 rounded-b-3xl">
      <div className="flex items-center justify-between px-14 py-4">
        {/* Left Section */}
        <div className="flex items-center flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden backdrop-blur-xl h-14 w-14"
            onClick={handleMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {activeTeam && teamMembers.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto px-4 py-3 rounded-2xl backdrop-blur-xl transition-all duration-300 max-w-[320px] min-h-14"
                >
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="flex -space-x-3 shrink-0">
                      {displayedMembers.map((member, index) => (
                        <div
                          key={`${member.id}-${index}`}
                          className="relative rounded-full"
                        >
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shrink-0">
                            <Image
                              src={member.user.image || "/default-avatar.png"}
                              alt={member.user.name}
                              width={32}
                              height={32}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      ))}
                      {extraMembersCount > 0 && (
                        <div className="w-10 h-10 bg-linear-to-br from-gray-100/40 to-gray-200/40 rounded-xl flex items-center justify-center text-sm font-medium text-gray-600 backdrop-blur-xl">
                          +{extraMembersCount}
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {activeTeam.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {teamMembers.length} members
                      </p>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-85 p-0 rounded-3xl backdrop-blur-xl bg-white/10 transition-all duration-300 z-30"
                align="start"
              >
                <div className="p-6 backdrop-blur-xl bg-white/10 transition-all duration-300 rounded-t-3xl">
                  <h3 className="font-bold text-gray-900 text-lg">
                    Team Members
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {teamMembers.length} member
                    {teamMembers.length !== 1 ? "s" : ""} in your team
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {teamMembers.map((member, index) => (
                    <div
                      key={`${member.id}-${index}-full`}
                      className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/10 transition-all duration-300 group"
                      // hover:bg-gray-50/50 border-b border-white/20 last:border-b-0 transition-all
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border border-white/50 flex items-center justify-center">
                            <Image
                              src={member.user.image || "/default-avatar.png"}
                              alt={member.user.name}
                              width={40}
                              height={40}
                              className="rounded-2xl"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate text-gray-900">
                              {member.user.name}
                            </p>
                            {member.userId === activeTeam.createdById && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-yellow-100/80 text-yellow-700 border-yellow-200/50 backdrop-blur-sm"
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs py-1 px-2 font-medium backdrop-blur-sm",
                            getRoleColor(member.role)
                          )}
                        >
                          {getRoleText(member.role)}
                        </Badge>

                        {currentUserMember?.role === "ADMIN" &&
                          member.userId !== dbUser?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 backdrop-blur-xl bg-white/30 hover:bg-white/50 border border-white/30 transition-all duration-300"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-2xl backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateMemberRole(member.id, "EDIT")
                                  }
                                  disabled={member.role === "EDIT"}
                                  className="text-sm cursor-pointer backdrop-blur-sm"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Make Editor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateMemberRole(member.id, "VIEW")
                                  }
                                  disabled={member.role === "VIEW"}
                                  className="text-sm cursor-pointer backdrop-blur-sm"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Make Viewer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    removeMember(member.id, member.user.name)
                                  }
                                  className="text-sm text-red-600 cursor-pointer focus:text-red-600 backdrop-blur-sm"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 backdrop-blur-xl bg-white/10 transition-all duration-300 rounded-b-3xl">
                  <Button
                    className="w-full gap-2 text-sm h-11 bg-linear-to-br from-indigo-500/90 to-indigo-600/90 hover:from-indigo-600/90 hover:to-indigo-500/90 text-white backdrop-blur-xl bg-white/10 transition-all duration-300 group relative overflow-hidden"
                    // from-blue-600/90 to-indigo-600/90 hover:from-blue-700/90 hover:to-indigo-700/90
                    onClick={() => setIsInviteModalOpen(true)}
                    disabled={!activeTeam || !canInvite}
                  >
                    <Send className="h-4 w-4 relative z-10" />
                    <span className="relative z-10 font-semibold">
                      Invite Team
                    </span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 backdrop-blur-xl transition-all duration-300 hover:scale-110 relative"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white backdrop-blur-sm"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 backdrop-blur-xl transition-all duration-300 hover:scale-110"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className="h-6 w-6" />
            ) : (
              <Sun className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 backdrop-blur-xl transition-all duration-300 hover:scale-110"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamId={activeTeam?.id}
        teamName={activeTeam?.name}
        onInviteSent={onTeamUpdate}
      />
    </header>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}
