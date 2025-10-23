"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

interface PresenceIndicatorProps {
  activeUsers: any[];
}

export function PresenceIndicator({ activeUsers }: PresenceIndicatorProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const uniqueUsers = activeUsers
      .filter((user) => user?.user?.id)
      .reduce((acc, user) => {
        const uniqueId = `${user.user.id}-${user.lastActive}`;

        const existingIndex = acc.findIndex(
          (u: any) => u.user.id === user.user.id
        );
        if (existingIndex !== -1) {
          const existingUser = acc[existingIndex];
          const existingTime = new Date(existingUser.lastActive).getTime();
          const newTime = new Date(user.lastActive).getTime();

          if (newTime > existingTime) {
            acc[existingIndex] = { ...user, uniqueId };
          }
        } else {
          acc.push({ ...user, uniqueId });
        }
        return acc;
      }, [] as any[])
      .sort(
        (a: any, b: any) =>
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      );

    setUsers(uniqueUsers);
  }, [activeUsers, currentTime]);

  const getStatusColor = (status: string, lastActive: string) => {
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
  };

  const getStatusText = (status: string, lastActive: string) => {
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
  };

  const getTimeAgo = (lastActive: string) => {
    const lastActiveTime = new Date(lastActive).getTime();
    const now = currentTime;
    const minutesAgo = Math.floor((now - lastActiveTime) / (1000 * 60));

    if (minutesAgo < 1) return "just now";
    if (minutesAgo === 1) return "1 minute ago";
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo === 1) return "1 hour ago";
    return `${hoursAgo} hours ago`;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{users.length} online</span>

        <div className="flex -space-x-2">
          {users.slice(0, 4).map((user) => (
            <Tooltip
              key={user.uniqueId || `${user.user.id}-${user.lastActive}`}
            >
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                    <AvatarImage src={user.user?.image} alt={user.user?.name} />
                    <AvatarFallback className="text-[10px] bg-gray-200">
                      {user.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${getStatusColor(
                      user.status,
                      user.lastActive
                    )}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {user.user?.name || "Unknown User"}
                  </p>
                  <p className="text-gray-600">
                    {getStatusText(user.status, user.lastActive)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last active: {getTimeAgo(user.lastActive)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {users.length > 4 && (
            <Tooltip key="more-users-tooltip">
              <TooltipTrigger asChild>
                <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-medium border-2 border-white shadow-sm">
                  +{users.length - 4}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2">
                  <p className="font-medium">{users.length - 4} more users</p>
                  <div className="space-y-1">
                    {users.slice(4).map((user) => (
                      <div
                        key={
                          user.uniqueId || `${user.user.id}-${user.lastActive}`
                        }
                        className="flex items-center gap-2 text-xs"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={user.user?.image} />
                          <AvatarFallback className="text-[8px]">
                            {user.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.user?.name}</span>
                        <span className="text-gray-500">
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
