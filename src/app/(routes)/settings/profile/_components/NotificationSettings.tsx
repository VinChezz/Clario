"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Bell, Mail, MessageSquare } from "lucide-react";

export function NotificationSettings() {
  return (
    <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 border border-amber-300 dark:bg-amber-900 dark:border-amber-700">
              <Clock className="h-3 w-3 text-amber-700 dark:text-amber-300" />
            </div>
          </div>
          <div>
            <CardTitle className="text-gray-900 dark:text-white">
              Notifications
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Advanced notification settings coming soon
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
              Coming soon
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
              Coming soon
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Feature in Development
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
                We're working on a comprehensive notification system that will
                allow you to customize how and when you receive updates.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Planned for Q2 2026
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
