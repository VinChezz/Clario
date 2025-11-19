"use client";

import {
  ChevronDown,
  FileText,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  ChevronRight,
  Crown,
  Archive,
  Flag,
  History,
  Star,
} from "lucide-react";
import Image from "next/image";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileListContext } from "@/app/_context/FileListContext";
import { FILE } from "@/shared/types/file.interface";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/useMediaQuery";

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: "ADMIN" | "VIEW" | "EDIT";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface TEAM {
  id: string;
  name: string;
  createdById: string;
  _count?: {
    members: number;
  };
  members?: TeamMember[];
}

interface SideNavTopSectionProps {
  user: any;
  setActiveTeamInfo: (team: TEAM) => void;
  onItemClick?: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
  fileList_?: FILE[];
}

function SideNavTopSection({
  user,
  setActiveTeamInfo,
  onItemClick,
  isMobile = false,
  isTablet = false,
  fileList_ = [],
}: SideNavTopSectionProps) {
  const menu = [
    {
      id: 1,
      name: "Create Team",
      path: "/teams/create",
      icon: Users,
      description: "Start new team",
      color: "text-blue-600",
    },
    {
      id: 2,
      name: "Settings",
      path: "/settings",
      icon: Settings,
      description: "Manage preferences",
      color: "text-gray-600",
    },
    {
      id: 3,
      name: "Recent",
      icon: History,
      description: "Recent files",
      color: "text-indigo-600",
    },
    {
      id: 4,
      name: "Favorites",
      icon: Star,
      description: "Favorite files",
      color: "text-yellow-600",
    },
  ];

  const router = useRouter();
  const [activeTeam, setActiveTeam] = useState<TEAM>();
  const [teamList, setTeamList] = useState<TEAM[]>();
  const [fileList, setFileList] = useState<FILE[]>([]);
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const stableFileList = useMemo(() => fileList_, [JSON.stringify(fileList_)]);

  const isDesktop = useIsDesktop();

  useEffect(() => {
    setFileList(stableFileList);
  }, [stableFileList]);

  useEffect(() => {
    if (user) getTeamList();
  }, [user]);

  useEffect(() => {
    if (activeTeam) setActiveTeamInfo(activeTeam);
  }, [activeTeam]);

  const getTeamList = async () => {
    try {
      const res = await fetch("/api/teams", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`failed to fetch teams: ${res.status}`);
      }

      const data: TEAM[] = await res.json();
      setTeamList(data);
      if (data.length > 0) {
        setActiveTeam(data[0]);
      }
    } catch (e: any) {
      console.error("❌ Error fetching teams:", e.message);
    }
  };

  const getTeamSwitcherSize = () => {
    if (isMobile)
      return {
        padding: "p-3",
        gap: "gap-3",
        iconSize: "w-10 h-10",
        textSize: "text-sm",
      };
    if (isTablet)
      return {
        padding: "p-3",
        gap: "gap-3",
        iconSize: "w-10 h-10",
        textSize: "text-sm",
      };
    return {
      padding: "p-2",
      gap: "gap-2",
      iconSize: "w-8 h-8",
      textSize: "text-sm",
    };
  };

  const getFileItemSize = () => {
    if (isMobile)
      return {
        padding: "p-2.5",
        gap: "gap-3",
        iconSize: "w-7 h-7",
        textSize: "text-sm",
      };
    if (isTablet)
      return {
        padding: "p-2.5",
        gap: "gap-3",
        iconSize: "w-7 h-7",
        textSize: "text-sm",
      };
    return {
      padding: "p-1.5",
      gap: "gap-2",
      iconSize: "w-5 h-5",
      textSize: "text-sm",
    };
  };

  const getQuickAccessSize = () => {
    if (isMobile) return { buttonClass: "py-4 text-sm", iconSize: "h-4 w-4" };
    if (isTablet) return { buttonClass: "py-4 text-sm", iconSize: "h-4 w-4" };
    return { buttonClass: "py-2 text-xs", iconSize: "h-3.5 w-3.5" };
  };

  const teamSwitcher = getTeamSwitcherSize();
  const fileItem = getFileItemSize();
  const quickAccess = getQuickAccessSize();

  const onMenuClick = (item: any) => {
    if (item.path) router.push(item.path);
    setPopoverOpen(false);
    onItemClick?.();
  };

  const isCooperativeTeam = (team: TEAM) => {
    return team._count?.members && team._count.members > 3;
  };

  const getTeamInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTeamColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-orange-500 to-orange-600",
      "from-rose-500 to-rose-600",
      "from-cyan-500 to-cyan-600",
      "from-teal-500 to-teal-600",
      "from-amber-500 to-amber-600",
    ];
    return colors[index % colors.length];
  };

  const handleFileClick = (fileId: string) => {
    router.push(`/workspace/${fileId}`);
    onItemClick?.();
  };

  return (
    <div className={cn("space-y-4", isTablet && "space-y-3")}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="team-switcher"
            variant="ghost"
            className={cn(
              "w-full h-auto hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300",
              teamSwitcher.padding
            )}
          >
            <div className={cn("flex items-center w-full", teamSwitcher.gap)}>
              <div className="relative">
                <div
                  className={cn(
                    "rounded-xl bg-linear-to-br flex items-center justify-center shadow-sm",
                    teamSwitcher.iconSize,
                    activeTeam
                      ? getTeamColor(
                          teamList?.findIndex((t) => t.id === activeTeam.id) ||
                            0
                        )
                      : "from-gray-400 to-gray-500"
                  )}
                >
                  <span
                    className={cn(
                      "text-white font-bold",
                      teamSwitcher.textSize
                    )}
                  >
                    {activeTeam ? getTeamInitials(activeTeam.name) : "T"}
                  </span>
                </div>
                {activeTeam && activeTeam.createdById === user?.id && (
                  <div
                    className={cn(
                      "absolute -top-1 -right-1 bg-yellow-400 rounded-full shadow-sm",
                      isMobile ? "p-1" : "p-1"
                    )}
                  >
                    <Crown className={isMobile ? "h-3 w-3" : "h-3 w-3"} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className={cn("flex items-center mb-1", teamSwitcher.gap)}>
                  <h2
                    className={cn(
                      "font-semibold text-gray-700 truncate",
                      isMobile ? "text-base" : "text-base"
                    )}
                  >
                    {activeTeam?.name || "Select Team"}
                  </h2>
                  {activeTeam && isCooperativeTeam(activeTeam) && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "bg-green-50 text-green-700 border-green-200",
                        isMobile
                          ? "text-xs px-2 py-0 h-5"
                          : "text-sm px-3 py-1 h-6"
                      )}
                    >
                      Team
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    "text-gray-500 truncate",
                    isMobile ? "text-xs" : "text-sm"
                  )}
                >
                  {activeTeam?._count?.members || 0} members
                </p>
              </div>

              <ChevronDown
                className={cn(
                  "text-gray-400 transition-transform duration-200 shrink-0",
                  isMobile ? "h-5 w-5" : "h-6 w-6",
                  popoverOpen && "rotate-180"
                )}
              />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            "rounded-2xl shadow-xl border border-gray-200 max-h-[80vh] overflow-hidden flex flex-col",
            isMobile
              ? "w-[calc(100vw-2rem)] max-w-[400px] p-3"
              : isDesktop
              ? "w-72 p-3"
              : "w-96 p-6",
            isTablet && "w-88 p-5"
          )}
          align="start"
          sideOffset={isMobile ? 8 : 12}
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3
              className={cn(
                "font-semibold text-gray-700",
                isMobile ? "text-sm" : isDesktop ? "text-sm" : "text-xl"
              )}
            >
              Teams
            </h3>
            <Badge
              variant="outline"
              className={
                isMobile
                  ? "text-xs"
                  : isDesktop
                  ? "text-xs px-2 py-0"
                  : "text-base px-3 py-1"
              }
            >
              {teamList?.length || 0}
            </Badge>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {teamList?.map((team, index) => (
              <div
                key={team.id}
                className={cn(
                  "flex items-center justify-between rounded-lg cursor-pointer transition-all duration-200 border p-3 hover:shadow-sm",
                  activeTeam?.id === team.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                )}
                onClick={() => {
                  setActiveTeam(team);
                  setPopoverOpen(false);
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "rounded-lg bg-linear-to-br flex items-center justify-center shrink-0 shadow-sm",
                      isMobile
                        ? "w-10 h-10"
                        : isDesktop
                        ? "w-8 h-8"
                        : "w-14 h-14",
                      getTeamColor(index)
                    )}
                  >
                    <span
                      className={cn(
                        "text-white font-bold",
                        isMobile ? "text-sm" : isDesktop ? "text-xs" : "text-lg"
                      )}
                    >
                      {getTeamInitials(team.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className={cn(
                          "font-semibold truncate",
                          isMobile
                            ? "text-sm"
                            : isDesktop
                            ? "text-xs"
                            : "text-lg"
                        )}
                      >
                        {team.name}
                      </span>
                      {team.createdById === user?.id && (
                        <Crown
                          className={
                            isMobile
                              ? "h-4 w-4"
                              : isDesktop
                              ? "h-3 w-3"
                              : "h-5 w-5 text-yellow-500"
                          }
                        />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-gray-500 truncate",
                        isMobile
                          ? "text-xs"
                          : isDesktop
                          ? "text-[10px]"
                          : "text-base"
                      )}
                    >
                      {team._count?.members || 0} members
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-3 shrink-0" />

          <div className="space-y-2 shrink-0">
            {menu.map((item) => (
              <div
                key={item.id}
                className="flex items-center rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 group p-3 gap-3 hover:shadow-sm"
                onClick={() => onMenuClick(item)}
              >
                <div
                  className={cn(
                    "rounded-md bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors shrink-0 shadow-sm",
                    isMobile
                      ? "w-10 h-10"
                      : isDesktop
                      ? "w-8 h-8"
                      : "w-12 h-12",
                    item.color
                  )}
                >
                  <item.icon
                    className={
                      isMobile ? "h-5 w-5" : isDesktop ? "h-4 w-4" : "h-6 w-6"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-semibold text-gray-700 truncate",
                      isMobile ? "text-sm" : isDesktop ? "text-xs" : "text-lg"
                    )}
                  >
                    {item.name}
                  </h3>
                  <p
                    className={cn(
                      "text-gray-500 truncate",
                      isMobile
                        ? "text-xs"
                        : isDesktop
                        ? "text-[10px]"
                        : "text-sm"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-3 shrink-0" />

          <div className="space-y-2 shrink-0">
            {user && (
              <div className="flex items-center p-2 gap-3 bg-gray-50 rounded-lg">
                <Image
                  src={user?.picture}
                  alt="user"
                  width={isMobile ? 40 : isDesktop ? 32 : 56}
                  height={isMobile ? 40 : isDesktop ? 32 : 56}
                  className="rounded-full border border-white shadow-sm shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2
                    className={cn(
                      "font-bold text-gray-700 truncate",
                      isMobile ? "text-sm" : isDesktop ? "text-xs" : "text-xl"
                    )}
                  >
                    {user?.given_name} {user?.family_name}
                  </h2>
                  <h2
                    className={cn(
                      "text-gray-500 truncate",
                      isMobile
                        ? "text-xs"
                        : isDesktop
                        ? "text-[10px]"
                        : "text-base"
                    )}
                  >
                    {user?.email}
                  </h2>
                </div>
              </div>
            )}
            <LogoutLink>
              <div className="flex items-center rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-50 group p-3 gap-3 hover:shadow-sm border border-transparent hover:border-red-200">
                <div
                  className={cn(
                    "rounded-md bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0 shadow-sm",
                    isMobile ? "w-10 h-10" : isDesktop ? "w-8 h-8" : "w-12 h-12"
                  )}
                >
                  <LogOut
                    className={
                      isMobile
                        ? "h-5 w-5"
                        : isDesktop
                        ? "h-4 w-4"
                        : "h-6 w-6 text-red-600"
                    }
                  />
                </div>
                <span
                  className={cn(
                    "font-semibold text-red-600",
                    isMobile ? "text-sm" : isDesktop ? "text-xs" : "text-lg"
                  )}
                >
                  Logout
                </span>
              </div>
            </LogoutLink>
          </div>
        </PopoverContent>
      </Popover>

      <div className="space-y-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between items-center hover:bg-gray-50 transition-all duration-200 group",
            teamSwitcher.padding,
            isMobile ? "rounded-xl" : "rounded-lg"
          )}
          onClick={() => setOpen(!open)}
        >
          <div className={cn("flex items-center", teamSwitcher.gap)}>
            <div
              className={cn(
                "rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm",
                teamSwitcher.iconSize
              )}
            >
              <LayoutGrid
                className={cn("text-white", isMobile ? "h-5 w-5" : "h-4 w-4")}
              />
            </div>
            <div className="text-left">
              <span
                className={cn(
                  "font-semibold text-gray-900",
                  teamSwitcher.textSize
                )}
              >
                All Files
              </span>
              <p
                className={cn(
                  "text-gray-500",
                  isMobile ? "text-xs" : "text-[10px]"
                )}
              >
                {fileList.length} file{fileList.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg transition-all duration-200",
              isMobile ? "p-2" : "p-1",
              open
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
            )}
          >
            {open ? (
              <ChevronDown className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
            ) : (
              <ChevronRight className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
            )}
          </div>
        </Button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="file-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "border-l-2 border-gray-100 space-y-0.5 py-1",
                  isMobile ? "ml-4 pl-6" : "ml-3 pl-4"
                )}
              >
                {fileList && fileList.length > 0 ? (
                  fileList.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 group",
                        fileItem.padding,
                        fileItem.gap
                      )}
                      onClick={() => handleFileClick(file.id)}
                    >
                      <div
                        className={cn(
                          "rounded-md bg-linear-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white",
                          fileItem.iconSize
                        )}
                      >
                        <FileText
                          className={isMobile ? "h-4 w-4" : "h-3 w-3"}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-gray-700 group-hover:text-text-gray-700 truncate flex-1",
                          fileItem.textSize
                        )}
                      >
                        {file.fileName}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight
                          className={isMobile ? "h-3 w-3" : "h-2 w-2"}
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex items-center rounded-lg bg-gray-50 border border-gray-100",
                      fileItem.padding,
                      fileItem.gap
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-md bg-gray-200 flex items-center justify-center",
                        fileItem.iconSize
                      )}
                    >
                      <FileText className={isMobile ? "h-3 w-3" : "h-2 w-2"} />
                    </div>
                    <div>
                      <p className={cn("text-gray-600", fileItem.textSize)}>
                        No files yet
                      </p>
                      <p
                        className={cn(
                          "text-gray-400",
                          isMobile ? "text-xs" : "text-[10px]"
                        )}
                      >
                        Create your first file
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2.5">
        <h3
          className={cn(
            "font-semibold text-black",
            isMobile ? "text-base" : "text-sm"
          )}
        >
          Quick Access
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {menu.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className={cn(
                "h-auto hover:bg-gray-50 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-700",
                quickAccess.buttonClass
              )}
              onClick={() => onMenuClick(item)}
            >
              <div className="flex flex-col items-center gap-1.5">
                <item.icon
                  className={cn(quickAccess.iconSize, "text-gray-600")}
                />
                <span
                  className={cn(
                    "font-medium text-gray-700",
                    isMobile ? "text-sm" : "text-xs"
                  )}
                >
                  {item.name}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SideNavTopSection;
