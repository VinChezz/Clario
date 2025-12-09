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
import { Save, SpellCheck, Hash } from "lucide-react";

export function EditorSettings() {
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
      if (!res.ok) throw new Error("Failed to update editor settings");
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
      toast("Failed to update editor settings");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });

  const toggleSetting = (key: string, value: boolean) => {
    mutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
      <CardHeader>
        <CardTitle>Editor</CardTitle>
        <CardDescription>Configure your editor preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Save className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto-save</Label>
              <p className="text-sm text-gray-500">
                Automatically save changes while editing
              </p>
            </div>
          </div>
          <Switch
            id="auto-save"
            checked={settings?.autoSave ?? true}
            onCheckedChange={(checked) => toggleSetting("autoSave", checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <SpellCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="spell-check">Spell Check</Label>
              <p className="text-sm text-gray-500">
                Enable spell checking in the editor
              </p>
            </div>
          </div>
          <Switch
            id="spell-check"
            checked={settings?.spellCheck ?? true}
            onCheckedChange={(checked) => toggleSetting("spellCheck", checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="line-numbers">Line Numbers</Label>
              <p className="text-sm text-gray-500">
                Show line numbers in the editor
              </p>
            </div>
          </div>
          <Switch
            id="line-numbers"
            checked={settings?.lineNumbers ?? false}
            onCheckedChange={(checked) => toggleSetting("lineNumbers", checked)}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Editor Preview
          </h4>
          <div
            className={`font-mono text-sm ${
              settings?.fontSize === "SMALL"
                ? "text-sm"
                : settings?.fontSize === "MEDIUM"
                ? "text-base"
                : settings?.fontSize === "LARGE"
                ? "text-lg"
                : "text-xl"
            }`}
          >
            <div className="flex">
              {settings?.lineNumbers && (
                <div className="pr-4 text-right text-gray-400 dark:text-gray-500 select-none border-r border-gray-300 dark:border-gray-700 mr-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="h-6">
                      {num}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="h-6">
                  <span className="text-blue-600 dark:text-blue-400">
                    function
                  </span>{" "}
                  <span className="text-green-600 dark:text-green-400">
                    helloWorld
                  </span>
                  () {"{"}
                </div>
                <div className="h-6 ml-4">
                  <span className="text-purple-600 dark:text-purple-400">
                    console
                  </span>
                  .
                  <span className="text-yellow-600 dark:text-yellow-400">
                    log
                  </span>
                  (
                  <span className="text-red-600 dark:text-red-400">
                    'Hello, World!'
                  </span>
                  );
                </div>
                <div className="h-6">{"}"}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            This preview shows how your editor will look with current settings
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
