"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update notification settings");
      return res.json();
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["user-settings"] });

      const previousSettings = queryClient.getQueryData(["user-settings"]);

      queryClient.setQueryData(["user-settings"], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousSettings };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["user-settings"], context?.previousSettings);
      toast("Failed to update notification settings");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });

  const toggleSetting = (key: string, value: boolean) => {
    mutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configure how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings?.emailNotifications ?? true}
                onCheckedChange={(checked) =>
                  toggleSetting("emailNotifications", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mention-emails">Mention Emails</Label>
                <p className="text-sm text-gray-500">
                  Get emails when someone mentions you
                </p>
              </div>
              <Switch
                id="mention-emails"
                checked={settings?.mentionEmails ?? true}
                onCheckedChange={(checked) =>
                  toggleSetting("mentionEmails", checked)
                }
                disabled={!settings?.emailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="comment-emails">Comment Emails</Label>
                <p className="text-sm text-gray-500">
                  Get emails on new comments
                </p>
              </div>
              <Switch
                id="comment-emails"
                checked={settings?.commentEmails ?? true}
                onCheckedChange={(checked) =>
                  toggleSetting("commentEmails", checked)
                }
                disabled={!settings?.emailNotifications}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Push Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings?.pushNotifications ?? true}
              onCheckedChange={(checked) =>
                toggleSetting("pushNotifications", checked)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
