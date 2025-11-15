"use client";

import { Button } from "@/components/ui/button";
import { Archive, Flag, Github, Plus, Crown, Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Constant from "@/app/_constant/Constant";
import { TeamMember } from "@prisma/client";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const StorageIndicator = ({
  totalFiles,
  maxFiles,
  isMobile = false,
  isTablet = false,
}: {
  totalFiles: number;
  maxFiles: number;
  isMobile?: boolean;
  isTablet?: boolean;
}) => {
  const usagePercentage = (totalFiles / maxFiles) * 100;
  const remainingFiles = maxFiles - totalFiles;

  const getStorageStatus = () => {
    if (usagePercentage >= 100) {
      return {
        color: "from-red-500 to-red-600",
        bgColor: "from-red-50 to-red-100",
        textColor: "text-red-600",
        message: "Storage full",
      };
    } else if (usagePercentage >= 80) {
      return {
        color: "from-yellow-500 to-orange-500",
        bgColor: "from-yellow-50 to-orange-100",
        textColor: "text-orange-600",
        message: "Almost full",
      };
    } else {
      return {
        color: "from-blue-500 to-indigo-600",
        bgColor: "from-blue-50 to-indigo-100",
        textColor: "text-blue-600",
        message: `${remainingFiles} files left`,
      };
    }
  };

  const status = getStorageStatus();

  const getSizing = () => {
    if (isMobile)
      return { padding: "p-4", text: "text-sm", subtext: "text-xs" };
    if (isTablet)
      return { padding: "p-4", text: "text-sm", subtext: "text-xs" };
    return { padding: "p-3", text: "text-xs", subtext: "text-[10px]" };
  };

  const sizing = getSizing();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        `bg-linear-to-br ${status.bgColor} rounded-xl space-y-3 border border-gray-200 shadow-sm`,
        sizing.padding
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold text-gray-900", sizing.text)}>
            Storage
          </span>
        </div>
        <span className={cn("font-bold text-gray-900", sizing.text)}>
          {totalFiles}/{maxFiles}
        </span>
      </div>

      <div className="space-y-2">
        <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-linear-to-r ${status.color}`}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className={cn("font-medium", status.textColor, sizing.subtext)}>
            {status.message}
          </span>
          <span className={cn("text-gray-500", sizing.subtext)}>
            {Math.round(usagePercentage)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

interface SideNavBottomSectionProps {
  onFileCreate: (fileName: string) => void;
  totalFiles: number;
  isLoading?: boolean;
  onAction?: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

export default function SideNavBottomSection({
  onFileCreate,
  totalFiles,
  isLoading = false,
  onAction,
  isMobile = false,
  isTablet = false,
}: SideNavBottomSectionProps) {
  const { user }: any = useKindeBrowserClient();
  const [fileInput, setFileInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { activeTeam } = useActiveTeam();
  const [dbUser, setDbUser] = useState<any>(null);
  const router = useRouter();

  const isStorageFull = totalFiles >= Constant.MAX_FREE_FILE;

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
      const membersWithDates = activeTeam.members.map((member) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
      }));
      setTeamMembers(membersWithDates);
    } else {
      setTeamMembers([]);
    }
  }, [activeTeam]);

  const currentUserMember = teamMembers.find(
    (member) => member.userId === dbUser?.id
  );
  const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

  const canCreateFiles =
    (isCurrentUserCreator || currentUserMember?.role === "EDIT") &&
    !isStorageFull;

  const handleFileCreate = (fileName: string) => {
    if (isStorageFull) return;
    onFileCreate(fileName);
    onAction?.();
  };

  const handleUpgradeClick = () => {
    router.push("/pricing");
    onAction?.();
  };

  const getButtonSize = () => {
    if (isMobile) return { height: "h-12", text: "text-sm" };
    if (isTablet) return { height: "h-12", text: "text-sm" };
    return { height: "h-9", text: "text-xs" };
  };

  const getUpgradeCardSize = () => {
    if (isMobile) return { padding: "p-4", text: "text-sm" };
    if (isTablet) return { padding: "p-4", text: "text-sm" };
    return { padding: "p-3", text: "text-xs" };
  };

  const buttonSize = getButtonSize();
  const upgradeCard = getUpgradeCardSize();

  const menuList = [
    { id: 1, name: "Getting Started", icon: Flag, path: "" },
    { id: 2, name: "Github", icon: Github, path: "" },
    { id: 3, name: "Archive", icon: Archive, path: "" },
  ];

  return (
    <div className={cn("space-y-4", isTablet && "space-y-4")}>
      <div className="space-y-2">
        {menuList.map((menu) => (
          <button
            key={menu.id}
            className={cn(
              "w-full flex items-center gap-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200",
              isMobile ? "px-4 py-3 text-sm" : "px-4 py-3 text-sm"
            )}
            onClick={onAction}
          >
            <menu.icon className={cn(isMobile ? "h-5 w-5" : "h-5 w-5")} />
            <span>{menu.name}</span>
          </button>
        ))}
      </div>

      <div
        className={cn(
          "bg-linear-to-br from-purple-600 to-indigo-700 rounded-xl text-white relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
          upgradeCard.padding
        )}
        onClick={handleUpgradeClick}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-yellow-300" />
            <span className={cn("font-bold", upgradeCard.text)}>
              PRO FEATURES
            </span>
          </div>

          <h3
            className={cn("font-bold mb-1", isMobile ? "text-lg" : "text-base")}
          >
            Unlock Premium
          </h3>
          <p
            className={cn(
              "text-white/90 mb-3 leading-relaxed",
              isMobile ? "text-sm" : "text-xs"
            )}
          >
            Get unlimited storage & features
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("font-semibold", upgradeCard.text)}>
                Upgrade Now
              </span>
            </div>
            <div className="bg-white/20 rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm">
              $10/mo
            </div>
          </div>
        </div>
      </div>

      {isStorageFull ? (
        <Button
          className={cn(
            "w-full bg-linear-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 gap-2 shadow-lg cursor-not-allowed relative overflow-hidden",
            buttonSize.height,
            buttonSize.text
          )}
          disabled
        >
          <Lock
            className={cn("text-white", isMobile ? "h-4 w-4" : "h-3.5 w-3.5")}
          />
          <span className="text-white font-semibold">Storage Full</span>
        </Button>
      ) : (
        <Dialog>
          <DialogTrigger className="w-full" asChild>
            <Button
              className={cn(
                "w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300",
                buttonSize.height,
                buttonSize.text
              )}
              disabled={!canCreateFiles || isLoading}
            >
              <Plus className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
              New File
            </Button>
          </DialogTrigger>

          <DialogContent
            className={cn(
              "rounded-xl",
              isMobile ? "sm:max-w-md" : "sm:max-w-sm"
            )}
          >
            <DialogHeader>
              <DialogTitle className={cn(isMobile ? "text-lg" : "text-base")}>
                Create New File
              </DialogTitle>
              <DialogDescription
                className={cn(isMobile ? "text-sm" : "text-xs")}
              >
                Give your file a descriptive name
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Enter file name..."
                className={cn(
                  "border-gray-300 focus:border-blue-500",
                  isMobile ? "rounded-lg text-sm" : "rounded-lg text-sm"
                )}
                onChange={(e) => setFileInput(e.target.value)}
                value={fileInput}
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "border-gray-300 hover:bg-gray-50",
                    isMobile ? "text-sm" : "text-xs"
                  )}
                >
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  className="bg-linear-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={!(fileInput && fileInput.length > 3)}
                  onClick={() => {
                    handleFileCreate(fileInput);
                    setFileInput("");
                  }}
                  size={isMobile ? "default" : "sm"}
                >
                  Create File
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <StorageIndicator
        totalFiles={totalFiles}
        maxFiles={Constant.MAX_FREE_FILE}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  );
}
