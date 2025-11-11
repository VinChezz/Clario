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
  Users,
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
  const [isScrolled, setIsScrolled] = useState(false);
  const { isTourActive } = useTour();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const displayedMembers = teamMembers.slice(0, 3);
  const extraMembersCount = teamMembers.length - 3;

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
    <header className="sticky top-0">
      <div className="flex items-center justify-between p-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {activeTeam && teamMembers.length > 0 && (
            <Popover>
              <PopoverTrigger asChild id="members-check">
                <Button
                  variant="ghost"
                  className="h-auto p-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {displayedMembers.map((member, index) => (
                        <div key={`${member.id}-${index}`} className="relative">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border-2 border-white/80 dark:border-gray-800/80 shadow-lg flex items-center justify-center">
                            <Image
                              src={member.user.image || "/default-avatar.png"}
                              alt={member.user.name}
                              width={36}
                              height={36}
                              className="rounded-full"
                            />
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white/80 dark:border-gray-800/80 backdrop-blur-sm",
                              member.role === "ADMIN"
                                ? "bg-linear-to-br from-red-500 to-red-600"
                                : member.role === "EDIT"
                                ? "bg-linear-to-br from-blue-500 to-blue-600"
                                : "bg-linear-to-br from-gray-500 to-gray-600"
                            )}
                          />
                        </div>
                      ))}
                      {extraMembersCount > 0 && (
                        <div className="w-10 h-10 bg-linear-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-700/80 dark:to-gray-600/80 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white/80 dark:border-gray-800/80 shadow-lg backdrop-blur-sm">
                          +{extraMembersCount}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activeTeam.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {teamMembers.length} members
                      </p>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-linear-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Team Members
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {teamMembers.length} member
                    {teamMembers.length !== 1 ? "s" : ""} in your team
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {teamMembers.map((member, index) => (
                    <div
                      key={`${member.id}-${index}-full`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 flex items-center justify-center">
                            <Image
                              src={member.user.image || "/default-avatar.png"}
                              alt={member.user.name}
                              width={44}
                              height={44}
                              className="rounded-2xl"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
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
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs py-1.5 px-3 font-medium backdrop-blur-sm",
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
                                  className="h-8 w-8 p-0 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
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

                <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-linear-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <Button
                    id="invite-button"
                    className="w-full gap-3 text-sm h-11 bg-linear-to-br from-blue-600/90 to-indigo-600/90 hover:from-blue-700/90 hover:to-indigo-700/90 text-white backdrop-blur-xl border border-blue-500/30 shadow-2xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    onClick={() => setIsInviteModalOpen(true)}
                    disabled={!activeTeam || !canInvite}
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-sm group-hover:from-white/20 group-hover:to-white/10 transition-all duration-500" />
                    <Send className="h-5 w-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10 font-semibold">
                      Invite Team Members
                    </span>

                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-br from-transparent via-white/20 to-transparent" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-110"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {user && (
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border-2 border-white/80 dark:border-gray-800/80 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105">
              <Image
                src={user?.picture || "/default-avatar.png"}
                alt="user"
                width={42}
                height={42}
                className="rounded-2xl"
              />
            </div>
          )}
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
