"use client";

import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileForm } from "./_components/UserProfileForm";
import { AppearanceSettings } from "./_components/AppearanceSettings";
import { NotificationSettings } from "./_components/NotificationSettings";
import { EditorSettings } from "./_components/EditorSettings";
import { AccountInfo } from "./_components/AccountInfo";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UserSettingsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 space-y-1"
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <div className="border-b dark:border-gray-800 pb-2">
              <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Appearance
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 relative"
                >
                  Notifications
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs py-0 px-1 h-4 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  >
                    Soon
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="editor"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Account
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <UserProfileForm />
              </motion.div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <AppearanceSettings />
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <NotificationSettings />
              </motion.div>
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <EditorSettings />
              </motion.div>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <AccountInfo />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </>
  );
}
