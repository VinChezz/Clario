"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkTeam();
    }
  }, [user]);

  const checkTeam = async () => {
    try {
      const resp = await fetch("/api/teams/check", {
        method: "GET",
        cache: "no-store",
      });

      if (!resp.ok) {
        console.error("Failed to check teams");
        return;
      }

      const result = await resp.json();

      if (!result?.length) {
        router.push("/teams/create");
      }
    } catch (err) {
      console.error("Error checking team:", err);
    }
  };

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
