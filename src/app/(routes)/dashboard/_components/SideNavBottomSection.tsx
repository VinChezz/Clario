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
  AlertCircle,
  TrendingUp,
  Zap,
  CheckCircle,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  formatDate,
  formatTime,
  formatFileSize,
  calculateDaysUntilDeletion,
} from "@/lib/formatUtils";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";
import { useStorageStatus } from "@/hooks/useStorageStatus";
import { getButtonStyles, getButtonText } from "@/lib/storageButtonUtils";

const CreateFileDialog = ({
  open,
  onOpenChange,
  fileName,
  setFileName,
  onSubmit,
  isCreating,
  activeTeam,
  canCreate,
  storageData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  setFileName: (name: string) => void;
  onSubmit: (shouldOpenFile: boolean) => void;
  isCreating: boolean;
  activeTeam: any;
  canCreate: boolean;
  storageData: any;
}) => {
  const storageHook = useStorage(activeTeam?.id);
  const [canCreateFile, setCanCreateFile] = useState(true);
  const [storageInfo, setStorageInfo] = useState<string>("");

  useEffect(() => {
    if (open && storageHook.data) {
      const fileSizeBytes = 75 * 1024 * 1024;
      const hasSpace = storageHook.canCreateFile
        ? storageHook.canCreateFile(fileSizeBytes)
        : true;

      setCanCreateFile(hasSpace);

      const usedGB = storageHook.getUsedGB();
      const limitGB = storageHook.getLimitGB();
      const percentage = storageHook.percentage;

      setStorageInfo(
        `Storage: ${usedGB.toFixed(1)}GB of ${limitGB.toFixed(1)}GB used (${Math.round(percentage)}%)`,
      );
    }
  }, [open, storageHook.data, storageHook.percentage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                New Document
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                {canCreate
                  ? canCreateFile
                    ? "Give your document a name to get started"
                    : "Storage limit reached"
                  : "You don't have permission to create documents"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {canCreate ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <Input
                placeholder="Document name..."
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    fileName.trim() &&
                    !isCreating &&
                    activeTeam?.id &&
                    canCreateFile
                  ) {
                    onSubmit(false);
                  }
                }}
                disabled={isCreating || !canCreateFile}
                autoFocus
                className={`h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                  !canCreateFile ? "border-red-300 dark:border-red-700" : ""
                }`}
              />

              {!canCreateFile && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    ❌ Cannot create file - storage is full!
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-300 mt-1">
                    Delete files or upgrade plan to create new documents. (75MB
                    required per file)
                  </p>
                </div>
              )}

              {storageInfo && canCreateFile && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {storageInfo}
                </p>
              )}

              {!activeTeam?.id && (
                <p className="text-sm text-red-500 font-medium">
                  Please select a team first
                </p>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-6">
              <Lock className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Your role doesn't allow creating new documents.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            {canCreate && (
              <>
                <Button
                  onClick={() => onSubmit(false)}
                  disabled={
                    !fileName.trim() ||
                    isCreating ||
                    !activeTeam?.id ||
                    !canCreateFile
                  }
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  {isCreating ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : !canCreateFile ? (
                    "Storage Full"
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  onClick={() => onSubmit(true)}
                  disabled={
                    !fileName.trim() ||
                    isCreating ||
                    !activeTeam?.id ||
                    !canCreateFile
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
                >
                  {isCreating ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : !canCreateFile ? (
                    "Storage Full"
                  ) : (
                    "Create & Open"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StorageIndicatorProps {
  currentUsageGB?: number;
  maxStorageGB?: number;
  plan?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  isLargeTablet?: boolean;
  isHorizontalMobile?: boolean;
  isLandscape?: boolean;
  showWarning?: boolean;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
  teamId?: string;
  useTeamStorage?: boolean;
  storageData?: {
    usedBytes?: string;
    limitBytes?: string;
    plan?: string;
  };
}

export function StorageIndicator({
  currentUsageGB: propCurrentUsageGB,
  maxStorageGB: propMaxStorageGB,
  plan: propPlan,
  isMobile = false,
  isTablet = false,
  isLargeTablet = false,
  isHorizontalMobile = false,
  isLandscape = false,
  showWarning = false,
  showUpgradeButton = false,
  onUpgradeClick,
  teamId,
  useTeamStorage = false,
  storageData,
}: StorageIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);

  const useStorageHook = teamId || useTeamStorage;
  const storageHook = useStorageHook ? useStorage(teamId, true) : null;

  let currentUsageGB = propCurrentUsageGB;
  let maxStorageGB = propMaxStorageGB;
  let plan = propPlan;

  if (storageData) {
    if (storageData.usedBytes) {
      const usedBytes = Number(storageData.usedBytes);
      currentUsageGB = usedBytes / 1024 ** 3;
    }
    if (storageData.limitBytes) {
      const limitBytes = Number(storageData.limitBytes);
      maxStorageGB = limitBytes / 1024 ** 3;
    }
    if (storageData.plan) {
      plan = storageData.plan;
    }
  }

  currentUsageGB = currentUsageGB || 0;
  maxStorageGB = maxStorageGB || 10;
  plan = plan || "FREE";

  const usagePercentage =
    maxStorageGB > 0 ? (currentUsageGB / maxStorageGB) * 100 : 0;
  const remainingPercentage = 100 - usagePercentage;

  const getStorageStatus = () => {
    if (usagePercentage >= 100) {
      return {
        color: "from-red-500 to-red-600 dark:from-red-600 dark:to-red-700",
        bgColor:
          "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
        textColor: "text-red-600 dark:text-red-400",
        message: "Storage full - upgrade needed",
        icon: AlertCircle,
        iconColor: "text-red-600 dark:text-red-400",
        showUpgradeButton: true,
      };
    } else if (usagePercentage >= 90) {
      return {
        color:
          "from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600",
        bgColor:
          "from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-800/20",
        textColor: "text-red-600 dark:text-red-400",
        icon: AlertCircle,
        iconColor: "text-red-600 dark:text-red-400",
        showUpgradeButton: true,
      };
    } else if (usagePercentage >= 80 || showWarning) {
      return {
        color:
          "from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600",
        bgColor:
          "from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20",
        textColor: "text-orange-600 dark:text-orange-400",
        message: `${Math.round(remainingPercentage)}% available`,
        icon: TrendingUp,
        iconColor: "text-orange-600 dark:text-orange-400",
        showUpgradeButton: showUpgradeButton,
      };
    } else {
      return {
        color:
          "from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
        bgColor:
          "from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20",
        textColor: "text-blue-600 dark:text-blue-400",
        message: `${Math.round(remainingPercentage)}% available`,
        icon: Zap,
        iconColor: "text-blue-600 dark:text-blue-400",
        showUpgradeButton: false,
      };
    }
  };

  const status = getStorageStatus();
  const StatusIcon = status.icon;

  const getStorageSize = () => {
    if (isHorizontalMobile || isLandscape) return "p-2 space-y-1.5";
    if (isMobile) return "p-2 space-y-2";
    if (isTablet) return "p-3 space-y-2";
    if (isLargeTablet) return "p-3 space-y-2.5";
    return "p-2 space-y-2";
  };

  const storageSize = getStorageSize();

  const formatGB = (gb: number): string => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        `bg-linear-to-br ${status.bgColor} rounded-xl border shadow-sm`,
        "border-gray-200 dark:border-[#2a2a2d]",
        storageSize,
      )}
      id="storage-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-semibold",
            "text-gray-900 dark:text-[#f0f0f0]",
            isHorizontalMobile || isLandscape
              ? "text-xs"
              : isTablet
                ? "text-xs"
                : "text-sm",
          )}
        >
          Storage
        </span>
        <span
          className={cn(
            "font-bold",
            "text-gray-900 dark:text-[#f0f0f0]",
            isHorizontalMobile || isLandscape
              ? "text-xs"
              : isTablet
                ? "text-xs"
                : "text-sm",
          )}
        >
          {Math.round(usagePercentage)}%
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-[#2a2a2d]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-linear-to-r ${status.color}`}
          />

          {isHovered && usagePercentage > 0 && (
            <motion.div
              className="absolute top-0 h-full w-8 bg-linear-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-32px" }}
              animate={{
                x: "calc(100% + 32px)",
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            />
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "font-medium",
                status.textColor,
                isHorizontalMobile || isLandscape
                  ? "text-[9px]"
                  : isTablet
                    ? "text-[10px]"
                    : "text-xs",
              )}
            >
              {formatGB(currentUsageGB)}
            </span>
            <span
              className={cn(
                "text-gray-500 dark:text-[#a0a0a0]",
                isHorizontalMobile || isLandscape
                  ? "text-[7px]"
                  : isTablet
                    ? "text-[8px]"
                    : "text-[10px]",
              )}
            >
              / {formatGB(maxStorageGB)}
            </span>
          </div>
          <span
            className={cn(
              "font-medium",
              status.textColor,
              isHorizontalMobile || isLandscape
                ? "text-[9px]"
                : isTablet
                  ? "text-[10px]"
                  : "text-xs",
            )}
          >
            {status.message}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          height: isHovered ? "auto" : 0,
        }}
        className="overflow-hidden"
      >
        <div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2d]">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg">
              <StatusIcon className={cn("h-3 w-3", status.iconColor)} />
              <p className={cn("text-[10px] font-medium", status.textColor)}>
                {usagePercentage >= 100
                  ? "Storage full - upgrade needed"
                  : usagePercentage >= 80
                    ? `${Math.round(remainingPercentage)}% space remaining`
                    : `${Math.round(remainingPercentage)}% free space`}
              </p>
            </div>

            <div className="text-center text-[10px] text-gray-600 dark:text-[#a0a0a0]">
              Using {formatGB(currentUsageGB)} of {formatGB(maxStorageGB)}
            </div>

            {showUpgradeButton && onUpgradeClick && plan === "FREE" && (
              <button
                onClick={onUpgradeClick}
                className={cn(
                  "w-full text-[10px] font-semibold text-center py-1.5 rounded-lg transition-colors",
                  status.textColor,
                  status.textColor.includes("red")
                    ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                    : status.textColor.includes("orange")
                      ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
                      : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30",
                )}
              >
                Upgrade plan for more storage
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {isHovered &&
        usagePercentage >= 90 &&
        onUpgradeClick &&
        plan === "FREE" && (
          <div className="pt-2">
            <button
              onClick={onUpgradeClick}
              className={cn(
                "w-full text-xs font-semibold text-center py-1.5 rounded-lg transition-colors",
                "text-white",
                "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
              )}
            >
              Upgrade - storage {Math.round(usagePercentage)}% full
            </button>
          </div>
        )}
    </motion.div>
  );
}

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
      <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d]">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full mx-auto mb-4">
            <RotateCcw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900 dark:text-[#f0f0f0]">
            Rotate your device
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-[#a0a0a0] mt-2">
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
            <Button
              variant="outline"
              className="flex-1 border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-50 dark:hover:bg-[#252528]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onRetry}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
  const { user } = useKindeBrowserClient();
  const [fileInput, setFileInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [storageCheckResult, setStorageCheckResult] = useState<{
    canCreate: boolean;
    reason?: string;
    timestamp?: number;
  }>({ canCreate: true });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [permanentlyDeletedCount, setPermanentlyDeletedCount] =
    useState<number>(0);
  const [hasDeletedOneFile, setHasDeletedOneFile] = useState<boolean>(false);

  const prevStorageStateRef = useRef<{
    usedBytes?: bigint;
    limitBytes?: bigint;
    percentage?: number;
  }>({});

  const prevTeamIdRef = useRef<string | undefined>(null);

  const router = useRouter();

  const { startTour } = useTour();
  const { fileCount, hasFiles, updateFromFileList } = useFileData();

  const { activeTeam } = useActiveTeam();
  const storageHook = useStorage(activeTeam?.id, true);
  const storageStatus = useStorageStatus(activeTeam?.id);

  const isMobileDevice = useIsMobile();
  const isTabletDevice = useIsTablet();
  const isLargeTabletDevice = useIsLargeTablet();
  const isHorizontalMobileDevice = useIsHorizontalMobile();
  const isHorizontalTablet = useIsHorizontalTablet();
  const isLandscapeDevice = useIsLandscape();

  const daysUntilDeletion = calculateDaysUntilDeletion(deletedFiles);

  const [storageData, setStorageData] = useState<{
    currentUsageGB: number;
    maxStorageGB: number;
    plan: string;
    usedBytes: bigint;
    limitBytes: bigint;
    percentage: number;
    canCreateFiles: boolean;
  }>({
    currentUsageGB: 0,
    maxStorageGB: 10,
    plan: "FREE",
    usedBytes: BigInt(0),
    limitBytes: BigInt(10 * 1024 * 1024 * 1024),
    percentage: 0,
    canCreateFiles: true,
  });

  const canCreateFiles = useMemo(() => {
    if (!activeTeam?.id || !dbUser) return false;

    const currentUserMember = teamMembers.find(
      (member) => member.userId === dbUser?.id,
    );
    const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

    const hasPermission =
      isCurrentUserCreator || currentUserMember?.role === "EDIT";

    return hasPermission && storageData.canCreateFiles;
  }, [activeTeam, dbUser, teamMembers, storageData.canCreateFiles]);

  const checkStorage = useCallback(() => {
    if (!user?.email || !activeTeam?.id) {
      setStorageCheckResult({ canCreate: false, reason: "No active team" });
      return;
    }

    const currentUserMember = teamMembers.find(
      (member) => member.userId === dbUser?.id,
    );
    const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

    const hasPermission =
      isCurrentUserCreator || currentUserMember?.role === "EDIT";

    if (!hasPermission) {
      setStorageCheckResult({
        canCreate: false,
        reason: "No permission to create files",
      });
      return;
    }

    if (!storageData.usedBytes || !storageData.limitBytes) {
      setStorageCheckResult({ canCreate: true });
      return;
    }

    const currentUsedBytes = storageData.usedBytes;
    const currentLimitBytes = storageData.limitBytes;
    const currentPercentage = storageData.percentage;

    const fileSizeBytes = 75 * 1024 * 1024;
    const fileSizeGB = fileSizeBytes / 1024 ** 3;

    const remainingBytes = currentLimitBytes - currentUsedBytes;
    const remainingGB = Number(remainingBytes) / 1024 ** 3;

    const hasEnoughSpace = remainingBytes >= BigInt(fileSizeBytes);

    if (!hasEnoughSpace) {
      setStorageCheckResult({
        canCreate: false,
        reason: `Not enough storage. Need ${fileSizeGB.toFixed(2)}GB, but only ${remainingGB.toFixed(2)}GB available (including files in trash).`,
        timestamp: Date.now(),
      });
      return;
    }

    if (currentPercentage >= 100) {
      setStorageCheckResult({
        canCreate: false,
        reason:
          "Storage is completely full! Delete files permanently or upgrade plan.",
        timestamp: Date.now(),
      });
      return;
    } else if (currentPercentage >= 90) {
      setStorageCheckResult({
        canCreate: false,
        reason:
          "Storage almost full (>90%). Delete files permanently to create new ones or upgrade plan.",
        timestamp: Date.now(),
      });
      return;
    }

    setStorageCheckResult({
      canCreate: true,
      timestamp: Date.now(),
    });
  }, [
    user,
    activeTeam,
    dbUser,
    teamMembers,
    storageData.usedBytes,
    storageData.limitBytes,
    storageData.percentage,
  ]);

  const refreshStorageData = async () => {
    if (!user?.email || !activeTeam?.id) return;

    setIsLoadingStorage(true);
    try {
      const response = await fetch(
        `/api/users/storage?teamId=${activeTeam.id}&includeTrash=true`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch storage data");
      }

      const data = await response.json();

      const usedBytes = BigInt(data.storage?.usedBytes || 0);
      const limitBytes = BigInt(
        data.storage?.limitBytes || 2 * 1024 * 1024 * 1024,
      );

      const currentUsageGB = Number(usedBytes) / (1024 * 1024 * 1024);
      const maxStorageGB = Number(limitBytes) / (1024 * 1024 * 1024);
      const percentage = data.storage?.percentage || 0;

      const remainingBytes = limitBytes - usedBytes;
      const canCreateFiles = remainingBytes > 75 * 1024 * 1024;

      setStorageData({
        currentUsageGB,
        maxStorageGB,
        plan: data.user?.plan || "FREE",
        usedBytes,
        limitBytes,
        percentage,
        canCreateFiles,
      });

      if (updateFromFileList) {
        const filesResponse = await fetch(`/api/files?teamId=${activeTeam.id}`);
        const files = await filesResponse.json();
        updateFromFileList(files);
      }

      checkGithubConnection();
    } catch (error) {
      console.error("Failed to load storage data:", error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (activeTeam?.id) {
      refreshStorageData();
      checkGithubConnection();
      checkStorage();
    }
  }, [activeTeam?.id]);

  useEffect(() => {
    if (activeTeam?.id !== prevTeamIdRef.current) {
      setStorageData({
        currentUsageGB: 0,
        maxStorageGB: 10,
        plan: "FREE",
        usedBytes: BigInt(0),
        limitBytes: BigInt(10 * 1024 * 1024 * 1024),
        percentage: 0,
        canCreateFiles: true,
      });

      setStorageCheckResult({ canCreate: true });

      prevStorageStateRef.current = {};

      prevTeamIdRef.current = activeTeam?.id;

      setDeletedFiles([]);
      setSelectedFiles([]);

      setIsGithubConnected(false);
    }
  }, [activeTeam?.id]);

  useEffect(() => {
    if (user?.email && activeTeam?.id) {
      refreshStorageData();
      checkGithubConnection();
      checkStorage();
    }
  }, [user?.email, activeTeam?.id]);

  useEffect(() => {
    if (fileCount !== undefined) {
      return;
    }
  }, [fileCount]);

  const actualFileCount = fileCount !== undefined ? fileCount : totalFiles || 0;
  const actualHasFiles = actualFileCount > 0;

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

  const checkGithubConnection = async () => {
    if (!activeTeam?.id) return;

    setIsCheckingRepo(true);
    try {
      const response = await fetch(
        `/api/github/connect?teamId=${activeTeam.id}`,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkStorage();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [checkStorage]);

  const handleFileCreate = async (fileName: string, shouldOpenFile = false) => {
    if (!storageCheckResult.canCreate) {
      toast.error(
        storageCheckResult.reason || "Cannot create file due to storage limits",
        { duration: 5000 },
      );

      if (
        storageCheckResult.reason?.includes("Not enough storage") ||
        storageCheckResult.reason?.includes("Storage almost full") ||
        storageCheckResult.reason?.includes("Storage is completely full")
      ) {
        router.push("/pricing");
      }

      return;
    }

    if (storageHook?.data) {
      const fileSizeBytes = 75 * 1024 * 1024;
      const usedBytes = BigInt(storageHook.data.storage.usedBytes || "0");
      const limitBytes = BigInt(storageHook.data.storage.limitBytes || "0");

      const remainingBytes = limitBytes - usedBytes;
      if (remainingBytes < BigInt(fileSizeBytes)) {
        const usedGB = Number(usedBytes) / 1024 ** 3;
        const limitGB = Number(limitBytes) / 1024 ** 3;
        const remainingGB = limitGB - usedGB;
        const neededGB = (fileSizeBytes / 1024 ** 3).toFixed(2);

        toast.error(
          `Cannot create file. Need ${neededGB}GB, but only ${remainingGB.toFixed(2)}GB available.`,
          { duration: 6000 },
        );

        router.push("/pricing");
        return;
      }
    }

    setIsCreating(true);
    try {
      await onFileCreate(fileName);
      onAction?.();
      setCreateDialogOpen(false);
      setFileInput("");

      setTimeout(() => {
        refreshStorageData();
        if (storageHook) storageHook.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error creating file:", error);
      toast.error("Failed to create file");
    } finally {
      setIsCreating(false);
    }
  };

  const currentUserMember = teamMembers.find(
    (member) => member.userId === dbUser?.id,
  );
  const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

  const createButtonContent = useMemo(() => {
    if (!canCreateFiles) {
      if (!storageData.canCreateFiles) {
        return {
          text: storageData.percentage >= 100 ? "Storage Full" : "Almost Full",
          icon: Lock,
          disabled: true,
        };
      }
      return {
        text: "No Permission",
        icon: Lock,
        disabled: true,
      };
    }
    return {
      text: getButtonText(storageStatus.status, storageStatus.plan),
      icon: storageStatus.status === "full" ? Lock : Plus,
      disabled: !storageStatus.canCreate,
    };
  }, [canCreateFiles, storageData, storageStatus]);

  const getStorageInfo = () => {
    const { status, message, percentage, plan, showUpgrade } = storageStatus;

    switch (status) {
      case "full":
        return {
          status: "full",
          message,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          buttonText: getButtonText(status, plan),
          disabled: true,
          showUpgrade: true,
        };
      case "warning":
        return {
          status: "warning",
          message,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          buttonText: getButtonText(status, plan),
          disabled: percentage >= 90,
          showUpgrade: showUpgrade,
        };
      case "no-permission":
        return {
          status: "no-permission",
          message,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          buttonText: getButtonText(status, plan),
          disabled: true,
          showUpgrade: false,
        };
      case "no-team":
        return {
          status: "no-team",
          message,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          buttonText: getButtonText(status, plan),
          disabled: true,
          showUpgrade: false,
        };
      default:
        return {
          status: "ok",
          message,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          buttonText: getButtonText(status, plan),
          disabled: false,
          showUpgrade: false,
        };
    }
  };

  const fetchDeletedFiles = async () => {
    if (!activeTeam?.id) {
      console.error("❌ No active team ID for fetching trash");
      return;
    }

    setIsLoadingTrash(true);
    try {
      const response = await fetch(`/api/files/trash?teamId=${activeTeam.id}`);
      if (response.ok) {
        const data = await response.json();

        setDeletedFiles(data.files || []);
        setSelectedFiles([]);

        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach((warning: any) => {
            if (warning.type === "TRASH_FULL") {
              toast.warning(warning.message, {
                duration: 6000,
                action:
                  warning.action === "upgrade_or_clean"
                    ? {
                        label: "Upgrade",
                        onClick: () => router.push("/pricing"),
                      }
                    : undefined,
              });
            }
          });
        }
      } else {
        console.error("❌ Failed to fetch deleted files:", response.status);
      }
    } catch (error) {
      console.error("❌ Failed to fetch deleted files:", error);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const canDeletePermanently = useCallback(() => {
    if (storageData.plan !== "FREE") {
      return true;
    }

    return !hasDeletedOneFile;
  }, [storageData.plan, hasDeletedOneFile]);

  const getDeleteRestrictionMessage = () => {
    if (storageData.plan === "FREE" && hasDeletedOneFile) {
      return "You have already used your 1 permanent deletion. Upgrade to PRO for unlimited deletions.";
    }
    return "";
  };

  const handleDeletePermanently = async (fileId: string) => {
    if (!canDeletePermanently()) {
      const restrictionMessage = getDeleteRestrictionMessage();
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Delete limit reached</span>
          <span>{restrictionMessage}</span>
          <Button
            variant="link"
            className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
            onClick={() => router.push("/pricing")}
          >
            Upgrade to PRO for unlimited deletions →
          </Button>
        </div>,
        { duration: 8000 },
      );
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}/permanent`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setFileToDelete(null);
        setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
        fetchDeletedFiles();

        refreshStorageData();
        toast.success(data.message || "File permanently deleted");

        if (storageData.plan === "FREE") {
          setPermanentlyDeletedCount((prev) => prev + 1);
          setHasDeletedOneFile(true);

          localStorage.setItem(`free_plan_deleted_${activeTeam?.id}`, "true");
        }
      } else if (response.status === 403) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{data.error}</span>
            <span>{data.details}</span>
            {data.upgradeUrl && (
              <Button
                variant="link"
                className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
                onClick={() => router.push(data.upgradeUrl)}
              >
                Upgrade to PRO →
              </Button>
            )}
          </div>,
          { duration: 8000 },
        );
      } else {
        toast.error(data.error || data.details || "Failed to delete file");
      }
    } catch (error) {
      console.error("❌ Error deleting file permanently:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
        fetchDeletedFiles();
        refreshStorageData();
        toast.success(data.message || "File restored successfully");

        if (storageData.plan === "FREE") {
          localStorage.setItem("lastRestoreTime", Date.now().toString());
        }
      } else {
        toast.error(data.error || "Failed to restore file");
      }
    } catch (error) {
      console.error("Failed to restore file:", error);
      toast.error("Failed to restore file");
    }
  };

  const deleteSelectedFiles = async () => {
    try {
      setIsLoadingTrash(true);
      if (storageData.plan === "FREE") {
        if (hasDeletedOneFile && selectedFiles.length > 0) {
          const restrictionMessage = getDeleteRestrictionMessage();
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Delete limit reached</span>
              <span>{restrictionMessage}</span>
              <Button
                variant="link"
                className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
                onClick={() => router.push("/pricing")}
              >
                Upgrade to PRO for unlimited deletions →
              </Button>
            </div>,
            { duration: 8000 },
          );
          setIsLoadingTrash(false);
          return;
        }

        if (!hasDeletedOneFile && selectedFiles.length > 1) {
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Free plan restriction</span>
              <span>
                You can only delete one file at a time on FREE plan. Upgrade to
                PRO for bulk deletions.
              </span>
              <Button
                variant="link"
                className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
                onClick={() => router.push("/pricing")}
              >
                Upgrade to PRO →
              </Button>
            </div>,
            { duration: 8000 },
          );
          setIsLoadingTrash(false);
          return;
        }
      }

      for (const fileId of selectedFiles) {
        await handleDeletePermanently(fileId);
      }

      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to delete selected files:", error);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const emptyTrash = async () => {
    if (storageData.plan === "FREE") {
      if (hasDeletedOneFile) {
        const restrictionMessage = getDeleteRestrictionMessage();
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Delete limit reached</span>
            <span>{restrictionMessage}</span>
            <Button
              variant="link"
              className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
              onClick={() => router.push("/pricing")}
            >
              Upgrade to PRO for unlimited deletions →
            </Button>
          </div>,
          { duration: 8000 },
        );
        return;
      }

      if (deletedFiles.length === 0) {
        toast.info("Trash is already empty");
        return;
      }

      if (deletedFiles.length > 1) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Free plan restriction</span>
            <span>
              You can only delete one file at a time on FREE plan. Please select
              one file to delete.
            </span>
            <Button
              variant="link"
              className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
              onClick={() => router.push("/pricing")}
            >
              Upgrade to PRO for bulk deletions →
            </Button>
          </div>,
          { duration: 8000 },
        );
        return;
      }
    }

    if (
      confirm(
        `Empty trash? This will permanently delete ${deletedFiles.length} item${deletedFiles.length > 1 ? "s" : ""}.`,
      )
    ) {
      try {
        setIsLoadingTrash(true);

        for (const file of deletedFiles) {
          await handleDeletePermanently(file.id);
        }

        setSelectedFiles([]);
      } catch (error) {
        console.error("Failed to delete all files:", error);
      } finally {
        setIsLoadingTrash(false);
      }
    }
  };

  const updateTrashStateOnly = () => {
    fetchDeletedFiles();
  };

  useEffect(() => {
    if (activeTeam?.id) {
      const hasDeleted = localStorage.getItem(
        `free_plan_deleted_${activeTeam.id}`,
      );
      setHasDeletedOneFile(hasDeleted === "true");

      const checkDeletedCount = async () => {
        try {
          const response = await fetch(`/api/files/trash/count`);
          if (response.ok) {
            const data = await response.json();
            setPermanentlyDeletedCount(data.count || 0);
            if (data.count > 0) {
              setHasDeletedOneFile(true);
            }
          }
        } catch (error) {
          console.error("Failed to fetch deleted count:", error);
        }
      };

      if (storageData.plan === "FREE") {
        checkDeletedCount();
      }
    }
  }, [activeTeam?.id, storageData.plan]);

  const renderDeleteButton = () => {
    const isDisabled = storageData.plan === "FREE" && hasDeletedOneFile;
    const tooltip = isDisabled
      ? "Delete limit reached (1/1 used)"
      : "Delete permanently";

    return (
      <button
        onClick={() => {
          if (isDisabled) {
            toast.error(
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Delete limit reached</span>
                <span>
                  You have already permanently deleted one file. Upgrade to PRO
                  for unlimited deletions.
                </span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
                  onClick={() => router.push("/pricing")}
                >
                  Upgrade to PRO →
                </Button>
              </div>,
              { duration: 8000 },
            );
            return;
          }

          if (
            confirm(
              `Permanently delete ${selectedFiles.length} item${selectedFiles.length > 1 ? "s" : ""}?`,
            )
          ) {
            deleteSelectedFiles();
          }
        }}
        disabled={isDisabled || selectedFiles.length === 0}
        className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${
          isDisabled
            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
            : "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
        }`}
        title={tooltip}
      >
        Delete
      </button>
    );
  };

  const renderFileDeleteButton = (fileId: string) => {
    const isDisabled = storageData.plan === "FREE" && hasDeletedOneFile;
    const tooltip = isDisabled
      ? "You have already used your one permanent deletion on FREE plan"
      : "Delete permanently";

    return (
      <Button
        variant="secondary"
        size="icon"
        className={`h-8 w-8 shadow-md hover:shadow-lg backdrop-blur-sm ${
          isDisabled
            ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            : "bg-white/90 dark:bg-[#252528]/90"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (isDisabled) {
            toast.error(
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Delete limit reached</span>
                <span>
                  You have already permanently deleted one file. Upgrade to PRO
                  for unlimited deletions.
                </span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600 dark:text-blue-400 justify-start"
                  onClick={() => router.push("/pricing")}
                >
                  Upgrade to PRO →
                </Button>
              </div>,
              { duration: 8000 },
            );
          } else {
            setFileToDelete(fileId);
          }
        }}
        disabled={isDisabled}
        title={tooltip}
      >
        <Trash2
          className={`h-4 w-4 ${
            isDisabled
              ? "text-gray-400 dark:text-gray-600"
              : "text-red-600 dark:text-red-400"
          }`}
        />
      </Button>
    );
  };

  const handleUpgradeClick = () => {
    router.push("/pricing?from=dashboard");
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

  const menuList = [
    ...(shouldShowTourButton
      ? [
          {
            id: 1,
            name: "Show Tour",
            icon: Play,
            onClick: handleStartTour,
            className:
              "text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-50 dark:hover:bg-[#252528]",
          },
        ]
      : []),
    {
      id: 2,
      name: isGithubConnected ? "View Repository" : "Connect Repo",
      icon: isGithubConnected ? CheckCircle2 : Github,
      onClick: () => setGithubModalOpen(true),
      className: isGithubConnected
        ? "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
        : "text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-50 dark:hover:bg-[#252528]",
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
      className:
        "text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-50 dark:hover:bg-[#252528]",
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

  const getSpacing = () => {
    if (isHorizontalMobileDevice || isLandscapeDevice) return "space-y-1";
    if (isMobileDevice) return "space-y-2";
    if (isTabletDevice) return "space-y-3.5";
    if (isLargeTabletDevice) return "space-y-4";
    return "space-y-3";
  };

  const buttonSize = getButtonSize();
  const upgradeCard = getUpgradeCardSize();
  const spacing = getSpacing();
  const storageInfo = getStorageInfo();

  const getMaxStorageLimit = () => {
    if (storageHook?.data?.teamStorage) {
      const limitBytes = BigInt(storageHook.data.teamStorage.limitBytes || "0");
      return Number(limitBytes) / (1024 * 1024 * 1024);
    }

    return storageData.maxStorageGB;
  };

  const maxStorageLimit = getMaxStorageLimit();

  return (
    <>
      <div
        className={cn(
          "flex flex-col justify-between",
          isMobileDevice || isHorizontalMobileDevice || isLandscapeDevice
            ? "overflow-hidden"
            : "overflow-visible",
        )}
      >
        <div className={cn("flex-1", spacing)}>
          <div className={cn("space-y-0.5", buttonSize.spacing)}>
            {menuList.map((menu) => (
              <button
                key={menu.id}
                className={cn(
                  "w-full flex items-center rounded-lg transition-all duration-200 hover:shadow-sm",
                  "text-gray-700 dark:text-[#f0f0f0]",
                  "hover:bg-gray-50 dark:hover:bg-[#252528]",
                  "hover:border-gray-200 dark:hover:border-[#2a2a2d]",
                  buttonSize.padding,
                  buttonSize.text,
                  buttonSize.gap,
                  menu.className,
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
                    <div className="h-3 w-3 border-2 border-gray-300 dark:border-[#707070] rounded-full" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          {storageData.plan === "FREE" &&
            (isHorizontalMobileDevice && isLandscapeDevice ? (
              <div
                className={cn(
                  "bg-linear-to-br rounded-xl text-white relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
                  "from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-800",
                  upgradeCard.padding,
                )}
                onClick={handleUpgradeClick}
              >
                <h3 className={cn("font-bold mb-1", upgradeCard.title)}>
                  Unlock Premium
                </h3>

                <p
                  className={cn(
                    "text-white/90 leading-relaxed",
                    upgradeCard.desc,
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
                          : "text-sm",
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
                          : "px-2 py-1 text-xs",
                    )}
                  >
                    $10/mo
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "bg-linear-to-br rounded-xl text-white relative overflow-hidden group cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
                  "from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-800",
                  "dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
                  upgradeCard.padding,
                )}
                onClick={handleUpgradeClick}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)]"></div>

                <div className="relative z-10">
                  <div
                    className={cn(
                      "flex items-center gap-2 mb-2",
                      (isHorizontalMobileDevice || isLandscapeDevice) && "mb-1",
                      isLargeTabletDevice && "mb-3",
                    )}
                  >
                    <Crown
                      className={cn(
                        "text-yellow-300",
                        isHorizontalMobileDevice || isLandscapeDevice
                          ? "h-3.5 w-3.5"
                          : isLargeTabletDevice
                            ? "h-5 w-5"
                            : "h-4 w-4",
                      )}
                    />
                    <span
                      className={cn(
                        "font-bold",
                        isHorizontalMobileDevice || isLandscapeDevice
                          ? "text-xs"
                          : isLargeTabletDevice
                            ? "text-base"
                            : "text-sm",
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
                      upgradeCard.desc,
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
                            : "text-sm",
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
                            : "px-2 py-1 text-xs",
                      )}
                    >
                      $10/mo
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {actualHasFiles && (
            <>
              {!canCreateFiles ? (
                <Button
                  className={cn(
                    "w-full bg-linear-to-r shadow-lg cursor-not-allowed relative overflow-hidden",
                    "from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700",
                    "dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                    buttonSize.height,
                    buttonSize.text,
                    buttonSize.gap,
                  )}
                  id="create-file-button-sidenav"
                  disabled
                >
                  <Lock className={cn("text-white", buttonSize.icon)} />
                  <span className="text-white font-semibold">
                    {createButtonContent.text}
                  </span>
                </Button>
              ) : (
                <>
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className={cn(
                      getButtonStyles(storageStatus.status),
                      buttonSize.height,
                      buttonSize.text,
                      buttonSize.gap,
                      "w-full",
                    )}
                    disabled={createButtonContent.disabled}
                    id="create-file-button-sidenav"
                  >
                    {React.createElement(createButtonContent.icon, {
                      className: buttonSize.icon,
                    })}
                    {createButtonContent.text}
                  </button>

                  <CreateFileDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    fileName={fileInput}
                    setFileName={setFileInput}
                    onSubmit={(shouldOpenFile) =>
                      handleFileCreate(fileInput, shouldOpenFile)
                    }
                    isCreating={isCreating}
                    activeTeam={activeTeam}
                    canCreate={canCreateFiles}
                    storageData={storageData}
                  />
                </>
              )}
            </>
          )}

          <Dialog open={trashModalOpen} onOpenChange={setTrashModalOpen}>
            <DialogContent
              className={cn(
                "p-0 gap-0 overflow-hidden rounded-2xl max-w-3xl",
                "bg-white dark:bg-[#1a1a1c]",
                "border border-gray-200 dark:border-[#2a2a2d]",
                isHorizontalMobileDevice || isLandscapeDevice
                  ? "max-h-[85vh]"
                  : "max-h-[80vh]",
              )}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className={cn(
                  "px-8 pt-8 pb-6 border-b",
                  "bg-linear-to-br from-gray-50 to-white dark:from-[#1a1a1c] dark:to-[#0f0f10]",
                  "border-gray-100 dark:border-[#2a2a2d]",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br shadow-lg from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600">
                      <Trash2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-[#f0f0f0]">
                        Trash
                      </DialogTitle>
                      <p className="text-gray-500 dark:text-[#a0a0a0] mt-1">
                        Files will be permanently deleted after 30 days
                      </p>

                      {storageData.plan === "FREE" && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              hasDeletedOneFile ? "bg-red-500" : "bg-green-500"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              hasDeletedOneFile
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {hasDeletedOneFile
                              ? "1/1 used"
                              : "1 deletion available"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {deletedFiles.length > 0 && (
                <div className="px-8 py-4 border-b border-gray-100 dark:border-[#2a2a2d] bg-gray-50/50 dark:bg-[#252528]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="select-all"
                          className="h-4 w-4 rounded border cursor-pointer border-gray-300 dark:border-[#3a3a3d] text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-600"
                          checked={
                            selectedFiles.length === deletedFiles.length &&
                            deletedFiles.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFiles(deletedFiles.map((f) => f.id));
                            } else {
                              setSelectedFiles([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium cursor-pointer select-none text-gray-700 dark:text-[#f0f0f0]"
                        >
                          Select all
                        </label>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-[#2a2a2d]">
                          <span className="text-sm text-gray-600 dark:text-[#a0a0a0]">
                            {selectedFiles.length} selected
                          </span>
                          <div className="h-4 w-px bg-gray-300 dark:bg-[#2a2a2d]" />
                          <button
                            onClick={() => {
                              selectedFiles.forEach((id) =>
                                handleRestoreFile(id),
                              );
                              setSelectedFiles([]);
                            }}
                            className="text-sm font-medium px-2 py-1 rounded-md transition-colors text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            Restore
                          </button>
                          <div className="h-4 w-px bg-gray-300 dark:bg-[#2a2a2d]" />

                          {renderDeleteButton()}
                        </div>
                      )}
                    </div>

                    {deletedFiles.length >= 3 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        onClick={() => {
                          emptyTrash();
                        }}
                        disabled={
                          isLoadingTrash ||
                          (storageData.plan === "FREE" && hasDeletedOneFile)
                        }
                        title={
                          storageData.plan === "FREE" && hasDeletedOneFile
                            ? "Delete limit reached (1/1 used)"
                            : "Empty trash"
                        }
                      >
                        {isLoadingTrash ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Empty Trash
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex-1 overflow-y-auto",
                  isHorizontalMobileDevice ||
                    isLandscapeDevice ||
                    isHorizontalTablet
                    ? "max-h-[50vh]"
                    : "max-h-[50vh]",
                )}
              >
                {deletedFiles && deletedFiles.length > 0 ? (
                  <div className="p-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {deletedFiles.map((file) => (
                        <div
                          key={file.id}
                          className={cn(
                            "group relative rounded-xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden",
                            "bg-white dark:bg-[#1a1a1c]",
                            "border-gray-200 dark:border-[#2a2a2d]",
                            "hover:border-gray-300 dark:hover:border-[#3a3a3d]",
                            "hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
                            selectedFiles.includes(file.id) &&
                              "ring-2 ring-red-500 dark:ring-red-600 border-red-500 dark:border-red-600",
                          )}
                          onClick={() => {
                            if (selectedFiles.includes(file.id)) {
                              setSelectedFiles((prev) =>
                                prev.filter((id) => id !== file.id),
                              );
                            } else {
                              setSelectedFiles((prev) => [...prev, file.id]);
                            }
                          }}
                        >
                          <div
                            className="absolute top-4 right-4 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              id={`select-${file.id}`}
                              className="h-5 w-5 rounded border cursor-pointer border-gray-300 dark:border-[#3a3a3d] text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-600"
                              checked={selectedFiles.includes(file.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedFiles((prev) => [
                                    ...prev,
                                    file.id,
                                  ]);
                                } else {
                                  setSelectedFiles((prev) =>
                                    prev.filter((id) => id !== file.id),
                                  );
                                }
                              }}
                            />
                          </div>

                          <div className="mb-4 relative">
                            <div className="w-full aspect-video rounded-lg flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 dark:from-[#252528] dark:to-[#2a2a2d]">
                              <FileText className="h-10 w-10 text-gray-400 dark:text-[#707070]" />
                              <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent dark:from-black/10 dark:to-transparent rounded-lg" />
                            </div>

                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-md hover:shadow-lg bg-white/90 dark:bg-[#252528]/90 backdrop-blur-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreFile(file.id);
                                }}
                              >
                                <svg
                                  className="h-4 w-4 text-green-600 dark:text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                  />
                                </svg>
                              </Button>

                              {renderFileDeleteButton(file.id)}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm truncate mb-1 text-gray-900 dark:text-[#f0f0f0]">
                              {file.fileName}
                            </h4>
                            <p className="text-xs mb-2 text-gray-500 dark:text-[#a0a0a0]">
                              Deleted • {formatDate(file.deletedAt)}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-[#707070]">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>{formatTime(file.deletedAt)}</span>
                              </div>
                              {file.size && (
                                <span className="font-medium">
                                  {formatFileSize(file.size)}
                                </span>
                              )}
                            </div>
                          </div>

                          {storageData.plan === "FREE" && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                {hasDeletedOneFile
                                  ? "1/1 permanent deletions used"
                                  : "1 permanent deletion available"}
                              </p>
                            </div>
                          )}

                          <div className="absolute inset-0 rounded-xl pointer-events-none bg-linear-to-br from-transparent to-gray-50/50 dark:from-transparent dark:to-[#252528]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-8">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 dark:from-[#252528] dark:to-[#2a2a2d]">
                        <Trash2 className="h-12 w-12 text-gray-400 dark:text-[#707070]" />
                      </div>
                      <div className="absolute -inset-2 rounded-full animate-pulse bg-linear-to-br from-transparent via-gray-50/50 to-transparent dark:from-transparent dark:via-[#252528]/50 dark:to-transparent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-[#f0f0f0]">
                      Trash is empty
                    </h3>
                    <p className="text-center max-w-md mb-6 text-gray-500 dark:text-[#a0a0a0]">
                      Files you delete will appear here. They'll be permanently
                      removed after 30 days.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-[#707070]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-[#3a3a3d]" />
                        <span>Files stay for 30 days</span>
                      </div>
                      <div className="w-px h-4 bg-gray-300 dark:bg-[#2a2a2d]" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-[#3a3a3d]" />
                        <span>Restore anytime</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center px-5 py-3 border-t border-gray-100 dark:border-[#2a2a2d] bg-white/60 dark:bg-[#1a1a1c]/60">
                {deletedFiles.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-gray-200 dark:text-[#2a2a2d]"
                          />
                          <circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="text-amber-500 dark:text-amber-400"
                            strokeDasharray={`${(88 * daysUntilDeletion) / 30} 88`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-900 dark:text-[#f0f0f0]">
                            {daysUntilDeletion}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-[#f0f0f0]">
                          {deletedFiles.length} file
                          {deletedFiles.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                          in trash
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-gray-500 dark:text-[#a0a0a0]" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-[#a0a0a0]">
                      Empty
                    </span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <AlertDialog
            open={!!fileToDelete}
            onOpenChange={() => setFileToDelete(null)}
          >
            <AlertDialogContent className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 dark:text-[#f0f0f0]">
                  Permanently delete file?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-[#a0a0a0]">
                  This action cannot be undone. The file will be permanently
                  deleted from the server and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-50 dark:hover:bg-[#252528]">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    fileToDelete && handleDeletePermanently(fileToDelete)
                  }
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
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
                currentUsageGB={storageData.currentUsageGB}
                maxStorageGB={storageData.maxStorageGB}
                plan={storageData.plan}
                isMobile={isMobileDevice}
                isTablet={isTabletDevice}
                isLargeTablet={isLargeTabletDevice}
                isHorizontalMobile={isHorizontalMobileDevice}
                isLandscape={isLandscapeDevice}
                showWarning={storageData.percentage >= 80}
                showUpgradeButton={
                  storageData.plan === "FREE" && storageData.percentage >= 80
                }
                onUpgradeClick={handleUpgradeClick}
                teamId={activeTeam?.id}
                useTeamStorage={true}
                key={activeTeam?.id}
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
