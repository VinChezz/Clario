"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Virgil from "next/font/local";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Loader from "@/app/_loaders/loader";
import {
  ChevronLeft,
  Users,
  Sparkles,
  ArrowRight,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

const virgil = Virgil({
  src: "../../../fonts/Virgil.woff2",
});

export default function CreateTeam() {
  const { user, isLoading } = useKindeBrowserClient();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href =
        "/api/auth/login?post_login_redirect_url=/teams/create";
      return;
    }
  }, [user, isLoading]);

  if (isLoading) return <Loader />;

  const createNewTeam = async () => {
    try {
      setLoading(true);
      const trimmedTeamName = teamName.trim();

      if (!trimmedTeamName) {
        toast.error("Team name cannot be empty");
        return;
      }

      console.log("Creating team with name:", trimmedTeamName);

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedTeamName,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toast.error("Invalid response from server");
        return;
      }

      if (!res.ok) {
        console.error("API Error:", data);

        if (res.status === 503) {
          toast.error(
            "Service temporarily unavailable. Please try again in a moment."
          );
        } else {
          toast.error(data.error || `Failed to create team: ${res.status}`);
        }
        return;
      }

      console.log("Team created successfully:", data);
      toast.success("Team created successfully!");

      sessionStorage.setItem("new-team-created", "true");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (e) {
      console.error("Network error: ", e);
      toast.error("Network error - please check your connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-900">
      <div className="container mx-auto px-6 md:px-16 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-16"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Image
                src={"/logo-1.png"}
                alt={"logo"}
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Clario
            </div>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80"
            onClick={() => router.push("/dashboard?skipTeamCheck=true")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Create Your Workspace
            </div>

            <h1
              className={`${virgil.className} text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6`}
            >
              What's your team name?
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Give your team a memorable name. You can always change it later
              from settings.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Building2 className="h-4 w-4" />
                  TEAM NAME
                </label>

                <div className="relative">
                  <Input
                    placeholder="Enter your team name..."
                    className="h-14 text-lg pl-12 pr-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        teamName.trim().length > 0 &&
                        !loading
                      ) {
                        createNewTeam();
                      }
                    }}
                  />
                  <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will be the name of your workspace where you can
                  collaborate with your team.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Team Collaboration
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Real-time Editing
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Workspace Management
                  </p>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full h-14 text-lg font-semibold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-2xl transition-all duration-300 group relative overflow-hidden"
                  disabled={
                    !(teamName && teamName.trim().length > 0) || loading
                  }
                  onClick={createNewTeam}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-white/10 to-white/5 backdrop-blur-sm group-hover:from-white/20 group-hover:to-white/10 transition-all duration-500" />

                  {loading ? (
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Your Team...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 relative z-10">
                      Create Team
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}

                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You'll be able to invite team members right after creating your
              team.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
