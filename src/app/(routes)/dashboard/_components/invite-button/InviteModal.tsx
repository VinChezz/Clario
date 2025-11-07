"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  User,
  Search,
  ArrowLeft,
  Send,
  X,
  Check,
  Copy,
  Mail,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

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
  const { user: currentUser } = useKindeBrowserClient();

  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"main" | "search" | "link">("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [currentPlatform, setCurrentPlatform] = useState<
    "telegram" | "discord"
  >("telegram");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [existingMembers, setExistingMembers] = useState<User[]>([]);

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
    if (!isOpen) {
      setView("main");
      setInviteLink("");
      setSearchQuery("");
      setSelectedUsers([]);
      setUsers([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.log("Search error:", error);
        toast.error("Failed to search users");
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const isUserAlreadyMember = (userId: string) => {
    return existingMembers.some((member) => member.id === userId);
  };

  const isCurrentUser = (user: User) => {
    return user.email === currentUser?.email;
  };

  const handleUserSelect = (user: User) => {
    if (
      !isCurrentUser(user) &&
      !isUserAlreadyMember(user.id) &&
      !selectedUsers.find((u) => u.id === user.id)
    ) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const generateInviteLink = async (platform: "telegram" | "discord") => {
    if (!teamId) {
      toast.error("No team selected");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          type: platform,
          users: [],
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const token = result.inviteToken;
        if (token) {
          const link = `${window.location.origin}/invite/accept?token=${token}`;
          setInviteLink(link);
          setCurrentPlatform(platform);
          setView("link");
          toast.success(
            `${
              platform === "telegram" ? "Telegram" : "Discord"
            } invite link generated`
          );
        }
      } else {
        toast.error(result.error || "Failed to generate link");
      }
    } catch (error) {
      console.error("Invite link error:", error);
      toast.error("Error generating invite link");
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailInvites = async () => {
    if (!teamId || selectedUsers.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: selectedUsers.map((u) => u.id),
          teamId,
          type: "email",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onInviteSent?.();
        toast.success(
          `Invited ${selectedUsers.length} user(s) to ${teamName || "the team"}`
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareToTelegram = () => {
    const text = `🎉 Join "${teamName}" team on our platform!\n\n${inviteLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      inviteLink
    )}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank", "width=600,height=500");
  };

  const shareToDiscord = async () => {
    try {
      const textToCopy = `🎉 **Team Invitation**\n\nJoin **${teamName}**\n\nInvite Link: ${inviteLink}`;

      await navigator.clipboard.writeText(textToCopy);

      toast.success(
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>Discord invite copied! Paste it in your server</span>
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      console.error("Failed to share to Discord:", error);
      toast.error("Failed to prepare Discord invite");
    }
  };

  const handleBackToMain = () => {
    setView("main");
    setInviteLink("");
    setSelectedUsers([]);
    setSearchQuery("");
  };

  if (view === "link") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg bg-linear-to-br from-white to-gray-50/50 border-0 shadow-2xl">
          <div className="rounded-2xl">
            <DialogHeader className="text-center pb-4">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="p-2 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {currentPlatform === "telegram" ? "Telegram" : "Discord"}{" "}
                    Invite
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Share this link with your team
                  </DialogDescription>
                </div>
                <div className="w-10"></div>
              </div>
            </DialogHeader>

            <div className="space-y-6 p-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Invite Link
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="flex-1 font-mono text-sm bg-gray-50/80 border-gray-200"
                      />
                      <Button
                        onClick={copyToClipboard}
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={
                        currentPlatform === "telegram"
                          ? shareToTelegram
                          : shareToDiscord
                      }
                      className={`flex-1 h-12 transition-all duration-200 transform hover:scale-[1.02] ${
                        currentPlatform === "telegram"
                          ? "bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                          : "bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                      }`}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Share on{" "}
                      {currentPlatform === "telegram" ? "Telegram" : "Discord"}
                    </Button>
                  </div>

                  {currentPlatform === "discord" && (
                    <Button
                      onClick={() =>
                        window.open(
                          "https://discord.com/channels/@me",
                          "_blank"
                        )
                      }
                      variant="outline"
                      className="w-full h-12 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-all duration-200 transform hover:scale-[1.02] rounded-xl"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Discord
                    </Button>
                  )}
                </div>
              </div>

              {currentPlatform === "discord" && (
                <div className="bg-linear-to-r from-indigo-50 to-purple-50/50 border border-indigo-200/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-indigo-100">
                      <MessageCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-indigo-900">
                        How to share on Discord
                      </p>
                      <ol className="text-xs text-indigo-700/80 mt-1 list-decimal list-inside space-y-1">
                        <li>Click "Share on Discord" to copy the invite</li>
                        <li>
                          Click {""}
                          <span
                            onClick={() =>
                              window.open(
                                "https://discord.com/channels/@me",
                                "_blank"
                              )
                            }
                            className="font-bold text-indigo-700 hover:text-indigo-800 transition-all duration-200 transform cursor-pointer"
                          >
                            "Open Discord" {""}
                          </span>
                          to go to your Discord
                        </li>
                        <li>Paste the invite in your desired channel</li>
                        <li>Team members can click the link to join</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 border border-blue-200/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                    <Check className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-blue-900">
                      Invite Link Active
                    </p>
                    <p className="text-xs text-blue-700/80 mt-1">
                      This link expires in 7 days • Anyone can join your team
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (view === "search") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg bg-linear-to-br from-white to-gray-50/50 border-0 shadow-2xl">
          <div className="rounded-2xl">
            <DialogHeader className="text-center pb-4">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="p-2 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Invite by Email
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Search and select team members
                  </DialogDescription>
                </div>
                <div className="w-10"></div>
              </div>
            </DialogHeader>

            <div className="space-y-4 p-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-12 bg-white/80 border-gray-200 focus:border-blue-300 transition-colors rounded-xl"
                />
              </div>

              {selectedUsers.length > 0 && (
                <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 border border-blue-200/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-900">
                      Selected ({selectedUsers.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                      className="h-6 text-blue-600 hover:text-blue-800 text-xs hover:bg-blue-100/50 rounded-md transition-colors"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="bg-white/90 text-gray-700 border-blue-200/70 px-3 py-1.5 rounded-full shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="text-[10px] bg-linear-to-br from-blue-100 to-blue-200 text-blue-600">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs max-w-20 truncate font-medium">
                            {user.name}
                          </span>
                          <button
                            onClick={() => removeUser(user.id)}
                            className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : users.length === 0 && searchQuery ? (
                  <div className="text-center py-8 text-gray-500 bg-white/50 rounded-xl border border-gray-200/50">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No users found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                ) : (
                  users.map((user) => {
                    const isSelected = selectedUsers.some(
                      (u) => u.id === user.id
                    );
                    const isAlreadyMember = isUserAlreadyMember(user.id);
                    const isSelf = isCurrentUser(user);

                    return (
                      <button
                        key={user.id}
                        onClick={() => !isSelf && handleUserSelect(user)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border ${
                          isSelected
                            ? "bg-linear-to-r from-blue-50 to-blue-100/50 border-blue-200 shadow-sm"
                            : isSelf
                            ? "bg-gray-50/80 border-gray-200 cursor-not-allowed"
                            : isAlreadyMember
                            ? "bg-green-50/80 border-green-200 cursor-not-allowed"
                            : "bg-white/80 border-gray-200/50 hover:bg-gray-50/80 hover:border-gray-300 hover:shadow-sm"
                        }`}
                        disabled={isSelected || isSelf || isAlreadyMember}
                      >
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={user.image} />
                          <AvatarFallback
                            className={`${
                              isSelf
                                ? "bg-linear-to-br from-gray-100 to-gray-200 text-gray-600"
                                : "bg-linear-to-br from-blue-100 to-indigo-100 text-blue-600"
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {user.name}
                            {isSelf && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-gray-100 text-gray-600 border-gray-300"
                              >
                                <UserCog className="h-3 w-3 mr-1" />
                                You
                              </Badge>
                            )}
                            {isAlreadyMember && !isSelf && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-100 text-green-700 border-green-300"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                In Team
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-green-100 p-1.5 rounded-full shadow-sm">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        {(isSelf || isAlreadyMember) && !isSelected && (
                          <div className="text-xs text-gray-400 italic px-2">
                            {isSelf ? "This is you" : "Already in team"}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {selectedUsers.length > 0 && (
                <Button
                  onClick={sendEmailInvites}
                  disabled={isLoading}
                  className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] rounded-xl"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Invite {selectedUsers.length}{" "}
                  {selectedUsers.length === 1 ? "person" : "people"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-linear-to-br from-white to-gray-50/50 border-0 shadow-2xl">
        <div className="rounded-2xl">
          <DialogHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Invite to {teamName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              Bring your team together
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 p-1">
            <Button
              onClick={() => {
                setView("search");
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              variant="outline"
              className="w-full h-16 justify-start px-6 hover:bg-white/80 hover:border-blue-200 transition-all duration-200 group border-2 border-gray-200/50 rounded-xl hover:shadow-sm"
              disabled={!teamId}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Email Invite</div>
                <div className="text-sm text-gray-500">
                  Search and select users
                </div>
              </div>
            </Button>

            <Button
              onClick={() => generateInviteLink("telegram")}
              variant="outline"
              className="w-full h-16 justify-start px-6 hover:bg-white/80 hover:border-blue-200 transition-all duration-200 group border-2 border-gray-200/50 rounded-xl hover:shadow-sm"
              disabled={!teamId || isLoading}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Telegram</div>
                <div className="text-sm text-gray-500">
                  Generate invite link
                </div>
              </div>
            </Button>

            <Button
              onClick={() => generateInviteLink("discord")}
              variant="outline"
              className="w-full h-16 justify-start px-6 hover:bg-white/80 hover:border-indigo-200 transition-all duration-200 group border-2 border-gray-200/50 rounded-xl hover:shadow-sm"
              disabled={!teamId || isLoading}
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Discord</div>
                <div className="text-sm text-gray-500">
                  Generate invite link
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
