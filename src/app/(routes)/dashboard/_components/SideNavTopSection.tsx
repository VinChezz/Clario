import {
  ChevronDown,
  FileText,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  ChevronRight,
  UsersIcon,
  Crown,
  Plus,
  Building,
} from "lucide-react";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
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
}

function SideNavTopSection({
  user,
  setActiveTeamInfo,
  onItemClick,
}: SideNavTopSectionProps) {
  const menu = [
    {
      id: 1,
      name: "Create Team",
      path: "/teams/create",
      icon: Users,
      description: "Start a new team collaboration",
      color: "text-blue-600",
    },
    {
      id: 2,
      name: "Settings",
      path: "",
      icon: Settings,
      description: "Manage your preferences",
      color: "text-gray-600",
    },
  ];

  const router = useRouter();
  const [activeTeam, setActiveTeam] = useState<TEAM>();
  const [teamList, setTeamList] = useState<TEAM[]>();
  const { fileList_ } = useContext(FileListContext);
  const [fileList, setFileList] = useState<FILE[]>([]);
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (fileList_) setFileList(fileList_);
  }, [fileList_]);

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
    ];
    return colors[index % colors.length];
  };

  const handleFileClick = (fileId: string) => {
    router.push(`/workspace/${fileId}`);
    onItemClick?.();
  };

  return (
    <div className="space-y-6 p-4">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="team-switcher"
            variant="ghost"
            className="w-full h-auto p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="relative">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl bg-linear-to-br flex items-center justify-center shadow-sm",
                    activeTeam
                      ? getTeamColor(
                          teamList?.findIndex((t) => t.id === activeTeam.id) ||
                            0
                        )
                      : "from-gray-400 to-gray-500"
                  )}
                >
                  <span className="text-white font-bold text-sm">
                    {activeTeam ? getTeamInitials(activeTeam.name) : "T"}
                  </span>
                </div>
                {activeTeam && activeTeam.createdById === user?.id && (
                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900 truncate text-sm">
                    {activeTeam?.name || "Select Team"}
                  </h2>
                  {activeTeam && isCooperativeTeam(activeTeam) && (
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0"
                    >
                      <UsersIcon className="h-3 w-3 mr-1" />
                      Team
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {activeTeam?._count?.members || 0} members
                </p>
              </div>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  popoverOpen && "rotate-180"
                )}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-4 rounded-2xl shadow-xl border border-gray-200"
          align="start"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Teams</h3>
            <Badge variant="outline" className="text-xs">
              {teamList?.length || 0}
            </Badge>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teamList?.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                    activeTeam?.id === team.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  )}
                  onClick={() => {
                    setActiveTeam(team);
                    setPopoverOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg bg-linear-to-br flex items-center justify-center",
                        getTeamColor(index)
                      )}
                    >
                      <span className="text-white font-semibold text-xs">
                        {getTeamInitials(team.name)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium text-sm",
                            activeTeam?.id === team.id
                              ? "text-blue-900"
                              : "text-gray-900"
                          )}
                        >
                          {team.name}
                        </span>
                        {team.createdById === user?.id && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {team._count?.members || 0} members
                      </p>
                    </div>
                  </div>

                  {isCooperativeTeam(team) && (
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 text-xs"
                    >
                      Team
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            {menu.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 group"
                onClick={() => onMenuClick(item)}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors",
                    item.color
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            {user && (
              <div className="flex items-center gap-3 p-2">
                <Image
                  src={user?.picture}
                  alt="user"
                  width={36}
                  height={36}
                  className="rounded-full border-2 border-white shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">
                    {user?.given_name} {user?.family_name}
                  </h2>
                  <h2 className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </h2>
                </div>
              </div>
            )}

            <LogoutLink>
              <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-red-50 group">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-red-600 text-sm">Logout</span>
              </div>
            </LogoutLink>
          </div>
        </PopoverContent>
      </Popover>

      <div className="space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <LayoutGrid className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-gray-900 text-sm">
                All Files
              </span>
              <p className="text-xs text-gray-500">
                {fileList.length} file{fileList.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "p-1 rounded-lg transition-all duration-200",
              open
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
            )}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
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
              <div className="ml-4 pl-8 border-l-2 border-gray-100 space-y-1 py-2">
                {fileList && fileList.length > 0 ? (
                  fileList.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleFileClick(file.id)}
                    >
                      <div className="w-6 h-6 rounded-md bg-linear-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                        <FileText className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate flex-1">
                        {file.fileName}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center">
                      <FileText className="h-3 w-3 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">No files yet</p>
                      <p className="text-xs text-gray-400">
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
    </div>
  );
}

export default SideNavTopSection;
