"use client";

import { FileListContext } from "@/app/_context/FileListContext";
import { useFileData } from "@/app/_context/FileDataContext";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  MoreHorizontal,
  FileText,
  Clock,
  Grid3x3,
  List,
  LayoutGrid,
  Download,
  Share,
  Trash2,
  Edit3,
  X,
  Plus,
  Search,
  Filter,
  ChevronRight,
  User,
  HardDrive,
  ArrowUpDown,
  Star,
  StarOff,
  Heart,
  Lock,
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FILE } from "@/shared/types/file.interface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/app/_context/FavoritesContext";
import { useStorage } from "@/hooks/useStorage";
import { cn } from "@/lib/utils";
import { useStorageStatus } from "@/hooks/useStorageStatus";
import { getButtonStyles, getButtonText } from "@/lib/storageButtonUtils";

type ViewMode = "grid" | "list" | "table";
type SortOrder = "asc" | "desc";
type UserRole = "ADMIN" | "VIEW" | "EDIT";

interface FileListProps {
  files?: FILE[];
  onFileUpdate?: (files: any[]) => void;
  onCreateFile?: (fileName: string) => void;
  onMenuToggle?: () => void;
}

export default function FileList({
  files,
  onFileUpdate,
  onCreateFile,
  onMenuToggle,
}: FileListProps) {
  const { user }: any = useKindeBrowserClient();
  const [fileList, setFileList] = useState<FILE[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState<any[]>([]);
  const [createFileModalOpen, setCreateFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("ADMIN");
  const [loadingRole, setLoadingRole] = useState(true);

  const router = useRouter();
  const isMobile = useIsMobile();
  const { activeTeam } = useActiveTeam();
  const { fileList_, setFileList_ } = useContext(FileListContext);
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();
  const { updateFromFileList } = useFileData();
  const storageHook = useStorage(activeTeam?.id);
  const storageStatus = useStorageStatus(activeTeam?.id);
  const [canCreateNewFile, setCanCreateNewFile] = useState(true);
  const [storageErrorMessage, setStorageErrorMessage] = useState<string | null>(
    null,
  );

  const fetchUserRole = async () => {
    if (!user || !activeTeam?.id) {
      setUserRole("VIEW");
      setLoadingRole(false);
      return;
    }

    try {
      setLoadingRole(true);

      const response = await fetch(
        `/api/teams/${activeTeam.id}/members/${user.id}/role`,
      );

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role || "VIEW");
      } else {
        setUserRole("VIEW");
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    } finally {
      setLoadingRole(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user, activeTeam?.id]);

  const canCreate = userRole !== "VIEW";
  const canDelete = userRole === "ADMIN";
  const canRename = userRole === "ADMIN";

  useEffect(() => {
    if (files && files.length > 0) {
      const activeFiles = files.filter(
        (file) => !file.deletedAt && !file.isDeleted,
      );
      setFileList(activeFiles);
    } else if (fileList_ && Array.isArray(fileList_)) {
      const activeFiles = fileList_.filter(
        (file: FILE) => !file.deletedAt && !file.isDeleted,
      );
      setFileList(activeFiles);
    } else {
      setFileList([]);
    }
  }, [files, fileList_]);

  useEffect(() => {
    if (isMobile && viewMode === "table") {
      setViewMode("list");
    }
  }, [isMobile]);

  const fetchDeletedFiles = async () => {
    try {
      const url = activeTeam?.id
        ? `/api/files/trash?teamId=${activeTeam.id}`
        : "/api/files/trash";

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setDeletedFiles(data.files || data || []);
      } else {
        console.error("Failed to fetch deleted files:", response.status);
        setDeletedFiles([]);
      }
    } catch (error) {
      console.error("Failed to fetch deleted files:", error);
      setDeletedFiles([]);
    }
  };

  const checkStorageBeforeCreate = async (): Promise<{
    canCreate: boolean;
    message?: string;
  }> => {
    if (!activeTeam?.id) {
      return { canCreate: false, message: "No active team selected" };
    }

    if (!storageHook.data) {
      return { canCreate: true };
    }

    const fileSizeBytes = 75 * 1024 * 1024;

    const usedBytes = BigInt(storageHook.data.storage.usedBytes);
    const limitBytes = BigInt(storageHook.data.storage.limitBytes);

    if (usedBytes + BigInt(fileSizeBytes) > limitBytes) {
      const usedGB = storageHook.getUsedGB();
      const limitGB = storageHook.getLimitGB();
      const remainingGB = limitGB - usedGB;

      return {
        canCreate: false,
        message: `Not enough storage. Need ${(fileSizeBytes / 1024 ** 3).toFixed(2)}GB, but only ${remainingGB.toFixed(2)}GB available (includes files in trash).`,
      };
    }

    if (storageHook.percentage >= 100) {
      return {
        canCreate: false,
        message:
          "Storage is completely full! Delete files permanently or upgrade plan.",
      };
    } else if (storageHook.percentage >= 90) {
      return {
        canCreate: false,
        message:
          "Storage almost full (>90%). Delete files permanently to create new ones or upgrade plan.",
      };
    }

    return { canCreate: true };
  };

  useEffect(() => {
    const updateStorageCheck = async () => {
      const check = await checkStorageBeforeCreate();
      setCanCreateNewFile(check.canCreate);
      setStorageErrorMessage(check.message || null);
    };

    updateStorageCheck();
  }, [activeTeam?.id, storageHook.data, storageHook.percentage]);

  const handleCreateFile = async (shouldOpenFile = false) => {
    const storageCheck = await checkStorageBeforeCreate();
    if (!storageCheck.canCreate) {
      toast.error(
        storageCheck.message || "Cannot create file due to storage limits",
        {
          duration: 6000,
          action:
            storageHook.percentage >= 80
              ? {
                  label: "View Storage",
                  onClick: () => {
                    toast.info("Storage management coming soon");
                  },
                }
              : undefined,
        },
      );
      return;
    }

    if (!newFileName.trim() || isCreatingFile || !activeTeam?.id) return;

    setIsCreatingFile(true);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: newFileName.trim(),
          teamId: activeTeam.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errorCode === "FILE_LIMIT_EXCEEDED") {
          toast.warning("Storage limit exceeded");
        } else {
          throw new Error(data.error || "Failed to create file");
        }
        return;
      }

      const filesResponse = await fetch(`/api/files?teamId=${activeTeam.id}`);
      const allFiles = await filesResponse.json();

      const activeFiles = Array.isArray(allFiles)
        ? allFiles.filter((file: FILE) => !file.deletedAt && !file.isDeleted)
        : [];

      setFileList(activeFiles);

      if (setFileList_) {
        setFileList_(activeFiles);
      }

      updateFromFileList(activeFiles);

      if (onFileUpdate) {
        onFileUpdate(activeFiles);
      }

      if (onCreateFile) {
        onCreateFile(newFileName.trim());
      }

      setNewFileName("");
      setCreateFileModalOpen(false);

      if (shouldOpenFile) {
        router.push(`/workspace/${data.id}`);
      } else {
      }
    } catch (error: any) {
      console.error("❌ Failed to create file:", error);
      toast.error("Error creating file");
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const previousFileList = [...fileList];

    try {
      const updatedFileList = fileList.filter((file) => file.id !== fileId);
      setFileList(updatedFileList);

      if (isFavorite(fileId)) {
        toggleFavorite(fileId);
      }

      if (setFileList_) {
        setFileList_((prev: any) => {
          if (Array.isArray(prev)) {
            return prev.filter((file: any) => file.id !== fileId);
          }
          return [];
        });
      }

      updateFromFileList(updatedFileList);

      if (onFileUpdate) {
        onFileUpdate(updatedFileList);
      }

      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }

      fetchDeletedFiles();
    } catch (error: any) {
      console.error("❌ Failed to delete file:", error);

      setFileList(previousFileList);

      if (setFileList_) {
        setFileList_(previousFileList);
      }

      updateFromFileList(previousFileList);

      if (onFileUpdate) {
        onFileUpdate(previousFileList);
      }
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      const updatedDeletedFiles = deletedFiles.filter(
        (file) => file.id !== fileId,
      );
      setDeletedFiles(updatedDeletedFiles);

      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Restore failed");
      }

      if (activeTeam?.id) {
        const filesResponse = await fetch(`/api/files?teamId=${activeTeam.id}`);
        const updatedFiles = await filesResponse.json();
        setFileList(updatedFiles);

        if (setFileList_) {
          setFileList_(updatedFiles);
        }

        updateFromFileList(updatedFiles);

        if (onFileUpdate) {
          onFileUpdate(updatedFiles);
        }
      }
      fetchDeletedFiles();

      toast.success("File restored successfully");
    } catch (error: any) {
      console.error("❌ Failed to restore file:", error);
      fetchDeletedFiles();
    }
  };

  const handleDownloadFile = async (file: FILE) => {
    try {
      const fileData = {
        fileName: file.fileName,
        document: file.document,
        whiteboard: file.whiteboard,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      };

      const blob = new Blob([JSON.stringify(fileData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File downloaded");
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileSize = (file: FILE): number => {
    if (file.sizeBytes !== undefined && file.sizeBytes !== null) {
      return Number(file.sizeBytes);
    }

    if (file.size !== undefined && file.size !== null) {
      return Number(file.size);
    }

    return 0;
  };

  const filesToShow = showFavorites
    ? fileList.filter((file) => file.id && isFavorite(file.id))
    : fileList;

  const filteredAndSortedFiles = filesToShow
    .filter((file) =>
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;

      switch (sortBy) {
        case "name":
          return multiplier * a.fileName.localeCompare(b.fileName);
        case "date":
          return (
            multiplier *
            (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          );
        case "size":
          const sizeA = getFileSize(a);
          const sizeB = getFileSize(b);
          return multiplier * (sizeB - sizeA);
        default:
          return 0;
      }
    });

  const handleSortChange = (newSortBy: "name" | "date" | "size") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === "size" ? "desc" : "desc");
    }
  };

  const formatDate = (dateString: string) => {
    const date = moment(dateString);
    const now = moment();

    if (date.isSame(now, "day")) {
      return "Today";
    } else if (date.isSame(now.clone().subtract(1, "day"), "day")) {
      return "Yesterday";
    } else if (date.isSame(now, "week")) {
      return date.format("dddd");
    } else {
      return date.format("MMM DD, YYYY");
    }
  };

  const formatTime = (dateString: string) => {
    return moment(dateString).format("HH:mm");
  };

  const getFilePreviewGradient = (index: number) => {
    const gradients = [
      "from-blue-500/10 to-blue-600/20",
      "from-purple-500/10 to-purple-600/20",
      "from-emerald-500/10 to-emerald-600/20",
      "from-rose-500/10 to-rose-600/20",
      "from-amber-500/10 to-amber-600/20",
      "from-indigo-500/10 to-indigo-600/20",
      "from-pink-500/10 to-pink-600/20",
      "from-teal-500/10 to-teal-600/20",
    ];
    return gradients[index % gradients.length];
  };

  const getFileIconColor = (index: number) => {
    const colors = [
      "text-blue-400",
      "text-purple-400",
      "text-emerald-400",
      "text-rose-400",
      "text-amber-400",
      "text-indigo-400",
      "text-pink-400",
      "text-teal-400",
    ];
    return colors[index % colors.length];
  };

  const handleFileAction = (
    action: string,
    file: FILE,
    e?: React.MouseEvent,
  ) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    switch (action) {
      case "share":
        console.log("Sharing file:", file.fileName);
        break;
      case "download":
        handleDownloadFile(file);
        break;
      case "rename":
        console.log("Renaming file:", file.fileName);
        break;
      case "delete":
        handleDeleteFile(file.id!);
        break;
      case "favorite":
        toggleFavorite(file.id!);
        break;
      default:
        break;
    }
  };

  const CreateFileButton = ({
    variant = "default",
    size = "default",
  }: {
    variant?: "default" | "outline";
    size?: "default" | "sm" | "icon";
  }) => {
    const { status, canCreate, message, plan, loading } = storageStatus;

    const getButtonState = () => {
      return {
        disabled: !canCreate || loading,
        title: message,
        className: getButtonStyles(status, variant, size),
        status,
      };
    };

    const buttonState = getButtonState();
    const isDisabled = buttonState.disabled;
    const buttonText = getButtonText(status, plan);

    const shouldShowLock = status === "full";

    return (
      <Button
        onClick={() => !isDisabled && setCreateFileModalOpen(true)}
        disabled={!storageStatus.canCreate}
        title={buttonState.title}
        className={buttonState.className}
      >
        {shouldShowLock ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {size !== "icon" && (
          <span className="hidden sm:inline">{buttonText}</span>
        )}
      </Button>
    );
  };

  const EmptyState = () => {
    const { activeTeam } = useActiveTeam();
    const storageHook = useStorage(activeTeam?.id);
    const [canCreate, setCanCreate] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
      const checkStorage = async () => {
        if (!activeTeam?.id) {
          setCanCreate(false);
          setErrorMessage("Please select a team first");
          return;
        }

        if (!storageHook.data) return;

        const fileSizeBytes = 75 * 1024 * 1024;

        if (
          storageHook.canCreateFile &&
          !storageHook.canCreateFile(fileSizeBytes)
        ) {
          setCanCreate(false);
          const usedGB = storageHook.getUsedGB();
          const limitGB = storageHook.getLimitGB();
          const remainingGB = limitGB - usedGB;
          setErrorMessage(
            `Not enough storage. Need ${(fileSizeBytes / 1024 ** 3).toFixed(2)}GB, but only ${remainingGB.toFixed(2)}GB available.`,
          );
        } else if (storageHook.percentage >= 100) {
          setCanCreate(false);
          setErrorMessage(
            "Storage is completely full! Delete files or upgrade plan.",
          );
        } else if (storageHook.percentage >= 90) {
          setCanCreate(false);
          setErrorMessage(
            "Storage almost full (>90%). Delete files to create new ones.",
          );
        } else {
          setCanCreate(true);
          setErrorMessage(null);
        }
      };

      checkStorage();
    }, [activeTeam?.id, storageHook.data, storageHook.percentage]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col items-center justify-center p-8"
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 blur-3xl rounded-full" />
          <div className="relative w-32 h-32 rounded-2xl bg-linear-to-br from-white to-gray-50 dark:from-[#1a1a1c] dark:to-[#252528] flex items-center justify-center shadow-lg border border-gray-200 dark:border-[#2a2a2d]">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          </div>
        </div>

        {!canCreate ? (
          <>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
              Cannot Create File
            </h3>
            <p className="text-gray-700 dark:text-[#f0f0f0] text-center max-w-md mb-6 font-medium">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl text-white font-medium shadow-lg bg-gray-600 hover:bg-gray-700"
              >
                Refresh Storage Status
              </motion.button>
              {storageHook.percentage >= 80 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toast.info("Storage management coming soon")}
                  className="px-6 py-3 rounded-xl text-white font-medium shadow-lg bg-red-600 hover:bg-red-700"
                >
                  Manage Storage
                </motion.button>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-[#f0f0f0] mb-3">
              No documents yet
            </h3>
            <p className="text-gray-500 dark:text-[#a0a0a0] text-center max-w-md mb-6">
              Create your first document to start collaborating with your team
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateFileModalOpen(true)}
              className="group relative px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <div className="absolute inset-0 rounded-xl transition-colors bg-white/10 group-hover:bg-white/20" />
              <div className="relative flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Create new document</span>
              </div>
            </motion.button>
          </>
        )}
      </motion.div>
    );
  };

  const hasFavorites = favoritesCount > 0;

  useEffect(() => {
    if (showFavorites && !hasFavorites) {
      setShowFavorites(false);
    }
  }, [hasFavorites, showFavorites]);

  if (!fileList || fileList.length === 0) {
    return (
      <>
        <EmptyState />
        <CreateFileDialog
          open={createFileModalOpen}
          onOpenChange={setCreateFileModalOpen}
          fileName={newFileName}
          setFileName={setNewFileName}
          onSubmit={handleCreateFile}
          isCreating={isCreatingFile}
          activeTeam={activeTeam}
          canCreate={canCreate}
        />
      </>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f0f0f0]">
                  {showFavorites ? "Favorites" : "Documents"}
                </h1>
                <p className="text-gray-500 dark:text-[#a0a0a0] mt-1 text-sm">
                  {showFavorites
                    ? `${favoritesCount} favorite document${favoritesCount !== 1 ? "s" : ""}`
                    : `${filteredAndSortedFiles.length} document${filteredAndSortedFiles.length !== 1 ? "s" : ""}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CreateFileButton />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#707070]" />
                <Input
                  placeholder={`Search ${showFavorites ? "favorites" : "documents"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 rounded-xl border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-[#f0f0f0] shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-[#a0a0a0]" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFavorites(!showFavorites)}
                  disabled={!hasFavorites}
                  className={`h-10 px-4 rounded-xl border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] hover:bg-gray-50 dark:hover:bg-[#252528] disabled:opacity-50 disabled:cursor-not-allowed ${
                    showFavorites
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50 text-yellow-600 dark:text-yellow-400"
                      : ""
                  }`}
                >
                  <Star
                    className={`h-4 w-4 mr-2 ${showFavorites ? "fill-yellow-400 text-yellow-400" : ""}`}
                  />
                  <span className="hidden sm:inline">
                    {hasFavorites
                      ? showFavorites
                        ? "Show All"
                        : "Favorites"
                      : "No favorites"}
                  </span>
                  {hasFavorites && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    >
                      {favoritesCount}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 px-4 rounded-xl border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] hover:bg-gray-50 dark:hover:bg-[#252528]"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sort</span>
                      <span className="ml-1 text-xs text-gray-500">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
                  >
                    <DropdownMenuItem
                      onClick={() => handleSortChange("name")}
                      className="flex items-center justify-between text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      <span>Name</span>
                      {sortBy === "name" && <ArrowUpDown className="h-3 w-3" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange("date")}
                      className="flex items-center justify-between text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      <span>Date Modified</span>
                      {sortBy === "date" && <ArrowUpDown className="h-3 w-3" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange("size")}
                      className="flex items-center justify-between text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      <span>Size</span>
                      {sortBy === "size" && <ArrowUpDown className="h-3 w-3" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
                    <div className="px-2 py-1 text-xs text-gray-500 dark:text-[#a0a0a0]">
                      Sort order: {sortOrder === "asc" ? "A → Z" : "Z → A"}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  onClick={() => {
                    setTrashModalOpen(true);
                    fetchDeletedFiles();
                  }}
                  className="h-10 px-4 rounded-xl border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] hover:bg-gray-50 dark:hover:bg-[#252528]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Trash</span>
                </Button>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#252528] rounded-xl p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1c]"
                  >
                    <Grid3x3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1c]"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  {!isMobile && (
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className="h-8 w-8 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1c]"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {sortBy === "size" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a0a0a0] px-1"
            >
              <HardDrive className="h-4 w-4" />
              <span>
                Sorted by size:{" "}
                {sortOrder === "desc" ? "Smallest first" : "Largest first"}
              </span>
            </motion.div>
          )}

          {showFavorites && filteredAndSortedFiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 dark:text-[#a0a0a0]"
            >
              <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="font-medium text-gray-900 dark:text-[#f0f0f0] mb-1">
                No favorite files yet
              </p>
              <p className="text-sm">Mark files as favorite to see them here</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === "grid" && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8"
                >
                  {filteredAndSortedFiles.map((file, index) => (
                    <FileGridItem
                      key={file.id || index}
                      file={file}
                      index={index}
                      onFileClick={() => router.push(`/workspace/${file.id}`)}
                      onFileAction={handleFileAction}
                      getFilePreviewGradient={getFilePreviewGradient}
                      getFileIconColor={getFileIconColor}
                      formatDate={formatDate}
                      getFileSize={getFileSize}
                      formatFileSize={formatFileSize}
                      isFavorite={file.id ? isFavorite(file.id) : false}
                      onToggleFavorite={(fileId: any) => {
                        if (fileId) {
                          toggleFavorite(fileId);
                        }
                      }}
                      canDelete={canDelete}
                      canRename={canRename}
                    />
                  ))}
                </motion.div>
              )}

              {viewMode === "list" && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 pb-8"
                >
                  {filteredAndSortedFiles.map((file, index) => (
                    <FileListItem
                      key={file.id || index}
                      file={file}
                      index={index}
                      onFileClick={() => router.push(`/workspace/${file.id}`)}
                      onFileAction={handleFileAction}
                      getFileIconColor={getFileIconColor}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getFileSize={getFileSize}
                      formatFileSize={formatFileSize}
                      isFavorite={file.id ? isFavorite(file.id) : false}
                      onToggleFavorite={() => {
                        if (file.id) {
                          toggleFavorite(file.id);
                        }
                      }}
                      canDelete={canDelete}
                      canRename={canRename}
                    />
                  ))}
                </motion.div>
              )}

              {viewMode === "table" && !isMobile && (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pb-8"
                >
                  <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2d] overflow-hidden bg-white dark:bg-[#1a1a1c] shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#252528]">
                          <TableHead className="py-4 px-6 font-medium text-gray-700 dark:text-[#f0f0f0] w-10"></TableHead>
                          <TableHead className="py-4 px-6 font-medium text-gray-700 dark:text-[#f0f0f0]">
                            Name
                          </TableHead>
                          <TableHead className="py-4 px-6 font-medium text-gray-700 dark:text-[#f0f0f0]">
                            Modified
                          </TableHead>
                          <TableHead className="py-4 px-6 font-medium text-gray-700 dark:text-[#f0f0f0]">
                            <button
                              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              onClick={() => handleSortChange("size")}
                            >
                              Size
                              {sortBy === "size" && (
                                <ArrowUpDown className="h-3 w-3" />
                              )}
                            </button>
                          </TableHead>
                          <TableHead className="py-4 px-6 font-medium text-gray-700 dark:text-[#f0f0f0]">
                            Author
                          </TableHead>
                          <TableHead className="w-20 py-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedFiles.map((file, index) => (
                          <TableRow
                            key={file.id || index}
                            className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group border-b border-gray-100 dark:border-[#2a2a2d] last:border-b-0"
                            onClick={() => router.push(`/workspace/${file.id}`)}
                          >
                            <TableCell className="py-4 px-6">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(file.id!);
                                }}
                              >
                                {isFavorite(file.id!) ? (
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <Star className="h-4 w-4 text-gray-400 hover:text-yellow-400" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl ${getFileIconColor(index)} bg-white/10 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center`}
                                >
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-[#f0f0f0] group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {file.fileName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1">
                                    Created {formatDate(file.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400 dark:text-[#707070]" />
                                <div className="text-sm text-gray-600 dark:text-[#a0a0a0]">
                                  {formatDate(file.updatedAt)} at{" "}
                                  {formatTime(file.updatedAt)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-gray-400 dark:text-[#707070]" />
                                <span className="text-sm text-gray-600 dark:text-[#a0a0a0] font-medium">
                                  {formatFileSize(getFileSize(file))}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {file.createdBy && (
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={
                                      file.createdBy.image ||
                                      "/default-avatar.png"
                                    }
                                    alt={file.createdBy.name}
                                    width={24}
                                    height={24}
                                    className="rounded-full ring-1 ring-gray-200 dark:ring-[#2a2a2d]"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-[#f0f0f0]">
                                    {file.createdBy.name}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
                                  >
                                    <DropdownMenuItem
                                      onClick={(e) => toggleFavorite(file.id!)}
                                      className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                    >
                                      {isFavorite(file.id!) ? (
                                        <>
                                          <StarOff className="h-4 w-4 mr-2" />{" "}
                                          Remove from Favorites
                                        </>
                                      ) : (
                                        <>
                                          <Star className="h-4 w-4 mr-2" /> Add
                                          to Favorites
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleFileAction("download", file, e)
                                      }
                                      className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                    >
                                      <Download className="h-4 w-4 mr-2" />{" "}
                                      Download
                                    </DropdownMenuItem>
                                    {canRename && (
                                      <DropdownMenuItem
                                        onClick={(e) =>
                                          handleFileAction("rename", file, e)
                                        }
                                        className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                      >
                                        <Edit3 className="h-4 w-4 mr-2" />{" "}
                                        Rename
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleFileAction("share", file, e)
                                      }
                                      className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                    >
                                      <Share className="h-4 w-4 mr-2" /> Share
                                    </DropdownMenuItem>
                                    {canDelete && (
                                      <>
                                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
                                        <DropdownMenuItem
                                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          onClick={(e) =>
                                            handleFileAction("delete", file, e)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />{" "}
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <CreateFileDialog
        open={createFileModalOpen}
        onOpenChange={setCreateFileModalOpen}
        fileName={newFileName}
        setFileName={setNewFileName}
        onSubmit={handleCreateFile}
        isCreating={isCreatingFile}
        activeTeam={activeTeam}
        canCreate={canCreate}
      />

      <TrashDialog
        open={trashModalOpen}
        onOpenChange={setTrashModalOpen}
        deletedFiles={deletedFiles}
        onRestore={handleRestoreFile}
        onRefresh={fetchDeletedFiles}
      />
    </div>
  );
}

const CreateFileDialog = ({
  open,
  onOpenChange,
  fileName,
  setFileName,
  onSubmit,
  isCreating,
  activeTeam,
  canCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  setFileName: (name: string) => void;
  onSubmit: (shouldOpenFile: boolean) => void;
  isCreating: boolean;
  activeTeam: any;
  canCreate: boolean;
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
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-[#f0f0f0]">
            New Document
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-[#a0a0a0]">
            {canCreate
              ? canCreateFile
                ? "Give your document a name to get started"
                : "Storage limit reached"
              : "You don't have permission to create documents"}
          </DialogDescription>
        </DialogHeader>

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
              className={`h-11 rounded-xl border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-[#f0f0f0] ${
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

            {!activeTeam?.id && (
              <p className="text-sm text-red-500 font-medium">
                Please select a team first
              </p>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-700 dark:text-[#a0a0a0]">
              Your role doesn't allow creating new documents.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="border-gray-200 dark:border-[#2a2a2d] hover:bg-gray-50 dark:hover:bg-[#252528]"
          >
            Cancel
          </Button>
          {canCreate && (
            <div className="flex gap-2">
              <Button
                onClick={() => onSubmit(false)}
                disabled={
                  !fileName.trim() ||
                  isCreating ||
                  !activeTeam?.id ||
                  !canCreateFile
                }
                className={`${
                  !canCreateFile
                    ? "bg-red-500 hover:bg-red-600 cursor-not-allowed"
                    : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                }`}
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
                className={`${
                  !canCreateFile
                    ? "bg-red-500 hover:bg-red-600 cursor-not-allowed"
                    : "bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                }`}
              >
                {isCreating ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : !canCreateFile ? (
                  "Storage Full"
                ) : (
                  "Create & Open"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TrashDialog = ({
  open,
  onOpenChange,
  deletedFiles,
  onRestore,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedFiles: any[];
  onRestore: (fileId: string) => void;
  onRefresh?: () => void;
}) => {
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  const handleRestore = async (fileId: string) => {
    setIsRestoring(fileId);
    try {
      await onRestore(fileId);
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setIsRestoring(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-[#f0f0f0]">
            Trash
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-[#a0a0a0]">
            Restore files or permanently delete them
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {deletedFiles.length > 0 ? (
            deletedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-xl border bg-gray-50 dark:bg-[#252528] border-gray-200 dark:border-[#2a2a2d]"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-[#707070]" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#f0f0f0] text-sm">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                      Deleted {new Date(file.deletedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(file.id)}
                  disabled={isRestoring === file.id}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                >
                  {isRestoring === file.id ? (
                    <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Restore"
                  )}
                </Button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-[#707070]">
              <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-900 dark:text-[#f0f0f0] mb-1">
                Trash is empty
              </p>
              <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">
                Deleted files will appear here
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FileGridItem = ({
  file,
  index,
  onFileClick,
  onFileAction,
  getFilePreviewGradient,
  getFileIconColor,
  formatDate,
  getFileSize,
  formatFileSize,
  isFavorite,
  onToggleFavorite,
  canDelete,
  canRename,
}: any) => {
  const fileSize = getFileSize(file);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div
        className="bg-white dark:bg-[#1a1a1c] rounded-xl border border-gray-200 dark:border-[#2a2a2d] overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer"
        onClick={onFileClick}
      >
        <div
          className={`h-28 relative overflow-hidden bg-linear-to-br ${getFilePreviewGradient(
            index,
          )}`}
        >
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-16 h-16 rounded-xl ${getFileIconColor(index)} bg-white/10 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center`}
            >
              <FileText className="h-8 w-8" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-white/90 hover:bg-white dark:bg-[#252528]/90 dark:hover:bg-[#252528] backdrop-blur-sm shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite(file.id);
              }}
            >
              {isFavorite ? (
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ) : (
                <Star className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-white/90 hover:bg-white dark:bg-[#252528]/90 dark:hover:bg-[#252528] backdrop-blur-sm shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("download", file, e);
              }}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-[#f0f0f0] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {file.fileName}
                </h3>
                {isFavorite && (
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-[#a0a0a0] mt-1">
                Edited {formatDate(file.updatedAt)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(file.id);
                  }}
                  className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                >
                  {isFavorite ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" /> Remove from Favorites
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" /> Add to Favorites
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => onFileAction("download", file, e)}
                  className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
                {canRename && (
                  <DropdownMenuItem
                    onClick={(e) => onFileAction("rename", file, e)}
                    className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  >
                    <Edit3 className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => onFileAction("share", file, e)}
                  className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                >
                  <Share className="h-4 w-4 mr-2" /> Share
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => onFileAction("delete", file, e)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {file.createdBy && (
                <>
                  <Image
                    src={file.createdBy.image || "/default-avatar.png"}
                    alt={file.createdBy.name}
                    width={20}
                    height={20}
                    className="rounded-full ring-1 ring-gray-200 dark:ring-[#2a2a2d]"
                  />
                  <span className="text-xs text-gray-600 dark:text-[#a0a0a0] truncate max-w-20">
                    {file.createdBy.name}
                  </span>
                </>
              )}
            </div>
            {Number(fileSize) > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-[#a0a0a0]">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(fileSize)}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FileListItem = ({
  file,
  index,
  onFileClick,
  onFileAction,
  getFileIconColor,
  formatDate,
  formatTime,
  getFileSize,
  formatFileSize,
  isFavorite,
  onToggleFavorite,
  canDelete,
  canRename,
}: any) => {
  const fileSize = getFileSize(file);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
    >
      <div
        className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer"
        onClick={onFileClick}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileIconColor(
            index,
          )} bg-linear-to-br from-gray-50 to-gray-100 dark:from-[#252528] dark:to-[#2a2a2d]`}
        >
          <FileText className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-[#f0f0f0] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {file.fileName}
              </h3>
              {isFavorite && (
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <Badge
              variant="secondary"
              className="text-xs rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            >
              DOC
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#a0a0a0] flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(file.updatedAt)} at {formatTime(file.updatedAt)}
            </span>
            {Number(fileSize) > 0 && (
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(fileSize)}
              </span>
            )}
            {file.createdBy && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-25">{file.createdBy.name}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleFavorite();
            }}
            className="h-8 w-8 text-gray-600 dark:text-[#a0a0a0] hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
          >
            {isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onFileAction("download", file, e);
            }}
            className="h-8 w-8 text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
          >
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
            >
              <DropdownMenuItem
                onClick={(e) => onToggleFavorite(file.id, e)}
                className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              >
                {isFavorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" /> Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" /> Add to Favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => onFileAction("download", file, e)}
                className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </DropdownMenuItem>
              {canRename && (
                <DropdownMenuItem
                  onClick={(e) => onFileAction("rename", file, e)}
                  className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                >
                  <Edit3 className="h-4 w-4 mr-2" /> Rename
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => onFileAction("share", file, e)}
                className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              >
                <Share className="h-4 w-4 mr-2" /> Share
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={(e) => onFileAction("delete", file, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-[#707070]" />
        </div>
      </div>
    </motion.div>
  );
};
