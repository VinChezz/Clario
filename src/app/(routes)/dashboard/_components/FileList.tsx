"use client";

import { FileListContext } from "@/app/_context/FileListContext";
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

type ViewMode = "grid" | "list" | "table";

export default function FileList() {
  const { fileList_, setFileList_ } = useContext(FileListContext);
  const [fileList, setFileList] = useState<FILE[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const { user }: any = useKindeBrowserClient();
  const router = useRouter();

  useEffect(() => {
    if (fileList_) setFileList(fileList_);
  }, [fileList_]);

  // Filter and sort files
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

  const handleFileAction = (action: string, file: FILE) => {
    switch (action) {
      case "share":
        console.log("Sharing file:", file.fileName);
        break;
      case "download":
        console.log("Downloading file:", file.fileName);
        break;
      case "rename":
        console.log("Renaming file:", file.fileName);
        break;
      case "archive":
        console.log("Archiving file:", file.fileName);
        break;
      case "delete":
        console.log("Deleting file:", file.fileName);
        break;
      default:
        break;
    }
  };

  if (!fileList || fileList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-24 h-24 bg-linear-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <FileText className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No files yet</h3>
        <p className="text-gray-500 text-lg max-w-md mb-8">
          Create your first file to get started with your team workspace
        </p>
        <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create New File
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Files</h2>
          <p className="text-gray-500 mt-1">
            {filteredAndSortedFiles.length} file
            {filteredAndSortedFiles.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 rounded-lg border-gray-300 focus:border-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                Date Modified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("size")}>
                Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="grid" className="gap-2 px-3">
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 px-3">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2 px-3">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedFiles.map((file, index) => (
            <div
              key={file.id || index}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-gray-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => router.push(`/workspace/${file.id}`)}
            >
              <div className="relative">
                <div
                  className={`h-40 bg-linear-to-br ${getFilePreviewGradient(
                    index
                  )} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-16 w-16 text-white/90" />
                  </div>

                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className={`${getFileTypeColor(
                        file.fileName
                      )} text-xs font-medium`}
                    >
                      {file.fileName.split(".").pop()?.toUpperCase() || "FILE"}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction("share", file);
                        }}
                      >
                        <Share className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("download", file)}
                          >
                            <Download className="h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("rename", file)}
                          >
                            <Edit3 className="h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("share", file)}
                          >
                            <Share className="h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("archive", file)}
                          >
                            <Archive className="h-4 w-4" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => handleFileAction("delete", file)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 truncate flex-1 group-hover:text-blue-600 transition-colors">
                    {file.fileName}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileAction("star", file);
                    }}
                  >
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Edited {formatDate(file.updatedAt)}</span>
                  </div>

                  {file.size && (
                    <div className="text-xs text-gray-500">
                      Size: {formatFileSize(file.size)}
                    </div>
                  )}

                  {file.createdBy && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Image
                        src={file.createdBy.image || "/default-avatar.png"}
                        alt={file.createdBy.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-xs text-gray-600 truncate">
                        {file.createdBy.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredAndSortedFiles.map((file, index) => (
            <div
              key={file.id || index}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
              onClick={() => router.push(`/workspace/${file.id}`)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-linear-to-br ${getFilePreviewGradient(
                    index
                  )} flex items-center justify-center shrink-0 shadow-lg`}
                >
                  <FileText className="h-7 w-7 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {file.fileName}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`${getFileTypeColor(file.fileName)} text-xs`}
                    >
                      {file.fileName.split(".").pop()?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        Modified {formatDate(file.updatedAt)} at{" "}
                        {formatTime(file.updatedAt)}
                      </span>
                    </div>

                    {file.size && (
                      <div className="text-sm text-gray-500">
                        • {formatFileSize(file.size)}
                      </div>
                    )}

                    {file.createdBy && (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <Image
                          src={file.createdBy.image || "/default-avatar.png"}
                          alt={file.createdBy.name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        <span className="text-sm text-gray-600">
                          {file.createdBy.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileAction("share", file);
                    }}
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileAction("star", file);
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleFileAction("download", file)}
                      >
                        <Download className="h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleFileAction("rename", file)}
                      >
                        <Edit3 className="h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleFileAction("copy", file)}
                      >
                        <Copy className="h-4 w-4" /> Make a Copy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleFileAction("archive", file)}
                      >
                        <Archive className="h-4 w-4" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-600"
                        onClick={() => handleFileAction("delete", file)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-gray-50 to-blue-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700 py-4">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-gray-700 py-4">
                  Type
                </TableHead>
                <TableHead className="font-semibold text-gray-700 py-4">
                  Size
                </TableHead>
                <TableHead className="font-semibold text-gray-700 py-4">
                  Modified
                </TableHead>
                <TableHead className="font-semibold text-gray-700 py-4">
                  Author
                </TableHead>
                <TableHead className="w-20 py-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFiles.map((file, index) => (
                <TableRow
                  key={file.id || index}
                  className="cursor-pointer hover:bg-blue-50/50 transition-colors group border-b border-gray-100 last:border-b-0"
                  onClick={() => router.push(`/workspace/${file.id}`)}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-linear-to-br ${getFilePreviewGradient(
                          index
                        )} flex items-center justify-center shadow-md`}
                      >
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {file.fileName}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Created {formatDate(file.createdAt)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="secondary"
                      className={getFileTypeColor(file.fileName)}
                    >
                      {file.fileName.split(".").pop()?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-gray-600 text-sm">
                    {formatFileSize(file.size || 0)}
                  </TableCell>
                  <TableCell className="py-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <div>{formatDate(file.updatedAt)}</div>
                        <div className="text-gray-400">
                          {formatTime(file.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {file.createdBy && (
                      <div className="flex items-center gap-3">
                        <Image
                          src={file.createdBy.image || "/default-avatar.png"}
                          alt={file.createdBy.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                          {file.createdBy.name}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("download", file)}
                          >
                            <Download className="h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("rename", file)}
                          >
                            <Edit3 className="h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("share", file)}
                          >
                            <Share className="h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("archive", file)}
                          >
                            <Archive className="h-4 w-4" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => handleFileAction("copy", file)}
                          >
                            <Copy className="h-4 w-4" /> Make a Copy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => handleFileAction("delete", file)}
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
  );
}

const Search = ({ className }: { className?: string }) => (
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

const Filter = ({ className }: { className?: string }) => (
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

const Plus = ({ className }: { className?: string }) => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);
