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
import { toast } from "sonner";
import { Link } from "lucide-react";

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
  permissions: "VIEW" | "EDIT";
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
      toast.success("The link has been copied to the clipboard.");
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-8 text-[12px] gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          onClick={fetchShareInfo}
          disabled={!canShare}
        >
          {children || <Link className="h-4 w-4" />}
          Share
          {!canShare && <span className="text-xs">(No permission)</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share file</DialogTitle>
          <DialogDescription>
            Set up access to file "{fileName}"
            {!canShare && (
              <span className="text-red-500 block mt-1">
                You don't have permission to change share settings
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label
                htmlFor="public-access"
                className="flex flex-col space-y-1"
              >
                <span>Public access</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Allow access via link
                </span>
              </Label>
              <Switch
                id="public-access"
                checked={shareInfo?.isPublic || false}
                onCheckedChange={(checked) => handleShareToggle(checked)}
                disabled={isUpdating || !canShare}
              />
            </div>

            {shareInfo?.isPublic && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="space-y-2">
                  <Label>Access link</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={getShareableLink()}
                      readOnly
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      variant="secondary"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permissions">Access rights</Label>
                  <Select
                    value={shareInfo?.permissions || "VIEW"}
                    onValueChange={(value) => handleShareToggle(true, value)}
                    disabled={isUpdating || !canShare}
                  >
                    <SelectTrigger id="permissions">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEW">View only</SelectItem>
                      <SelectItem value="EDIT">Editing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quick sharing</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={shareToTelegram}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Telegram
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const text = `Hi! Check out the file "${fileName}": ${getShareableLink()}`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                          text
                        )}`;
                        window.open(whatsappUrl, "_blank");
                      }}
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {shareInfo?.permissions === "VIEW"
                    ? "Users will only be able to view the file"
                    : "Users will be able to edit the file"}
                </div>
              </div>
            )}

            {!shareInfo?.isPublic && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Enable public access to share the file via a link</p>
                {!canShare && (
                  <p className="text-red-500 text-sm mt-2">
                    Only users with EDIT permissions can change share settings
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
