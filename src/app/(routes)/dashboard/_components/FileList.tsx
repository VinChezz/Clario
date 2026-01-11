"use client";

import { FileListContext } from "@/app/_context/FileListContext";
import { useFileData } from "@/app/_context/FileDataContext";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  Archive,
  MoreHorizontal,
  FileText,
  Clock,
  Grid3x3,
  List,
  LayoutGrid,
  Download,
  Share,
  Star,
  Trash2,
  Edit3,
  Copy,
  Eye,
  X,
  Plus,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ViewMode = "grid" | "list" | "table";

interface FileListProps {
  files?: FILE[];
  onFileUpdate?: (files: any[]) => void;
  onCreateFile?: (fileName: string) => void;
}

export default function FileList({
  files,
  onFileUpdate,
  onCreateFile,
}: FileListProps) {
  const { fileList_, setFileList_ } = useContext(FileListContext);
  const [fileList, setFileList] = useState<FILE[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState<any[]>([]);
  const [createFileModalOpen, setCreateFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const { user }: any = useKindeBrowserClient();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { activeTeam } = useActiveTeam();

  const { updateFromFileList } = useFileData();

  useEffect(() => {
    if (files && files.length > 0) {
      const activeFiles = files.filter(
        (file) => !file.deletedAt && !file.isDeleted
      );
      setFileList(activeFiles);
    } else if (fileList_ && Array.isArray(fileList_)) {
      const activeFiles = fileList_.filter(
        (file: FILE) => !file.deletedAt && !file.isDeleted
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
      const response = await fetch("/api/files/trash");
      if (response.ok) {
        const files = await response.json();
        setDeletedFiles(files);
      }
    } catch (error) {
      console.error("Failed to fetch deleted files:", error);
    }
  };

  const handleCreateFile = async (shouldOpenFile = false) => {
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
        toast.success(`File "${newFileName.trim()}" created successfully!`);
      }

      console.log("✅ File created successfully:", data.id);
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

      if (setFileList_) {
        setFileList_((prev: any) => {
          // Проверяем, что prev - массив
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

      console.log("✅ File moved to trash successfully");
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
        (file) => file.id !== fileId
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

      console.log("✅ File restored successfully");
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

  const filteredAndSortedFiles = fileList
    .filter((file) =>
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.fileName.localeCompare(b.fileName);
        case "date":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "size":
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });

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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFilePreviewGradient = (index: number) => {
    const gradients = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-green-400 to-green-600",
      "from-orange-400 to-orange-600",
      "from-cyan-400 to-cyan-600",
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
      "from-rose-400 to-rose-600",
      "from-red-400 to-red-600",
      "from-amber-400 to-amber-600",
      "from-lime-400 to-lime-600",
      "from-emerald-400 to-emerald-600",
      "from-sky-400 to-sky-600",
      "from-fuchsia-400 to-fuchsia-600",
      "from-violet-400 to-violet-600",
    ];
    return gradients[index % gradients.length];
  };

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "bg-red-100 text-red-700";
      case "doc":
      case "docx":
        return "bg-blue-100 text-blue-700";
      case "xls":
      case "xlsx":
        return "bg-green-100 text-green-700";
      case "ppt":
      case "pptx":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleFileAction = (
    action: string,
    file: FILE,
    e?: React.MouseEvent
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
      case "archive":
        console.log("Archiving file:", file.fileName);
        break;
      case "delete":
        handleDeleteFile(file.id!);
        break;
      case "star":
        console.log("Starring file:", file.fileName);
        break;
      case "copy":
        console.log("Copying file:", file.fileName);
        break;
      default:
        break;
    }
  };

  const EmptyState = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="relative w-24 h-24 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-[#252528] dark:to-[#2a2a2d] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg border border-gray-200/50 dark:border-[#2a2a2d]">
              <div className="relative">
                <div className="absolute -inset-4 bg-linear-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20 rounded-full blur-md" />
                <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400 relative z-10" />
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold dark:text-[#f0f0f0] mb-3 bg-linear-to-r from-gray-900 to-gray-700 dark:from-[#f0f0f0] dark:to-[#a0a0a0] bg-clip-text text-transparent">
            No files yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Create your first file to get started with your team workspace
          </p>
          <Button
            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => setCreateFileModalOpen(true)}
            id="create-file-button-filelist"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create new file
          </Button>
        </div>
      </div>
    </div>
  );

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
        />
      </>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 lg:space-y-6">
          <div className="flex flex-col gap-3 lg:gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-[#f0f0f0] truncate">
                  All Files
                </h2>
                <p className="text-gray-500 dark:text-[#a0a0a0] mt-1 text-sm lg:text-base">
                  {filteredAndSortedFiles.length} file
                  {filteredAndSortedFiles.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                  >
                    {isSearchOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <SearchIcon className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div
              className={`flex flex-col lg:flex-row items-stretch lg:items-center gap-3 ${
                isMobile && !isSearchOpen ? "hidden" : ""
              }`}
            >
              <div className="relative flex-1">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 rounded-lg h-10 border-gray-300 dark:border-[#2a2a2d] focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-[#252528] text-gray-900 dark:text-[#f0f0f0]"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#707070]">
                  <SearchIcon className="h-4 w-4" />
                </div>
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#707070] hover:text-gray-600 dark:hover:text-[#a0a0a0]"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 lg:gap-3 z-50">
                <Button
                  variant="outline"
                  className="gap-2 flex-1 lg:flex-initial h-10 border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  onClick={() => {
                    setTrashModalOpen(true);
                    fetchDeletedFiles();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="lg:inline">Trash</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 flex-1 lg:flex-initial h-10 border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      <FilterIcon className="h-4 w-4" />
                      <span className="lg:inline">Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
                  >
                    <DropdownMenuItem
                      onClick={() => setSortBy("name")}
                      className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("date")}
                      className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      Date Modified
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("size")}
                      className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                    >
                      Size
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as ViewMode)}
                  className="flex-1 lg:flex-initial"
                >
                  <TabsList className="p-1 w-full lg:w-auto grid grid-cols-3 lg:flex h-10 bg-gray-100 dark:bg-[#252528] border border-gray-200 dark:border-[#2a2a2d] z-0">
                    <TabsTrigger
                      value="grid"
                      className="gap-2 px-2 lg:px-3 text-gray-700 dark:text-[#f0f0f0] data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-[#1a1a1c] dark:data-[state=active]:text-[#f0f0f0]"
                    >
                      <Grid3x3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="list"
                      className="gap-2 px-2 lg:px-3 text-gray-700 dark:text-[#f0f0f0] data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-[#1a1a1c] dark:data-[state=active]:text-[#f0f0f0]"
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                    {!isMobile && (
                      <TabsTrigger
                        value="table"
                        className="gap-2 px-3 text-gray-700 dark:text-[#f0f0f0] data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-[#1a1a1c] dark:data-[state=active]:text-[#f0f0f0]"
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Table</span>
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6 pb-4">
              {filteredAndSortedFiles.map((file, index) => (
                <FileGridItem
                  key={file.id || index}
                  file={file}
                  index={index}
                  onFileClick={() => router.push(`/workspace/${file.id}`)}
                  onFileAction={handleFileAction}
                  getFilePreviewGradient={getFilePreviewGradient}
                  getFileTypeColor={getFileTypeColor}
                  formatDate={formatDate}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}

          {viewMode === "list" && (
            <div className="space-y-2 lg:space-y-3 pb-4">
              {filteredAndSortedFiles.map((file, index) => (
                <FileListItem
                  key={file.id || index}
                  file={file}
                  index={index}
                  isMobile={isMobile}
                  onFileClick={() => router.push(`/workspace/${file.id}`)}
                  onFileAction={handleFileAction}
                  getFilePreviewGradient={getFilePreviewGradient}
                  getFileTypeColor={getFileTypeColor}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}

          {viewMode === "table" && !isMobile && (
            <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] rounded-2xl overflow-hidden shadow-sm pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-gray-50 to-blue-50 dark:from-[#252528] dark:to-blue-900/20 hover:bg-gray-50 dark:hover:bg-[#252528]">
                    <TableHead className="font-semibold text-gray-700 dark:text-[#f0f0f0] py-4 px-6">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-[#f0f0f0] py-4 px-6">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-[#f0f0f0] py-4 px-6">
                      Size
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-[#f0f0f0] py-4 px-6">
                      Modified
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-[#f0f0f0] py-4 px-6">
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
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl bg-linear-to-br ${getFilePreviewGradient(
                              index
                            )} flex items-center justify-center shadow-md`}
                          >
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-[#f0f0f0] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {file.fileName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1">
                              Created {formatDate(file.createdAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className="text-[10px] lg:text-xs shrink-0"
                        >
                          {file.fileName.split(".").pop()?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600 dark:text-[#a0a0a0] text-sm">
                        {formatFileSize(file.size || 0)}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600 dark:text-[#a0a0a0] text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-[#707070]" />
                          <div>
                            <div>{formatDate(file.updatedAt)}</div>
                            <div className="text-gray-400 dark:text-[#707070]">
                              {formatTime(file.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {file.createdBy && (
                          <div className="flex items-center gap-3">
                            <Image
                              src={
                                file.createdBy.image || "/default-avatar.png"
                              }
                              alt={file.createdBy.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <span className="text-sm text-gray-700 dark:text-[#f0f0f0] font-medium">
                              {file.createdBy.name}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex pl-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
                            >
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction("download", file, e);
                                }}
                              >
                                <Download className="h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction("rename", file, e);
                                }}
                              >
                                <Edit3 className="h-4 w-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction("share", file, e);
                                }}
                              >
                                <Share className="h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction("archive", file, e);
                                }}
                              >
                                <Archive className="h-4 w-4" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction("copy", file, e);
                                }}
                              >
                                <Copy className="h-4 w-4" /> Make a Copy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileAction("delete", file, e);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
      />

      <Dialog open={trashModalOpen} onOpenChange={setTrashModalOpen}>
        <DialogContent className="max-w-2xl max-h-[600px] flex flex-col bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-[#f0f0f0]">
              Trash
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3">
            {deletedFiles.length > 0 ? (
              deletedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-[#252528] border-gray-200 dark:border-[#2a2a2d]"
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreFile(file.id)}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800/50"
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-[#707070]">
                <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-[#f0f0f0]">
                  Trash is empty
                </p>
                <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                  Deleted files will appear here
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  setFileName: (name: string) => void;
  onSubmit: (shouldOpenFile: boolean) => void;
  isCreating: boolean;
  activeTeam: any;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
      <DialogHeader>
        <DialogTitle className="dark:text-gray-100">
          Create New File
        </DialogTitle>
        <DialogDescription className="dark:text-gray-400">
          Give your new file a descriptive name
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Input
          placeholder="Enter file name..."
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              fileName.trim() &&
              !isCreating &&
              activeTeam?.id
            ) {
              onSubmit(false);
            }
          }}
          disabled={isCreating}
          autoFocus
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>• File will be created in your current team</p>
          <p>• You can add content after creation</p>
          {!activeTeam?.id && (
            <p className="text-red-500 dark:text-red-400 font-medium">
              • Please select a team first
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <div className="flex gap-2">
          <Button
            onClick={() => onSubmit(false)}
            disabled={!fileName.trim() || isCreating || !activeTeam?.id}
            className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create Only"
            )}
          </Button>

          <Button
            onClick={() => onSubmit(true)}
            disabled={!fileName.trim() || isCreating || !activeTeam?.id}
            className="bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create & Open"
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const FileGridItem = ({
  file,
  index,
  onFileClick,
  onFileAction,
  getFilePreviewGradient,
  getFileTypeColor,
  formatDate,
  formatFileSize,
}: any) => (
  <div
    className="group bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] rounded-xl lg:rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    onClick={onFileClick}
  >
    <div className="relative">
      <div
        className={`h-32 lg:h-40 bg-linear-to-br ${getFilePreviewGradient(
          index
        )} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-white/90" />
        </div>

        <div className="absolute top-2 lg:top-3 left-2 lg:left-3">
          <Badge
            variant="secondary"
            className="text-[10px] lg:text-xs shrink-0"
          >
            {file.fileName.split(".").pop()?.toUpperCase()}
          </Badge>
        </div>

        <div className="absolute top-2 lg:top-3 right-2 lg:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 lg:h-8 lg:w-8 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 backdrop-blur-sm shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onFileAction("download", file, e);
              }}
            >
              <Download className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 lg:h-8 lg:w-8 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 backdrop-blur-sm shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
              >
                <DropdownMenuItem
                  className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileAction("download", file, e);
                  }}
                >
                  <Download className="h-4 w-4" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileAction("rename", file, e);
                  }}
                >
                  <Edit3 className="h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileAction("share", file, e);
                  }}
                >
                  <Share className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileAction("archive", file, e);
                  }}
                >
                  <Archive className="h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileAction("copy", file, e);
                  }}
                >
                  <Copy className="h-4 w-4" /> Make a Copy
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileAction("delete", file, e);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <div className="p-3 lg:p-5">
      <div className="flex items-start justify-between mb-2 lg:mb-3">
        <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100 truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {file.fileName}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 lg:h-8 lg:w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onFileAction("star", file, e);
          }}
        >
          <Star className="h-3 w-3 lg:h-4 lg:w-4 fill-yellow-400 text-yellow-400" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Edited {formatDate(file.updatedAt)}</span>
        </div>

        {file.size && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Size: {formatFileSize(file.size)}
          </div>
        )}

        {file.createdBy && (
          <div className="flex items-center gap-2 pt-2 lg:pt-3 dark:border-gray-700">
            <Image
              src={file.createdBy.image || "/default-avatar.png"}
              alt={file.createdBy.name}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {file.createdBy.name}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const FileListItem = ({
  file,
  index,
  isMobile,
  onFileClick,
  onFileAction,
  getFilePreviewGradient,
  getFileTypeColor,
  formatDate,
  formatTime,
  formatFileSize,
}: any) => (
  <div
    className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] rounded-xl p-3 lg:p-5 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group"
    onClick={onFileClick}
  >
    <div className="flex items-center gap-3 lg:gap-4">
      <div
        className={`w-12 h-12 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl bg-linear-to-br ${getFilePreviewGradient(
          index
        )} flex items-center justify-center shrink-0 shadow-lg`}
      >
        <FileText className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 lg:mb-2">
          <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">
            {file.fileName}
          </h3>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-wrap text-xs lg:text-sm">
          <div className="flex items-center gap-1.5 lg:gap-2 text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
            <span>
              {formatDate(file.updatedAt)}
              {!isMobile && ` at ${formatTime(file.updatedAt)}`}
            </span>
          </div>

          {file.size && (
            <div className="text-gray-500 dark:text-gray-400">
              • {formatFileSize(file.size)}
            </div>
          )}

          {file.createdBy && !isMobile && (
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <Image
                src={file.createdBy.image || "/default-avatar.png"}
                alt={file.createdBy.name}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-gray-600 dark:text-gray-300">
                {file.createdBy.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <Badge variant="secondary" className="text-[10px] lg:text-xs shrink-0">
        {file.fileName.split(".").pop()?.toUpperCase()}
      </Badge>

      <div
        className="flex items-center gap-1 lg:gap-2 opacity-0
      group-hover:opacity-100 transition-opacity shrink-0"
      >
        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onFileAction("download", file, e);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onFileAction("star", file, e);
              }}
            >
              <Star className="h-4 w-4" />
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
          >
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("download", file, e);
              }}
            >
              <Download className="h-4 w-4" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("rename", file, e);
              }}
            >
              <Edit3 className="h-4 w-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("share", file, e);
              }}
            >
              <Share className="h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("archive", file, e);
              }}
            >
              <Archive className="h-4 w-4" /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("copy", file, e);
              }}
            >
              <Copy className="h-4 w-4" /> Make a Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2a2a2d]" />
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onFileAction("delete", file, e);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
);

const SearchIcon = ({ className }: { className?: string }) => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
    />
  </svg>
);
