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
  Activity,
  FileText,
  User,
  Calendar,
  Clock,
  ArrowLeft,
  MessageSquare,
  Eye,
  Download,
  Upload,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: {
    type: string;
    name: string;
    id: string;
  };
}

export default function UserActivityPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const teamId = params.teamId as string;
  const userId = searchParams.get("user");

  const [userInfo, setUserInfo] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserActivity();
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

  const loadUserActivity = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/activity?userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
      case "upload":
        return <Upload className="h-4 w-4 text-green-600" />;
      case "edit":
      case "update":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "view":
      case "read":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "download":
        return <Download className="h-4 w-4 text-amber-600" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
      case "upload":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "edit":
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "view":
      case "read":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "download":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "comment":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.resource?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayActivity = activities.filter(
    (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
  );

  const avgPerDay = Math.round(filteredActivities.length / 14);

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
              Activity Log
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track actions performed by this team member
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activities.length} activities
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {todayActivity.length} today
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userInfo?.image} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {userInfo?.name || "Loading..."}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {userInfo?.email || "Loading..."}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Last Active
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activities.length > 0
                    ? formatDistanceToNow(new Date(activities[0].timestamp), {
                        addSuffix: true,
                      })
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Actions
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {activities.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {todayActivity.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg/Day
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {avgPerDay}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Latest actions by {userInfo?.name || "this member"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative ml-4">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <TooltipProvider>
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No activity yet
                </div>
              ) : (
                filteredActivities
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((activity) => {
                    const isExpanded = expandedActivity === activity.id;
                    return (
                      <div key={activity.id} className="relative mb-4 pl-8">
                        <div
                          className={`absolute left-2 top-1 h-3 w-3 rounded-full ${getActionColor(
                            activity.action
                          )} cursor-pointer`}
                          onClick={() =>
                            setExpandedActivity(isExpanded ? null : activity.id)
                          }
                        ></div>

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getActionColor(
                                  activity.action
                                )}`}
                              >
                                {getActionIcon(activity.action)}
                                <span className="capitalize">
                                  {activity.action}
                                </span>
                              </div>
                              {activity.resource && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="text-xs cursor-pointer"
                                    >
                                      {activity.resource.type}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {activity.resource.name}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
                                  {formatDistanceToNow(
                                    new Date(activity.timestamp),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(
                                  new Date(activity.timestamp),
                                  "MMM d, yyyy 'at' h:mm a"
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {isExpanded && (
                            <div className="bg-gray-50 dark:bg-gray-800/65 p-3 rounded-lg mt-1 transition-all duration-300">
                              <p className="text-gray-900 dark:text-white">
                                {activity.details}
                              </p>
                              <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(activity.timestamp),
                                    "h:mm a"
                                  )}
                                </div>
                                {activity.ipAddress && (
                                  <span>IP: {activity.ipAddress}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
