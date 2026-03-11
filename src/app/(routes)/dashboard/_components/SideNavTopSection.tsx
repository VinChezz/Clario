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
  ChevronLeft,
  Heart,
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
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useFavorites } from "@/app/_context/FavoritesContext";
import { useTeamData } from "@/hooks/useTeamData";

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
  onFileClick?: (fileId: string) => void;
  onOpenFilesWithFilter?: (filter: "all" | "recent" | "favorites") => void;
}

function SideNavTopSection({
  user,
  setActiveTeamInfo,
  onItemClick,
  onFileClick,
  onOpenFilesWithFilter,
}: SideNavTopSectionProps) {
  const router = useRouter();
  const [teamList, setTeamList] = useState<TEAM[]>();
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileFilter, setFileFilter] = useState<"all" | "recent" | "favorites">(
    "all",
  );
  const [userPlan, setUserPlan] = useState<Plan>(Plan.FREE);
  const [currentTeamsCount, setCurrentTeamsCount] = useState(0);
  const [canCreateTeam, setCanCreateTeam] = useState(true);

  const isMobileDevice = useIsMobile();
  const isTabletDevice = useIsTablet();
  const isLargeTabletDevice = useIsLargeTablet();
  const isHorizontalMobileDevice = useIsHorizontalMobile();
  const isHorizontalTablet = useIsHorizontalTablet();
  const isLandscapeDevice = useIsLandscape();
  const { activeTeam, setActiveTeam } = useActiveTeam();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { files, refresh, isLoading } = useTeamData(activeTeam?.id);

  const recentFilesList = useMemo(() => {
    return [...files]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 10);
  }, [files]);

  const favoriteFilesList = useMemo(() => {
    return files.filter((file) => file.id && isFavorite(file.id));
  }, [files, isFavorite]);

  useEffect(() => {
    if (user) {
      getTeamList();
      fetchUserPlan();
    }
  }, [user]);

  useEffect(() => {
    if (activeTeam) setActiveTeamInfo(activeTeam);
  }, [activeTeam, setActiveTeamInfo]);

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

      if (activeTeam) {
        const updatedActiveTeam = data.find((t) => t.id === activeTeam.id);
        if (updatedActiveTeam) {
          setActiveTeam(updatedActiveTeam);
        } else if (data.length > 0) {
          setActiveTeam(data[0]);
        }
      } else if (data.length > 0) {
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
  };

  const onMenuClick = async (item: any) => {
    if (item.id === 1 && item.isDisabled) {
      router.push("/pricing");
      return;
    }

    if (item.actionType === "filter" && item.filter) {
      setFileFilter(item.filter);
      setSearchQuery("");
      setFilesModalOpen(true);

      if (onOpenFilesWithFilter) {
        onOpenFilesWithFilter(item.filter);
      }
    } else if (item.actionType === "route" && item.path) {
      const pathWithTeamId = item.path.replace(
        /:teamId/g,
        activeTeam?.id || "",
      );
      router.push(pathWithTeamId);
    }

    onItemClick?.();
  };

  const filteredTeams = teamList?.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getFilesForCurrentFilter = () => {
    switch (fileFilter) {
      case "recent":
        return recentFilesList;
      case "favorites":
        return favoriteFilesList;
      default:
        return files;
    }
  };

  const currentFiles = getFilesForCurrentFilter();

  const filteredFiles = useMemo(() => {
    return (currentFiles || []).filter((file) =>
      file?.fileName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [currentFiles, searchQuery]);

  const menu = [
    {
      id: 1,
      name: "Create Team",
      path: "/teams/create",
      icon: Users,
      description: "Start new team",
      color: "text-blue-600 dark:text-blue-400",
      buttonClass:
        "hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20",
      textClass: "group-hover:text-blue-700 dark:group-hover:text-blue-300",
      iconClass:
        "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm dark:from-blue-600 dark:to-blue-700",
      iconColor: "text-white",
      isDisabled: userPlan === Plan.FREE && currentTeamsCount >= 1,
      disabledTooltip:
        "Free plan limited to 1 team. Upgrade to create more teams.",
      actionType: "route",
    },
    {
      id: 2,
      name: "Settings",
      path: `/settings/team/:teamId`,
      icon: Settings,
      description: "Manage preferences",
      color: "text-gray-600 dark:text-gray-400",
      buttonClass:
        "hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50",
      textClass: "",
      iconClass:
        "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
      iconColor: "text-gray-600 dark:text-gray-400",
      actionType: "route",
    },
    {
      id: 3,
      name: "Recent",
      path: "#",
      icon: History,
      description: "Recent files",
      color: "text-indigo-600 dark:text-indigo-400",
      buttonClass:
        "hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20",
      textClass: "group-hover:text-indigo-700 dark:group-hover:text-indigo-300",
      iconClass:
        "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm dark:from-indigo-600 dark:to-indigo-700",
      iconColor: "text-white",
      actionType: "filter",
      filter: "recent" as const,
    },
    {
      id: 4,
      name: "Favorites",
      path: "#",
      icon: Star,
      description: "Favorite files",
      color: "text-yellow-600 dark:text-yellow-400",
      buttonClass:
        "hover:border-amber-300 hover:bg-amber-50 dark:hover:border-amber-700 dark:hover:bg-amber-900/20",
      textClass: "group-hover:text-amber-700 dark:group-hover:text-amber-300",
      iconClass:
        "bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm dark:from-amber-600 dark:to-amber-700",
      iconColor: "text-white",
      actionType: "filter",
      filter: "favorites" as const,
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
        textSize: "text-sm",
        minHeight: "min-h-[60px]",
        showText: true,
      };
    if (isHorizontalMobileDevice || isLandscapeDevice)
      return {
        buttonClass: "p-2",
        iconSize: "h-3 w-3",
        iconBoxSize: "w-6 h-6",
        gridCols: "grid-cols-2",
        gap: "gap-1",
        textSize: "text-[9px]",
        minHeight: "min-h-[32px]",
        showText: false,
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
        showText: true,
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
        showText: true,
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
        showText: true,
      };

    return {
      buttonClass: "p-1.5",
      iconSize: "h-4 w-4",
      iconBoxSize: "w-7 h-7",
      gridCols: "grid-cols-2",
      gap: "gap-4",
      textSize: "text-xs",
      minHeight: "min-h-[42px]",
      showText: true,
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
          "group flex items-center w-full rounded-xl border transition-all duration-200",
          "border-gray-200 dark:border-[#2a2a2d]",
          "bg-white dark:bg-[#1a1a1c]",
          "hover:border-gray-300 dark:hover:border-[#3a3a3d]",
          "hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
          buttonSize.padding,
          buttonSize.gap,
        )}
        id="team-switcher"
      >
        <div
          className={cn(
            "rounded-xl bg-linear-to-br flex items-center justify-center text-white font-bold",
            "shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
            buttonSize.avatarSize,
            activeTeam && teamList
              ? getTeamColor(
                  teamList.findIndex((t) => t.id === activeTeam.id) || 0,
                )
              : "from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700",
          )}
        >
          {activeTeam ? getTeamInitials(activeTeam.name) : "T"}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {activeTeam?.createdById === user?.id && (
              <Crown
                className={cn(
                  "text-amber-500 dark:text-amber-400 shrink-0",
                  buttonSize.crownSize,
                )}
              />
            )}
            <span
              className={cn(
                "font-semibold truncate",
                "text-gray-900 dark:text-[#f0f0f0]",
                buttonSize.text,
              )}
            >
              {activeTeam?.name || "Select Team"}
            </span>
          </div>
          <span
            className={cn(
              "text-gray-500 dark:text-[#a0a0a0]",
              isHorizontalMobileDevice ||
                isLandscapeDevice ||
                isHorizontalTablet
                ? "text-[10px]"
                : "text-xs",
            )}
          >
            {activeTeam?._count?.members || 0} members
          </span>
        </div>
        <ChevronRight
          className={cn(
            "text-gray-400 dark:text-[#707070] group-hover:text-gray-600 dark:group-hover:text-[#a0a0a0] transition-colors shrink-0",
            buttonSize.chevronSize,
          )}
        />
      </button>

      <button
        onClick={() => {
          setFilesModalOpen(true);
        }}
        className={cn(
          "group flex items-center w-full rounded-xl border transition-all duration-200",
          "border-gray-200 dark:border-[#2a2a2d]",
          "bg-white dark:bg-[#1a1a1c]",
          "hover:border-gray-300 dark:hover:border-[#3a3a3d]",
          "hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
          buttonSize.padding,
          buttonSize.gap,
        )}
        id="all-files"
      >
        <div
          className={cn(
            "rounded-xl bg-linear-to-br flex items-center justify-center",
            fileFilter === "recent"
              ? "from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700"
              : fileFilter === "favorites"
                ? "from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700"
                : "from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
            "shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
            buttonSize.avatarSize,
          )}
        >
          {fileFilter === "recent" ? (
            <Clock className={cn("text-white", buttonSize.icon)} />
          ) : fileFilter === "favorites" ? (
            <Star className={cn("text-white", buttonSize.icon)} />
          ) : (
            <FileText className={cn("text-white", buttonSize.icon)} />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <span
            className={cn(
              "font-semibold block mb-0.5",
              "text-gray-900 dark:text-[#f0f0f0]",
              buttonSize.text,
            )}
          >
            {fileFilter === "recent"
              ? "Recent Files"
              : fileFilter === "favorites"
                ? "Favorite Files"
                : "All Files"}
          </span>
          <p
            className={cn(
              "text-gray-500 dark:text-[#a0a0a0]",
              isHorizontalMobileDevice ||
                isLandscapeDevice ||
                isHorizontalTablet
                ? "text-[10px]"
                : "text-xs",
            )}
          >
            {isLoading
              ? "Loading..."
              : fileFilter === "recent"
                ? `${recentFilesList.length} recent files`
                : fileFilter === "favorites"
                  ? `${favoriteFilesList.length} favorite files`
                  : `${files.length} files`}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "text-gray-400 dark:text-[#707070] group-hover:text-gray-600 dark:group-hover:text-[#a0a0a0] transition-colors shrink-0",
            buttonSize.chevronSize,
          )}
        />
      </button>

      <div
        className={cn("grid", quickAccess.gridCols, quickAccess.gap)}
        id="quick-access-section"
      >
        {!quickAccess.showText
          ? menu.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuClick(item)}
                disabled={item.isDisabled}
                className={cn(
                  "flex items-center justify-center rounded-xl border transition-all group w-full min-w-0 relative",
                  "border-gray-200 dark:border-[#2a2a2d]",
                  item.buttonClass,
                  quickAccess.buttonClass,
                  quickAccess.gap,
                  item.isDisabled && "opacity-50 cursor-not-allowed",
                )}
                title={
                  item.name +
                  (item.isDisabled ? ` - ${item.disabledTooltip}` : "")
                }
              >
                <div
                  className={cn(
                    "rounded-lg flex items-center justify-center",
                    item.iconClass,
                    quickAccess.iconBoxSize,
                  )}
                >
                  <item.icon
                    className={cn(quickAccess.iconSize, item.iconColor)}
                  />
                </div>
                {item.isDisabled && (
                  <Lock className="absolute right-1.5 h-2.5 w-2.5 text-gray-400 dark:text-[#707070]" />
                )}
              </button>
            ))
          : menu.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuClick(item)}
                disabled={item.isDisabled}
                className={cn(
                  "flex items-center rounded-xl border transition-all group text-left w-full min-w-0 relative",
                  "border-gray-200 dark:border-[#2a2a2d]",
                  item.buttonClass,
                  quickAccess.buttonClass,
                  quickAccess.gap,
                  item.isDisabled && "opacity-50 cursor-not-allowed",
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
                      : "w-10 h-10",
                  )}
                >
                  <item.icon
                    className={cn(quickAccess.iconSize, item.iconColor)}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "font-medium overflow-hidden",
                      quickAccess.textSize,
                      "text-gray-700 dark:text-[#f0f0f0]",
                      item.textClass,
                    )}
                  >
                    {item.name}
                  </span>
                </div>
                {item.isDisabled && (
                  <Lock className="h-3 w-3 text-gray-400 dark:text-[#707070] ml-auto" />
                )}
              </button>
            ))}
      </div>

      <Dialog open={teamsModalOpen} onOpenChange={setTeamsModalOpen}>
        <DialogContent
          className={cn(
            "p-0 gap-0 overflow-hidden rounded-2xl flex flex-col",
            "bg-white dark:bg-[#1a1a1c]",
            "border border-gray-200 dark:border-[#2a2a2d]",
            isHorizontalTablet ? "max-w-[70vw] max-h-[80vh]" : modalSizes.teams,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader
            className={cn(
              "border-b",
              "bg-linear-to-br from-gray-50 to-white dark:from-[#1a1a1c] dark:to-[#0f0f10]",
              "border-gray-200 dark:border-[#2a2a2d]",
              modalSizes.contentPadding,
              "pb-3",
            )}
          >
            <DialogTitle
              className={cn(
                "font-bold",
                "text-gray-900 dark:text-[#f0f0f0]",
                modalSizes.title,
              )}
            >
              Teams
            </DialogTitle>
          </DialogHeader>

          <div className={cn("shrink-0", modalSizes.contentPadding, "pb-3")}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#707070]" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 text-sm rounded-xl",
                  "border-gray-200 dark:border-[#2a2a2d]",
                  "focus:border-blue-500 dark:focus:border-blue-500",
                  "bg-white dark:bg-[#252528]",
                  "text-gray-900 dark:text-[#f0f0f0]",
                  modalSizes.inputHeight,
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "overflow-y-auto flex-1",
              modalSizes.contentPadding,
              "pt-0",
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
                        ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-500 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-[#252528] border-2 border-transparent hover:border-gray-200 dark:hover:border-[#3a3a3d]",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl bg-linear-to-br flex items-center justify-center text-white font-bold",
                        "shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
                        modalSizes.teamAvatar,
                        getTeamColor(index),
                      )}
                    >
                      {getTeamInitials(team.name)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {team.createdById === user?.id && (
                          <Crown
                            className={cn(
                              "h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0",
                              buttonSize.crownSize,
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "font-semibold truncate",
                            "text-gray-900 dark:text-[#f0f0f0]",
                            buttonSize.text,
                          )}
                        >
                          {team.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-gray-500 dark:text-[#a0a0a0]",
                          isHorizontalMobileDevice ||
                            isLandscapeDevice ||
                            isHorizontalTablet
                            ? "text-[10px]"
                            : "text-xs",
                        )}
                      >
                        {team._count?.members || 0} members
                      </span>
                    </div>
                    {activeTeam?.id === team.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-[#707070]">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium text-gray-900 dark:text-[#f0f0f0]">
                    No teams found
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="mx-5 bg-gray-200 dark:bg-[#2a2a2d]" />

          <div
            className={cn(
              "shrink-0",
              modalSizes.contentPadding,
              "bg-gray-50 dark:bg-[#252528]",
            )}
          >
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-2.5 shadow-sm border bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]">
                <Image
                  src={user?.picture}
                  alt="user"
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-gray-100 dark:ring-[#2a2a2d]"
                  priority
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900 dark:text-[#f0f0f0]">
                    {user?.given_name} {user?.family_name}
                  </p>
                  <p className="text-xs truncate text-gray-500 dark:text-[#a0a0a0]">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}
            <LogoutLink postLogoutRedirectURL="https://clario967.vercel.app/">
              <button className="w-full flex items-center justify-center gap-2 p-1.5 rounded-xl transition-all border bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 dark:border-red-800/50">
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
            "bg-white dark:bg-[#1a1a1c]",
            "border border-gray-200 dark:border-[#2a2a2d]",
            isHorizontalMobileDevice || isLandscapeDevice
              ? "max-h-96"
              : "max-h-150",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-7 pt-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2d] bg-linear-to-br from-gray-50 to-white dark:from-[#1a1a1c] dark:to-[#0f0f10]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle
                  className={cn(
                    "font-bold",
                    "text-gray-900 dark:text-[#f0f0f0]",
                    modalSizes.title,
                  )}
                >
                  {fileFilter === "recent"
                    ? "Recent Files"
                    : fileFilter === "favorites"
                      ? "Favorite Files"
                      : "All Files"}
                </DialogTitle>
                {fileFilter === "recent" && (
                  <Clock className="h-5 w-5 text-indigo-500" />
                )}
                {fileFilter === "favorites" && (
                  <Star className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <Badge
                variant="secondary"
                className="text-xs font-semibold px-3 py-1 bg-white dark:bg-[#252528] shadow-sm border-gray-200 dark:border-[#2a2a2d] text-gray-900 dark:text-[#f0f0f0]"
              >
                {isLoading ? "..." : filteredFiles.length}
                {!isLoading && fileFilter === "recent" && " recent"}
                {!isLoading && fileFilter === "favorites" && " favorite"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-7 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#707070]" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 text-sm rounded-xl",
                  "border-gray-200 dark:border-[#2a2a2d]",
                  "focus:border-indigo-500 dark:focus:border-indigo-500",
                  "bg-white dark:bg-[#252528]",
                  "text-gray-900 dark:text-[#f0f0f0]",
                  modalSizes.inputHeight,
                )}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                {
                  value: "all",
                  label: "All Files",
                  icon: FolderOpen,
                  color:
                    "from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
                },
                {
                  value: "recent",
                  label: "Recent",
                  icon: Clock,
                  color:
                    "from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700",
                },
                {
                  value: "favorites",
                  label: "Favorites",
                  icon: Star,
                  color:
                    "from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700",
                },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFileFilter(filter.value as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0",
                    fileFilter === filter.value
                      ? `bg-linear-to-br ${filter.color} text-white shadow-md dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]`
                      : "bg-gray-100 dark:bg-[#252528] text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#2a2a2d]",
                  )}
                >
                  <filter.icon className="h-3.5 w-3.5" />
                  {filter.label}
                </button>
              ))}
              {fileFilter !== "all" && (
                <button
                  onClick={() => setFileFilter("all")}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-[#a0a0a0] dark:hover:text-[#f0f0f0] transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  View all files
                </button>
              )}
            </div>
          </div>

          <div
            className={cn(
              "overflow-y-auto p-5 pt-1",
              isHorizontalMobileDevice ||
                isLandscapeDevice ||
                isHorizontalTablet
                ? "max-h-48"
                : "max-h-120",
            )}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className={cn("grid gap-3", modalSizes.fileGrid)}>
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => file.id && handleFileClick(file.id)}
                    className="group relative w-full text-left flex flex-col rounded-xl border overflow-hidden transition-all duration-300 border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-1 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        file.id && handleFileClick(file.id);
                      }
                    }}
                  >
                    <div className="relative w-full aspect-video flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-[#252528] dark:to-[#2a2a2d] group-hover:from-transparent group-hover:to-transparent transition-all">
                      <FileText className="h-8 w-8 text-gray-400 dark:text-[#707070] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />

                      {file.id && isFavorite(file.id) && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 backdrop-blur-sm flex items-center justify-center">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-[#f0f0f0]">
                          {file.fileName}
                        </p>
                        {file.id && isFavorite(file.id) && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(file.id!);
                          }}
                          className="text-xs text-gray-400 hover:text-amber-500 dark:text-[#707070] dark:hover:text-amber-400 transition-colors cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(file.id!);
                            }
                          }}
                        >
                          {isFavorite(file.id!) ? "Remove" : "Add"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-[#707070]">
                {fileFilter === "recent" ? (
                  <>
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-[#f0f0f0]">
                      No recent files
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                      Recently modified files will appear here
                    </p>
                  </>
                ) : fileFilter === "favorites" ? (
                  <>
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-[#f0f0f0]">
                      No favorite files
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                      Mark files as favorite to see them here
                    </p>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-[#f0f0f0]">
                      No files yet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                      Create your first file to get started
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SideNavTopSection;
