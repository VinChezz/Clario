"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useContext } from "react";
import {
  Loader2,
  FileText,
  Search,
  Check,
  ChevronRight,
  Folder,
  Home,
  File,
  FolderOpen,
  FolderTree,
  Plus,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { FileListContext } from "@/app/_context/FileListContext";
import { useTheme } from "@/app/_context/AppearanceContext";
import moment from "moment";

interface AddReadmeToFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readmeContent: string;
  onConfirm: (fileId: string, fileName: string) => Promise<void>;
}

interface FileItem {
  id: string;
  fileName: string;
  document?: string;
  whiteboard?: string;
  type: "document" | "folder";
  parentId?: string;
  teamId: string;
  updatedAt: string;
  createdAt: string;
  description?: string;
  size?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdBy?: {
    id: string;
    name: string;
    image?: string;
  };
}

export function AddReadmeToFileModal({
  open,
  onOpenChange,
  readmeContent,
  onConfirm,
}: AddReadmeToFileModalProps) {
  const { activeTeam } = useActiveTeam();
  const { isDark } = useTheme();
  const { fileList_ } = useContext(FileListContext);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [pathHistory, setPathHistory] = useState<string[]>(["root"]);

  useEffect(() => {
    if (open && activeTeam?.id) {
      fetchTeamFiles();
      setSelectedFile(null);
      setCurrentFolder("root");
      setPathHistory(["root"]);
      setSearchQuery("");
    }
  }, [open, activeTeam?.id]);

  useEffect(() => {
    if (fileList_) {
      if (Array.isArray(fileList_)) {
        const activeFiles = fileList_.filter(
          (file: FileItem) => !file.deletedAt && !file.isDeleted,
        );
        setFiles(activeFiles);
        setFilteredFiles(activeFiles);
      } else {
        console.warn("fileList_ is not an array:", fileList_);
        if (typeof fileList_ === "object" && fileList_ !== null) {
          const filesData =
            (fileList_ as any).files ||
            (fileList_ as any).data ||
            Object.values(fileList_);

          if (Array.isArray(filesData)) {
            const activeFiles = filesData.filter(
              (file: FileItem) => !file.deletedAt && !file.isDeleted,
            );
            setFiles(activeFiles);
            setFilteredFiles(activeFiles);
          }
        }
      }
    }
  }, [fileList_]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(
        (file) =>
          file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (file.description?.toLowerCase() || "").includes(
            searchQuery.toLowerCase(),
          ),
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  const fetchTeamFiles = async () => {
    if (!activeTeam?.id) return;

    setIsLoading(true);
    try {
      console.log("Fetching files for team:", activeTeam.id);
      const response = await fetch(`/api/files?teamId=${activeTeam.id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      let allFiles: FileItem[] = [];

      if (data.files && Array.isArray(data.files)) {
        allFiles = data.files;
      } else if (Array.isArray(data)) {
        allFiles = data;
      } else if (data.success && data.data && Array.isArray(data.data)) {
        allFiles = data.data;
      }

      console.log("Extracted files:", allFiles);

      const activeFiles = allFiles.filter(
        (file: FileItem) => !file.deletedAt && !file.isDeleted,
      );

      setFiles(activeFiles);
      setFilteredFiles(activeFiles);
      console.log("Active files:", activeFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");

      if (fileList_ && fileList_.length > 0) {
        console.log("Using files from context");
        const activeFiles = fileList_.filter(
          (file: FileItem) => !file.deletedAt && !file.isDeleted,
        );
        setFiles(activeFiles);
        setFilteredFiles(activeFiles);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRoot = () => {
    setPathHistory(["root"]);
    setCurrentFolder("root");
    setSelectedFile(null);
  };

  const getCurrentFiles = () => {
    if (searchQuery.trim()) {
      return filteredFiles.filter((file) => {
        if (currentFolder === "root") {
          return !file.parentId || file.parentId === "root";
        }
        return file.parentId === currentFolder;
      });
    }

    return files.filter((file) => {
      if (currentFolder === "root") {
        return !file.parentId || file.parentId === "root";
      }
      return file.parentId === currentFolder;
    });
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setIsLoading(true);
      await onConfirm(selectedFile.id, selectedFile.fileName);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding readme to file:", error);
    } finally {
      setIsLoading(false);
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

  const getFilePreviewGradient = (index: number) => {
    const gradients = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-green-400 to-green-600",
      "from-orange-400 to-orange-600",
      "from-cyan-400 to-cyan-600",
    ];
    return gradients[index % gradients.length];
  };

  const getFileIconColor = () => {
    return isDark ? "text-white" : "text-gray-700";
  };

  const getFolderIconColor = () => {
    return isDark ? "text-white" : "text-orange-600";
  };

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          width: "60vw",
          height: "85vh",
          maxWidth: "none",
          maxHeight: "none",
        }}
        className={cn(
          "max-w-5xl max-h-[85vh] overflow-hidden p-0 gap-0",
          isDark
            ? "bg-[#0a0a0a] border-[#2a2a2d] text-white"
            : "bg-white border-gray-200",
        )}
      >
        <DialogHeader
          className={cn(
            "px-6 py-4 border-b",
            isDark ? "border-[#2a2a2d]" : "border-gray-200",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                isDark ? "bg-[#1a1a1c]" : "bg-blue-50",
              )}
            >
              <FileText
                className={cn(
                  "h-5 w-5",
                  isDark ? "text-blue-400" : "text-blue-600",
                )}
              />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Add README to Document
              </DialogTitle>
              <DialogDescription
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-500",
                )}
              >
                Select a document to add README content at the beginning
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 border-r">
            <div className="p-4 border-b">
              <div className="relative">
                <Search
                  className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
                    isDark ? "text-gray-500" : "text-gray-400",
                  )}
                />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-10 pr-10",
                    isDark
                      ? "bg-[#1a1a1c] border-[#2a2a2d] text-white placeholder:text-gray-500 focus:border-blue-500"
                      : "border-gray-200 focus:border-blue-500",
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={cn(
                      "absolute right-3 top-1/2 transform -translate-y-1/2",
                      isDark
                        ? "text-gray-500 hover:text-gray-300"
                        : "text-gray-400 hover:text-gray-600",
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              className={cn(
                "px-4 py-3 flex items-center gap-2 border-b",
                isDark
                  ? "bg-[#111111] border-[#2a2a2d]"
                  : "bg-gray-50 border-gray-200",
              )}
            >
              <button
                onClick={navigateToRoot}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors",
                  isDark
                    ? "text-gray-400 hover:text-white hover:bg-[#2a2a2d]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
                )}
                title="All files"
              >
                <Home className="h-4 w-4" />
                <span className="text-base">All Files</span>
              </button>

              {pathHistory.length > 1 && (
                <>
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5",
                      isDark ? "text-[#3f3f46]" : "text-gray-400",
                    )}
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {pathHistory.slice(1).map((folderId, index) => {
                      const folder = files.find((f) => f.id === folderId);
                      if (!folder) return null;

                      return (
                        <div
                          key={folderId}
                          className="flex items-center gap-1.5"
                        >
                          <button
                            onClick={() => {
                              const newHistory = pathHistory.slice(
                                0,
                                index + 2,
                              );
                              setPathHistory(newHistory);
                              setCurrentFolder(folderId);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors truncate max-w-[120px]",
                              isDark
                                ? "text-gray-300 hover:text-white hover:bg-[#2a2a2d]"
                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-200",
                            )}
                          >
                            <Folder className="h-3 w-3 shrink-0" />
                            <span className="truncate">{folder.fileName}</span>
                          </button>
                          {index < pathHistory.length - 2 && (
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                isDark ? "text-[#3f3f46]" : "text-gray-400",
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-60 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p
                    className={cn(
                      "text-sm",
                      isDark ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    Loading files...
                  </p>
                </div>
              ) : getCurrentFiles().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 gap-4">
                  <div
                    className={cn(
                      "p-4 rounded-full",
                      isDark ? "bg-[#1a1a1c]" : "bg-gray-100",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-8 w-8",
                        isDark ? "text-gray-500" : "text-gray-500",
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "font-medium mb-1",
                        isDark ? "text-gray-300" : "text-gray-700",
                      )}
                    >
                      {searchQuery.trim() ? "No files found" : "No files here"}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        isDark ? "text-gray-500" : "text-gray-500",
                      )}
                    >
                      {searchQuery.trim()
                        ? "Try a different search term"
                        : "Create a file to get started"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {getCurrentFiles().map((file, index) => (
                    <div
                      key={file.id}
                      className={cn(
                        "group flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                        selectedFile?.id === file.id
                          ? cn(
                              "border-blue-500",
                              isDark ? "bg-blue-900/20" : "bg-blue-50",
                            )
                          : cn(
                              "border-transparent hover:border-gray-300",
                              isDark
                                ? "hover:bg-[#1a1a1c] border-[#2a2a2d]"
                                : "hover:bg-gray-50 border-gray-200",
                            ),
                        isDark ? "bg-[#0f0f10]" : "bg-white",
                      )}
                      onClick={() => handleFileClick(file)}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                          getFilePreviewGradient(index),
                        )}
                      >
                        {file.type === "folder" ? (
                          <FolderOpen
                            className={cn("h-6 w-6", getFolderIconColor())}
                          />
                        ) : (
                          <FileText
                            className={cn("h-6 w-6", getFileIconColor())}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className={cn(
                              "font-medium truncate",
                              isDark ? "text-gray-200" : "text-gray-900",
                            )}
                          >
                            {file.fileName}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isDark
                                ? file.type === "folder"
                                  ? "border-orange-800 text-orange-400"
                                  : "border-blue-800 text-blue-400"
                                : file.type === "folder"
                                  ? "border-orange-200 text-orange-700"
                                  : "border-blue-200 text-blue-700",
                            )}
                          >
                            {file.type === "folder" ? "Folder" : "Document"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span
                              className={cn(
                                isDark ? "text-gray-400" : "text-gray-600",
                              )}
                            >
                              {formatDate(file.updatedAt)}
                            </span>
                          </div>

                          {file.size && (
                            <span
                              className={cn(
                                isDark ? "text-gray-400" : "text-gray-600",
                              )}
                            >
                              • {formatFileSize(file.size)}
                            </span>
                          )}

                          {file.createdBy && (
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs",
                                isDark
                                  ? "bg-[#2a2a2d] text-gray-300"
                                  : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {file.createdBy.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedFile?.id === file.id && (
                        <div
                          className={cn(
                            "p-1 rounded-full",
                            isDark ? "bg-blue-600" : "bg-blue-500",
                          )}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-96 flex flex-col min-h-0">
            <div
              className={cn(
                "p-6 border-b",
                isDark ? "border-[#2a2a2d]" : "border-gray-200",
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isDark ? "bg-[#1a1a1c]" : "bg-gray-100",
                  )}
                >
                  <FileText
                    className={cn(
                      "h-5 w-5",
                      isDark ? "text-blue-400" : "text-blue-600",
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-semibold text-lg",
                      isDark ? "text-gray-200" : "text-gray-900",
                    )}
                  >
                    Selected Document
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      isDark ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    {selectedFile
                      ? "Document details and preview"
                      : "Select a document to continue"}
                  </p>
                </div>
              </div>

              {selectedFile ? (
                <div
                  className={cn(
                    "p-4 rounded-xl",
                    isDark
                      ? "bg-[#1a1a1c] border border-[#2a2a2d]"
                      : "bg-gray-50 border border-gray-200",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        isDark ? "bg-blue-900/30" : "bg-blue-100",
                      )}
                    >
                      <FileText
                        className={cn(
                          "h-6 w-6",
                          isDark ? "text-blue-400" : "text-blue-600",
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "font-semibold mb-2 text-lg",
                          isDark ? "text-gray-200" : "text-gray-900",
                        )}
                      >
                        {selectedFile.fileName}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              isDark
                                ? "bg-blue-900/30 text-blue-400 border-blue-800"
                                : "bg-blue-100 text-blue-700 border-blue-200",
                            )}
                          >
                            Document
                          </Badge>
                          <span
                            className={cn(
                              "text-sm",
                              isDark ? "text-gray-400" : "text-gray-600",
                            )}
                          >
                            Updated {formatDate(selectedFile.updatedAt)}
                          </span>
                        </div>
                        {selectedFile.description && (
                          <p
                            className={cn(
                              "text-sm",
                              isDark ? "text-gray-400" : "text-gray-600",
                            )}
                          >
                            {selectedFile.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "p-6 rounded-xl border-2 border-dashed text-center",
                    isDark
                      ? "border-[#2a2a2d] bg-[#0f0f10]"
                      : "border-gray-300 bg-gray-50",
                  )}
                >
                  <FileText
                    className={cn(
                      "h-10 w-10 mx-auto mb-3",
                      isDark ? "text-gray-600" : "text-gray-500",
                    )}
                  />
                  <p
                    className={cn(
                      "font-medium mb-1",
                      isDark ? "text-gray-300" : "text-gray-700",
                    )}
                  >
                    No document selected
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      isDark ? "text-gray-500" : "text-gray-500",
                    )}
                  >
                    Select a document from the list to add the README
                  </p>
                </div>
              )}
            </div>

            <div
              className={cn(
                "p-6 border-b flex-1 overflow-hidden",
                isDark ? "border-[#2a2a2d]" : "border-gray-200",
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isDark ? "bg-[#1a1a1c]" : "bg-gray-100",
                  )}
                >
                  <FolderTree
                    className={cn(
                      "h-5 w-5",
                      isDark ? "text-purple-400" : "text-purple-600",
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-semibold text-lg",
                      isDark ? "text-gray-200" : "text-gray-900",
                    )}
                  >
                    README Preview
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      isDark ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    Preview of the content that will be added
                  </p>
                </div>
              </div>

              <div className="h-48 overflow-y-auto mb-4">
                <div
                  className={cn(
                    "p-4 rounded-lg text-sm font-mono whitespace-pre-wrap",
                    isDark
                      ? "bg-[#1a1a1c] text-gray-300 border border-[#2a2a2d]"
                      : "bg-gray-50 text-gray-700 border border-gray-200",
                  )}
                >
                  {readmeContent.length > 500
                    ? `${readmeContent.substring(0, 500)}...`
                    : readmeContent}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div
                  className={cn(
                    "text-xs flex items-center gap-2",
                    isDark ? "text-gray-500" : "text-gray-500",
                  )}
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isDark ? "bg-blue-500" : "bg-blue-500",
                    )}
                  />
                  <span>
                    {readmeContent.length.toLocaleString()} characters
                  </span>
                </div>
                <div
                  className={cn(
                    "text-xs",
                    isDark ? "text-gray-500" : "text-gray-500",
                  )}
                >
                  Will be added to beginning
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={!selectedFile || isLoading}
                className="w-full h-11 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding README...
                  </>
                ) : (
                  "Add README to Document"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-11"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "0 KB";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}
