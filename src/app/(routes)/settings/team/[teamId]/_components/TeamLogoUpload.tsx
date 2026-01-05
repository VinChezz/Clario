import { useState } from "react";
import { Upload, Camera, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamLogoUploadProps {
  teamId: string;
  currentLogo?: string;
  teamName?: string;
  onLogoUpdate: (logoUrl: string) => void;
  className?: string;
}

export function TeamLogoUpload({
  teamId,
  currentLogo,
  teamName,
  onLogoUpdate,
  className,
}: TeamLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload JPG, PNG, WebP, or GIF image");
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
      formData.append("teamId", teamId);

      const response = await fetch("/api/teams/upload-logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      toast.success("Logo updated successfully");
      onLogoUpdate(result.logoUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Are you sure you want to remove the team logo?")) {
      return;
    }

    setIsRemoving(true);

    try {
      const response = await fetch("/api/teams/remove-logo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove logo");
      }

      onLogoUpdate("");
      toast.success("Logo removed successfully");
    } catch (error) {
      console.error("Logo removal error:", error);
      toast.error("Failed to remove logo");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }

    if (event.target) {
      event.target.value = "";
    }
  };

  const initials = teamName
    ? teamName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TM";

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <div className="relative h-40 w-40 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt={teamName || "Team logo"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}

            {!currentLogo && (
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
                disabled={isUploading || isRemoving}
              />
            </label>

            {(isUploading || isRemoving) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="h-10 w-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-1">
          {teamName && (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {teamName}
            </h3>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentLogo ? "Custom team logo" : "No logo uploaded"}
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
            disabled={isUploading || isRemoving}
          />
          <div
            className={cn(
              "flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-all duration-200",
              "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
              "group cursor-pointer",
              (isUploading || isRemoving) && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
              {isUploading ? (
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {isUploading ? "Uploading..." : "Upload new logo"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                JPG, PNG, WebP or GIF, max 5MB
              </p>
            </div>
          </div>
        </label>

        {currentLogo && (
          <Button
            variant="destructive"
            onClick={handleRemoveLogo}
            disabled={isUploading || isRemoving}
            className="flex items-center justify-center gap-3 px-4 py-8 rounded-xl transition-all duration-200"
          >
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              {isRemoving ? (
                <Loader2 className="h-5 w-5 text-red-600 dark:text-red-400 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-white">
                {isRemoving ? "Removing..." : "Remove logo"}
              </p>
              <p className="text-sm text-white/80">
                Delete the current team logo
              </p>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
