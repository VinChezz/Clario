"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  User,
  Calendar,
  ArrowLeft,
  FileText,
  Reply,
  Search,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies: number;
  status: "OPEN" | "RESOLVED";
  file: {
    id: string;
    name: string;
    type: string;
  };
  isEdited: boolean;
}

export default function UserCommentsPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const teamId = params.teamId as string;
  const userId = searchParams.get("user");

  const [userInfo, setUserInfo] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserComments();
    }
  }, [userId, teamId]);

  const loadUserData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadUserComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/comments?userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || comment.file.type.includes(filterType);
    return matchesSearch && matchesType;
  });

  const resolvedComments = comments.filter(
    (comment) => comment.status === "RESOLVED"
  ).length;

  const resolutionRate =
    comments.length > 0
      ? Math.round((resolvedComments / comments.length) * 100)
      : 0;

  const totalReplies = comments.reduce(
    (sum, comment) => sum + comment.replies,
    0
  );
  const recentComments = comments.slice(0, 5);

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
              User Comments
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review comments made by this team member
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {comments.length} comments
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {resolvedComments} resolved comments
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="py-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userInfo?.image} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">
                {userInfo?.name || "Loading..."}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {userInfo?.email || "Loading..."}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {comments.length} Comments
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
                  Total Comments
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {comments.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Resolved Comments
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {resolvedComments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Replies
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalReplies}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Reply className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-1">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search comments or files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>
            Comments made by {userInfo?.name || "this member"} on team files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No comments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? "Try a different search term"
                  : "This user hasn't made any comments yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className="group border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userInfo?.image} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {userInfo?.name || "User"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {comment.isEdited && (
                            <>
                              <span>•</span>
                              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                Edited
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content || "—"}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{comment.status}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          <Reply className="h-4 w-4" />
                          <span>{comment.replies}</span>
                        </Button>
                      </div>

                      <Link
                        href={`/workspace/${comment.file.id}`}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {comment.file.name}
                        </span>
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {comment.file.type.split("/")[1]?.toUpperCase() ||
                          "FILE"}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Updated{" "}
                      {format(new Date(comment.updatedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment Activity Overview</CardTitle>
          <CardDescription>
            Summary of comments, resolution status, and replies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Recently Commented Files
              </h4>
              <div className="space-y-3">
                {recentComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {comment.file.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(comment.createdAt), "MMM d")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {comment.status === "RESOLVED"
                              ? "Resolved"
                              : "Open"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Reply className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {comment.replies}{" "}
                            {comment.replies > 0 ? "reply" : "replies"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {comments.length > 0
                    ? (Number(resolvedComments) / comments.length).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. resolution rate
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {comments.length > 0
                    ? Math.round((resolvedComments / comments.length) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Resolution rate
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
