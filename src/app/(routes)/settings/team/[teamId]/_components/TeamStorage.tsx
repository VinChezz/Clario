"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  TrendingUp,
  Zap,
  RefreshCw,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import { Skeleton } from "@/components/ui/skeleton";
import { Plan } from "@prisma/client";
import { getPlanLimit } from "@/lib/planUtils";
import { StorageDetailsModal } from "./StorageDetailModal";
import {
  useIsMobile,
  useIsSmallMobile,
  useIsTablet,
} from "@/hooks/useMediaQuery";

interface TeamStorageProps {
  currentUsageGB?: number;
  plan?: Plan | string;
  autoFetch?: boolean;
  showRealSize?: boolean;
}

export function TeamStorage({
  currentUsageGB: propCurrentUsageGB,
  plan: propPlan,
  autoFetch = true,
  showRealSize = false,
}: TeamStorageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const storageHook = autoFetch ? useStorage() : null;
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();
  const isTablet = useIsTablet();

  const currentUsageGB =
    propCurrentUsageGB !== undefined
      ? propCurrentUsageGB
      : storageHook
      ? storageHook.getUsedGB()
      : 0;

  const plan = propPlan || storageHook?.data?.user.plan || Plan.FREE;

  const planLimits = getPlanLimit(plan as Plan);
  const planLimitGB = planLimits.maxStorage / (1024 * 1024 * 1024);

  const percentage = planLimitGB > 0 ? (currentUsageGB / planLimitGB) * 100 : 0;
  const isLoading = storageHook?.loading || false;

  const realUsedBytes = storageHook?.data?.files?.calculatedSizeBytes
    ? Number(storageHook.data.files.calculatedSizeBytes)
    : 0;
  const realUsedGB = realUsedBytes / (1024 * 1024 * 1024);

  const realPlanLimitBytes = planLimits.maxStorage;
  const realPlanLimitGB = realPlanLimitBytes / (1024 * 1024 * 1024);

  const realPercentage =
    realUsedBytes > 0 ? (realUsedBytes / realPlanLimitBytes) * 100 : 0;

  const weightMultiplier =
    currentUsageGB > 0 && realUsedGB > 0
      ? currentUsageGB / realUsedGB
      : currentUsageGB > 0
      ? 1
      : 1;

  const getColor = () => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-yellow-500";
    if (percentage > 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const getGradientColor = () => {
    if (percentage > 90) return "from-red-500 to-red-600";
    if (percentage > 70) return "from-yellow-500 to-yellow-600";
    if (percentage > 50) return "from-blue-500 to-blue-600";
    return "from-green-500 to-green-600";
  };

  const formatGB = (gb: number): string => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    if (gb < 0.1 && gb > 0) {
      return `${(gb * 1024).toFixed(1)} MB`;
    }
    if (gb === 0) {
      return "0 GB";
    }
    return `${gb.toFixed(1)} GB`;
  };

  const handleRefresh = () => {
    if (storageHook?.refresh) {
      storageHook.refresh();
    }
  };

  const getTitleSize = () => {
    if (isSmallMobile) return "text-base";
    if (isMobile) return "text-lg";
    return "text-xl";
  };

  const getValueSize = () => {
    if (isSmallMobile) return "text-xl";
    if (isMobile) return "text-2xl";
    return "text-2xl";
  };

  const getSubtitleSize = () => {
    if (isSmallMobile) return "text-xs";
    if (isMobile) return "text-sm";
    return "text-sm";
  };

  const getProgressBarHeight = () => {
    if (isSmallMobile) return "h-2";
    return "h-3";
  };

  const shouldShowGlowAnimation = !isMobile && percentage > 0;

  if (isLoading && autoFetch) {
    return (
      <div className="space-y-3 md:space-y-4">
        <Skeleton className={`${getProgressBarHeight()} w-full`} />
        <div className="flex justify-between">
          <div className="space-y-1.5 md:space-y-2">
            <Skeleton
              className={`${isSmallMobile ? "h-7" : "h-8"} ${
                isSmallMobile ? "w-20" : "w-24"
              }`}
            />
            <Skeleton
              className={`${isSmallMobile ? "h-3" : "h-4"} ${
                isSmallMobile ? "w-14" : "w-16"
              }`}
            />
          </div>
          <div className="space-y-1.5 md:space-y-2 text-right">
            <Skeleton
              className={`${isSmallMobile ? "h-7" : "h-8"} ${
                isSmallMobile ? "w-20" : "w-24"
              } ml-auto`}
            />
            <Skeleton
              className={`${isSmallMobile ? "h-3" : "h-4"} ${
                isSmallMobile ? "w-16" : "w-20"
              } ml-auto`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (storageHook?.error && autoFetch) {
    return (
      <div
        className={`space-y-3 md:space-y-4 ${
          isSmallMobile ? "p-3" : "p-4"
        } bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle
            className={`${
              isSmallMobile ? "h-4 w-4" : "h-5 w-5"
            } text-red-600 dark:text-red-400`}
          />
          <p
            className={`${
              isSmallMobile ? "text-xs" : "text-sm"
            } text-red-700 dark:text-red-300`}
          >
            Failed to load storage data
          </p>
        </div>
        <Button
          variant="outline"
          size={isSmallMobile ? "sm" : "default"}
          onClick={handleRefresh}
          className="w-full"
        >
          <RefreshCw
            className={`${isSmallMobile ? "h-3 w-3" : "h-4 w-4"} mr-2`}
          />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className="space-y-3 md:space-y-4"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive
              className={`${
                isSmallMobile ? "h-4 w-4" : "h-5 w-5"
              } text-gray-500 dark:text-gray-400`}
            />
            <h3
              className={`font-semibold text-gray-900 dark:text-white ${getTitleSize()}`}
            >
              Storage Usage
            </h3>
          </div>
          {storageHook?.refresh && !isSmallMobile && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              onClick={handleRefresh}
              className={`${isMobile ? "h-7 w-7" : "h-8 w-8"} p-0`}
              title="Refresh storage data"
            >
              <RefreshCw
                className={`${isSmallMobile ? "h-3 w-3" : "h-4 w-4"} ${
                  storageHook.loading ? "animate-spin" : ""
                }`}
              />
            </Button>
          )}
        </div>

        {/* Предупреждение о взвешенном хранилище */}
        {realUsedGB > 0 &&
          weightMultiplier > 1.5 &&
          !isNaN(weightMultiplier) && (
            <div
              className={`${
                isSmallMobile ? "p-2" : "p-3"
              } bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`${
                    isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                  } text-amber-600 dark:text-amber-400 mt-0.5`}
                />
                <div className="flex-1">
                  <p
                    className={`${
                      isSmallMobile ? "text-xs" : "text-sm"
                    } font-medium text-amber-800 dark:text-amber-300`}
                  >
                    Weighted Storage
                  </p>
                  <p
                    className={`${
                      isSmallMobile ? "text-xs" : "text-xs"
                    } text-amber-700 dark:text-amber-400 mt-1`}
                  >
                    Files use weighted size: {weightMultiplier.toFixed(1)}x real
                    size.
                    {realUsedGB > 0 && <> Real: {formatGB(realUsedGB)}</>}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Индикатор прогресса */}
        <div
          className={`relative ${getProgressBarHeight()} bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden`}
        >
          <motion.div
            className={`h-full bg-linear-to-r ${getGradientColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {shouldShowGlowAnimation && isHovered && (
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
          <div>
            <motion.p
              className={`font-bold text-gray-900 dark:text-white ${getValueSize()}`}
              animate={
                !isMobile
                  ? {
                      scale: isHovered ? 1.05 : 1,
                      transition: { type: "spring", stiffness: 400 },
                    }
                  : {}
              }
            >
              {showRealSize && realUsedGB > 0
                ? formatGB(realUsedGB)
                : formatGB(currentUsageGB)}
            </motion.p>
            <p
              className={`text-gray-500 dark:text-gray-400 ${getSubtitleSize()}`}
            >
              {showRealSize && realUsedGB > 0
                ? "Real size used"
                : "Weighted usage"}
            </p>
          </div>

          <div className="text-right">
            <p
              className={`font-bold text-gray-900 dark:text-white ${getValueSize()}`}
            >
              {formatGB(planLimitGB)}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <div
                className={`${
                  isSmallMobile ? "w-1.5 h-1.5" : "w-2 h-2"
                } rounded-full ${getColor()}`}
              />
              <p
                className={`text-gray-500 dark:text-gray-400 ${getSubtitleSize()}`}
              >
                {plan} Plan
              </p>
            </div>
          </div>
        </div>

        {/* На мобильных всегда показываем кнопку View Details */}
        {(isMobile || isHovered) && (
          <motion.div
            initial={
              isMobile
                ? { opacity: 1, height: "auto" }
                : { opacity: 0, height: 0 }
            }
            animate={
              isMobile
                ? { opacity: 1, height: "auto" }
                : {
                    opacity: isHovered ? 1 : 0,
                    height: isHovered ? "auto" : 0,
                  }
            }
            className="overflow-hidden"
          >
            <div
              className={`${
                isMobile ? "pt-3" : "pt-4"
              } border-t border-gray-200 dark:border-gray-800`}
            >
              <div className="space-y-2 md:space-y-3">
                {percentage > 90 ? (
                  <div
                    className={`${
                      isSmallMobile ? "p-2" : "p-3"
                    } flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg`}
                  >
                    <AlertCircle
                      className={`${
                        isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                      } text-red-600 dark:text-red-400`}
                    />
                    <div className="flex-1">
                      <p
                        className={`${
                          isSmallMobile ? "text-xs" : "text-sm"
                        } font-medium text-red-700 dark:text-red-300`}
                      >
                        Storage almost full
                      </p>
                      <p
                        className={`${
                          isSmallMobile ? "text-xs" : "text-xs"
                        } text-red-600 dark:text-red-400`}
                      >
                        {isSmallMobile
                          ? "Upgrade plan or free space"
                          : "Consider upgrading your plan or freeing up space."}
                      </p>
                    </div>
                  </div>
                ) : percentage > 70 ? (
                  <div
                    className={`${
                      isSmallMobile ? "p-2" : "p-3"
                    } flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg`}
                  >
                    <TrendingUp
                      className={`${
                        isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                      } text-yellow-600 dark:text-yellow-400`}
                    />
                    <div className="flex-1">
                      <p
                        className={`${
                          isSmallMobile ? "text-xs" : "text-sm"
                        } font-medium text-yellow-700 dark:text-yellow-300`}
                      >
                        {isSmallMobile
                          ? "Storage getting full"
                          : "Storage usage is moderate"}
                      </p>
                      <p
                        className={`${
                          isSmallMobile ? "text-xs" : "text-xs"
                        } text-yellow-600 dark:text-yellow-400`}
                      >
                        {formatGB(planLimitGB - currentUsageGB)} remaining
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${
                      isSmallMobile ? "p-2" : "p-3"
                    } flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg`}
                  >
                    <Zap
                      className={`${
                        isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                      } text-green-600 dark:text-green-400`}
                    />
                    <div className="flex-1">
                      <p
                        className={`${
                          isSmallMobile ? "text-xs" : "text-sm"
                        } font-medium text-green-700 dark:text-green-300`}
                      >
                        {isSmallMobile
                          ? "Storage healthy"
                          : "Plenty of storage available"}
                      </p>
                      <p
                        className={`${
                          isSmallMobile ? "text-xs" : "text-xs"
                        } text-green-600 dark:text-green-400`}
                      >
                        {(100 - percentage).toFixed(0)}% free
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size={isSmallMobile ? "sm" : "default"}
                  className="w-full"
                  onClick={() => setShowDetails(true)}
                >
                  View Storage Details
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!isHovered && !isMobile && (
          <div className="pt-2">
            <div
              className={`flex items-center justify-between ${getSubtitleSize()}`}
            >
              <span className="text-gray-600 dark:text-gray-400">
                {percentage.toFixed(1)}% used
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatGB(planLimitGB - currentUsageGB)} free
              </span>
            </div>
            {realUsedGB > 0 && currentUsageGB > realUsedGB * 1.5 && (
              <div
                className={`mt-2 text-amber-600 dark:text-amber-400 ${
                  isSmallMobile ? "text-xs" : "text-xs"
                }`}
              >
                Weighted: {formatGB(currentUsageGB)}, Real:{" "}
                {formatGB(realUsedGB)}
              </div>
            )}
          </div>
        )}
      </div>

      <StorageDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        storageData={storageHook?.data || null}
        currentUsageGB={currentUsageGB}
        plan={plan}
        realUsedGB={realUsedGB}
        weightMultiplier={weightMultiplier}
      />
    </>
  );
}
