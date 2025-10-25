"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import SideNav from "./_components/SideNav";
import { FileListContext } from "@/app/_context/FileListContext";

function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user }: any = useKindeBrowserClient();
  const [fileList_, setFileList_] = useState();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const skipTeamCheck = searchParams.get("skipTeamCheck") === "true";

  useEffect(() => {
    if (user) {
      if (!skipTeamCheck) {
        checkTeam();
      } else {
        console.log("⚡ Skipping team check (Back button pressed)");
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [user, skipTeamCheck]);

  const checkTeam = async () => {
    try {
      setIsChecking(true);
      console.log("🔍 Checking teams for user:", user.email);

      const resp = await fetch("/api/teams", {
        method: "GET",
        cache: "no-store",
      });

      const result = await resp.json();

      console.log("📋 Teams check result:", {
        status: resp.status,
        teamsCount: Array.isArray(result) ? result.length : "invalid response",
        hasTeams: Array.isArray(result) && result.length > 0,
      });

      if (Array.isArray(result) && result.length === 0) {
        console.log("➡️ No teams found, redirecting to create team");
        router.push("/teams/create");
      } else {
        console.log("✅ Teams found, staying on dashboard");
      }
    } catch (err) {
      console.error("❌ Error checking team:", err);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FileListContext.Provider value={{ fileList_, setFileList_ }}>
        <div className="grid grid-cols-4">
          <div className="bg-white h-screen w-72 fixed">
            <SideNav />
          </div>
          <div className="col-span-4 ml-72">{children}</div>
        </div>
      </FileListContext.Provider>
    </div>
  );
}

export default DashboardLayout;
