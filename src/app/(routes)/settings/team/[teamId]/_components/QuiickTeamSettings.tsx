"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface TeamSettingsProps {
  teamId: string;
  teamName: string;
}

export function QuickTeamSettings({ teamId, teamName }: TeamSettingsProps) {
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-all duration-300 ${
                isPrimary
                  ? "bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 shadow-lg"
                  : "bg-gray-50 dark:bg-gray-800/50"
              }`}
            >
              {isPrimary ? (
                <Star className="h-5 w-5 text-amber-500 dark:text-amber-400 fill-amber-400/30" />
              ) : (
                <Star className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                {isPrimary ? "Primary Team" : "Set as Primary"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPrimary
                  ? "Opens automatically on login"
                  : "Make this your default team"}
              </p>
            </div>
          </div>

          {isPrimary ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePrimary}
              disabled={isLoading}
              className="h-8 px-3 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              ) : (
                <>
                  <X className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleMakePrimary}
              disabled={isLoading}
              className="h-8 px-3 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300 dark:hover:text-white shadow-sm"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-700 border-t-transparent dark:border-gray-300" />
              ) : (
                "Set"
              )}
            </Button>
          )}
        </div>

        {isPrimary && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="shrink-0 w-4 h-4 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded">
                  <Check className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  Auto-opens on login
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="shrink-0 w-4 h-4 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 rounded">
                  <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  Priority feature access
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="shrink-0 w-4 h-4 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded">
                  <Check className="h-2.5 w-2.5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  Extended file retention
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          About Primary Teams
        </h4>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Your primary team is the default team that opens automatically when
          you access the application. This is useful if you frequently work with
          one specific team.
        </p>
        <div className="mt-3 text-xs text-blue-500 dark:text-blue-400">
          <p>• You can only have one primary team at a time</p>
          <p>• Changing your primary team will update your default view</p>
          <p>• Any team member can set a team as primary</p>
          <p>• Team settings and preferences are saved per team</p>
        </div>
      </div>
    </div>
  );
}
