"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PresenceIndicatorProps {
  activeUsers: any[];
}

export function PresenceIndicator({ activeUsers }: PresenceIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "EDITING":
        return "bg-green-400";
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "EDITING":
        return "Editing";
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

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 4).map((user, index) => (
            <Tooltip key={user.id || index}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-5 w-5 border border-white">
                    <AvatarImage src={user.user.image} />
                    <AvatarFallback className="text-[10px]">
                      {user.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${getStatusColor(
                      user.status
                    )}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.user.name}</p>
                <p className="text-sm text-gray-600">
                  {getStatusText(user.status)}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}

          {activeUsers.length > 4 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-medium border border-white">
                  +{activeUsers.length - 4}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>And {activeUsers.length - 4} more users online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
