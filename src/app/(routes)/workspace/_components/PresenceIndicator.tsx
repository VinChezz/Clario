"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEffect, useState, useMemo, useCallback } from "react";
import { usePresence } from "@/hooks/usePresence";

interface PresenceIndicatorProps {
  fileId?: string;
  activeUsers?: any[];
}

export function PresenceIndicator({
  fileId,
  activeUsers: propActiveUsers,
}: PresenceIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const isMobile = useIsMobile();

  const { activeUsers: hookActiveUsers, isLoading } = useMemo(
    () =>
      fileId ? usePresence(fileId) : { activeUsers: [], isLoading: false },
    [fileId],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const users = useMemo(() => {
    const sourceUsers = fileId ? hookActiveUsers : propActiveUsers || [];

    if (!sourceUsers || sourceUsers.length === 0) {
      return [];
    }

    const now = Date.now();
    const activeThreshold = 2 * 60 * 1000;

    const filteredUsers = sourceUsers.filter((user: any) => {
      const lastActive = new Date(user.lastActive).getTime();
      return now - lastActive < activeThreshold;
    });

    return filteredUsers
      .filter((user: any) => user?.user?.id)
      .reduce((acc: any[], user: any) => {
        const existingIndex = acc.findIndex(
          (u: any) => u.user.id === user.user.id,
        );
        if (existingIndex !== -1) {
          const existingUser = acc[existingIndex];
          const existingTime = new Date(existingUser.lastActive).getTime();
          const newTime = new Date(user.lastActive).getTime();

          if (newTime > existingTime) {
            acc[existingIndex] = user;
          }
        } else {
          acc.push(user);
        }
        return acc;
      }, [])
      .sort(
        (a: any, b: any) =>
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
      );
  }, [hookActiveUsers, propActiveUsers, fileId, currentTime]);

  const getStatusColor = useCallback(
    (status: string, lastActive: string) => {
      const lastActiveTime = new Date(lastActive).getTime();
      const now = currentTime;
      const secondsInactive = (now - lastActiveTime) / 1000;

      if (secondsInactive > 30) {
        return "bg-yellow-400";
      }

      switch (status) {
        case "EDITING":
          return "bg-green-400 animate-pulse";
        case "VIEWING":
          return "bg-blue-400";
        case "COMMENTING":
          return "bg-purple-400";
        case "IDLE":
          return "bg-gray-400";
        default:
          return "bg-gray-400";
      }
    },
    [currentTime],
  );

  const getStatusText = useCallback(
    (status: string, lastActive: string) => {
      const lastActiveTime = new Date(lastActive).getTime();
      const now = currentTime;
      const secondsInactive = Math.floor((now - lastActiveTime) / 1000);

      if (secondsInactive > 60) {
        const minutesInactive = Math.floor(secondsInactive / 60);
        return `Inactive (${minutesInactive}m ago)`;
      }

      switch (status) {
        case "EDITING":
          return "Editing now";
        case "VIEWING":
          return "Viewing";
        case "COMMENTING":
          return "Commenting";
        case "IDLE":
          return "Idle";
        default:
          return "Unknown";
      }
    },
    [currentTime],
  );

  const getTimeAgo = useCallback(
    (lastActive: string) => {
      const lastActiveTime = new Date(lastActive).getTime();
      const now = currentTime;
      const minutesAgo = Math.floor((now - lastActiveTime) / (1000 * 60));

      if (minutesAgo < 1) return "just now";
      if (minutesAgo === 1) return "1 minute ago";
      if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

      const hoursAgo = Math.floor(minutesAgo / 60);
      if (hoursAgo === 1) return "1 hour ago";
      return `${hoursAgo} hours ago`;
    },
    [currentTime],
  );

  const avatarSize = isMobile ? "h-7 w-7" : "h-6 w-6";
  const statusDotSize = isMobile
    ? "h-3 w-3 -bottom-0.5 -right-0.5"
    : "h-2.5 w-2.5 -bottom-0.5 -right-0.5";
  const moreUsersSize = isMobile ? "h-7 w-7 text-xs" : "h-6 w-6 text-[10px]";

  if (fileId && isLoading && users.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`${avatarSize} rounded-full bg-gray-200 dark:bg-[#252528] border-2 border-white dark:border-[#1a1a1c] animate-pulse`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500 dark:text-[#707070]">
          No active users
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {!isMobile && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700 dark:text-[#f0f0f0] hidden sm:inline">
              {users.length} online
            </span>
          </div>
        )}

        <div className="flex -space-x-2">
          {users.slice(0, isMobile ? 3 : 4).map((user) => (
            <Tooltip key={`${user.user.id}-${user.lastActive}`}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={`${avatarSize} border-2 border-white dark:border-[#1a1a1c] shadow-sm`}
                  >
                    <AvatarImage src={user.user?.image} alt={user.user?.name} />
                    <AvatarFallback
                      className={`${
                        isMobile ? "text-xs" : "text-[10px]"
                      } bg-gray-200 dark:bg-[#252528] text-gray-700 dark:text-[#f0f0f0]`}
                    >
                      {user.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute ${statusDotSize} rounded-full border-2 border-white dark:border-[#1a1a1c] ${getStatusColor(
                      user.status,
                      user.lastActive,
                    )}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
                <div className="text-sm space-y-1">
                  <p className="font-medium dark:text-[#f0f0f0]">
                    {user.user?.name || "Unknown User"}
                  </p>
                  <p className="text-gray-600 dark:text-[#a0a0a0]">
                    {getStatusText(user.status, user.lastActive)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#707070]">
                    Last active: {getTimeAgo(user.lastActive)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {users.length > (isMobile ? 3 : 4) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`${moreUsersSize} bg-gray-200 dark:bg-[#252528] rounded-full flex items-center justify-center font-medium border-2 border-white dark:border-[#1a1a1c] shadow-sm text-gray-700 dark:text-[#f0f0f0]`}
                >
                  +{users.length - (isMobile ? 3 : 4)}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
                <div className="space-y-2">
                  <p className="font-medium dark:text-[#f0f0f0]">
                    {users.length - (isMobile ? 3 : 4)} more users
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {users.slice(isMobile ? 3 : 4).map((user) => (
                      <div
                        key={user.user.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={user.user?.image} />
                          <AvatarFallback className="text-[8px] bg-gray-200 dark:bg-[#252528] text-gray-700 dark:text-[#f0f0f0]">
                            {user.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="dark:text-[#f0f0f0]">
                          {user.user?.name}
                        </span>
                        <span className="text-gray-500 dark:text-[#707070]">
                          {getStatusText(user.status, user.lastActive)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
