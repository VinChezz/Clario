"use client";
import {
  ChevronDown,
  FileText,
  LogOut,
  Settings,
  Users,
  ChevronRight,
  Crown,
  History,
  Star,
  Search,
  Sparkles,
  Clock,
  FolderOpen,
  Lock,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { FILE } from "@/shared/types/file.interface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useIsMobile,
  useIsTablet,
  useIsLargeTablet,
  useIsHorizontalMobile,
  useIsHorizontalTablet,
  useIsLandscape,
} from "@/hooks/useMediaQuery";
import { Plan } from "@prisma/client";

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
  fileCount?: number;
  onFileClick?: (fileId: string) => void;
  refreshTrigger?: number;
  onRefreshFiles?: () => void;
}

function SideNavTopSection({
  user,
  setActiveTeamInfo,
  onItemClick,
  fileList_ = [],
  fileCount = 0,
  onFileClick,
  refreshTrigger = 0,
  onRefreshFiles,
}: SideNavTopSectionProps) {
  const router = useRouter();
  const [activeTeam, setActiveTeam] = useState<TEAM>();
  const [teamList, setTeamList] = useState<TEAM[]>();
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileFilter, setFileFilter] = useState<"all" | "recent" | "favorites">(
    "all"
  );
  const [localFileList, setLocalFileList] = useState<FILE[]>(fileList_);

  const [userPlan, setUserPlan] = useState<Plan>(Plan.FREE);
  const [currentTeamsCount, setCurrentTeamsCount] = useState(0);
  const [canCreateTeam, setCanCreateTeam] = useState(true);

  const isMobileDevice = useIsMobile();
  const isTabletDevice = useIsTablet();
  const isLargeTabletDevice = useIsLargeTablet();
  const isHorizontalMobileDevice = useIsHorizontalMobile();
  const isHorizontalTablet = useIsHorizontalTablet();
  const isLandscapeDevice = useIsLandscape();

  const memoizedLocalFileList = useMemo(
    () => localFileList,
    [JSON.stringify(localFileList)]
  );

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadFiles();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (user) {
      getTeamList();
      fetchUserPlan();
    }
  }, [user]);

  useEffect(() => {
    if (activeTeam) setActiveTeamInfo(activeTeam);
  }, [activeTeam]);

  const fetchUserPlan = async () => {
    try {
      const response = await fetch("/api/users/plan");
      const data = await response.json();

      setUserPlan(data.user.plan);
      setCurrentTeamsCount(data.usage.teams.current);
      setCanCreateTeam(data.usage.teams.canCreate);
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const loadFiles = async () => {
    try {
      if (!activeTeam?.id) return;

      console.log("🔄 Loading files for sidenav team:", activeTeam.id);

      const response = await fetch(`/api/files?teamId=${activeTeam.id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const files = await response.json();
      console.log("📁 Sidenav files response:", files);

      const activeFiles = Array.isArray(files)
        ? files.filter((file) => !file.deletedAt)
        : [];

      setLocalFileList(activeFiles);
      console.log("✅ Sidenav files loaded successfully:", activeFiles.length);
    } catch (error) {
      console.error("❌ Failed to load files in sidenav:", error);
      setLocalFileList([]);
    }
  };

  useEffect(() => {
    if (activeTeam?.id) {
      loadFiles();
    }
  }, [activeTeam?.id]);

  const getTeamList = async () => {
    try {
      const res = await fetch("/api/teams", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
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
      "from-pink-500 to-pink-600",
    ];
    return colors[index % colors.length];
  };

  const handleFileClick = (fileId: string) => {
    if (onFileClick) {
      onFileClick(fileId);
    } else {
      router.push(`/workspace/${fileId}`);
    }
    setFilesModalOpen(false);
    onItemClick?.();
  };

  const handleTeamSelect = (team: TEAM) => {
    setActiveTeam(team);
    setTeamsModalOpen(false);
    setSearchQuery("");
    if (team.id !== activeTeam?.id) {
      loadFiles();
    }
  };

  const handleQuickAction = (path: string) => {
    router.push(path);
    setTeamsModalOpen(false);
    onItemClick?.();
  };

  const onMenuClick = async (item: any) => {
    if (item.id === 1 && item.isDisabled) {
      router.push("/pricing");
      return;
    }

    if (item.path) {
      router.push(item.path);
    }
    onItemClick?.();
  };

  const filteredTeams = teamList?.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = memoizedLocalFileList.filter((file) => {
    const matchesSearch = file.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (fileFilter === "all") return matchesSearch;
    if (fileFilter === "recent") return matchesSearch;
    if (fileFilter === "favorites") return matchesSearch;
    return matchesSearch;
  });

  const handleRefreshFiles = () => {
    loadFiles();
    if (onRefreshFiles) {
      onRefreshFiles();
    }
  };

  const menu = [
    {
      id: 1,
      name: "Create Team",
      path: "/teams/create",
      icon: Users,
      description: "Start new team",
      color: "text-blue-600",
      buttonClass: "hover:border-blue-300 hover:bg-blue-50",
      textClass: "group-hover:text-blue-700",
      iconClass: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm",
      iconColor: "text-white",
      isDisabled: userPlan === Plan.FREE && currentTeamsCount >= 1,
      disabledTooltip:
        "Free plan limited to 1 team. Upgrade to create more teams.",
    },
    {
      id: 2,
      name: "Settings",
      path: "/settings",
      icon: Settings,
      description: "Manage preferences",
      color: "text-gray-600",
      buttonClass: "hover:border-gray-300 hover:bg-gray-50",
      textClass: "",
      iconClass: "bg-gradient-to-br from-gray-100 to-gray-200",
      iconColor: "text-gray-600",
    },
    {
      id: 3,
      name: "Recent",
      path: "/recent",
      icon: History,
      description: "Recent files",
      color: "text-indigo-600",
      buttonClass: "hover:border-indigo-300 hover:bg-indigo-50",
      textClass: "group-hover:text-indigo-700",
      iconClass: "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm",
      iconColor: "text-white",
    },
    {
      id: 4,
      name: "Favorites",
      path: "/favorites",
      icon: Star,
      description: "Favorite files",
      color: "text-yellow-600",
      buttonClass: "hover:border-amber-300 hover:bg-amber-50",
      textClass: "group-hover:text-amber-700",
      iconClass: "bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm",
      iconColor: "text-white",
    },
  ];

  const getButtonSize = () => {
    if (isMobileDevice)
      return {
        height: "h-15",
        text: "text-sm",
        icon: "h-4 w-4",
        padding: "px-3 py-2.5",
        gap: "gap-2",
        spacing: "space-y-4",
        avatarSize: "w-9 h-9 text-sm",
        crownSize: "h-3 w-3",
        chevronSize: "h-4 w-4",
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        height: "h-11",
        text: "text-xs",
        icon: "h-3.5 w-3.5",
        padding: "px-2.5 py-2",
        gap: "gap-1.5",
        spacing: "space-y-2",
        avatarSize: "w-8 h-8 text-xs",
        crownSize: "h-3 w-3",
        chevronSize: "h-3.5 w-3.5",
      };
    if (isHorizontalTablet) {
      return {
        height: "h-13",
        text: "text-sm",
        icon: "h-3.5 w-3.5",
        padding: "px-2.5 py-2",
        gap: "gap-1.5",
        spacing: "space-y-2",
        avatarSize: "w-9 h-9 text-sm",
        crownSize: "h-3 w-3",
        chevronSize: "h-3.5 w-3.5",
      };
    }

    if (isTabletDevice)
      return {
        height: "h-13",
        text: "text-base",
        icon: "h-4 w-4",
        padding: "px-3 py-2.5",
        gap: "gap-2",
        spacing: "space-y-2.5",
        avatarSize: "w-10 h-10 text-base",
        crownSize: "h-3.5 w-3.5",
        chevronSize: "h-4 w-4",
      };
    if (isLargeTabletDevice)
      return {
        height: "h-12",
        text: "text-base",
        icon: "h-6 w-6",
        padding: "px-4 py-4",
        gap: "gap-3",
        spacing: "space-y-8",
        avatarSize: "w-10 h-10 text-base",
        crownSize: "h-3.5 w-3.5",
        chevronSize: "h-4 w-4",
      };
    return {
      height: "h-10",
      text: "text-sm",
      icon: "h-5 w-5",
      padding: "px-3 py-3",
      gap: "gap-2",
      spacing: "space-y-2",
      avatarSize: "w-10 h-10 text-sm",
      crownSize: "h-3.5 w-3.5",
      chevronSize: "h-4 w-4",
    };
  };

  const getQuickAccessSize = () => {
    if (isMobileDevice)
      return {
        buttonClass: "p-1.5",
        iconSize: "h-3 w-3",
        iconBoxSize: "w-6 h-6",
        gridCols: "grid-cols-2",
        gap: "gap-1.5",
        textSize: "text-[14px]",
        minHeight: "min-h-[60px]",
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        buttonClass: "p-1",
        iconSize: "h-2.5 w-2.5",
        iconBoxSize: "w-5 h-5",
        gridCols: "grid-cols-4",
        gap: "gap-1",
        textSize: "text-[9px]",
        minHeight: "min-h-[32px]",
      };
    if (isHorizontalTablet) {
      return {
        buttonClass: "p-1",
        iconSize: "h-3 w-3",
        iconBoxSize: "w-6 h-6",
        gridCols: "grid-cols-2",
        gap: "gap-1",
        textSize: "text-[10px]",
        minHeight: "min-h-[36px]",
      };
    }
    if (isTabletDevice)
      return {
        buttonClass: "p-1.5",
        iconSize: "h-3 w-3",
        iconBoxSize: "w-10 h-10",
        gridCols: "grid-cols-2",
        gap: "gap-2",
        textSize: "text-xs",
        minHeight: "min-h-[44px]",
      };
    if (isLargeTabletDevice)
      return {
        buttonClass: "p-2",
        iconSize: "h-3.5 w-3.5",
        iconBoxSize: "w-8 h-8",
        gridCols: "grid-cols-2",
        gap: "gap-1.5",
        textSize: "text-sm",
        minHeight: "min-h-[48px]",
      };

    return {
      buttonClass: "p-1.5",
      iconSize: "h-4 w-4",
      iconBoxSize: "w-7 h-7",
      gridCols: "grid-cols-2",
      gap: "gap-4",
      textSize: "text-xs",
      minHeight: "min-h-[42px]",
    };
  };

  const getModalSizes = () => {
    if (isMobileDevice)
      return {
        teams: "max-w-[95vw] max-h-[87vh]",
        files: "max-w-[95vw] max-h-[90vh]",
        title: "text-base",
        inputHeight: "h-7",
        teamAvatar: "w-10 h-10 text-xs",
        fileGrid: "grid-cols-2",
        contentPadding: "p-3.5",
        teamItemPadding: "p-2",
        headerPadding: "px-3.5 pt-3.5 pb-3",
        searchPadding: "px-3.5 pb-3",
        teamsPadding: "px-3.5 pt-0",
        quickAccessPadding: "px-3.5",
        userPadding: "px-3.5",
        separatorMargin: "mx-3.5",
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        teams: "max-w-[85vw]",
        files: "max-w-[85vw]",
        title: "text-lg",
        inputHeight: "h-9",
        teamAvatar: "w-8 h-8 text-xs",
        fileGrid: "grid-cols-1",
        contentPadding: "p-3",
        teamItemPadding: "p-2",
        headerPadding: "px-3 pt-3 pb-2",
        searchPadding: "px-3 pb-2",
        teamsPadding: "px-3 pt-0",
        quickAccessPadding: "px-3",
        userPadding: "px-3",
        separatorMargin: "mx-3",
      };
    if (isHorizontalTablet) {
      return {
        teams: "max-w-[80vw]",
        files: "max-w-[80vw]",
        title: "text-lg",
        inputHeight: "h-9",
        teamAvatar: "w-8 h-8 text-sm",
        fileGrid: "grid-cols-2",
        contentPadding: "p-4",
        teamItemPadding: "p-3",
        headerPadding: "px-4 pt-4 pb-3",
        searchPadding: "px-4 pb-3",
        teamsPadding: "px-4 pt-0",
        quickAccessPadding: "px-4",
        userPadding: "px-4",
        separatorMargin: "mx-4",
      };
    }
    if (isTabletDevice)
      return {
        teams: "max-w-md",
        files: "max-w-2xl",
        title: "text-lg",
        inputHeight: "h-10",
        teamAvatar: "w-10 h-10 text-sm",
        fileGrid: "grid-cols-2",
        contentPadding: "p-5",
        teamItemPadding: "p-3",
        headerPadding: "px-5 pt-5 pb-4",
        searchPadding: "px-5 pb-4",
        teamsPadding: "px-5 pt-0",
        quickAccessPadding: "px-5",
        userPadding: "px-5",
        separatorMargin: "mx-5",
      };
    if (isLargeTabletDevice)
      return {
        teams: "max-w-lg",
        files: "max-w-3xl",
        title: "text-2xl",
        teamText: "text-xl",
        inputHeight: "h-12",
        teamAvatar: "w-12 h-12 text-base",
        fileGrid: "grid-cols-3",
        contentPadding: "p-6",
        teamItemPadding: "p-4",
        headerPadding: "px-6 pt-6 pb-5",
        searchPadding: "px-6 pb-5",
        teamsPadding: "px-6 pt-0",
        quickAccessPadding: "px-6",
        userPadding: "px-6",
        separatorMargin: "mx-6",
      };

    return {
      teams: "max-w-lg",
      files: "max-w-4xl",
      title: "text-xl",
      inputHeight: "h-8",
      teamAvatar: "w-10 h-10 text-sm",
      fileGrid: "grid-cols-3",
      contentPadding: "p-4",
      teamItemPadding: "p-3",
      headerPadding: "px-6 pt-6 pb-4",
      searchPadding: "px-4 pb-4",
      teamsPadding: "px-6 pt-0",
      quickAccessPadding: "px-6",
      userPadding: "px-6",
      separatorMargin: "mx-4",
    };
  };

  const getSpacing = () => {
    if (isHorizontalMobileDevice || isLandscapeDevice) return "gap-1";
    if (isHorizontalTablet) return "gap-2";
    if (isMobileDevice) return "gap-4";
    if (isTabletDevice) return "gap-2.5";
    if (isLargeTabletDevice) return "gap-5";
    return "gap-2";
  };

  const buttonSize = getButtonSize();
  const quickAccess = getQuickAccessSize();
  const modalSizes = getModalSizes();
  const spacing = getSpacing();

  return (
    <div className={cn(`flex flex-col`, spacing)}>
      <button
        onClick={() => setTeamsModalOpen(true)}
        className={cn(
          "group flex items-center w-full rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all duration-200",
          buttonSize.padding,
          buttonSize.gap
        )}
        id="team-switcher"
      >
        <div
          className={cn(
            "rounded-xl bg-linear-to-br flex items-center justify-center text-white font-bold shadow-sm",
            buttonSize.avatarSize,
            activeTeam && teamList
              ? getTeamColor(
                  teamList.findIndex((t) => t.id === activeTeam.id) || 0
                )
              : "from-gray-400 to-gray-500"
          )}
        >
          {activeTeam ? getTeamInitials(activeTeam.name) : "T"}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {activeTeam?.createdById === user?.id && (
              <Crown
                className={cn("text-amber-500 shrink-0", buttonSize.crownSize)}
              />
            )}
            <span
              className={cn(
                "font-semibold text-gray-900 truncate",
                buttonSize.text
              )}
            >
              {activeTeam?.name || "Select Team"}
            </span>
          </div>
          <span
            className={cn(
              "text-gray-500",
              isHorizontalMobileDevice ||
                isLandscapeDevice ||
                isHorizontalTablet
                ? "text-[10px]"
                : "text-xs"
            )}
          >
            {activeTeam?._count?.members || 0} members
          </span>
        </div>
        <ChevronRight
          className={cn(
            "text-gray-400 group-hover:text-gray-600 transition-colors shrink-0",
            buttonSize.chevronSize
          )}
        />
      </button>

      <button
        onClick={() => {
          setFilesModalOpen(true);
          handleRefreshFiles();
        }}
        className={cn(
          "group flex items-center w-full rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all duration-200",
          buttonSize.padding,
          buttonSize.gap
        )}
        id="all-files"
      >
        <div
          className={cn(
            "rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm",
            buttonSize.avatarSize
          )}
        >
          <FileText className={cn("text-white", buttonSize.icon)} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <span
            className={cn(
              "font-semibold text-gray-900 block mb-0.5",
              buttonSize.text
            )}
          >
            All Files
          </span>
          <p
            className={cn(
              "text-gray-500",
              isHorizontalMobileDevice ||
                isLandscapeDevice ||
                isHorizontalTablet
                ? "text-[10px]"
                : "text-xs"
            )}
          >
            {filteredFiles.length} files
          </p>
        </div>
        <ChevronRight
          className={cn(
            "text-gray-400 group-hover:text-gray-600 transition-colors shrink-0",
            buttonSize.chevronSize
          )}
        />
      </button>

      <div
        className={cn("grid", quickAccess.gridCols, quickAccess.gap)}
        id="quick-access-section"
      >
        {isHorizontalMobileDevice && isLandscapeDevice
          ? menu.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuClick(item)}
                disabled={item.isDisabled}
                className={cn(
                  "flex items-center justify-center rounded-xl border border-gray-200 transition-all group w-full min-w-0 relative",
                  item.buttonClass,
                  quickAccess.buttonClass,
                  quickAccess.gap,
                  item.isDisabled && "opacity-50 cursor-not-allowed"
                )}
                title={item.isDisabled ? item.disabledTooltip : ""}
              >
                <div
                  className={cn(
                    "rounded-lg flex items-center justify-center shrink-0 w-8 h-8",
                    item.iconClass
                  )}
                >
                  <item.icon
                    className={cn(quickAccess.iconSize, item.iconColor)}
                  />
                </div>
                {item.isDisabled && (
                  <Lock className="absolute right-2 h-3 w-3 text-gray-400" />
                )}
              </button>
            ))
          : menu.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuClick(item)}
                disabled={item.isDisabled}
                className={cn(
                  "flex items-center rounded-xl border border-gray-200 transition-all group text-left w-full min-w-0 relative",
                  item.buttonClass,
                  quickAccess.buttonClass,
                  quickAccess.gap,
                  item.isDisabled && "opacity-50 cursor-not-allowed"
                )}
                title={item.isDisabled ? item.disabledTooltip : ""}
              >
                <div
                  className={cn(
                    "rounded-lg flex items-center justify-center shrink-0",
                    item.iconClass,
                    isHorizontalMobileDevice ||
                      isLandscapeDevice ||
                      isHorizontalTablet
                      ? "w-8 h-8"
                      : "w-10 h-10"
                  )}
                >
                  <item.icon
                    className={cn(quickAccess.iconSize, item.iconColor)}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "font-medium text-gray-700 block truncate",
                      quickAccess.textSize,
                      item.textClass
                    )}
                  >
                    {item.name}
                  </span>
                </div>
                {item.isDisabled && (
                  <Lock className="h-3 w-3 text-gray-400 ml-auto" />
                )}
              </button>
            ))}
      </div>

      <Dialog open={teamsModalOpen} onOpenChange={setTeamsModalOpen}>
        <DialogContent
          className={cn(
            "p-0 gap-0 overflow-hidden rounded-2xl flex flex-col",
            isHorizontalTablet ? "max-w-[70vw] max-h-[80vh]" : modalSizes.teams
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader
            className={cn(
              "border-b bg-linear-to-br from-gray-50 to-white",
              modalSizes.contentPadding,
              "pb-3"
            )}
          >
            <DialogTitle
              className={cn("font-bold text-gray-900", modalSizes.title)}
            >
              Teams
            </DialogTitle>
          </DialogHeader>

          <div className={cn("shrink-0", modalSizes.contentPadding, "pb-3")}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 text-sm border-gray-200 focus:border-blue-500 rounded-xl",
                  modalSizes.inputHeight
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "overflow-y-auto flex-1",
              modalSizes.contentPadding,
              "pt-0"
            )}
          >
            <div className="space-y-2">
              {filteredTeams && filteredTeams.length > 0 ? (
                filteredTeams.map((team, index) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl transition-all",
                      modalSizes.teamItemPadding,
                      activeTeam?.id === team.id
                        ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
                        : "hover:bg-gray-50 border-2 border-transparent hover:border-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl bg-linear-to-br flex items-center justify-center text-white font-bold shadow-sm",
                        modalSizes.teamAvatar,
                        getTeamColor(index)
                      )}
                    >
                      {getTeamInitials(team.name)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {team.createdById === user?.id && (
                          <Crown
                            className={cn(
                              "h-3.5 w-3.5 text-amber-500 shrink-0",
                              buttonSize.crownSize
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "font-semibold text-gray-900 truncate",
                            buttonSize.text
                          )}
                        >
                          {team.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-gray-500",
                          isHorizontalMobileDevice ||
                            isLandscapeDevice ||
                            isHorizontalTablet
                            ? "text-[10px]"
                            : "text-xs"
                        )}
                      >
                        {team._count?.members || 0} members
                      </span>
                    </div>
                    {activeTeam?.id === team.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No teams found</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="mx-5" />

          <div className={cn("shrink-0", modalSizes.contentPadding)}>
            <div
              className={cn(
                "grid gap-2.5",
                isHorizontalMobileDevice ||
                  isLandscapeDevice ||
                  isHorizontalTablet
                  ? "grid-cols-1"
                  : "grid-cols-2"
              )}
            >
              {menu.map((item) => {
                const isCreateTeamDisabled =
                  item.id === 1 &&
                  userPlan === Plan.FREE &&
                  currentTeamsCount >= 1;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isCreateTeamDisabled) {
                        router.push("/pricing");
                      } else {
                        handleQuickAction(item.path!);
                      }
                    }}
                    disabled={item.id === 1 && isCreateTeamDisabled}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 transition-all group relative",
                      item.buttonClass,
                      isCreateTeamDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    title={isCreateTeamDisabled ? item.disabledTooltip : ""}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        item.iconClass
                      )}
                    >
                      <item.icon
                        className={cn(quickAccess.iconSize, item.iconColor)}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium text-gray-700",
                        quickAccess.textSize
                      )}
                    >
                      {item.name}
                    </span>
                    {isCreateTeamDisabled && (
                      <Lock className="absolute right-2 h-3 w-3 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="mx-5" />

          <div className={cn("shrink-0 bg-gray-50", modalSizes.contentPadding)}>
            {user && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2.5 shadow-sm border border-gray-200">
                <Image
                  src={user?.picture}
                  alt="user"
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user?.given_name} {user?.family_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}
            <LogoutLink>
              <button className="w-full flex items-center justify-center gap-2 p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all border border-red-200">
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </LogoutLink>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={filesModalOpen} onOpenChange={setFilesModalOpen}>
        <DialogContent
          className={cn(
            "p-0 gap-0 rounded-2xl max-w-2xl",
            isHorizontalMobileDevice || isLandscapeDevice
              ? "max-h-96"
              : "max-h-[600px]"
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-7 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle
                className={cn("font-bold text-gray-900", modalSizes.title)}
              >
                Files
              </DialogTitle>
              <Badge
                variant="secondary"
                className="text-xs font-semibold bg-white shadow-sm px-3 py-1"
              >
                {filteredFiles.length}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-7 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 text-sm border-gray-200 focus:border-indigo-500 rounded-xl",
                  modalSizes.inputHeight
                )}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFileFilter("all")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0",
                  fileFilter === "all"
                    ? "bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                All Files
              </button>
              <button
                onClick={() => setFileFilter("recent")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0",
                  fileFilter === "recent"
                    ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Recent
              </button>
              <button
                onClick={() => setFileFilter("favorites")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0",
                  fileFilter === "favorites"
                    ? "bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Star className="h-3.5 w-3.5" />
                Favorites
              </button>
            </div>
          </div>

          <div
            className={cn(
              "overflow-y-auto p-5 pt-1",
              isHorizontalMobileDevice ||
                isLandscapeDevice ||
                isHorizontalTablet
                ? "max-h-48"
                : "max-h-[480px]"
            )}
          >
            {filteredFiles && filteredFiles.length > 0 ? (
              <div className={cn("grid gap-3", modalSizes.fileGrid)}>
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleFileClick(file.id)}
                    className="group flex flex-col rounded-xl border border-gray-200 bg-white hover:bg-linear-to-br hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="w-full aspect-video bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center group-hover:from-transparent group-hover:to-transparent transition-all">
                      <FileText className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900 truncate mb-1">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold mb-1">No files yet</p>
                <p className="text-xs">Create your first file to get started</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SideNavTopSection;
