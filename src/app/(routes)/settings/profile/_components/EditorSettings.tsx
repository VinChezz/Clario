"use client";

import { useState, useEffect } from "react";
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
import { Save, SpellCheck, Hash, Loader2, WrapText } from "lucide-react";
import { useEditorSettings } from "@/hooks/useEditorSettings";

export function EditorSettings() {
  const { settings, isLoading, updateSettings } = useEditorSettings();

  const toggleSetting = async (key: string, value: boolean) => {
    const success = await updateSettings({ [key]: value });

    if (success) {
      toast.success("Settings updated");
    } else {
      toast.error("Failed to update settings");
    }
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
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <WrapText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="wrap-lines">Wrap Lines</Label>
              <p className="text-sm text-gray-500">
                Wrap long lines in the editor
              </p>
            </div>
          </div>
          <Switch
            id="wrap-lines"
            checked={settings?.wrapLines ?? false}
            onCheckedChange={(checked) => toggleSetting("wrapLines", checked)}
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
