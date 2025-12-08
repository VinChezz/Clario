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
import { Loader2, CheckCircle } from "lucide-react";
import { AvatarUploadSection } from "./AvatarUploadSection";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  timezone: z.string(),
  language: z.string(),
});

type ProfileData = z.infer<typeof profileSchema>;

export function UserProfileForm() {
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

      const previousSettings = queryClient.getQueryData(["user-settings"]);

      queryClient.setQueryData(["user-settings"], (old: any) => ({
        ...old,
        user: { ...old.user, ...newData },
      }));

      return { previousSettings };
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (err, newData, context) => {
      console.error("Update error:", err);
      queryClient.setQueryData(["user-settings"], context?.previousSettings);
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: settings
      ? {
          name: settings.user?.name || "",
          bio: settings.user?.bio || "",
          timezone: settings.user?.timezone || "UTC",
          language: settings.user?.language || "en",
        }
      : {
          name: "",
          bio: "",
          timezone: "UTC",
          language: "en",
        },
  });

  const onSubmit = (data: ProfileData) => {
    mutation.mutate(data);
  };

  const handleAvatarUpdate = (imageUrl: string) => {
    queryClient.setQueryData(["user-settings"], (old: any) => ({
      ...old,
      user: { ...old.user, image: imageUrl },
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
          Manage your personal information and profile picture
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
              <div className="space-y-2">
                <Label
                  htmlFor="timezone"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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

              <div className="space-y-2">
                <Label
                  htmlFor="language"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Language
                </Label>
                <select
                  id="language"
                  {...form.register("language")}
                  className="flex h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="uk">Ukrainian</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              disabled={mutation.isPending || !form.formState.isDirty}
              className="px-6 h-11 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
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
