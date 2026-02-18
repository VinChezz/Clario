"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Link,
  Copy,
  Send,
  Globe,
  Lock,
  Check,
  Eye,
  Edit3,
  Users,
  X,
  ChevronRight,
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
}

export default function ShareButton({
  fileId,
  fileName,
  permissions,
}: ShareButtonProps) {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
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
      setCopied(false);
    } else {
      fetchShareInfo();
    }
  };

  const handleShareToggle = async (
    isPublic: boolean,
    newPermissions = "VIEW",
  ) => {
    if (!canShare) {
      toast.error("You don't have permission to change share settings");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, isPublic, permissions: newPermissions }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update share settings");
      }

      const updatedFile = await res.json();
      setShareInfo(updatedFile);
    } catch (e) {
      console.error("Error updating share settings:", e);
      toast.error(e instanceof Error ? e.message : "Failed to update settings");
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareToTelegram = () => {
    const text = `Check out "${fileName}"`;
    const url = getShareableLink();
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canShare}
          className="h-8 px-2.5 gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
        >
          <Link className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Share</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Share file
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                  {fileName}
                </p>
              </div>
            </div>
            {!canShare && (
              <Badge variant="destructive" className="h-6 px-2 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                No access
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                    {shareInfo?.isPublic ? (
                      <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Public access
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {shareInfo?.isPublic
                        ? "Anyone with the link can access"
                        : "Only you and team members can access"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={shareInfo?.isPublic || false}
                  onCheckedChange={(checked) => handleShareToggle(checked)}
                  disabled={isUpdating || !canShare}
                  className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
                />
              </div>

              <AnimatePresence mode="wait">
                {shareInfo?.isPublic && (
                  <motion.div
                    key="share-content"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Shareable link
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={getShareableLink()}
                          readOnly
                          className="flex-1 h-9 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <Button
                          onClick={copyToClipboard}
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-9 px-3 border-gray-200 dark:border-gray-700",
                            copied &&
                              "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                          )}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Access level
                      </p>
                      <Select
                        value={shareInfo?.permissions || "VIEW"}
                        onValueChange={(value) =>
                          handleShareToggle(true, value)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-full h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                          <SelectItem
                            value="VIEW"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 py-1">
                              <Eye className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100">
                                Can view
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="EDIT"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 py-1">
                              <Edit3 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100">
                                Can edit
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Quick share
                      </p>
                      <Button
                        onClick={shareToTelegram}
                        variant="outline"
                        className="w-full h-9 gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                      >
                        <Send className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm">Share on Telegram</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!shareInfo?.isPublic && !isLoading && (
                <div className="text-center py-6 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Private file
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] mx-auto">
                    Enable public access to get a shareable link
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {shareInfo?.isPublic
                ? "Anyone with the link can access"
                : "Only you and your team"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 px-3 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
