"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BackButton from "./BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Menu, Users, Eye } from "lucide-react";
import Link from "next/link";
import InviteModal from "@/app/(routes)/dashboard/_components/invite-button/InviteModal";
import {
  useIsMobile,
  useIsSmallMobile,
  useIsTablet,
} from "@/hooks/useMediaQuery";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface AnimatedHeaderProps {
  teamName: string;
  teamId: string;
  onMenuToggle?: () => void;
  currentUserRole?: string;
  isCurrentUserCreator?: boolean;
}

export function AnimatedHeader({
  teamName,
  teamId,
  onMenuToggle,
  currentUserRole = "VIEW",
  isCurrentUserCreator = false,
}: AnimatedHeaderProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>(currentUserRole);
  const [isCreator, setIsCreator] = useState<boolean>(isCurrentUserCreator);
  const { user } = useKindeBrowserClient();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isSmallMobile = useIsSmallMobile();

  const hasAdminRights = userRole === "ADMIN" || isCreator;
  const hasEditRights = userRole === "EDIT" || hasAdminRights;

  useEffect(() => {
    if (currentUserRole) {
      setUserRole(currentUserRole);
    }

    if (isCurrentUserCreator !== undefined) {
      setIsCreator(isCurrentUserCreator);
    }
  }, [currentUserRole, isCurrentUserCreator]);

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  const getDisplayTeamName = () => {
    if (isSmallMobile) {
      if (teamName.length > 12) {
        return teamName.substring(0, 10) + "...";
      }
      return teamName;
    }

    if (isMobile) {
      if (teamName.length > 20) {
        return teamName.substring(0, 18) + "...";
      }
      return teamName;
    }

    if (isTablet && teamName.length > 25) {
      return teamName.substring(0, 23) + "...";
    }

    return teamName;
  };

  const getTeamNameTooltip = () => {
    if (isMobile || teamName === getDisplayTeamName()) {
      return undefined;
    }
    return teamName;
  };

  const getButtonSize = () => {
    if (isSmallMobile) return "sm";
    if (isMobile) return "default";
    return "default";
  };

  const getTitleSize = () => {
    if (isSmallMobile) return "text-lg";
    if (isMobile) return "text-lg";
    return "text-3xl";
  };

  const getSubtitleSize = () => {
    if (isSmallMobile) return "text-xs";
    if (isMobile) return "text-xs";
    return "text-base";
  };

  const getTitleStyles = () => {
    if (isSmallMobile) {
      return "truncate max-w-[130px]";
    }
    if (isMobile) {
      return "truncate max-w-[200px]";
    }
    return "";
  };

  const getSubtitle = () => {
    if (hasAdminRights) {
      return isSmallMobile
        ? "Team settings"
        : isMobile
        ? "Manage team settings"
        : "Manage your Team settings and members";
    } else if (hasEditRights) {
      return isSmallMobile
        ? "Team overview"
        : isMobile
        ? "View and edit team"
        : "View and edit team files";
    } else {
      return isSmallMobile
        ? "Team view"
        : isMobile
        ? "View team information"
        : "View team information and members";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          {isMobile && onMenuToggle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuToggle}
                className="h-9 w-9 md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <BackButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-0.5 md:space-y-1"
          >
            <h1
              className={`font-bold tracking-tight text-gray-900 dark:text-white ${getTitleSize()} ${getTitleStyles()}`}
              title={getTeamNameTooltip()}
            >
              {getDisplayTeamName()}
              {!isSmallMobile &&
                !isMobile &&
                (hasAdminRights
                  ? " Settings"
                  : hasEditRights
                  ? " Dashboard"
                  : " Overview")}
            </h1>
            <p
              className={`text-gray-600 dark:text-gray-400 ${getSubtitleSize()}`}
            >
              {getSubtitle()}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-2 md:gap-3"
        >
          {hasAdminRights && !isSmallMobile && (
            <Button
              onClick={handleOpenInviteModal}
              size={getButtonSize()}
              variant="outline"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 shadow-sm"
            >
              <Users
                className={`${
                  isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                } mr-1 md:mr-2`}
              />
              {!isSmallMobile && "Invite"}
            </Button>
          )}

          {hasAdminRights && (
            <Link href={`/settings/team/${teamId}/setup`}>
              <Button
                variant="outline"
                size={getButtonSize()}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 shadow-sm"
              >
                <Settings
                  className={`${
                    isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                  } mr-1 md:mr-2`}
                />
                {!isSmallMobile && "Settings"}
              </Button>
            </Link>
          )}

          {!hasEditRights && !hasAdminRights && !isSmallMobile && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Eye className="h-4 w-4" />
              <span>View Only</span>
            </div>
          )}
        </motion.div>
      </div>

      {isSmallMobile && hasAdminRights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Button
            onClick={handleOpenInviteModal}
            size="sm"
            variant="outline"
            className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 shadow-sm"
          >
            <Users className="h-3 w-3 mr-2" />
            Invite Team Member
          </Button>
        </motion.div>
      )}

      {isSmallMobile && !hasEditRights && !hasAdminRights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Eye className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              View only access
            </span>
          </div>
        </motion.div>
      )}

      {hasAdminRights && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          teamId={teamId}
          teamName={teamName}
        />
      )}
    </>
  );
}
