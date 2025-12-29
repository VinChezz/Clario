// components/storage/StorageDetailsModal.tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  X,
  HardDrive,
  FileText,
  File,
  Folder,
  Layers,
  TrendingUp,
  AlertTriangle,
  Zap,
  Upload,
  PieChart,
  Database,
  Cloud,
  Cpu,
  Shield,
  Users,
  FolderOpen,
  FileArchive,
  FileBox,
  GitBranch,
  HardDriveDownload,
  Package,
  BarChart,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StorageData } from "@/hooks/useStorage";
import { Plan } from "@prisma/client";

interface StorageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageData: StorageData | null;
  currentUsageGB: number;
  plan: Plan | string;
  realUsedGB?: number;
  weightMultiplier?: number;
}

export function StorageDetailsModal({
  isOpen,
  onClose,
  storageData,
  currentUsageGB,
  plan,
  realUsedGB = 0,
  weightMultiplier = 1,
}: StorageDetailsModalProps) {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number | string) => {
    const numBytes = typeof bytes === "string" ? parseFloat(bytes) : bytes;
    if (numBytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));

    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatGB = (gb: number): string => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    if (gb < 0.1 && gb > 0) return `${(gb * 1024).toFixed(1)} MB`;
    if (gb === 0) return "0 GB";
    return `${gb.toFixed(1)} GB`;
  };

  const getPlanLimitGB = () => {
    if (!storageData) return 0;
    const limitBytes = BigInt(storageData.storage.limitBytes);
    return Number(limitBytes) / 1024 ** 3;
  };

  const planLimitGB = getPlanLimitGB();
  const percentage = planLimitGB > 0 ? (currentUsageGB / planLimitGB) * 100 : 0;

  const getProgressGradient = (pct: number) => {
    if (pct > 90) return "linear-gradient(135deg, #ef4444, #dc2626)";
    if (pct > 70) return "linear-gradient(135deg, #f59e0b, #d97706)";
    if (pct > 50) return "linear-gradient(135deg, #3b82f6, #2563eb)";
    return "linear-gradient(135deg, #10b981, #059669)";
  };

  const getStatusColor = (pct: number) => {
    if (pct > 90) return "text-red-400";
    if (pct > 70) return "text-yellow-400";
    if (pct > 50) return "text-blue-400";
    return "text-green-400";
  };

  const getStatusBgColor = (pct: number) => {
    if (pct > 90) return "bg-red-500/10";
    if (pct > 70) return "bg-yellow-500/10";
    if (pct > 50) return "bg-blue-500/10";
    return "bg-green-500/10";
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "text-purple-400";
      case "business":
        return "text-blue-400";
      case "enterprise":
        return "text-emerald-400";
      default:
        return "text-gray-400";
    }
  };

  const getPlanBgColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "bg-purple-500/10";
      case "business":
        return "bg-blue-500/10";
      case "enterprise":
        return "bg-emerald-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  const fileStatistics = [
    {
      label: "Active Files",
      value: storageData?.files.activeCount || 0,
      icon: FileText,
      iconColor: "text-purple-500",
      bgColor: "bg-gradient-to-br from-purple-500/20 to-purple-600/20",
      description: "Currently accessible files",
    },
    {
      label: "Total Files",
      value: storageData?.user.totalCreatedFiles || 0,
      icon: FolderOpen,
      iconColor: "text-blue-500",
      bgColor: "bg-gradient-to-br from-blue-500/20 to-blue-600/20",
      description: "All files including archived",
    },
    {
      label: "File Versions",
      value: storageData?.files.versionsCount || 0,
      icon: GitBranch,
      iconColor: "text-green-500",
      bgColor: "bg-gradient-to-br from-green-500/20 to-green-600/20",
      description: "Historical versions saved",
    },
    {
      label: "Real Storage Size",
      value: realUsedGB > 0 ? formatGB(realUsedGB) : "Calculating...",
      icon: HardDriveDownload,
      iconColor: "text-amber-500",
      bgColor: "bg-gradient-to-br from-amber-500/20 to-amber-600/20",
      description: "Actual disk space used",
    },
    {
      label: "Weighted Storage",
      value: formatGB(currentUsageGB),
      icon: Package,
      iconColor: "text-pink-500",
      bgColor: "bg-gradient-to-br from-pink-500/20 to-pink-600/20",
      description: "Weighted storage used",
    },
    {
      label: "Daily Uploads",
      value: "24 avg",
      icon: Calendar,
      iconColor: "text-indigo-500",
      bgColor: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/20",
      description: "Average files per day",
    },
  ];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 350,
                mass: 0.8,
              }}
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-linear-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

                <div className="relative p-8 border-b border-white/10 dark:border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30" />
                        <div className="relative p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 shadow-lg">
                          <HardDrive className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Storage Analytics
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                          <div
                            className={`px-3 py-1 rounded-full ${getPlanBgColor(
                              plan
                            )} ${getPlanColor(
                              plan
                            )} text-sm font-medium flex items-center gap-2`}
                          >
                            <Shield className="h-3 w-3" />
                            {plan} Plan
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            Updated just now
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-11 w-11 rounded-xl hover:bg-white/10 dark:hover:bg-gray-800/50 transition-all duration-300"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="p-8 space-y-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="relative w-56 h-56">
                          <div className="absolute inset-0">
                            <svg
                              className="w-full h-full"
                              viewBox="0 0 100 100"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-gray-200 dark:text-gray-800"
                              />
                            </svg>
                          </div>

                          <motion.div className="absolute inset-0">
                            <svg
                              className="w-full h-full"
                              viewBox="0 0 100 100"
                            >
                              <defs>
                                <linearGradient
                                  id="progressGradient"
                                  x1="0%"
                                  y1="0%"
                                  x2="100%"
                                  y2="100%"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#3b82f6"
                                    stopOpacity="1"
                                  />
                                  <stop
                                    offset="50%"
                                    stopColor="#8b5cf6"
                                    stopOpacity="1"
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#ec4899"
                                    stopOpacity="1"
                                  />
                                </linearGradient>
                              </defs>
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: percentage / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                transform="rotate(-90 50 50)"
                              />
                            </svg>
                          </motion.div>

                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-center"
                            >
                              <div
                                className={`text-5xl font-bold ${getStatusColor(
                                  percentage
                                )}`}
                              >
                                {percentage.toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Storage Used
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Storage Overview
                          </h3>
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-linear-to-r from-white/30 to-transparent dark:from-gray-800/30 backdrop-blur-sm">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatGB(currentUsageGB)} /{" "}
                                {formatGB(planLimitGB)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Weighted storage usage
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-lg bg-linear-to-br from-blue-500/10 to-blue-600/10">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Available
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                  {formatGB(planLimitGB - currentUsageGB)}
                                </div>
                              </div>

                              {realUsedGB > 0 && (
                                <div className="p-3 rounded-lg bg-linear-to-br from-green-500/10 to-green-600/10">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Real Size
                                    </span>
                                  </div>
                                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {formatGB(realUsedGB)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {weightMultiplier > 1.5 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                              >
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                  Weight Multiplier:{" "}
                                  {weightMultiplier.toFixed(1)}x
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-linear-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-700/50" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
                          <BarChart className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          File Statistics
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fileStatistics.map((stat, idx) => {
                          const IconComponent = stat.icon;
                          return (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="group"
                            >
                              <Card className="border-none bg-linear-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 backdrop-blur-sm hover:from-white/60 hover:to-white/40 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 transition-all duration-300 h-full">
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2 rounded-lg ${stat.bgColor}`}
                                      >
                                        <IconComponent
                                          className={`h-5 w-5 ${stat.iconColor}`}
                                        />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                          {stat.label}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {stat.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                      {stat.value}
                                    </div>
                                    {stat.label === "Real Storage Size" &&
                                      realUsedGB > 0 &&
                                      weightMultiplier > 1 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Weighted: {formatGB(currentUsageGB)}
                                        </div>
                                      )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="border-none bg-linear-to-br from-white/50 to-white/30 dark:from-gray-800/30 dark:to-gray-800/10 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500">
                              <PieChart className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              File Type Distribution
                            </h3>
                          </div>
                          <div className="space-y-5">
                            {storageData?.files.statsByType && (
                              <>
                                {[
                                  {
                                    label: "Documents",
                                    value:
                                      storageData.files.statsByType.documents,
                                    icon: FileText,
                                    color: "from-blue-500 to-cyan-500",
                                    iconBg: "bg-blue-500/20",
                                  },
                                  {
                                    label: "Whiteboards",
                                    value:
                                      storageData.files.statsByType.whiteboards,
                                    icon: Layers,
                                    color: "from-purple-500 to-pink-500",
                                    iconBg: "bg-purple-500/20",
                                  },
                                  {
                                    label: "Mixed Files",
                                    value: storageData.files.statsByType.mixed,
                                    icon: FileBox,
                                    color: "from-green-500 to-emerald-500",
                                    iconBg: "bg-green-500/20",
                                  },
                                ].map((item, idx) => {
                                  const IconComponent = item.icon;
                                  const total =
                                    storageData.files.statsByType.totalFiles;
                                  const itemPercentage =
                                    total > 0 ? (item.value / total) * 100 : 0;

                                  return (
                                    <div key={item.label} className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`p-2 rounded-lg ${item.iconBg}`}
                                          >
                                            <IconComponent className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                          </div>
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {item.label}
                                          </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                          {item.value} (
                                          {itemPercentage.toFixed(0)}%)
                                        </span>
                                      </div>
                                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                          className={`h-full bg-linear-to-r ${item.color} rounded-full`}
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${itemPercentage}%`,
                                          }}
                                          transition={{
                                            duration: 1,
                                            delay: idx * 0.2,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Active Files
                                  </span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {storageData?.files.statsByType?.totalFiles ||
                                    0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none bg-linear-to-br from-white/50 to-white/30 dark:from-gray-800/30 dark:to-gray-800/10 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500">
                              <Zap className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Plan Insights
                            </h3>
                          </div>
                          <div className="space-y-4">
                            {[
                              {
                                label: "Current Plan",
                                value: plan,
                                icon: Shield,
                                color: getPlanColor(plan),
                              },
                              {
                                label: "Storage Limit",
                                value: formatGB(planLimitGB),
                                icon: HardDrive,
                                color: "text-blue-500",
                              },
                              {
                                label: "Files Created",
                                value: storageData?.user.totalCreatedFiles || 0,
                                icon: File,
                                color: "text-purple-500",
                              },
                              {
                                label: "Storage Health",
                                value:
                                  percentage > 90
                                    ? "Critical"
                                    : percentage > 70
                                    ? "Warning"
                                    : "Healthy",
                                icon:
                                  percentage > 90
                                    ? AlertTriangle
                                    : percentage > 70
                                    ? TrendingUp
                                    : Zap,
                                color: getStatusColor(percentage),
                              },
                            ].map((item, idx) => {
                              const IconComponent = item.icon;
                              return (
                                <motion.div
                                  key={item.label}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-white/30 to-transparent dark:from-gray-800/30 hover:from-white/40 dark:hover:from-gray-800/40 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${item.color.replace(
                                        "text-",
                                        "bg-"
                                      )}/20`}
                                    >
                                      <IconComponent
                                        className={`h-4 w-4 ${item.color}`}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {item.label}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-sm font-bold ${item.color}`}
                                  >
                                    {item.value}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Your {plan} plan provides {formatGB(planLimitGB)}{" "}
                              of weighted storage.
                              {percentage > 70 && (
                                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                                  {percentage > 90
                                    ? "Consider upgrading to increase your storage limit."
                                    : "Monitor your usage to avoid reaching the limit."}
                                </span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {percentage > 70 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl ${
                          percentage > 90
                            ? "bg-linear-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                            : "bg-linear-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-xl ${
                                percentage > 90
                                  ? "bg-red-500/20"
                                  : "bg-yellow-500/20"
                              }`}
                            >
                              <TrendingUp
                                className={`h-6 w-6 ${
                                  percentage > 90
                                    ? "text-red-500"
                                    : "text-yellow-500"
                                }`}
                              />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {percentage > 90
                                  ? "🚨 Storage Alert"
                                  : "⚠️ Storage Notice"}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {percentage > 90
                                  ? "Your storage is almost full. Consider cleaning up or upgrading."
                                  : `You're using ${percentage.toFixed(
                                      0
                                    )}% of your storage. Manage your files wisely.`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="border-gray-300 dark:border-gray-700 hover:bg-white/20"
                              onClick={() => {
                                /* Clean up action */
                              }}
                            >
                              Clean Up Files
                            </Button>
                            <Button
                              className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                              onClick={() => {
                                /* Upgrade action */
                              }}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Upgrade Plan
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="relative p-6 border-t border-white/10 dark:border-gray-800/50 bg-linear-to-r from-transparent via-white/5 to-transparent dark:via-gray-800/5">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">
                        <Cpu className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Real-Time Analytics
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        Last refresh: Just now
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={onClose}
                        className="hover:bg-white/10 dark:hover:bg-gray-800/50"
                      >
                        Close
                      </Button>
                      <Button className="bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg">
                        <Upload className="h-4 w-4 mr-2" />
                        Manage Storage
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
