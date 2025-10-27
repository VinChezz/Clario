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
}

function SideNavTopSection({
  user,
  setActiveTeamInfo,
}: SideNavTopSectionProps) {
  const menu = [
    { id: 1, name: "Create Team", path: "/teams/create", icon: Users },
    { id: 2, name: "Settings", path: "", icon: Settings },
  ];
  const router = useRouter();
  const [activeTeam, setActiveTeam] = useState<TEAM>();
  const [teamList, setTeamList] = useState<TEAM[]>();
  const { fileList_ } = useContext(FileListContext);
  const [fileList, setFileList] = useState<FILE[]>([]);
  const [open, setOpen] = useState(false);

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
      console.log("🔄 Fetching teams from /api/teams...");
      const res = await fetch("/api/teams", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to fetch teams:", res.status, errorText);
        throw new Error(`failed to fetch teams: ${res.status}`);
      }

      const data: TEAM[] = await res.json();
      console.log("✅ Teams data received:", data);
      console.log("📊 Number of teams:", data.length);

      setTeamList(data);
      if (data.length > 0) {
        console.log("🎯 Setting active team to first team:", data[0]);
        setActiveTeam(data[0]);
      } else {
        console.log("⚠️ No teams found");
      }
    } catch (e: any) {
      console.error("❌ Error fetching teams:", e.message);
    }
  };

  useEffect(() => {
    console.log("🔄 Team list updated:", teamList);
  }, [teamList]);

  useEffect(() => {
    if (activeTeam) {
      console.log("🎯 SideNavTopSection - Setting active team:", activeTeam);
      setActiveTeamInfo(activeTeam);
    }
  }, [activeTeam]);

  const onMenuClick = (item: any) => {
    if (item.path) router.push(item.path);
  };

  const isCooperativeTeam = (team: TEAM) => {
    return team._count?.members && team._count.members > 3;
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger>
          <div className="flex items-center gap-3 hover:bg-slate-200 p-3 rounded-lg cursor-pointer">
            <Image src="/logo-1.png" alt="logo" width={40} height={40} />
            <h2 className="flex gap-2 items-center font-bold text-[17px]">
              {activeTeam?.name}
              {activeTeam && isCooperativeTeam(activeTeam) && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Cooperative
                </Badge>
              )}
              <ChevronDown />
            </h2>
          </div>
        </PopoverTrigger>
        <PopoverContent className="ml-7 p-4 w-80">
          {/* Team Section */}
          <div className="space-y-2">
            {teamList?.map((team) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-2 hover:bg-blue-500 hover:text-white rounded-lg mb-1 cursor-pointer ${
                  activeTeam?.id === team.id && "bg-blue-500 text-white"
                }`}
                onClick={() => setActiveTeam(team)}
              >
                <div className="flex items-center gap-2">
                  <span>{team.name}</span>
                  {team.createdById === user?.id && (
                    <Crown className="h-3 w-3 text-yellow-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isCooperativeTeam(team) && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-800"
                    >
                      <UsersIcon className="h-2 w-2 mr-1" />
                      {team._count?.members}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Separator className="mt-2 bg-slate-100" />
          {/* Option Section */}
          <div>
            {menu.map((item) => (
              <h2
                key={item.id}
                className="flex gap-2 items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                onClick={() => onMenuClick(item)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </h2>
            ))}
            <LogoutLink>
              <h2 className="flex gap-2 items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
                <LogOut className="h-4 w-4" />
                Logout
              </h2>
            </LogoutLink>
          </div>
          <Separator className="mt-2 bg-slate-100" />
          {/* User Info Section */}
          {user && (
            <div className="mt-2 flex gap-2 items-center">
              <Image
                src={user?.picture}
                alt="user"
                width={30}
                height={30}
                className="rounded-full"
              />
              <div>
                <h2 className="text-[14px] font-bold">
                  {user?.given_name} {user?.family_name}
                </h2>
                <h2 className="text-[12px] text-gray-500">{user?.email}</h2>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        className="w-full justify-start gap-2 font-bold mt-8 bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
        <LayoutGrid className="h-5 w-5" />
        All Files
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="file-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="overflow-hidden mt-4"
          >
            {fileList && fileList.length > 0 ? (
              fileList.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded-lg cursor-pointer text-sm"
                  onClick={() => router.push(`/workspace/${file.id}`)}
                >
                  <FileText className="h-4 w-4 text-gray-700" />
                  <span>{file.fileName}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded-lg cursor-pointer text-sm">
                <span>Not files be added yet</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SideNavTopSection;
