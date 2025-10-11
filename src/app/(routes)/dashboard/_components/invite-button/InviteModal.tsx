"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, X, User, MessageCircle, Send, Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  teamId?: string;
  teamName?: string;
}

export default function InviteModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onInviteSent,
}: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [existingMembers, setExistingMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"main" | "search">("main");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchExistingMembers = async () => {
      if (!teamId) return;

      try {
        const response = await fetch(`/api/teams/${teamId}/members`);
        if (response.ok) {
          const data = await response.json();
          setExistingMembers(data.members || []);
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error);
      }
    };

    if (isOpen && teamId) {
      fetchExistingMembers();
    }
  }, [isOpen, teamId]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.log("Search error: ", error);
        toast.error("Failed to search users");
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const isUserAlreadyMember = (userId: string) => {
    return existingMembers.some((member) => member.id === userId);
  };

  const handleUserSelect = (user: User) => {
    if (
      !selectedUsers.find((u) => u.id === user.id) &&
      !isUserAlreadyMember(user.id)
    ) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setUsers([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleInvite = async (type: "email" | "telegram" | "discord") => {
    if (!teamId) {
      toast.error("No team selected");
      return;
    }

    if (selectedUsers.length === 0 && type === "email") {
      toast.warning("Please select at least one user to invite");
      return;
    }

    const alreadyMembers = selectedUsers.filter((user) =>
      isUserAlreadyMember(user.id)
    );
    if (alreadyMembers.length > 0) {
      toast.error(
        `Some users are already team members: ${alreadyMembers
          .map((u) => u.name)
          .join(", ")}`
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: type === "email" ? selectedUsers.map((u) => u.id) : [],
          teamId: teamId,
          type,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onInviteSent?.();
        if (type === "email") {
          for (const user of selectedUsers) {
            try {
              const invite = result.invites.find(
                (inv: any) => inv.inviteeId === user.id
              );
              if (invite) {
                const emailResponse = await fetch("/api/send-invite", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: user.email,
                    inviterName: user.name,
                    teamName: teamName || "Our Team",
                    inviteLink: `${window.location.origin}/invite/accept?token=${invite.token}`,
                  }),
                });

                const emailResult = await emailResponse.json();

                if (emailResult.warning) {
                  console.warn("Email warning:", emailResult.warning);
                  toast.warning(
                    `Invite sent to ${user.email}, but email delivery may be delayed`
                  );
                }
              }
            } catch (emailError) {
              console.error("Failed to send email to", user.email, emailError);
            }
          }
        }

        toast.success(
          type === "email"
            ? `Invited ${selectedUsers.length} user(s) to ${
                teamName || "the team"
              }`
            : `Share this link via ${type}`
        );
        setSelectedUsers([]);
        setSearchQuery("");
        setView("main");
        onClose();
      } else {
        toast.error(result.error || "Failed to send invites");
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Failed to send invites");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
        <DialogTitle className="sr-only">Invite Team Members</DialogTitle>
        <DialogDescription className="sr-only">
          Search for users to invite or share via external platforms
        </DialogDescription>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {teamName && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-center text-gray-700">
                Invite to {teamName}
              </h3>
            </div>
          )}

          <div className="p-6 pb-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setView("search");
                }}
                onFocus={() => setView("search")}
                className="pl-10 pr-4 h-12 bg-gray-50/50 border-0 text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.image} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {view === "main" && (
              <div className="p-6 space-y-4">
                <div className="text-center text-gray-500 mb-4">
                  Choose how to invite team members
                </div>

                <Button
                  onClick={() => {
                    setView("search");
                    searchInputRef.current?.focus();
                  }}
                  variant="outline"
                  className="w-full h-14 justify-start px-4 text-lg hover:bg-gray-50 border-gray-200"
                >
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium">Invite by email</div>
                    <div className="text-sm text-gray-400">
                      Search and select users
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleInvite("telegram")}
                  variant="outline"
                  className="w-full h-14 justify-start px-4 text-lg hover:bg-gray-50 border-gray-200"
                  disabled={isLoading}
                >
                  <MessageCircle className="h-5 w-5 mr-3 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Share via Telegram</div>
                    <div className="text-sm text-gray-400">
                      Generate invite link
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleInvite("discord")}
                  variant="outline"
                  className="w-full h-14 justify-start px-4 text-lg hover:bg-gray-50 border-gray-200"
                  disabled={isLoading}
                >
                  <MessageCircle className="h-5 w-5 mr-3 text-indigo-500" />
                  <div className="text-left">
                    <div className="font-medium">Share via Discord</div>
                    <div className="text-sm text-gray-400">
                      Generate invite link
                    </div>
                  </div>
                </Button>
              </div>
            )}

            {view === "search" && (
              <div className="p-2">
                {isLoading && (
                  <div className="p-4 text-center text-gray-400">
                    Searching...
                  </div>
                )}

                {!isLoading && users.length === 0 && searchQuery && (
                  <div className="p-4 text-center text-gray-400">
                    No users found for "{searchQuery}"
                  </div>
                )}

                {users.map((user) => {
                  const isAlreadyMember = isUserAlreadyMember(user.id);
                  const isSelected = selectedUsers.some(
                    (u) => u.id === user.id
                  );

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isAlreadyMember
                          ? "bg-gray-100 cursor-not-allowed opacity-50"
                          : isSelected
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      disabled={isLoading || isAlreadyMember || isSelected}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {isAlreadyMember && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              <Check className="h-3 w-3" />
                              Already in team
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {view === "search" && selectedUsers.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <Button
                onClick={() => handleInvite("email")}
                disabled={isLoading || !teamId}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Invite {selectedUsers.length} user
                {selectedUsers.length > 1 ? "s" : ""} to {teamName || "team"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
