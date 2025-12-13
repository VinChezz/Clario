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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import InviteModal from "./invite-button/InviteModal";
import { TeamMember } from "./SideNavTopSection";
import { toast } from "sonner";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRouter } from "next/navigation";
import {
  Zap,
  Coffee,
  Users,
  Plane,
  MessageSquare,
  ChevronDown,
  X,
} from "lucide-react";
import { useUserStatus } from "@/hooks/useUserStatus";

interface HeaderProps {
  onTeamUpdate?: () => void;
  onMenuToggle?: () => void;
}

export default function Header({ onTeamUpdate, onMenuToggle }: HeaderProps) {
  const { user }: any = useKindeBrowserClient();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const { userStatus, updateStatus, isLoading } = useUserStatus();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isMobile = useIsMobile();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [customStatusModalOpen, setCustomStatusModalOpen] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState("");

  const router = useRouter();

  const statusSuggestions = [
    { text: "Working remotely", emoji: "🏠" },
    { text: "Focusing on a deadline", emoji: "⏰" },
    { text: "Taking a break", emoji: "☕" },
    { text: "In deep work", emoji: "🎯" },
    { text: "Lunch break", emoji: "🍽️" },
    { text: "Working late", emoji: "🌙" },
    { text: "Vacation mode", emoji: "🏖️" },
    { text: "Creative flow", emoji: "🎨" },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const updateAvailabilityStatus = async (
    status: string,
    customText?: string
  ) => {
    try {
      await updateStatus({
        availabilityStatus: status,
        ...(customText && { customStatus: customText }),
      });

      toast.success(
        `Status updated to ${getStatusLabel(
          status,
          customText || userStatus?.customStatus
        )}`
      );
      setShowStatusDropdown(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleCustomStatusSubmit = () => {
    if (customStatusInput.trim() && customStatusInput.length <= 50) {
      updateAvailabilityStatus("CUSTOM", customStatusInput.trim());
      setCustomStatusModalOpen(false);
      setCustomStatusInput("");
    }
  };

  const openCustomStatusModal = () => {
    setCustomStatusInput(userStatus?.customStatus || "");
    setCustomStatusModalOpen(true);
    setShowStatusDropdown(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCustomStatusInput(suggestion);
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

  const StatusBadge = () => {
    const availabilityStatus = userStatus?.availabilityStatus || "AVAILABLE";
    const customStatusText = userStatus?.customStatus || "";

    const statusConfig: Record<
      string,
      {
        color: string;
        icon: React.ReactNode;
        gradient: string;
      }
    > = {
      AVAILABLE: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        icon: <Zap className="h-3.5 w-3.5" />,
        gradient: "from-green-400 to-emerald-500",
      },
      FOCUS: {
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        icon: <Coffee className="h-3.5 w-3.5" />,
        gradient: "from-purple-500 to-violet-600",
      },
      MEETING: {
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        icon: <Users className="h-3.5 w-3.5" />,
        gradient: "from-blue-500 to-cyan-500",
      },
      OOO: {
        color:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        icon: <Plane className="h-3.5 w-3.5" />,
        gradient: "from-red-500 to-orange-500",
      },
      CUSTOM: {
        color:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700",
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        gradient: "from-gray-500 to-slate-600",
      },
    };

    const config = statusConfig[availabilityStatus] || statusConfig.AVAILABLE;
    const displayText = getStatusLabel(availabilityStatus, customStatusText);

    return (
      <div className="relative">
        <Badge
          variant="outline"
          className={`${config.color} px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all duration-200 backdrop-blur-sm border rounded-full group`}
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <div
            className={`p-1.5 rounded-full bg-linear-to-r ${config.gradient} text-white`}
          >
            {config.icon}
          </div>
          <span className="font-medium capitalize text-sm">{displayText}</span>
          <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
        </Badge>

        {showStatusDropdown && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3">
              <div className="mb-2 px-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Set your status
                </p>
              </div>

              <div className="space-y-1">
                {[
                  {
                    value: "AVAILABLE",
                    label: "Available",
                    icon: <Zap className="h-4 w-4" />,
                  },
                  {
                    value: "FOCUS",
                    label: "Focus mode",
                    icon: <Coffee className="h-4 w-4" />,
                  },
                  {
                    value: "MEETING",
                    label: "In a meeting",
                    icon: <Users className="h-4 w-4" />,
                  },
                  {
                    value: "OOO",
                    label: "Out of office",
                    icon: <Plane className="h-4 w-4" />,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-150 ${
                      availabilityStatus === option.value
                        ? "bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => updateAvailabilityStatus(option.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          availabilityStatus === option.value
                            ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-gray-900 dark:text-white block">
                          {option.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.value === "AVAILABLE" &&
                            "Ready to collaborate"}
                          {option.value === "FOCUS" && "Do not disturb"}
                          {option.value === "MEETING" && "Busy in a meeting"}
                          {option.value === "OOO" && "Away from keyboard"}
                        </span>
                      </div>
                    </div>
                    {availabilityStatus === option.value && (
                      <div className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-indigo-500"></div>
                    )}
                  </button>
                ))}

                <div className="pt-2 border-t dark:border-gray-700">
                  <button
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150 group"
                    onClick={openCustomStatusModal}
                  >
                    <div className="p-2 rounded-lg bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-600 dark:text-gray-400 group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-gray-900 dark:text-white block">
                        Custom status
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {userStatus?.customStatus || "Set a custom message"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const updateThemeInSettings = async (newTheme: "light" | "dark") => {
    try {
      const themeValue = newTheme === "dark" ? "DARK" : "LIGHT";
      await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeValue }),
      });

      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Failed to update theme in settings:", error);
      localStorage.setItem("theme", newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    updateThemeInSettings(newTheme);

    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const navigateToSettings = () => {
    router.push("/settings/profile");
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
        return "bg-red-100/80 text-red-700 border-red-200/50 backdrop-blur-sm dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50";
      case "EDIT":
        return "bg-blue-100/80 text-blue-700 border-blue-200/50 backdrop-blur-sm dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50";
      case "VIEW":
        return "bg-gray-100/80 text-gray-700 border-gray-200/50 backdrop-blur-sm dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50";
      default:
        return "bg-gray-100/80 text-gray-700 border-gray-200/50 backdrop-blur-sm dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50";
    }
  };

  return (
    <header
      className="sticky top-0 backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 transition-all duration-300 z-30"
      id="dashboard-header"
    >
      <div
        className={cn(
          "flex items-center justify-between py-4 mx-auto max-w-7xl",
          isMobile ? "px-4" : "px-4"
        )}
      >
        <div className="flex items-center flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 lg:hidden backdrop-blur-xl transition-all duration-300 hover:bg-white/20 dark:hover:bg-gray-800/20",
              isMobile ? "h-10 w-10 mr-2" : "h-12 w-12 mr-3"
            )}
            onClick={handleMenuClick}
          >
            <Menu className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
          </Button>

          {activeTeam && teamMembers.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="members-check"
                  variant="ghost"
                  className={cn(
                    "h-auto rounded-2xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20 dark:hover:bg-gray-800/20",
                    isMobile
                      ? "px-3 py-2 max-w-[200px] min-h-10"
                      : "px-4 py-3 max-w-[280px] min-h-12"
                  )}
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="flex -space-x-2 shrink-0">
                      {displayedMembers.map((member, index) => (
                        <div
                          key={`${member.id}-${index}`}
                          className="relative rounded-full"
                        >
                          <div
                            className={cn(
                              "rounded-xl bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shrink-0",
                              isMobile ? "w-8 h-8" : "w-10 h-10"
                            )}
                          >
                            <Image
                              src={member.user.image || "/default-avatar.png"}
                              alt={member.user.name}
                              width={isMobile ? 24 : 32}
                              height={isMobile ? 24 : 32}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      ))}
                      {extraMembersCount > 0 && (
                        <div
                          className={cn(
                            "bg-linear-to-br from-gray-100/40 to-gray-200/40 dark:from-gray-800/40 dark:to-gray-700/40 rounded-xl flex items-center justify-center font-medium text-gray-600 dark:text-gray-400 backdrop-blur-xl",
                            isMobile ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
                          )}
                        >
                          +{extraMembersCount}
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-semibold text-gray-900 dark:text-white truncate",
                          isMobile ? "text-sm" : "text-base"
                        )}
                      >
                        {activeTeam.name}
                      </p>
                      <p
                        className={
                          isMobile
                            ? "text-xs text-gray-600 dark:text-gray-400"
                            : "text-sm text-gray-600 dark:text-gray-400"
                        }
                      >
                        {teamMembers.length} members
                      </p>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-85 p-0 rounded-3xl backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-800/20 transition-all duration-300 z-30"
                align="start"
              >
                <div className="p-6 backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 transition-all duration-300 rounded-t-3xl">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Team Members
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {teamMembers.length} member
                    {teamMembers.length !== 1 ? "s" : ""} in your team
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {teamMembers.map((member, index) => (
                    <div
                      key={`${member.id}-${index}-full`}
                      className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 transition-all duration-300 group border-b border-white/10 dark:border-gray-800/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl border border-white/50 dark:border-gray-800/50 flex items-center justify-center">
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
                            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                              {member.user.name}
                            </p>
                            {member.userId === activeTeam.createdById && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-yellow-100/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50 backdrop-blur-sm"
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
                                  className="h-8 w-8 p-0 backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-700/50 border border-white/30 dark:border-gray-700/30 transition-all duration-300"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-800/20 shadow-2xl"
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
                                  className="text-sm text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400 backdrop-blur-sm"
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

                <div className="p-4 backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 transition-all duration-300 rounded-b-3xl">
                  <Button
                    className="w-full gap-2 text-sm h-11 bg-linear-to-br from-indigo-500/90 to-indigo-600/90 hover:from-indigo-600/90 hover:to-indigo-500/90 text-white backdrop-blur-xl transition-all duration-300 group relative overflow-hidden"
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

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge />

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "backdrop-blur-xl transition-all duration-300 hover:scale-110 relative hover:bg-white/20 dark:hover:bg-gray-800/20",
              isMobile ? "h-9 w-9" : "h-11 w-11"
            )}
          >
            <Bell className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 backdrop-blur-sm"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-white/20 dark:hover:bg-gray-800/20",
              isMobile ? "h-9 w-9" : "h-11 w-11"
            )}
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
            ) : (
              <Sun className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-white/20 dark:hover:bg-gray-800/20",
              isMobile ? "h-9 w-9" : "h-11 w-11"
            )}
            onClick={navigateToSettings}
            title="User Settings"
          >
            <Settings className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
          </Button>
        </div>
      </div>

      <Dialog
        open={customStatusModalOpen}
        onOpenChange={setCustomStatusModalOpen}
      >
        <DialogContent
          className="sm:max-w-md rounded-2xl"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                Set Custom Status
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setCustomStatusModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Set a custom message that will be visible to your team members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-status" className="text-sm font-medium">
                  Status Message
                </Label>
                <span
                  className={`text-xs ${
                    customStatusInput.length > 50
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {customStatusInput.length}/50
                </span>
              </div>
              <Textarea
                id="custom-status"
                placeholder="What's your current status?"
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCustomStatusSubmit();
                  }
                }}
                className="min-h-[100px] resize-none rounded-xl border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                maxLength={50}
              />
              {customStatusInput.length > 50 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Status must be less than 50 characters
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quick Suggestions</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Click to apply
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                      customStatusInput === suggestion.text
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{suggestion.emoji}</span>
                      <span className="text-sm font-medium truncate">
                        {suggestion.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {customStatusInput && (
              <div className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview
                </p>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                  <Badge
                    variant="outline"
                    className="bg-linear-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700 px-3 py-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-2" />
                    <span className="font-medium capitalize">
                      {customStatusInput || "Custom status"}
                    </span>
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    Will appear in header
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => setCustomStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomStatusSubmit}
              disabled={
                !customStatusInput.trim() || customStatusInput.length > 50
              }
              className="flex-1 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Set Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
