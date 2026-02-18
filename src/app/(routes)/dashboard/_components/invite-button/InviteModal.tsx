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
  Users,
  Search,
  ArrowLeft,
  Send,
  X,
  Check,
  Copy,
  Mail,
  Sparkles,
  Loader2,
  PartyPopper,
  Link2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

type ViewType = "main" | "email" | "link";

export default function InviteModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onInviteSent,
}: InviteModalProps) {
  const { user: currentUser } = useKindeBrowserClient();

  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<ViewType>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [existingMembers, setExistingMembers] = useState<User[]>([]);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

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
      setTimeout(() => {
        setView("main");
        setInviteLink("");
        setSearchQuery("");
        setSelectedUsers([]);
        setUsers([]);
        setSearchError(null);
        setEmailError(null);
        setLinkCopied(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        setSearchError(null);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        if (data.users?.length === 0) {
          setSearchError("No users found. Try a different search.");
        } else {
          setUsers(data.users || []);
        }
      } catch (error) {
        console.log("Search error:", error);
        setSearchError("Failed to search users. Please try again.");
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 400);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const validateEmailInput = () => {
    if (selectedUsers.length === 0) {
      setEmailError("Please select at least one user to invite");
      return false;
    }
    setEmailError(null);
    return true;
  };

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
      setSearchQuery("");
      setEmailError(null);

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const generateInviteLink = async () => {
    if (!teamId) {
      toast.error("No team selected");
      return;
    }

    setIsGeneratingLink(true);
    try {
      const response = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          type: "telegram",
          users: [],
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const token = result.inviteToken;
        if (token) {
          const link = `${window.location.origin}/invite/accept?token=${token}`;
          setInviteLink(link);
          setView("link");
        }
      } else {
        toast.error(result.error || "Failed to generate link");
      }
    } catch (error) {
      console.error("Invite link error:", error);
      toast.error("Error generating invite link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const sendEmailInvites = async () => {
    if (!validateEmailInput()) return;
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
          <div className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4" />
            <span>Successfully invited {selectedUsers.length} user(s)!</span>
          </div>,
        );

        setTimeout(() => {
          setSelectedUsers([]);
          setSearchQuery("");
          setView("main");
          onClose();
        }, 500);
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
      setLinkCopied(true);
      toast.success("✨ Invite link copied to clipboard!");

      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleBackToMain = () => {
    setView("main");
    setInviteLink("");
    setSelectedUsers([]);
    setSearchQuery("");
    setEmailError(null);
  };

  if (view === "main") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <DialogHeader className="text-center space-y-4 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </motion.div>

              <div className="space-y-2">
                <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                  Invite to {teamName}
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 text-base">
                  Choose how you want to invite your team members
                </DialogDescription>
              </div>
            </DialogHeader>

            <motion.div
              className="space-y-3"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeInUp}>
                <Button
                  onClick={() => {
                    setView("email");
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  disabled={!teamId}
                  variant="outline"
                  className="w-full h-20 justify-start px-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl group relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white text-lg">
                      Email Invites
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Search and select team members
                    </div>
                  </div>

                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Button
                  onClick={generateInviteLink}
                  disabled={!teamId || isGeneratingLink}
                  variant="outline"
                  className="w-full h-20 justify-start px-6 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl group relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mr-4">
                    <Link2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white text-lg">
                      Invite Link
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Generate a shareable link
                    </div>
                  </div>

                  {isGeneratingLink ? (
                    <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6"
            >
              ✨ Team members will get access immediately
            </motion.p>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  if (view === "email") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="pb-4">
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBackToMain}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>

                <div className="flex-1 text-center">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    Email Invites
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 dark:text-gray-400">
                    Search and select team members
                  </DialogDescription>
                </div>

                <div className="w-10" />
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-10 pr-4 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl",
                    searchError && "border-red-500 focus:border-red-500",
                  )}
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                )}
              </motion.div>

              <AnimatePresence>
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{searchError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {selectedUsers.length > 0 && (
                  <motion.div
                    key="selected-users"
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Selected ({selectedUsers.length})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUsers([])}
                        className="h-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-md"
                      >
                        Clear all
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-full"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={user.image} />
                                <AvatarFallback className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs max-w-20 truncate font-medium">
                                {user.name}
                              </span>
                              <button
                                onClick={() => removeUser(user.id)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="max-h-64 overflow-y-auto space-y-2 pr-2"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                {!searchLoading &&
                  users.length === 0 &&
                  searchQuery.length >= 2 &&
                  !searchError && (
                    <motion.div
                      variants={fadeInUp}
                      className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700"
                    >
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>No users found</p>
                      <p className="text-sm mt-1">Try a different search</p>
                    </motion.div>
                  )}

                {users.map((user) => {
                  const isSelected = selectedUsers.some(
                    (u) => u.id === user.id,
                  );
                  const isAlreadyMember = isUserAlreadyMember(user.id);
                  const isSelf = isCurrentUser(user);

                  return (
                    <button
                      key={user.id}
                      onClick={() =>
                        !isSelf && !isAlreadyMember && handleUserSelect(user)
                      }
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border",
                        isSelected &&
                          "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                        isSelf &&
                          "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50",
                        isAlreadyMember &&
                          !isSelf &&
                          "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-not-allowed",
                        !isSelected &&
                          !isSelf &&
                          !isAlreadyMember &&
                          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-500 dark:hover:border-blue-400",
                      )}
                      disabled={isSelected || isSelf || isAlreadyMember}
                    >
                      <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span className="truncate">{user.name}</span>
                          {isSelf && (
                            <Badge className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                              You
                            </Badge>
                          )}
                          {isAlreadyMember && !isSelf && (
                            <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              In Team
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full"
                        >
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </motion.div>

              <AnimatePresence>
                {emailError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{emailError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <Button
                      onClick={sendEmailInvites}
                      disabled={isLoading}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg rounded-xl relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send {selectedUsers.length} Invitation
                      {selectedUsers.length > 1 ? "s" : ""}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
          className="relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shadow-xl">
              <CheckCircle2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>
          </motion.div>

          <DialogHeader className="text-center pt-16 pb-4">
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Invite Link Ready
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Share this link with your team members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-4">
                <label className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Shareable Link
                </label>

                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 font-mono text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className={cn(
                      "shrink-0 px-4 rounded-xl transition-all duration-200 flex items-center gap-2",
                      linkCopied
                        ? "bg-green-600 dark:bg-green-500 text-white"
                        : "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white",
                    )}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="bg-white dark:bg-gray-900 p-2 rounded-lg">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    Link Details
                  </p>
                  <ul className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      Expires in 7 days
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      Anyone with the link can join
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      No email required
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3"
            >
              <Button
                onClick={handleBackToMain}
                variant="outline"
                className="flex-1 h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl"
              >
                Back
              </Button>

              <Button
                onClick={onClose}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl"
              >
                Done
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
