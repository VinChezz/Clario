"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useIsMobile,
  useIsSmallMobile,
  useIsTablet,
} from "@/hooks/useMediaQuery";

interface TeamSettingsProps {
  teamId: string;
  teamName: string;
}

export function QuickTeamSettings({ teamId, teamName }: TeamSettingsProps) {
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    const primaryTeamId = localStorage.getItem("primary_team_id");
    if (primaryTeamId === teamId) {
      setIsPrimary(true);

      const hasOpenedSettings = localStorage.getItem(
        `team_${teamId}_settings_opened`
      );
      if (!hasOpenedSettings) {
        localStorage.setItem(`team_${teamId}_settings_opened`, "true");
      }
    }
  }, [teamId, teamName]);

  const handleMakePrimary = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      localStorage.setItem("primary_team_id", teamId);
      localStorage.setItem("primary_team_name", teamName);
      localStorage.removeItem(`team_${teamId}_settings_opened`);

      setIsPrimary(true);
    } catch (error) {
      console.error("Error setting primary team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePrimary = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      localStorage.removeItem("primary_team_id");
      localStorage.removeItem("primary_team_name");

      setIsPrimary(false);
    } catch (error) {
      console.error("Error removing primary team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardPadding = () => {
    if (isSmallMobile) return "p-3";
    if (isMobile) return "p-3 md:p-4";
    return "px-4 py-2";
  };

  const getInfoButtonSize = () => {
    if (isSmallMobile) return "h-6 w-6";
    return "h-7 w-7";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div
        className={`bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 ${getCardPadding()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`${
                isSmallMobile ? "p-1.5" : "p-2"
              } rounded-lg transition-all duration-300 ${
                isPrimary
                  ? "bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 shadow-lg"
                  : "bg-gray-50 dark:bg-gray-800/50"
              }`}
            >
              {isPrimary ? (
                <Star
                  className={`${
                    isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                  } text-amber-500 dark:text-amber-400 fill-amber-400/30`}
                />
              ) : (
                <Star
                  className={`${
                    isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                  } text-gray-400 dark:text-gray-500`}
                />
              )}
            </div>
            <div className="space-y-0.5">
              <h3
                className={`font-medium text-gray-900 dark:text-white ${
                  isSmallMobile ? "text-xs" : "text-sm"
                }`}
              >
                {isPrimary ? "Primary Team" : "Set as Primary"}
              </h3>
              <p
                className={`text-gray-500 dark:text-gray-400 ${
                  isSmallMobile ? "text-xs" : "text-xs"
                }`}
              >
                {isPrimary
                  ? "Opens automatically on login"
                  : "Make this your default team"}
              </p>
            </div>
          </div>

          {isPrimary ? (
            <Button
              variant="ghost"
              size={isSmallMobile ? "icon" : "sm"}
              onClick={handleRemovePrimary}
              disabled={isLoading}
              className={`text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 ${
                isSmallMobile ? "h-7 w-7" : "h-8 px-3 ml-2"
              }`}
            >
              {isLoading ? (
                <div
                  className={`animate-spin rounded-full border-2 border-gray-400 border-t-transparent ${
                    isSmallMobile ? "h-3 w-3" : "h-3.5 w-3.5"
                  }`}
                />
              ) : (
                <>
                  <X
                    className={`${
                      isSmallMobile ? "h-3.5 w-3.5" : "h-3.5 w-3.5"
                    }`}
                  />
                </>
              )}
            </Button>
          ) : (
            <Button
              size={isSmallMobile ? "sm" : "sm"}
              onClick={handleMakePrimary}
              disabled={isLoading}
              className={`h-8 ${
                isSmallMobile ? "px-2 text-xs" : "px-3"
              } bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300 dark:hover:text-white shadow-sm`}
            >
              {isLoading ? (
                <div
                  className={`animate-spin rounded-full border-2 ${
                    isSmallMobile
                      ? "h-3 w-3 border-gray-700 border-t-transparent"
                      : "h-3.5 w-3.5 border-gray-700 border-t-transparent dark:border-gray-300"
                  }`}
                />
              ) : (
                "Set"
              )}
            </Button>
          )}
        </div>

        {isPrimary && (
          <div
            className={`mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-800 ${
              isSmallMobile ? "space-y-1.5" : "space-y-2.5"
            }`}
          >
            <div
              className={`flex items-center gap-2 ${
                isSmallMobile ? "text-xs" : "text-xs"
              }`}
            >
              <div
                className={`shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded ${
                  isSmallMobile ? "w-3 h-3" : "w-4 h-4"
                }`}
              >
                <Check
                  className={`text-blue-600 dark:text-blue-400 ${
                    isSmallMobile ? "h-2 w-2" : "h-2.5 w-2.5"
                  }`}
                />
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                Auto-opens on login
              </span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                isSmallMobile ? "text-xs" : "text-xs"
              }`}
            >
              <div
                className={`shrink-0 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 rounded ${
                  isSmallMobile ? "w-3 h-3" : "w-4 h-4"
                }`}
              >
                <Check
                  className={`text-emerald-600 dark:text-emerald-400 ${
                    isSmallMobile ? "h-2 w-2" : "h-2.5 w-2.5"
                  }`}
                />
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                Priority feature access
              </span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                isSmallMobile ? "text-xs" : "text-xs"
              }`}
            >
              <div
                className={`shrink-0 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded ${
                  isSmallMobile ? "w-3 h-3" : "w-4 h-4"
                }`}
              >
                <Check
                  className={`text-violet-600 dark:text-violet-400 ${
                    isSmallMobile ? "h-2 w-2" : "h-2.5 w-2.5"
                  }`}
                />
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                Extended file retention
              </span>
            </div>
          </div>
        )}
      </div>

      {isMobile ? (
        <div
          className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 ${
            isSmallMobile ? "p-3" : "p-3 md:p-4"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4
                className={`font-medium text-blue-800 dark:text-blue-300 mb-1 ${
                  isSmallMobile ? "text-xs" : "text-sm"
                }`}
              >
                About Primary Teams
              </h4>
              <p
                className={`text-blue-600 dark:text-blue-400 ${
                  isSmallMobile ? "text-xs leading-tight" : "text-xs"
                }`}
              >
                Your primary team opens automatically when you access the app.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`${getInfoButtonSize()} text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300`}
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className={`${isSmallMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          </div>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <div
                    className={`space-y-1 text-blue-500 dark:text-blue-400 ${
                      isSmallMobile ? "text-xs" : "text-xs"
                    }`}
                  >
                    <p>• Only one primary team at a time</p>
                    <p>• Updates your default view</p>
                    <p>• Any member can set as primary</p>
                    <p>• Preferences saved per team</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          layout
          className={`bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 overflow-hidden ${getCardPadding()}`}
        >
          <motion.div
            layout
            className="flex items-start justify-between cursor-pointer"
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          >
            <div>
              <motion.h4
                layout="position"
                className="font-medium text-blue-800 dark:text-blue-300 mb-1"
              >
                About Primary Teams
              </motion.h4>
              <motion.p
                layout="position"
                className="text-sm text-blue-600 dark:text-blue-400"
              >
                {isInfoExpanded
                  ? "Click to collapse details"
                  : "Learn more about primary teams"}
              </motion.p>
            </div>
            <motion.div
              animate={{ rotate: isInfoExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center ml-2"
            >
              <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {isInfoExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  marginTop: "1rem",
                }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-blue-600 dark:text-blue-400 mb-3"
                >
                  Your primary team is the default team that opens automatically
                  when you access the application. This is useful if you
                  frequently work with one specific team.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className={`text-blue-500 dark:text-blue-400 ${
                    isTablet ? "text-xs" : "text-xs"
                  }`}
                >
                  <p>• You can only have one primary team at a time</p>
                  <p>
                    • Changing your primary team will update your default view
                  </p>
                  <p>• Any team member can set a team as primary</p>
                  <p>• Team settings and preferences are saved per team</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
