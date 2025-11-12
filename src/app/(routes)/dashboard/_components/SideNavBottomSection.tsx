"use client";

import { Button } from "@/components/ui/button";
import {
  Archive,
  Flag,
  Github,
  Plus,
  Zap,
  Crown,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Constant from "@/app/_constant/Constant";
import PricingDialog from "./PricingDialog";
import { TeamMember } from "@prisma/client";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";

export default function SideNavBottomSection({
  onFileCreate,
  totalFiles,
  isLoading,
  onAction,
}: any) {
  const menuList = [
    {
      id: 1,
      name: "Getting Started",
      icon: Flag,
      path: "",
    },
    {
      id: 2,
      name: "Github",
      icon: Github,
      path: "",
    },
    {
      id: 3,
      name: "Archive",
      icon: Archive,
      path: "",
    },
  ];

  const { user }: any = useKindeBrowserClient();
  const [fileInput, setFileInput] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { activeTeam } = useActiveTeam();
  const [dbUser, setDbUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      fetch("/api/auth/user")
        .then((res) => res.json())
        .then((data) => setDbUser(data))
        .catch((error) => console.error("Failed to load user:", error));
    }
  }, [user]);

  useEffect(() => {
    if (activeTeam?.members) {
      const membersWithDates = activeTeam.members.map((member) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
      }));
      setTeamMembers(membersWithDates);
    } else {
      setTeamMembers([]);
    }
  }, [activeTeam]);

  const currentUserMember = teamMembers.find(
    (member) => member.userId === dbUser?.id
  );
  const isCurrentUserCreator = activeTeam?.createdById === dbUser?.id;

  const canCreateFiles =
    isCurrentUserCreator || currentUserMember?.role === "EDIT";

  const usagePercentage = (totalFiles / Constant.MAX_FREE_FILE) * 100;

  const handleFileCreate = (fileName: string) => {
    onFileCreate(fileName);
    onAction?.();
  };

  const handleUpgradeClick = () => {
    router.push("/pricing");
    onAction?.();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {menuList.map((menu, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:shadow-sm border border-transparent hover:border-blue-100"
            onClick={onAction}
          >
            <menu.icon className="h-4 w-4" />
            <span>{menu.name}</span>
          </button>
        ))}
      </div>

      <div
        className="bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-4 text-white relative overflow-hidden group cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
        onClick={handleUpgradeClick}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-yellow-300" />
            <span className="font-bold text-sm">PRO FEATURES</span>
          </div>

          <h3 className="font-bold text-lg mb-1">Unlock Premium</h3>
          <p className="text-white/90 text-xs mb-3 leading-relaxed">
            Get unlimited storage, advanced collaboration, and priority support
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="font-semibold text-sm">Upgrade Now</span>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm">
              $10/mo
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-linear-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <Dialog>
        <DialogTrigger className="w-full" asChild>
          <Button
            id="create-file-button"
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            disabled={!canCreateFiles || isLoading}
          >
            <Plus className="h-4 w-4" />
            New File
          </Button>
        </DialogTrigger>
        {totalFiles < Constant.MAX_FREE_FILE ? (
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Create New File
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Give your file a descriptive name to get started
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter file name..."
                className="mt-2 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                onChange={(e) => setFileInput(e.target.value)}
                value={fileInput}
                autoFocus
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>File name must be at least 3 characters long</span>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="rounded-lg border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  className="bg-linear-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm"
                  disabled={!(fileInput && fileInput.length > 3)}
                  onClick={() => {
                    handleFileCreate(fileInput);
                    setFileInput("");
                  }}
                >
                  Create File
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        ) : (
          <PricingDialog />
        )}
      </Dialog>

      <div
        id="storage-section"
        className="bg-linear-to-br from-gray-50 to-blue-50 rounded-2xl p-4 space-y-3 border border-gray-100 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Storage Used
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {totalFiles}/{Constant.MAX_FREE_FILE}
          </span>
        </div>

        <div className="space-y-2">
          <div className="relative h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                usagePercentage >= 100
                  ? "bg-linear-to-br from-red-500 to-red-600"
                  : usagePercentage >= 80
                  ? "bg-linear-to-br from-yellow-500 to-orange-500"
                  : "bg-linear-to-br from-blue-500 to-indigo-600"
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          {totalFiles >= Constant.MAX_FREE_FILE ? (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              Storage full. Upgrade for unlimited files.
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              {Constant.MAX_FREE_FILE - totalFiles} files remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
