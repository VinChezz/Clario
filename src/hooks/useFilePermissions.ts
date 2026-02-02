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
      let userRole: PermissionType = "VIEW";

      if (activeTeam) {
        const isCreator = activeTeam.createdById === currentUser.id;

        if (isCreator) {
          userRole = "ADMIN";
        } else {
          const userMembership = activeTeam.members?.find(
            (member: any) => member.userId === currentUser.id,
          );

          if (userMembership) {
            userRole = userMembership.role as PermissionType;
          }
        }
      } else {
        console.log("⚠️ No active team found");
      }

      setPermissions(userRole);
      permissionsCalculated.current = true;
      setIsLoading(false);
    } else if (!teamLoading && !currentUser) {
      return;
    }
  }, [teamLoading, currentUser, activeTeam]);

  const canEdit = permissions === "EDIT" || permissions === "ADMIN";
  const canAdmin = permissions === "ADMIN";

  return {
    permissions,
    canEdit,
    canAdmin,
    isLoading: isLoading || teamLoading || !currentUser,
    currentUser,
    activeTeam,
  };
};
