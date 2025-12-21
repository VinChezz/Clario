"use client";

import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useEffect, useState, useRef } from "react";

type PermissionType = "ADMIN" | "EDIT" | "VIEW";

export const useFilePermissions = () => {
  const { activeTeam, isLoading: teamLoading } = useActiveTeam();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionType>("VIEW");
  const permissionsCalculated = useRef(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userRes = await fetch("/api/auth/user");
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const dbUser = await userRes.json();
        console.log("👤 User loaded:", dbUser.id);
        setCurrentUser(dbUser);
      } catch (err) {
        console.error("Error fetching user:", err);
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (permissionsCalculated.current) return;

    if (!teamLoading && currentUser) {
      console.log("🔍 Calculating permissions...", {
        userId: currentUser.id,
        hasTeam: !!activeTeam,
        teamCreatorId: activeTeam?.createdById,
      });

      let userRole: PermissionType = "VIEW";

      if (activeTeam) {
        const isCreator = activeTeam.createdById === currentUser.id;
        console.log("👑 Is user creator?", isCreator);

        if (isCreator) {
          userRole = "ADMIN";
        } else {
          const userMembership = activeTeam.members?.find(
            (member: any) => member.userId === currentUser.id
          );

          console.log("👥 User membership found:", userMembership);

          if (userMembership) {
            userRole = userMembership.role as PermissionType;
          }
        }
      } else {
        console.log("⚠️ No active team found");
      }

      console.log("🔐 Final permissions:", userRole);
      setPermissions(userRole);
      permissionsCalculated.current = true;
      setIsLoading(false);
    } else if (!teamLoading && !currentUser) {
      console.log("⚠️ Waiting for user data...");
    }
  }, [teamLoading, currentUser, activeTeam]);

  const canEdit = permissions === "EDIT" || permissions === "ADMIN";
  const canAdmin = permissions === "ADMIN";

  console.log("📊 useFilePermissions result:", {
    permissions,
    canEdit,
    canAdmin,
    isLoading,
    userId: currentUser?.id,
    hasActiveTeam: !!activeTeam,
  });

  return {
    permissions,
    canEdit,
    canAdmin,
    isLoading: isLoading || teamLoading || !currentUser,
    currentUser,
    activeTeam,
  };
};
