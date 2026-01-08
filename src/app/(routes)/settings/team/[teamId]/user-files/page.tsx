"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  ArrowLeft,
  File,
  Folder,
  HardDrive,
  Clock,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    name: string;
    email: string;
    image?: string;
  };
}

export default function UserFilesPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const teamId = params.teamId as string;
  const userId = searchParams.get("user");

  const [userInfo, setUserInfo] = useState<any>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserFiles();
    }
  }, [userId, teamId]);

  const loadUserData = async () => {
    const res = await fetch(`/api/users/${userId}`);
    if (res.ok) setUserInfo(await res.json());
  };

  const loadUserFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/files?userId=${userId}&type=document`
      );
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/settings/team/${teamId}/members/${userId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Member
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Files
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse files created by this team member
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {files.length} files
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(totalSize)} total
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={userInfo?.image}
                alt={userInfo?.name || "User avatar"}
              />
              <AvatarFallback className="bg-muted">
                {userInfo?.name ? (
                  userInfo.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                ) : (
                  <User className="h-8 w-8" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">
                {userInfo?.name || "Loading..."}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {userInfo?.email || "Loading..."}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {files.length} Files Created
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Files
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {files.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <File className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Storage
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatFileSize(totalSize)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Most Recent
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 truncate">
                  {files.length > 0
                    ? format(new Date(files[0]?.createdAt), "MMM d, yyyy")
                    : "No files"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Showing {filteredFiles.length} of {files.length}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No documents found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(file.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(file.createdAt), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          edited {format(new Date(file.updatedAt), "dd MMM")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {!isLoading && files.length > 0 && (
          <CardFooter className="flex justify-between text-sm text-muted-foreground border-t h-5">
            <span>Total storage used</span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-4 w-4" />
              {formatFileSize(totalSize)}
            </span>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
