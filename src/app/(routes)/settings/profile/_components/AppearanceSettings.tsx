// components/settings/AppearanceSettings.tsx
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Moon, Sun, Monitor, Type } from "lucide-react";

export function AppearanceSettings() {
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
      if (!res.ok) throw new Error("Failed to update appearance settings");
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
      toast("Failed to update appearance settings");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });

  const handleThemeChange = (theme: string) => {
    mutation.mutate({ theme });
  };

  const handleFontSizeChange = (fontSize: string) => {
    mutation.mutate({ fontSize });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how Clario looks and feels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Theme</Label>
          <RadioGroup
            value={settings?.theme || "LIGHT"}
            onValueChange={handleThemeChange}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { value: "LIGHT", icon: Sun, label: "Light" },
              { value: "DARK", icon: Moon, label: "Dark" },
              { value: "AUTO", icon: Monitor, label: "System" },
            ].map((themeOption) => (
              <motion.div
                key={themeOption.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RadioGroupItem
                  value={themeOption.value}
                  id={`theme-${themeOption.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`theme-${themeOption.value}`}
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:peer-data-[state=checked]:border-blue-500 dark:peer-data-[state=checked]:bg-blue-950/20 cursor-pointer transition-all"
                >
                  <themeOption.icon className="mb-3 h-6 w-6" />
                  <span className="font-medium">{themeOption.label}</span>
                </Label>
              </motion.div>
            ))}
          </RadioGroup>
        </div>

        {/* Font Size */}
        <div className="space-y-4">
          <Label htmlFor="font-size" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Font Size
          </Label>
          <Select
            value={settings?.fontSize || "MEDIUM"}
            onValueChange={handleFontSizeChange}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SMALL">Small</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LARGE">Large</SelectItem>
            </SelectContent>
          </Select>
          <div className="pt-2 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span
                className={`${
                  settings?.fontSize === "SMALL"
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : "text-gray-500"
                }`}
              >
                Small
              </span>
              <span
                className={`${
                  settings?.fontSize === "MEDIUM"
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : "text-gray-500"
                }`}
              >
                Medium
              </span>
              <span
                className={`${
                  settings?.fontSize === "LARGE"
                    ? "font-semibold text-blue-600 dark:text-blue-400"
                    : "text-gray-500"
                }`}
              >
                Large
              </span>
            </div>
            <div className="h-2 bg-linear-to-r from-gray-300 via-gray-400 to-gray-500 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-full relative">
              <motion.div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-blue-600 dark:bg-blue-500 shadow-md"
                animate={{
                  left:
                    settings?.fontSize === "SMALL"
                      ? "0%"
                      : settings?.fontSize === "MEDIUM"
                      ? "49%"
                      : "98%",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
