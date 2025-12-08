import { useState, useEffect } from "react";
import {
  Upload,
  RefreshCw,
  User,
  X,
  Check,
  Camera,
  Globe,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface AvatarUploadSectionProps {
  currentImage?: string;
  userName?: string;
  onAvatarUpdate: (imageUrl: string) => void;
}

export function AvatarUploadSection({
  currentImage,
  userName,
  onAvatarUpdate,
}: AvatarUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Загружаем информацию о Google аватарке
  useEffect(() => {
    fetchAvatarInfo();
  }, []);

  const fetchAvatarInfo = async () => {
    try {
      const response = await fetch("/api/users/upload-image");
      if (response.ok) {
        const data = await response.json();
        setGoogleAvatar(data.googleAvatar || null);
      }
    } catch (error) {
      console.error("Failed to fetch avatar info:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/users/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      toast.success("Avatar updated successfully");
      onAvatarUpdate(result.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToGoogle = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("action", "reset-to-google");

      const response = await fetch("/api/users/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Reset failed");
      }

      toast.success("Avatar reset to Google image");
      onAvatarUpdate(result.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    } catch (error) {
      console.error("Reset error:", error);
      toast.error(error instanceof Error ? error.message : "Reset failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Сбрасываем input
    if (event.target) {
      event.target.value = "";
    }
  };

  const isGoogleAvatar = currentImage?.startsWith("http");
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      <div className="space-y-6 ">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="relative h-40 w-40 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={userName || "Profile"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}

              {(!currentImage || currentImage === "") && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-4xl font-bold text-gray-700 dark:text-gray-300">
                    {initials}
                  </div>
                </div>
              )}

              <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform transition-transform group-hover:scale-110">
                  <Camera className="h-6 w-6 text-gray-800" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>

              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="h-10 w-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {isGoogleAvatar && (
              <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                <Globe className="h-3 w-3" />
                <span>Google</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            {userName && (
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {userName}
              </h3>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isGoogleAvatar
                ? "Using Google profile picture"
                : "Custom profile picture"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div
              className={cn(
                "flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-all duration-200",
                "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                "group cursor-pointer"
              )}
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  Upload new photo
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, PNG or WebP, max 5MB
                </p>
              </div>
            </div>
          </label>

          {googleAvatar && !isGoogleAvatar && (
            <Dialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-3 px-4 py-8 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-gray-200 dark:border-gray-700"
                >
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Use Google avatar
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reset to your Google account photo
                    </p>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Reset to Google Avatar
                  </DialogTitle>
                  <DialogDescription>
                    This will replace your current profile picture with your
                    Google account photo. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                      {currentImage ? (
                        <img
                          src={currentImage}
                          alt="Current"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-200">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <X className="h-5 w-5 text-gray-400" />
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                      {googleAvatar ? (
                        <img
                          src={googleAvatar}
                          alt="Google"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100">
                          <Globe className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResetToGoogle}
                    disabled={isUploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Reset
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isGoogleAvatar ? "Google Avatar" : "Custom Avatar"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isGoogleAvatar
                    ? "Using your Google account profile picture"
                    : "Using a custom uploaded image"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
