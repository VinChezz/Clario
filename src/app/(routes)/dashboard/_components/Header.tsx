import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  Search,
  Send,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Crown,
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
import { TEAM, TeamMember } from "./SideNavTopSection";
import { toast } from "sonner";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";

interface HeaderProps {
  onTeamUpdate?: () => void;
}

export default function Header({ onTeamUpdate }: HeaderProps) {
  const { user }: any = useKindeBrowserClient();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);

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
  const canManageRoles = currentUserMember?.role === "ADMIN";
  const canRemoveMembers = currentUserMember?.role === "ADMIN";
  const canEditFiles = ["ADMIN", "EDIT"].includes(
    currentUserMember?.role || ""
  );

  console.log("🔍 Header - Debug permissions:", {
    activeTeamId: activeTeam?.id,
    currentUserRole: currentUserMember?.role,
    canInvite,
    canManageRoles,
    canRemoveMembers,
    canEditFiles,
  });

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

    setTeamMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );

    if (activeTeam) {
      setActiveTeam({
        ...activeTeam,
        members: (activeTeam.members || []).map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        ),
      });
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
        setTeamMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.id === memberId ? { ...member, role: member.role } : member
          )
        );
        toast.error(error.error || "Failed to update role");
        return;
      }

      toast.success(`Member role updated to ${newRole}`);
      onTeamUpdate?.();
    } catch (error) {
      setTeamMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.id === memberId ? { ...member, role: member.role } : member
        )
      );
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${memberName} from the team?`)
    ) {
      return;
    }

    const memberToRemove = teamMembers.find((member) => member.id === memberId);

    setTeamMembers((prevMembers) =>
      prevMembers.filter((member) => member.id !== memberId)
    );

    if (activeTeam) {
      setActiveTeam({
        ...activeTeam,
        members: (activeTeam.members || []).filter(
          (member) => member.id !== memberId
        ),
      });
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
        if (memberToRemove) {
          setTeamMembers((prevMembers) => [...prevMembers, memberToRemove]);
          if (activeTeam) {
            setActiveTeam({
              ...activeTeam,
              members: [...(activeTeam.members || []), memberToRemove],
            });
          }
        }
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
        return;
      }

      toast.success(`Member removed from team`);
      onTeamUpdate?.();
    } catch (error) {
      if (memberToRemove) {
        setTeamMembers((prevMembers) => [...prevMembers, memberToRemove]);
        if (activeTeam) {
          setActiveTeam({
            ...activeTeam,
            members: [...(activeTeam.members || []), memberToRemove],
          });
        }
      }
      toast.error("Failed to remove member");
    }
  };

  const getRoleText = (role: "VIEW" | "EDIT" | "ADMIN") => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "EDIT":
        return "Edit";
      case "VIEW":
        return "View";
      default:
        return "View";
    }
  };

  const getRoleBadgeVariant = (role: "VIEW" | "EDIT" | "ADMIN") => {
    switch (role) {
      case "ADMIN":
        return "admin";
      case "EDIT":
        return "edit";
      case "VIEW":
        return "view";
      default:
        return "view";
    }
  };

  const getRoleIcon = (role: "VIEW" | "EDIT" | "ADMIN") => {
    switch (role) {
      case "ADMIN":
        return "A";
      case "EDIT":
        return "E";
      case "VIEW":
        return "V";
      default:
        return "V";
    }
  };

  return (
    <div className="flex justify-between w-full gap-2 items-center">
      {activeTeam && teamMembers.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer">
              <div className="flex -space-x-2">
                {displayedMembers.map((member, index) => (
                  <div key={`${member.id}-${index}`} className="relative">
                    <Image
                      src={member.user.image || "/default-avatar.png"}
                      alt={member.user.name}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-white"
                    />
                    <Badge
                      className={`
                        absolute -bottom-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-semibold rounded-full
                        ${
                          member.role === "ADMIN"
                            ? "bg-red-200 border border-red-200/50 text-white font-semibold backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,0,0,0.15)] hover:bg-red-300"
                            : member.role === "EDIT"
                            ? "bg-indigo-600/30 border border-indigo-600/20 text-white font-semibold backdrop-blur-md shadow-[inset_0_0_10px_rgba(99,102,241,0.25)] hover:bg-indigo-700/40"
                            : "bg-blue-700/30 border border-blue-300/30 text-white font-semibold backdrop-blur-md shadow-[inset_0_0_10px_rgba(59,130,246,0.15)] hover:bg-blue-900/40"
                        }
                      `}
                    >
                      {getRoleIcon(member.role)}
                    </Badge>
                  </div>
                ))}
                {extraMembersCount > 0 && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                    +{extraMembersCount}
                  </div>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-96 p-0 border shadow-lg"
            align="center"
            sideOffset={5}
          >
            <div className="p-4 border-b bg-gray-50/50">
              <h3 className="font-semibold text-lg">Team Members</h3>
              <p className="text-sm text-gray-500 mt-1">
                {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}{" "}
                in team
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {teamMembers.map((member, index) => (
                <div
                  key={`${member.id}-${index}-full`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Image
                      src={member.user.image || "/default-avatar.png"}
                      alt={member.user.name}
                      width={40}
                      height={40}
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {member.user.name}
                        </p>
                        {member.userId === activeTeam.createdById && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
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

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Badge
                      variant={getRoleBadgeVariant(member.role)}
                      className="min-w-[85px] justify-center text-xs py-1"
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
                              className="h-8 w-8 p-0 hover:bg-gray-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                updateMemberRole(member.id, "EDIT")
                              }
                              disabled={member.role === "EDIT"}
                              className="text-sm cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Make Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateMemberRole(member.id, "VIEW")
                              }
                              disabled={member.role === "VIEW"}
                              className="text-sm cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                removeMember(member.id, member.user.name)
                              }
                              className="text-sm text-red-600 cursor-pointer focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with invite button */}
            <div className="p-4 border-t bg-gray-50/50">
              <Button
                className="w-full gap-2 text-sm h-9 hover:bg-blue-700 bg-blue-600"
                onClick={() => setIsInviteModalOpen(true)}
                disabled={!activeTeam || !canInvite}
              >
                <Send className="h-4 w-4" />
                Invite Team Members
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="flex items-center gap-3">
        <Image
          src={user?.picture || "/default-avatar.png"}
          alt="user"
          width={30}
          height={30}
          className="rounded-full"
        />
        <Button
          className="gap-2 flex text-sm h-8 hover:bg-blue-700 bg-blue-600"
          onClick={() => setIsInviteModalOpen(true)}
          disabled={!activeTeam || !canInvite}
        >
          <Send className="h-4 w-4" />
          Invite
        </Button>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamId={activeTeam?.id}
        teamName={activeTeam?.name}
        onInviteSent={onTeamUpdate}
      />
    </div>
  );
}
