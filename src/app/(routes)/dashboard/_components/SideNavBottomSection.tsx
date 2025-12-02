"use client";

import { Button } from "@/components/ui/button";
import {
  Github,
  Plus,
  Crown,
  Lock,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  FileText,
  Badge,
} from "lucide-react";
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
import { GithubConnectModal } from "./github-modal/GithubConnectModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StorageIndicator = ({
  usedSlots,
  maxSlots,
  actualFileCount,
  plan = "FREE",
  isMobile = false,
  isTablet = false,
  isLargeTablet = false,
  isHorizontalMobile = false,
  isLandscape = false,
}: {
  usedSlots: number;
  maxSlots: number;
  actualFileCount: number;
  plan?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  isLargeTablet?: boolean;
  isHorizontalMobile?: boolean;
  isLandscape?: boolean;
}) => {
  const usagePercentage = (usedSlots / maxSlots) * 100;
  const remainingSlots = maxSlots - usedSlots;
  const filesInTrash = usedSlots - actualFileCount;

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
        message: `${remainingSlots} files left`,
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
        `bg-linear-to-br ${status.bgColor} rounded-xl border border-gray-200 shadow-sm`,
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
          Storage {plan !== "FREE" && `(${plan})`}
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
          {usedSlots}/{maxSlots}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="relative h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-linear-to-r ${status.color}`}
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

      {plan === "FREE" && filesInTrash > 0 && (
        <div className="pt-1">
          <div className="text-[10px] text-gray-500 flex justify-between">
            <span>{actualFileCount} active</span>
            <span>{filesInTrash} in trash</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const OrientationWarningModal = ({
  isOpen,
  onClose,
  onRetry,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}) => {
  const isTabletDevice = useIsTablet();
  const isLargeTabletDevice = useIsLargeTablet();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-4">
            <RotateCcw className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            Rotate your device
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {isTabletDevice || isLargeTabletDevice ? (
              <>
                For comfortable viewing of the tour on a tablet, we recommend
                using landscape orientation.
                <br />
                <br />
                Please rotate your device to landscape mode and tap "Try Again."
              </>
            ) : (
              "For best viewing of the tour, it is recommended to use horizontal device orientation."
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onRetry}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SideNavBottomSectionProps {
  onFileCreate: (fileName: string) => void;
  totalFiles?: number;
  onAction?: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
  windowHeight?: number | null;
}

export default function SideNavBottomSection({
  onFileCreate,
  totalFiles,
  onAction,
  windowHeight,
}: SideNavBottomSectionProps) {
  const { user, isLoading: isUserLoading } = useKindeBrowserClient();
  const [fileInput, setFileInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [storageData, setStorageData] = useState({
    usedSlots: 0,
    maxSlots: 10,
    actualFileCount: 0,
    plan: "FREE",
  });
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isCheckingRepo, setIsCheckingRepo] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState<any[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);

  const router = useRouter();

  const { startTour } = useTour();
  const { fileCount, hasFiles, isStorageFull, updateFromFileList } =
    useFileData();

  const { activeTeam, isLoading: isTeamLoading } = useActiveTeam();

  const isMobileDevice = useIsMobile();
  const isTabletDevice = useIsTablet();
  const isLargeTabletDevice = useIsLargeTablet();
  const isHorizontalMobileDevice = useIsHorizontalMobile();
  const isHorizontalTablet = useIsHorizontalTablet();
  const isLandscapeDevice = useIsLandscape();

  const refreshStorageData = async () => {
    if (!user?.email || !activeTeam?.id) return;

    setIsLoadingStorage(true);
    try {
      const response = await fetch(
        `/api/users/storage?teamId=${activeTeam.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch storage data");
      }
      const data = await response.json();

      console.log("Storage data refreshed:", data);

      setStorageData({
        usedSlots: data.storage?.usedSlots || 0,
        maxSlots: data.storage?.maxSlots || 10,
        actualFileCount: data.storage?.actualFileCount || 0,
        plan: data.user?.plan || "FREE",
      });

      if (updateFromFileList) {
        const filesResponse = await fetch(`/api/files?teamId=${activeTeam.id}`);
        const files = await filesResponse.json();
        updateFromFileList(files);
      }
    } catch (error) {
      console.error("Failed to load storage data:", error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (user?.email && activeTeam?.id) {
      console.log("Team changed, refreshing storage:", activeTeam.id);
      refreshStorageData();
    }
  }, [user?.email, activeTeam?.id]);

  useEffect(() => {
    if (fileCount !== undefined) {
      console.log("File count updated in context:", fileCount);

      setStorageData((prev) => ({
        ...prev,
        actualFileCount: fileCount,
      }));
    }
  }, [fileCount]);

  const actualFileCount = fileCount !== undefined ? fileCount : totalFiles || 0;
  const actualHasFiles =
    hasFiles !== undefined ? hasFiles : actualFileCount > 0;
  const actualIsStorageFull =
    isStorageFull !== undefined
      ? isStorageFull
      : storageData.usedSlots >= storageData.maxSlots;

  useEffect(() => {
    if (user?.email) {
      fetch("/api/auth/user")
        .then((res) => res.json())
        .then((data) => setDbUser(data))
        .catch((error) => console.error("Failed to load user:", error));
    }
  }, [user]);

  const currentUserMember = teamMembers.find(
    (member) => member.userId === dbUser?.id
  );
  const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

  const canCreateFiles =
    (isCurrentUserCreator || currentUserMember?.role === "EDIT") &&
    !actualIsStorageFull;

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

  useEffect(() => {
    if (activeTeam?.id) {
      checkGithubConnection();
    }
  }, [activeTeam?.id]);

  const checkGithubConnection = async () => {
    if (!activeTeam?.id) return;

    setIsCheckingRepo(true);
    try {
      const response = await fetch(
        `/api/github/connect?teamId=${activeTeam.id}`
      );
      const result = await response.json();
      setIsGithubConnected(result.connected);
    } catch (error) {
      console.error("Failed to check GitHub connection:", error);
      setIsGithubConnected(false);
    } finally {
      setIsCheckingRepo(false);
    }
  };

  const handleRepoConnected = () => {
    checkGithubConnection();
  };

  const handleFileCreate = async (fileName: string) => {
    if (actualIsStorageFull) return;

    try {
      onFileCreate(fileName);
      onAction?.();

      setTimeout(() => {
        refreshStorageData();
      }, 500);
    } catch (error) {
      console.error("Error creating file:", error);
    }
  };

  const handleDeletePermanently = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/permanent`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFileToDelete(null);
        fetchDeletedFiles();

        refreshStorageData();
      }
    } catch (error) {
      console.error("❌ Error deleting file permanently:", error);
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: "PATCH",
      });

      if (response.ok) {
        fetchDeletedFiles();

        refreshStorageData();
      }
    } catch (error) {
      console.error("Failed to restore file:", error);
    }
  };

  const handleUpgradeClick = () => {
    router.push("/pricing");
    onAction?.();
  };

  const canStartTour = () => {
    if (isTabletDevice || isLargeTabletDevice) {
      const isHorizontal = window.innerWidth > window.innerHeight;
      if (!isHorizontal) {
        setShowOrientationWarning(true);
        return false;
      }
    }
    return true;
  };

  const handleStartTour = () => {
    if (canStartTour()) {
      startTour();
      onAction?.();
    }
  };

  const handleRetryTour = () => {
    setShowOrientationWarning(false);

    setTimeout(() => {
      if (canStartTour()) {
        startTour();
        onAction?.();
      } else {
        setShowOrientationWarning(true);
      }
    }, 500);
  };

  const shouldShowTourButton = !isMobileDevice && !isHorizontalMobileDevice;

  const fetchDeletedFiles = async () => {
    if (!activeTeam?.id) return;

    setIsLoadingTrash(true);
    try {
      const response = await fetch(`/api/files/trash?teamId=${activeTeam.id}`);
      if (response.ok) {
        const files = await response.json();
        setDeletedFiles(files);
      }
    } catch (error) {
      console.error("Failed to fetch deleted files:", error);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const menuList = [
    ...(shouldShowTourButton
      ? [
          {
            id: 1,
            name: "Show Tour",
            icon: Play,
            onClick: handleStartTour,
            className: "",
          },
        ]
      : []),
    {
      id: 2,
      name: isGithubConnected ? "View Repository" : "Connect Repo",
      icon: isGithubConnected ? CheckCircle2 : Github,
      description: isGithubConnected
        ? "View connected GitHub repository"
        : "Link your GitHub repository",
      onClick: () => setGithubModalOpen(true),
      className: isGithubConnected
        ? "text-green-600 hover:text-green-700 hover:bg-green-50"
        : "",
    },
    {
      id: 3,
      name: "Trash",
      icon: Trash2,
      onClick: () => {
        setTrashModalOpen(true);
        fetchDeletedFiles();
        onAction?.();
      },
      className: "",
    },
  ];

  const getButtonSize = () => {
    if (isMobileDevice)
      return {
        height: "h-10",
        text: "text-sm",
        icon: "h-4 w-4",
        padding: "px-3 py-2.5",
        gap: "gap-2",
        spacing: "space-y-2",
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        height: "h-9",
        text: "text-xs",
        icon: "h-3.5 w-3.5",
        padding: "px-2.5 py-1.5",
        gap: "gap-1.5",
        spacing: "space-y-1",
      };
    if (isHorizontalTablet) {
      return {
        height: "h-9",
        text: "text-sm",
        icon: "h-3.5 w-3.5",
        padding: "px-2.5 py-2",
        gap: "gap-1.5",
        spacing: "space-y-4",
      };
    }
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
    if (isMobileDevice)
      return {
        padding: "p-2.5",
        title: "text-sm",
        desc: "text-xs",
        badge: "text-xs",
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        padding: "p-1.5",
        title: "text-xs",
        desc: "text-xs",
        badge: "text-[8px]",
      };
    if (isHorizontalTablet) {
      return {
        padding: "px-3 py-2",
        title: "text-sm",
        desc: "text-xs",
        badge: "text-[8px]",
      };
    }
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
      padding: "p-2.5",
      title: "text-base",
      desc: "text-sm",
      badge: "text-xs",
    };
  };

  const getModalSizes = () => {
    if (isMobileDevice)
      return {
        teams: "max-w-[95vw] max-h-[87vh]",
        files: "max-w-[95vw] max-h-[90vh]",
        title: "text-base",
        inputHeight: "h-7",
        teamAvatar: "w-10 h-10 text-xs",
        fileGrid: "grid-cols-2",
        contentPadding: "p-3.5",
        teamItemPadding: "p-2",
        headerPadding: "px-3.5 pt-3.5 pb-3",
        searchPadding: "px-3.5 pb-3",
        teamsPadding: "px-3.5 pt-0",
        quickAccessPadding: "px-3.5",
        userPadding: "px-3.5",
        separatorMargin: "mx-3.5",
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        teams: "max-w-[85vw]",
        files: "max-w-[85vw]",
        title: "text-lg",
        inputHeight: "h-9",
        teamAvatar: "w-8 h-8 text-xs",
        fileGrid: "grid-cols-1",
        contentPadding: "p-3",
        teamItemPadding: "p-2",
        headerPadding: "px-3 pt-3 pb-2",
        searchPadding: "px-3 pb-2",
        teamsPadding: "px-3 pt-0",
        quickAccessPadding: "px-3",
        userPadding: "px-3",
        separatorMargin: "mx-3",
      };
    if (isHorizontalTablet) {
      return {
        teams: "max-w-[80vw]",
        files: "max-w-[80vw]",
        title: "text-lg",
        inputHeight: "h-9",
        teamAvatar: "w-8 h-8 text-sm",
        fileGrid: "grid-cols-2",
        contentPadding: "p-4",
        teamItemPadding: "p-3",
        headerPadding: "px-4 pt-4 pb-3",
        searchPadding: "px-4 pb-3",
        teamsPadding: "px-4 pt-0",
        quickAccessPadding: "px-4",
        userPadding: "px-4",
        separatorMargin: "mx-4",
      };
    }
    if (isTabletDevice)
      return {
        teams: "max-w-md",
        files: "max-w-2xl",
        title: "text-lg",
        inputHeight: "h-10",
        teamAvatar: "w-10 h-10 text-sm",
        fileGrid: "grid-cols-2",
        contentPadding: "p-5",
        teamItemPadding: "p-3",
        headerPadding: "px-5 pt-5 pb-4",
        searchPadding: "px-5 pb-4",
        teamsPadding: "px-5 pt-0",
        quickAccessPadding: "px-5",
        userPadding: "px-5",
        separatorMargin: "mx-5",
      };
    if (isLargeTabletDevice)
      return {
        teams: "max-w-lg",
        files: "max-w-3xl",
        title: "text-2xl",
        teamText: "text-xl",
        inputHeight: "h-12",
        teamAvatar: "w-12 h-12 text-base",
        fileGrid: "grid-cols-3",
        contentPadding: "p-6",
        teamItemPadding: "p-4",
        headerPadding: "px-6 pt-6 pb-5",
        searchPadding: "px-6 pb-5",
        teamsPadding: "px-6 pt-0",
        quickAccessPadding: "px-6",
        userPadding: "px-6",
        separatorMargin: "mx-6",
      };

    return {
      teams: "max-w-lg",
      files: "max-w-4xl",
      title: "text-xl",
      inputHeight: "h-8",
      teamAvatar: "w-10 h-10 text-sm",
      fileGrid: "grid-cols-3",
      contentPadding: "p-4",
      teamItemPadding: "p-3",
      headerPadding: "px-6 pt-6 pb-4",
      searchPadding: "px-4 pb-4",
      teamsPadding: "px-6 pt-0",
      quickAccessPadding: "px-6",
      userPadding: "px-6",
      separatorMargin: "mx-4",
    };
  };

  const getSpacing = () => {
    if (isHorizontalMobileDevice || isLandscapeDevice) return "space-y-1";
    if (isMobileDevice) return "space-y-2";
    if (isTabletDevice) return "space-y-3.5";
    if (isLargeTabletDevice) return "space-y-4";
    return "space-y-3";
  };

  const buttonSize = getButtonSize();
  const upgradeCard = getUpgradeCardSize();
  const modalSizes = getModalSizes();
  const spacing = getSpacing();

  console.log("creator:", isCurrentUserCreator);
  console.log("member role:", currentUserMember?.role);

  return (
    <>
      <div
        className={cn(
          "flex flex-col justify-between",
          isMobileDevice || isHorizontalMobileDevice || isLandscapeDevice
            ? "overflow-hidden"
            : "overflow-visible"
        )}
      >
        <div className={cn("flex-1", spacing)}>
          <div className={cn("space-y-0.5", buttonSize.spacing)}>
            {menuList.map((menu) => (
              <button
                key={menu.id}
                className={cn(
                  "w-full flex items-center text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200",
                  buttonSize.padding,
                  buttonSize.text,
                  buttonSize.gap,
                  menu.className
                )}
                onClick={menu.onClick}
                disabled={menu.id === 2 && isCheckingRepo}
              >
                <menu.icon className={buttonSize.icon} />
                <span className="font-medium">{menu.name}</span>
                {menu.id === 2 && isCheckingRepo && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="ml-auto"
                  >
                    <div className="h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          {isHorizontalMobileDevice && isLandscapeDevice ? (
            <div
              className={cn(
                "bg-linear-to-br from-purple-600 to-indigo-700 rounded-xl text-white relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
                upgradeCard.padding
              )}
              onClick={handleUpgradeClick}
            >
              <h3 className={cn("font-bold mb-1", upgradeCard.title)}>
                Unlock Premium
              </h3>

              <p
                className={cn(
                  "text-white/90 leading-relaxed",
                  upgradeCard.desc
                )}
              >
                Get unlimited storage & features
              </p>

              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-semibold",
                    isLargeTabletDevice
                      ? "text-base"
                      : isHorizontalMobileDevice || isLandscapeDevice
                      ? "text-[10px]"
                      : "text-sm"
                  )}
                >
                  Upgrade Now
                </span>

                <div
                  className={cn(
                    "bg-white/20 rounded-full font-medium backdrop-blur-sm",
                    isLargeTabletDevice
                      ? "px-3 py-1.5 text-sm"
                      : isHorizontalMobileDevice || isLandscapeDevice
                      ? "px-2 py-0.5 text-[9px]"
                      : "px-2 py-1 text-xs"
                  )}
                >
                  $10/mo
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "bg-linear-to-br from-purple-600 to-indigo-700 rounded-xl text-white relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
                upgradeCard.padding
              )}
              onClick={handleUpgradeClick}
            >
              <div className="absolute inset-0 bg-[radial-linear(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>

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
          )}

          {actualHasFiles && (
            <>
              {actualIsStorageFull ? (
                <Button
                  className={cn(
                    "w-full bg-linear-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 shadow-lg cursor-not-allowed relative overflow-hidden",
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
                        "w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300",
                        buttonSize.height,
                        buttonSize.text,
                        buttonSize.gap
                      )}
                      disabled={!canCreateFiles}
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
                        (isHorizontalMobileDevice || isLandscapeDevice) &&
                          "gap-2",
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
                            "bg-linear-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
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

          <Dialog open={trashModalOpen} onOpenChange={setTrashModalOpen}>
            <DialogContent
              className={cn(
                "p-0 gap-0 overflow-hidden rounded-2xl max-w-2xl",
                isHorizontalMobileDevice || isLandscapeDevice
                  ? "max-h-96"
                  : "max-h-[600px]"
              )}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader className="px-7 pt-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle
                    className={cn("font-bold text-gray-900", modalSizes.title)}
                  >
                    Trash
                  </DialogTitle>
                  <Badge className="text-xs font-semibold bg-white shadow-sm px-3 py-1">
                    {deletedFiles.length}
                  </Badge>
                </div>
              </DialogHeader>

              <div
                className={cn(
                  "overflow-y-auto p-5 pt-1",
                  isHorizontalMobileDevice ||
                    isLandscapeDevice ||
                    isHorizontalTablet
                    ? "max-h-48"
                    : "max-h-[480px]"
                )}
              >
                {deletedFiles && deletedFiles.length > 0 ? (
                  <div className={cn("grid gap-3", modalSizes.fileGrid)}>
                    {deletedFiles.map((file) => (
                      <div
                        key={file.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRestoreFile(file.id)}
                        className="group flex flex-col rounded-xl border border-gray-200 bg-white
                        hover:bg-linear-to-br hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50
                        hover:border-indigo-200 hover:shadow-md hover:-translate-y-1
                        transition-all duration-300 overflow-hidden cursor-pointer"
                      >
                        <div
                          className="relative w-full aspect-video bg-linear-to-br from-gray-50 to-gray-100
                          flex items-center justify-center group-hover:from-transparent
                          group-hover:to-transparent transition-all"
                        >
                          <FileText className="h-8 w-8 text-gray-400 group-hover:text-red-600 transition-colors" />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileToDelete(file.id);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-md bg-white shadow-sm
                            border border-gray-200 opacity-0 group-hover:opacity-100
                            hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm text-gray-900 truncate mb-1">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-red-600">
                            Deleted
                            {new Date(file.deletedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold mb-1">Trash is empty</p>
                    <p className="text-xs">Deleted files will appear here</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Files in trash will be automatically deleted after 30 days
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <AlertDialog
            open={!!fileToDelete}
            onOpenChange={() => setFileToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Permanently delete file?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The file will be permanently
                  deleted from the server and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    fileToDelete && handleDeletePermanently(fileToDelete)
                  }
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="pt-3">
          {!isMobileDevice && !isHorizontalMobileDevice && (
            <div className="space-y-2">
              <StorageIndicator
                usedSlots={storageData.usedSlots}
                maxSlots={storageData.maxSlots}
                actualFileCount={storageData.actualFileCount}
                plan={storageData.plan}
                isMobile={isMobileDevice}
                isTablet={isTabletDevice}
                isLargeTablet={isLargeTabletDevice}
                isHorizontalMobile={isHorizontalMobileDevice}
                isLandscape={isLandscapeDevice}
              />
            </div>
          )}
        </div>
      </div>

      <GithubConnectModal
        open={githubModalOpen}
        onOpenChange={setGithubModalOpen}
        onRepoConnected={handleRepoConnected}
      />

      <OrientationWarningModal
        isOpen={showOrientationWarning}
        onClose={() => setShowOrientationWarning(false)}
        onRetry={handleRetryTour}
      />
    </>
  );
}
