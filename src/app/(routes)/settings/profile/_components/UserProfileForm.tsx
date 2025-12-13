"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  Clock,
  Zap,
  Users,
  Coffee,
  Plane,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { AvatarUploadSection } from "./AvatarUploadSection";
import { useState, useEffect } from "react";
import { useUserStatus } from "@/hooks/useUserStatus";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  timezone: z.string(),
  availabilityStatus: z.enum([
    "AVAILABLE",
    "FOCUS",
    "MEETING",
    "OOO",
    "CUSTOM",
  ]),
  customStatus: z.string().max(50).optional(),
  showPresence: z.boolean(),
});

type ProfileData = z.infer<typeof profileSchema>;

const statusSuggestions = [
  {
    text: "Working remotely",
    emoji: "🏠",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20",
  },
  {
    text: "Focusing on a deadline",
    emoji: "⏰",
    color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20",
  },
  {
    text: "Taking a break",
    emoji: "☕",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20",
  },
  {
    text: "In deep work",
    emoji: "🎯",
    color: "bg-green-50 text-green-700 dark:bg-green-900/20",
  },
  {
    text: "Lunch break",
    emoji: "🍽️",
    color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20",
  },
  {
    text: "Working late",
    emoji: "🌙",
    color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20",
  },
  {
    text: "Vacation mode",
    emoji: "🏖️",
    color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20",
  },
  {
    text: "Creative flow",
    emoji: "🎨",
    color: "bg-pink-50 text-pink-700 dark:bg-pink-900/20",
  },
];

function StatusIndicator({
  status,
  customStatus,
  size = "md",
}: {
  status: string;
  customStatus?: string;
  size?: "sm" | "md" | "lg";
}) {
  const statusConfig = {
    AVAILABLE: {
      color: "bg-green-500",
      icon: <Zap className="h-3 w-3" />,
      label: "Available",
    },
    FOCUS: {
      color: "bg-purple-500",
      icon: <Coffee className="h-3 w-3" />,
      label: "Focus mode",
    },
    MEETING: {
      color: "bg-blue-500",
      icon: <Users className="h-3 w-3" />,
      label: "In a meeting",
    },
    OOO: {
      color: "bg-red-500",
      icon: <Plane className="h-3 w-3" />,
      label: "Out of office",
    },
    CUSTOM: {
      color: "bg-linear-to-r from-gray-400 to-slate-500",
      icon: <MessageSquare className="h-3 w-3" />,
      label: customStatus || "Custom",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.AVAILABLE;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${config.color} rounded-full p-1 flex items-center justify-center`}
      >
        <div className="text-white">{config.icon}</div>
      </div>
      <span
        className={`font-medium ${
          size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"
        }`}
      >
        {status === "CUSTOM" && customStatus ? customStatus : config.label}
      </span>
    </div>
  );
}

export function UserProfileForm() {
  const { userStatus, updateStatus } = useUserStatus();
  const queryClient = useQueryClient();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return res.json();
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["user-settings"] });
      await queryClient.cancelQueries({ queryKey: ["user-status"] });

      const previousSettings = queryClient.getQueryData(["user-settings"]);
      const previousStatus = queryClient.getQueryData(["user-status"]);

      queryClient.setQueryData(["user-settings"], (old: any) => ({
        ...old,
        user: { ...old.user, ...newData },
      }));

      queryClient.setQueryData(["user-status"], (old: any) => ({
        ...old,
        availabilityStatus: newData.availabilityStatus,
        customStatus: newData.customStatus,
      }));

      return { previousSettings, previousStatus };
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (err, newData, context) => {
      console.error("Update error:", err);
      queryClient.setQueryData(["user-settings"], context?.previousSettings);
      queryClient.setQueryData(["user-status"], context?.previousStatus);
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      queryClient.invalidateQueries({ queryKey: ["user-status"] });
    },
  });

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      timezone: "UTC",
      availabilityStatus: "AVAILABLE",
      customStatus: "",
      showPresence: true,
    },
  });

  useEffect(() => {
    if (settings?.user) {
      form.reset({
        name: settings.user?.name || "",
        bio: settings.user?.bio || "",
        timezone: settings.user?.timezone || "UTC",
        availabilityStatus: settings.user?.availabilityStatus || "AVAILABLE",
        customStatus: settings.user?.customStatus || "",
        showPresence: settings.user?.showPresence ?? true,
      });
    }
  }, [settings, form]);

  const selectedStatus = form.watch("availabilityStatus");
  const customStatus = form.watch("customStatus");

  useEffect(() => {
    setShowCustomInput(selectedStatus === "CUSTOM");
  }, [selectedStatus]);

  const onSubmit = (data: ProfileData) => {
    console.log("Submitting form data:", data);

    if (data.availabilityStatus !== "CUSTOM") {
      data.customStatus = "";
    }

    mutation.mutate(data, {
      onSuccess: (result) => {
        console.log("Mutation successful:", result);
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        console.error("Mutation error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update profile"
        );
      },
    });
  };

  const handleAvatarUpdate = (imageUrl: string) => {
    queryClient.setQueryData(["user-settings"], (old: any) => ({
      ...old,
      user: { ...old.user, image: imageUrl },
    }));
  };

  const quickUpdateStatus = (status: string, customText?: string) => {
    updateStatus({
      availabilityStatus: status,
      ...(customText && { customStatus: customText }),
    })
      .then(() => {})
      .catch((error) => {
        console.error("Failed to update status:", error);
        toast.error("Failed to update status");
      });
  };

  const handleCustomStatusUpdate = () => {
    const customText = form.getValues("customStatus")?.trim();
    if (customText) {
      quickUpdateStatus("CUSTOM", customText);
    } else {
      toast.info("Please enter custom status text");
    }
  };

  const applySuggestion = (suggestion: string) => {
    form.setValue("customStatus", suggestion);
    toast.success("Suggestion applied!");
  };

  const clearCustomStatus = () => {
    form.setValue("customStatus", "");
    toast.info("Custom status cleared");
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
    <Card className="border-none shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Manage your personal information and availability status
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Picture
            </h3>
            <div className="text-sm text-gray-500">
              {settings?.user?.image?.startsWith("http") ? "Google" : "Custom"}
            </div>
          </div>

          <AvatarUploadSection
            currentImage={settings?.user?.image}
            userName={settings?.user?.name}
            onAvatarUpdate={handleAvatarUpdate}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Display Name
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter your name"
                className="max-w-md h-11 rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="bio"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Bio
              </Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                placeholder="Tell us about yourself..."
                className="max-w-md min-h-[100px] resize-none rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Brief description for your profile
                </p>
                <span className="text-xs text-gray-400">
                  {form.watch("bio")?.length || 0}/500
                </span>
              </div>
              {form.formState.errors.bio && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Availability Status
                </h3>
                <div className="flex items-center gap-2">
                  <StatusIndicator
                    status={selectedStatus}
                    customStatus={customStatus}
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: "AVAILABLE",
                      label: "Available",
                      icon: <Zap className="h-4 w-4" />,
                      color:
                        "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
                    },
                    {
                      value: "FOCUS",
                      label: "Focus mode",
                      icon: <Coffee className="h-4 w-4" />,
                      color:
                        "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
                    },
                    {
                      value: "MEETING",
                      label: "In a meeting",
                      icon: <Users className="h-4 w-4" />,
                      color:
                        "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
                    },
                    {
                      value: "OOO",
                      label: "Out of office",
                      icon: <Plane className="h-4 w-4" />,
                      color:
                        "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
                    },
                    {
                      value: "CUSTOM",
                      label: "Custom",
                      icon: <MessageSquare className="h-4 w-4" />,
                      color:
                        "border-gray-500 bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        form.setValue(
                          "availabilityStatus",
                          option.value as any
                        );

                        if (option.value !== "CUSTOM") {
                          form.setValue("customStatus", "");
                          quickUpdateStatus(option.value);
                        } else {
                          setShowCustomInput(true);
                          const currentCustomText =
                            form.getValues("customStatus");
                          if (currentCustomText?.trim()) {
                            quickUpdateStatus(
                              "CUSTOM",
                              currentCustomText.trim()
                            );
                          }
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        selectedStatus === option.value
                          ? option.color +
                            " ring-2 ring-offset-2 ring-opacity-50"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg mb-2 ${
                          selectedStatus === option.value
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <span className="font-medium text-sm">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                {showCustomInput && (
                  <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="customStatus"
                          className="text-sm font-medium"
                        >
                          Custom Status Text
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearCustomStatus}
                            className="h-8 px-3 text-xs"
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="h-8 px-3 text-xs"
                          >
                            {showSuggestions ? "Hide" : "Show"} suggestions
                          </Button>
                        </div>
                      </div>

                      <div className="relative">
                        <Input
                          id="customStatus"
                          {...form.register("customStatus")}
                          placeholder="e.g., Working on a deadline, On vacation..."
                          className="max-w-md h-11 rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 pr-20"
                          maxLength={50}
                          onBlur={(e) => {
                            if (
                              e.target.value.trim() &&
                              selectedStatus === "CUSTOM"
                            ) {
                              handleCustomStatusUpdate();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              selectedStatus === "CUSTOM"
                            ) {
                              e.preventDefault();
                              handleCustomStatusUpdate();
                            }
                          }}
                        />
                        <div className="absolute right-0 top-0 bottom-0 flex items-center px-3">
                          <span className="text-xs text-gray-400">
                            {customStatus?.length || 0}/50
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        Max 50 characters. This will be displayed to your team
                        members.
                      </p>
                    </div>

                    {showSuggestions && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Quick suggestions
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • Click to apply
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {statusSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${suggestion.color} border-transparent hover:scale-[1.02] active:scale-[0.98]`}
                              onClick={() => {
                                form.setValue("customStatus", suggestion.text);
                                quickUpdateStatus("CUSTOM", suggestion.text);
                              }}
                            >
                              <span className="text-lg">
                                {suggestion.emoji}
                              </span>
                              <span className="text-sm font-medium truncate flex-1 text-left">
                                {suggestion.text}
                              </span>
                              <div className="w-6 h-6 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
                                <span className="text-xs">✓</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {customStatus && (
                      <div className="pt-4 border-t dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Preview
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-gray-500">
                              Live preview - select "status" and wait for it to
                              appear
                            </span>
                          </div>
                        </div>
                        <div className="bg-linear-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-linear-to-r from-gray-400 to-slate-500">
                              <MessageSquare className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {customStatus}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                This is how your status will appear to team
                                members
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="showPresence"
                    {...form.register("showPresence")}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="showPresence" className="text-sm">
                    Show my availability status to team members
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
              <div className="space-y-2">
                <Label
                  htmlFor="timezone"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Timezone
                </Label>
                <select
                  id="timezone"
                  {...form.register("timezone")}
                  className="flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              disabled={mutation.isPending || !form.formState.isDirty}
              className="px-6 h-11 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  {mutation.isSuccess && (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </>
              )}
            </Button>

            {form.formState.isDirty && !mutation.isPending && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
