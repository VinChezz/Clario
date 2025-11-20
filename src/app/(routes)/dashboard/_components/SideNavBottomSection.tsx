// components/SideNavBottomSection.tsx (оптимизированная версия)
"use client";

import { Button } from "@/components/ui/button";
import { Archive, Flag, Github, Plus, Crown, Lock, Play } from "lucide-react";
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
import { useTour } from "../../../_context/TourContext";
import { useFileData } from "../../../_context/FileDataContext";
import {
  useIsMobile,
  useIsTablet,
  useIsLargeTablet,
  useIsHorizontalMobile,
  useIsLandscape,
  useIsHorizontalTablet,
} from "@/hooks/useMediaQuery";

const StorageIndicator = ({
  totalFiles,
  maxFiles,
  isMobile = false,
  isTablet = false,
  isLargeTablet = false,
  isHorizontalMobile = false,
  isLandscape = false,
}: {
  totalFiles: number;
  maxFiles: number;
  isMobile?: boolean;
  isTablet?: boolean;
  isLargeTablet?: boolean;
  isHorizontalMobile?: boolean;
  isLandscape?: boolean;
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

  const getStorageSize = () => {
    if (isHorizontalMobile || isLandscape) return "p-2 space-y-1.5";
    if (isMobile) return "p-2 space-y-2";
    if (isTablet) return "p-3 space-y-2";
    if (isLargeTablet) return "p-3 space-y-2.5";
    return "p-2 space-y-2";
  };

  const storageSize = getStorageSize();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        `bg-gradient-to-br ${status.bgColor} rounded-xl border border-gray-200 shadow-sm`,
        storageSize
      )}
      id="storage-section"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-semibold text-gray-900",
            isHorizontalMobile || isLandscape
              ? "text-xs"
              : isTablet
              ? "text-xs"
              : "text-sm"
          )}
        >
          Storage
        </span>
        <span
          className={cn(
            "font-bold text-gray-900",
            isHorizontalMobile || isLandscape
              ? "text-xs"
              : isTablet
              ? "text-xs"
              : "text-sm"
          )}
        >
          {totalFiles}/{maxFiles}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="relative h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${status.color}`}
          />
        </div>

        <div className="flex justify-between items-center">
          <span
            className={cn(
              "font-medium",
              status.textColor,
              isHorizontalMobile || isLandscape
                ? "text-[9px]"
                : isTablet
                ? "text-[10px]"
                : "text-xs"
            )}
          >
            {status.message}
          </span>
          <span
            className={cn(
              "text-gray-500",
              isHorizontalMobile || isLandscape
                ? "text-[9px]"
                : isTablet
                ? "text-[10px]"
                : "text-xs"
            )}
          >
            {Math.round(usagePercentage)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

interface SideNavBottomSectionProps {
  onFileCreate: (fileName: string) => void;
  totalFiles?: number;
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
}: SideNavBottomSectionProps) {
  const { user }: any = useKindeBrowserClient();
  const [fileInput, setFileInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { activeTeam } = useActiveTeam();
  const [dbUser, setDbUser] = useState<any>(null);
  const router = useRouter();

  const { startTour } = useTour();
  const { fileCount, hasFiles, isStorageFull } = useFileData();

  const isMobileDevice = useIsMobile();
  const isTabletDevice = useIsTablet();
  const isLargeTabletDevice = useIsLargeTablet();
  const isHorizontalMobileDevice = useIsHorizontalMobile();
  const isHorizontalTablet = useIsHorizontalTablet();
  const isLandscapeDevice = useIsLandscape();

  const actualFileCount = fileCount !== undefined ? fileCount : totalFiles || 0;
  const actualHasFiles =
    hasFiles !== undefined ? hasFiles : actualFileCount > 0;
  const actualIsStorageFull =
    isStorageFull !== undefined
      ? isStorageFull
      : actualFileCount >= Constant.MAX_FREE_FILE;

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

  const handleStartTour = () => {
    startTour();
    onAction?.();
  };

  const menuList = [
    {
      id: 1,
      name: "Show Tour",
      icon: Play,
      onClick: handleStartTour,
    },
    {
      id: 2,
      name: "Github",
      icon: Github,
      onClick: () => window.open("https://github.com/your-repo", "_blank"),
    },
    {
      id: 3,
      name: "Archive",
      icon: Archive,
      onClick: onAction,
    },
  ];

  const getButtonSize = () => {
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        height: "h-9",
        text: "text-xs",
        icon: "h-3.5 w-3.5",
        padding: "px-2.5 py-2",
        gap: "gap-1.5",
        spacing: "space-y-2",
      };
    if (isHorizontalTablet) {
      return {
        height: "h-9",
        text: "text-base",
        icon: "h-3.5 w-3.5",
        padding: "px-2.5 py-2",
        gap: "gap-1.5",
        spacing: "space-y-2",
      };
    }
    if (isMobileDevice)
      return {
        height: "h-14",
        text: "text-base",
        icon: "h-4 w-4",
        padding: "px-3 py-2.5",
        gap: "gap-2",
        spacing: "space-y-2",
      };
    if (isTabletDevice)
      return {
        height: "h-11",
        text: "text-sm",
        icon: "h-4 w-4",
        padding: "px-3 py-2.5",
        gap: "gap-2",
        spacing: "space-y-2.5",
      };
    if (isLargeTabletDevice)
      return {
        height: "h-13",
        text: "text-lg",
        icon: "h-5 w-5",
        padding: "px-4 py-2.5",
        gap: "gap-3",
        spacing: "space-y-4",
      };
    return {
      height: "h-10",
      text: "text-sm",
      icon: "h-5 w-5",
      padding: "px-3 py-3",
      gap: "gap-2",
      spacing: "space-y-2",
    };
  };

  const getUpgradeCardSize = () => {
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        padding: "p-2.5",
        title: "text-sm",
        desc: "text-xs",
        badge: "text-[10px]",
      };
    if (isHorizontalTablet) {
      return {
        padding: "px-3 py-2.5",
        title: "text-sm",
        desc: "text-xs",
        badge: "text-[8px]",
      };
    }
    if (isMobileDevice)
      return {
        padding: "p-3.5",
        title: "text-base",
        desc: "text-sm",
        badge: "text-xs",
      };
    if (isTabletDevice)
      return {
        padding: "p-3",
        title: "text-base",
        desc: "text-sm",
        badge: "text-xs",
      };
    if (isLargeTabletDevice)
      return {
        padding: "p-4",
        title: "text-lg",
        desc: "text-base",
        badge: "text-sm",
      };
    return {
      padding: "p-3",
      title: "text-base",
      desc: "text-sm",
      badge: "text-xs",
    };
  };

  const getSpacing = () => {
    if (isHorizontalMobileDevice || isLandscapeDevice) return "space-y-3";
    if (isMobileDevice) return "space-y-4";
    if (isTabletDevice) return "space-y-3.5";
    if (isLargeTabletDevice) return "space-y-4";
    return "space-y-3";
  };

  const buttonSize = getButtonSize();
  const upgradeCard = getUpgradeCardSize();
  const spacing = getSpacing();

  return (
    <div className={cn(spacing)}>
      <div className={cn("space-y-0.5", buttonSize.spacing)}>
        {menuList.map((menu) => (
          <button
            key={menu.id}
            className={cn(
              "w-full flex items-center text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200",
              buttonSize.padding,
              buttonSize.text,
              buttonSize.gap
            )}
            onClick={menu.onClick}
          >
            <menu.icon className={buttonSize.icon} />
            <span className="font-medium">{menu.name}</span>
          </button>
        ))}
      </div>

      <div
        className={cn(
          "bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl text-white relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
          upgradeCard.padding
        )}
        onClick={handleUpgradeClick}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>

        <div className="relative z-10">
          <div
            className={cn(
              "flex items-center gap-2 mb-2",
              (isHorizontalMobileDevice || isLandscapeDevice) && "mb-1",
              isLargeTabletDevice && "mb-3"
            )}
          >
            <Crown
              className={cn(
                "text-yellow-300",
                isHorizontalMobileDevice || isLandscapeDevice
                  ? "h-3.5 w-3.5"
                  : isLargeTabletDevice
                  ? "h-5 w-5"
                  : "h-4 w-4"
              )}
            />
            <span
              className={cn(
                "font-bold",
                isHorizontalMobileDevice || isLandscapeDevice
                  ? "text-xs"
                  : isLargeTabletDevice
                  ? "text-base"
                  : "text-sm"
              )}
            >
              PRO FEATURES
            </span>
          </div>

          <h3 className={cn("font-bold mb-1", upgradeCard.title)}>
            Unlock Premium
          </h3>
          <p
            className={cn(
              "text-white/90 mb-3 leading-relaxed",
              upgradeCard.desc
            )}
          >
            Get unlimited storage & features
          </p>

          <div className="flex items-center justify-between">
            <span
              className={cn(
                "font-semibold",
                isHorizontalMobileDevice || isLandscapeDevice
                  ? "text-xs"
                  : isLargeTabletDevice
                  ? "text-base"
                  : "text-sm"
              )}
            >
              Upgrade Now
            </span>
            <div
              className={cn(
                "bg-white/20 rounded-full font-medium backdrop-blur-sm",
                isHorizontalMobileDevice || isLandscapeDevice
                  ? "px-2 py-1 text-[10px]"
                  : isLargeTabletDevice
                  ? "px-3 py-1.5 text-sm"
                  : "px-2 py-1 text-xs"
              )}
            >
              $10/mo
            </div>
          </div>
        </div>
      </div>

      {actualHasFiles && (
        <>
          {actualIsStorageFull ? (
            <Button
              className={cn(
                "w-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 shadow-lg cursor-not-allowed relative overflow-hidden",
                buttonSize.height,
                buttonSize.text,
                buttonSize.gap
              )}
              id="storage-full-button"
              disabled
            >
              <Lock className={cn("text-white", buttonSize.icon)} />
              <span className="text-white font-semibold">Storage Full</span>
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger className="w-full" asChild>
                <Button
                  className={cn(
                    "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300",
                    buttonSize.height,
                    buttonSize.text,
                    buttonSize.gap
                  )}
                  disabled={!canCreateFiles || isLoading}
                  id="create-file-button-sidenav"
                >
                  <Plus className={buttonSize.icon} />
                  New File
                </Button>
              </DialogTrigger>

              <DialogContent
                className={cn(
                  "rounded-xl",
                  isHorizontalMobileDevice || isLandscapeDevice
                    ? "sm:max-w-xs"
                    : isMobileDevice
                    ? "sm:max-w-sm"
                    : "sm:max-w-lg",
                  isLargeTabletDevice && "sm:max-w-lg"
                )}
              >
                <DialogHeader>
                  <DialogTitle
                    className={cn(
                      isHorizontalMobileDevice || isLandscapeDevice
                        ? "text-base"
                        : isMobileDevice
                        ? "text-lg"
                        : "text-xl",
                      isLargeTabletDevice && "text-2xl"
                    )}
                  >
                    Create New File
                  </DialogTitle>
                  <DialogDescription
                    className={cn(
                      isHorizontalMobileDevice || isLandscapeDevice
                        ? "text-xs"
                        : isMobileDevice
                        ? "text-sm"
                        : "text-base",
                      isLargeTabletDevice && "text-lg"
                    )}
                  >
                    Give your file a descriptive name
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Input
                    placeholder="Enter file name..."
                    className={cn(
                      "border-gray-300 focus:border-blue-500 rounded-lg",
                      isHorizontalMobileDevice || isLandscapeDevice
                        ? "text-xs h-9"
                        : isMobileDevice
                        ? "text-sm h-10"
                        : "text-base h-12",
                      isLargeTabletDevice && "text-lg h-14"
                    )}
                    onChange={(e) => setFileInput(e.target.value)}
                    value={fileInput}
                    autoFocus
                  />
                </div>

                <DialogFooter
                  className={cn(
                    "gap-3",
                    (isHorizontalMobileDevice || isLandscapeDevice) && "gap-2",
                    isTabletDevice && "gap-2",
                    isLargeTabletDevice && "gap-4"
                  )}
                >
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "border-gray-300 hover:bg-gray-50",
                        isHorizontalMobileDevice || isLandscapeDevice
                          ? "text-xs h-8"
                          : isMobileDevice
                          ? "text-sm h-9"
                          : "text-base h-11",
                        isLargeTabletDevice && "text-lg h-12"
                      )}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      className={cn(
                        "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                        isHorizontalMobileDevice || isLandscapeDevice
                          ? "text-xs h-8"
                          : isMobileDevice
                          ? "text-sm h-9"
                          : "text-base h-11",
                        isLargeTabletDevice && "text-lg h-12"
                      )}
                      disabled={!(fileInput && fileInput.length > 3)}
                      onClick={() => {
                        handleFileCreate(fileInput);
                        setFileInput("");
                      }}
                    >
                      Create File
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      <StorageIndicator
        totalFiles={actualFileCount}
        maxFiles={Constant.MAX_FREE_FILE}
        isMobile={isMobileDevice}
        isTablet={isTabletDevice}
        isLargeTablet={isLargeTabletDevice}
        isHorizontalMobile={isHorizontalMobileDevice}
        isLandscape={isLandscapeDevice}
      />
    </div>
  );
}
