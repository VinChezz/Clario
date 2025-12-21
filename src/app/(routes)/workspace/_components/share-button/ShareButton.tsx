"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Link,
  Copy,
  Send,
  Shield,
  Globe,
  Lock,
  Check,
  MessageCircle,
} from "lucide-react";

interface ShareInfo {
  id: string;
  fileName: string;
  isPublic: boolean;
  shareToken?: string;
  permissions: string;
}

interface ShareButtonProps {
  fileId: string;
  fileName: string;
  permissions: "ADMIN" | "VIEW" | "EDIT";
  children?: React.ReactNode;
}

export default function ShareButton({
  fileId,
  fileName,
  permissions,
  children,
}: ShareButtonProps) {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [discordShared, setDiscordShared] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const canShare = permissions === "EDIT" || permissions === "ADMIN";

  const fetchShareInfo = async () => {
    if (!canShare) {
      toast.error("You don't have permission to share files");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/share?fileId=${fileId}`);
      if (!res.ok) throw new Error("Failed to fetch share info");
      const data = await res.json();
      setShareInfo(data);
    } catch (e) {
      console.error("Error fetching share info:", e);
      toast.error("Failed to load access settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setDiscordShared(false);
      setCopied(false);
    }
  };

  const handleTriggerClick = () => {
    fetchShareInfo();
    setIsOpen(true);
  };

  const handleShareToggle = async (isPublic: boolean, permissions = "VIEW") => {
    if (!canShare) {
      toast.error("You don't have permission to change share settings");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/share", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId, isPublic, permissions }),
      });

      if (!res.ok) throw new Error("Failed to update share settings");

      const updatedFile = await res.json();
      setShareInfo(updatedFile);

      toast.success(isPublic ? "Access is open" : "Access denied", {
        description: isPublic
          ? "Now the file can be shared via a link"
          : "The file is no longer available via the link.",
      });
    } catch (e) {
      console.error("Error updating share settings:", e);
      toast.error("Failed to update access settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const getShareableLink = () => {
    if (!shareInfo?.shareToken) return "";
    return `${window.location.origin}/public/${shareInfo.shareToken}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareableLink());
      setCopied(true);
      toast.success("The link has been copied to the clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy error: ", e);
      toast.error("Failed to copy link");
    }
  };

  const shareToTelegram = () => {
    const text = `Check out the file "${fileName}": ${getShareableLink()}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      getShareableLink()
    )}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank", "width=600,height=400");
  };

  const shareToDiscord = async () => {
    try {
      const text = `📄 Check out the file **"${fileName}"**\n\n${getShareableLink()}`;
      await navigator.clipboard.writeText(text);

      setDiscordShared(true);
      toast.success("Discord message copied! Paste it in your server");
    } catch (error) {
      console.error("Failed to share to Discord:", error);
      toast.error("Failed to prepare Discord message");
    }
  };

  const openDiscord = () => {
    window.open("https://discord.com/channels/@me", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTriggerClick}
          disabled={!canShare}
          className="h-9 px-3 gap-2 font-medium text-gray-700 dark:text-[#f0f0f0] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528] transition-colors rounded-lg"
        >
          <Link className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-linear-to-br from-white to-gray-50/50 dark:from-[#1a1a1c] dark:to-[#252528]/50 border-0 dark:border-[#2a2a2d] shadow-2xl">
        <div className="rounded-xl">
          <DialogHeader className="text-center space-y-1 pb-4">
            <div className="mx-auto w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-500">
              Share File
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-[#a0a0a0] text-sm">
              {fileName}
              {!canShare && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  No permission
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              <div className="bg-white/80 dark:bg-[#252528] backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-[#2a2a2d] shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <Label className="text-xs font-semibold text-gray-900 dark:text-[#f0f0f0]">
                        Public Access
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                        Allow access via link
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={shareInfo?.isPublic || false}
                    onCheckedChange={(checked) => handleShareToggle(checked)}
                    disabled={isUpdating || !canShare}
                    className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500 h-5 w-9"
                  />
                </div>
              </div>

              {shareInfo?.isPublic && (
                <div className="space-y-3">
                  <div className="bg-white/80 dark:bg-[#252528] backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-[#2a2a2d] shadow-sm">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 dark:text-[#f0f0f0] mb-2 block">
                          Shareable Link
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={getShareableLink()}
                            readOnly
                            className="flex-1 font-mono text-xs bg-gray-50/80 dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d] h-8 text-gray-900 dark:text-[#f0f0f0]"
                          />
                          <Button
                            onClick={copyToClipboard}
                            size="sm"
                            variant={copied ? "default" : "outline"}
                            className={`shrink-0 transition-all duration-200 h-8 w-8 p-0 ${
                              copied
                                ? "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 border-green-600"
                                : "border-gray-300 dark:border-[#2a2a2d] hover:bg-gray-50 dark:hover:bg-[#252528]"
                            }`}
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 dark:text-[#f0f0f0]">
                          Access Level
                        </Label>
                        <Select
                          value={shareInfo?.permissions || "VIEW"}
                          onValueChange={(value) =>
                            handleShareToggle(true, value)
                          }
                          disabled={isUpdating || !canShare}
                        >
                          <SelectTrigger className="bg-gray-50/80 dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d] h-8 text-xs text-gray-900 dark:text-[#f0f0f0]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
                            <SelectItem
                              value="VIEW"
                              className="text-xs hover:bg-gray-100 dark:hover:bg-[#252528]"
                            >
                              <div className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5" />
                                View only
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="EDIT"
                              className="text-xs hover:bg-gray-100 dark:hover:bg-[#252528]"
                            >
                              <div className="flex items-center gap-2">
                                <Edit className="h-3.5 w-3.5" />
                                Can edit
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700 dark:text-[#f0f0f0]">
                          Quick Share
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={shareToTelegram}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1 border-gray-300 dark:border-[#2a2a2d] hover:bg-gray-50 dark:hover:bg-[#252528] transition-colors h-8 text-xs text-gray-700 dark:text-[#f0f0f0]"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 48 48"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_318_61)">
                                <path
                                  d="M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48Z"
                                  fill="url(#paint0_linear_318_61)"
                                />
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M10.8638 23.7466C17.8603 20.6984 22.5257 18.6888 24.8601 17.7179C31.5251 14.9456 32.91 14.4641 33.8127 14.4482C34.0113 14.4447 34.4552 14.4939 34.7427 14.7272C34.9855 14.9242 35.0523 15.1904 35.0843 15.3771C35.1163 15.5639 35.1561 15.9895 35.1244 16.3219C34.7633 20.1169 33.2004 29.3263 32.4053 33.5767C32.0689 35.3752 31.4065 35.9783 30.7652 36.0373C29.3714 36.1655 28.3131 35.1162 26.9632 34.2313C24.8509 32.8467 23.6576 31.9847 21.6072 30.6336C19.2377 29.0721 20.7738 28.2139 22.1242 26.8113C22.4776 26.4442 28.6183 20.8587 28.7372 20.352C28.7521 20.2886 28.7659 20.0524 28.6255 19.9277C28.4852 19.803 28.2781 19.8456 28.1286 19.8795C27.9168 19.9276 24.5423 22.158 18.0053 26.5707C17.0475 27.2284 16.1799 27.5489 15.4026 27.5321C14.5457 27.5135 12.8973 27.0475 11.6719 26.6492C10.1689 26.1606 8.97432 25.9023 9.07834 25.0726C9.13252 24.6404 9.72767 24.1984 10.8638 23.7466Z"
                                  fill="white"
                                />
                              </g>
                              <defs>
                                <linearGradient
                                  id="paint0_linear_318_61"
                                  x1="0"
                                  y1="0"
                                  x2="48"
                                  y2="48"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop stopColor="#37AEE2" />
                                  <stop offset="1" stopColor="#1E96C8" />
                                </linearGradient>
                                <clipPath id="clip0_318_61">
                                  <rect width="48" height="48" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                            Telegram
                          </Button>
                          <Button
                            onClick={shareToDiscord}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1 border-gray-300 dark:border-[#2a2a2d] hover:bg-gray-50 dark:hover:bg-[#252528] transition-colors h-8 text-xs text-gray-700 dark:text-[#f0f0f0]"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 48 48"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M40.634 8.31121C37.5747 6.90744 34.294 5.87321 30.8638 5.28087C30.8013 5.26943 30.7389 5.298 30.7067 5.35514C30.2848 6.10557 29.8175 7.08457 29.4902 7.85406C25.8008 7.30172 22.1304 7.30172 18.5166 7.85406C18.1893 7.06747 17.705 6.10557 17.2811 5.35514C17.249 5.29991 17.1866 5.27134 17.1241 5.28087C13.6958 5.87132 10.4151 6.90555 7.35387 8.31121C7.32737 8.32263 7.30465 8.3417 7.28958 8.36644C1.06678 17.6632 -0.6379 26.7314 0.19836 35.6872C0.202144 35.731 0.22674 35.7729 0.260796 35.7995C4.36642 38.8146 8.34341 40.645 12.2466 41.8583C12.309 41.8773 12.3752 41.8545 12.415 41.803C13.3383 40.5422 14.1613 39.2127 14.867 37.8146C14.9086 37.7328 14.8688 37.6356 14.7837 37.6032C13.4783 37.108 12.2352 36.5042 11.0395 35.8186C10.9449 35.7634 10.9373 35.6281 11.0243 35.5633C11.2759 35.3748 11.5276 35.1786 11.7679 34.9805C11.8114 34.9443 11.872 34.9367 11.9231 34.9595C19.7786 38.5461 28.2831 38.5461 36.0459 34.9595C36.097 34.9348 36.1576 34.9424 36.203 34.9786C36.4433 35.1767 36.6949 35.3748 36.9484 35.5633C36.9484 35.5633 36.9484 35.5633 36.9484 35.5633C37.0354 35.6281 37.0298 35.7634 36.9352 35.8186C35.7394 36.5176 34.4964 37.108 33.189 37.6014C33.1039 37.6337 33.0661 37.7328 33.1077 37.8146C33.8285 39.2108 34.6515 40.5402 35.5578 41.8012C35.5957 41.8545 35.6637 41.8773 35.7262 41.8583C39.6483 40.645 43.6252 38.8146 47.7309 35.7995C47.7668 35.7729 47.7895 35.7329 47.7933 35.6891C48.7942 25.3352 46.117 16.3413 40.6964 8.36833C40.6832 8.3417 40.6605 8.32263 40.634 8.31121ZM16.04 30.234C13.675 30.234 11.7263 28.0627 11.7263 25.3962C11.7263 22.7296 13.6372 20.5583 16.04 20.5583C18.4617 20.5583 20.3916 22.7487 20.3538 25.3962C20.3538 28.0627 18.4428 30.234 16.04 30.234ZM31.9895 30.234C29.6245 30.234 27.6758 28.0627 27.6758 25.3962C27.6758 22.7296 29.5867 20.5583 31.9895 20.5583C34.4113 20.5583 36.3411 22.7487 36.3033 25.3962C36.3033 28.0627 34.4113 30.234 31.9895 30.234Z"
                                fill="#5865F2"
                              />
                            </svg>
                            Discord
                          </Button>
                        </div>

                        {discordShared && (
                          <Button
                            onClick={openDiscord}
                            className="w-full h-8 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white transition-all duration-200 text-xs rounded-md"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            Open Discord
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {discordShared && (
                    <div className="bg-linear-to-r from-indigo-50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-800/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-white dark:bg-[#252528] p-1.5 rounded-md shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                          <MessageCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                            Discord Message Ready!
                          </p>
                          <ol className="text-xs text-indigo-700/80 dark:text-indigo-400 mt-0.5 list-decimal list-inside space-y-0.5">
                            <li>Click "Open Discord" above</li>
                            <li>Go to your desired channel</li>
                            <li>Paste the message (Ctrl+V)</li>
                            <li>Send it to share with your team</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-white dark:bg-[#252528] p-1.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-800/50">
                        <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                          {shareInfo?.permissions === "VIEW"
                            ? "View Only Access"
                            : "Edit Access Enabled"}
                        </p>
                        <p className="text-xs text-blue-700/80 dark:text-blue-400">
                          {shareInfo?.permissions === "VIEW"
                            ? "Users can view but cannot make changes"
                            : "Users can view and edit this file"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!shareInfo?.isPublic && (
                <div className="text-center py-6 bg-white/50 dark:bg-[#252528]/50 rounded-lg border border-gray-200/50 dark:border-[#2a2a2d]">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-[#2a2a2d]" />
                  <p className="text-gray-600 dark:text-[#a0a0a0] font-medium text-sm">
                    Enable public access to share the file via a link
                  </p>
                  {!canShare && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1 bg-red-50/50 dark:bg-red-900/20 p-1.5 rounded-md">
                      Only users with EDIT permissions can change share settings
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Eye = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const Edit = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
