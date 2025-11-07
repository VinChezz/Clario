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

  const canShare = permissions === "EDIT";

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
          className="h-8 px-3 gap-2 font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 transition-colors rounded-lg"
        >
          <Link className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-sm">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-linear-to-br from-white to-gray-50/50 border-0 shadow-2xl">
        <div className="rounded-xl">
          <DialogHeader className="text-center space-y-1 pb-4">
            <div className="mx-auto w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Share File
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4 p-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <Label className="text-xs font-semibold text-gray-900">
                        Public Access
                      </Label>
                      <p className="text-xs text-gray-500">
                        Allow access via link
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={shareInfo?.isPublic || false}
                    onCheckedChange={(checked) => handleShareToggle(checked)}
                    disabled={isUpdating || !canShare}
                    className="data-[state=checked]:bg-blue-600 h-5 w-9"
                  />
                </div>
              </div>

              {shareInfo?.isPublic && (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                          Shareable Link
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={getShareableLink()}
                            readOnly
                            className="flex-1 font-mono text-xs bg-gray-50/80 border-gray-200 h-8"
                          />
                          <Button
                            onClick={copyToClipboard}
                            size="sm"
                            variant={copied ? "default" : "outline"}
                            className={`shrink-0 transition-all duration-200 h-8 w-8 p-0 ${
                              copied
                                ? "bg-green-600 hover:bg-green-700 border-green-600"
                                : "border-gray-300 hover:bg-gray-50"
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
                        <Label className="text-xs font-semibold text-gray-700">
                          Access Level
                        </Label>
                        <Select
                          value={shareInfo?.permissions || "VIEW"}
                          onValueChange={(value) =>
                            handleShareToggle(true, value)
                          }
                          disabled={isUpdating || !canShare}
                        >
                          <SelectTrigger className="bg-gray-50/80 border-gray-200 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEW" className="text-xs">
                              <div className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5" />
                                View only
                              </div>
                            </SelectItem>
                            <SelectItem value="EDIT" className="text-xs">
                              <div className="flex items-center gap-2">
                                <Edit className="h-3.5 w-3.5" />
                                Can edit
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-700">
                          Quick Share
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={shareToTelegram}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1 border-gray-300 hover:bg-gray-50 transition-colors h-8 text-xs"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Telegram
                          </Button>
                          <Button
                            onClick={shareToDiscord}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1 border-gray-300 hover:bg-gray-50 transition-colors h-8 text-xs"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Discord
                          </Button>
                        </div>

                        {discordShared && (
                          <Button
                            onClick={openDiscord}
                            className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 text-xs rounded-md"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            Open Discord
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {discordShared && (
                    <div className="bg-linear-to-r from-indigo-50 to-purple-50/50 border border-indigo-200/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="bg-white p-1.5 rounded-md shadow-sm border border-indigo-100">
                          <MessageCircle className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-indigo-900">
                            Discord Message Ready!
                          </p>
                          <ol className="text-xs text-indigo-700/80 mt-0.5 list-decimal list-inside space-y-0.5">
                            <li>Click "Open Discord" above</li>
                            <li>Go to your desired channel</li>
                            <li>Paste the message (Ctrl+V)</li>
                            <li>Send it to share with your team</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-linear-to-r from-blue-50 to-indigo-50/50 border border-blue-200/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="bg-white p-1.5 rounded-md shadow-sm border border-blue-100">
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-blue-900">
                          {shareInfo?.permissions === "VIEW"
                            ? "View Only Access"
                            : "Edit Access Enabled"}
                        </p>
                        <p className="text-xs text-blue-700/80">
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
                <div className="text-center py-6 bg-white/50 rounded-lg border border-gray-200/50">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-600 font-medium text-sm">
                    Enable public access to share the file via a link
                  </p>
                  {!canShare && (
                    <p className="text-red-500 text-xs mt-1 bg-red-50/50 p-1.5 rounded-md">
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
