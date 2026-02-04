import { cn } from "@/lib/utils";
import { StorageStatus } from "@/hooks/useStorageStatus";

export const getButtonStyles = (
  status: StorageStatus,
  variant: "default" | "outline" = "default",
  size: "default" | "sm" | "icon" = "default",
) => {
  const baseStyles = cn(
    "px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-300",
    "flex items-center gap-2",
    size === "icon" && "w-10 h-10 justify-center p-0",
    size === "sm" && "px-3 py-1.5 text-sm",
  );

  if (variant === "outline") {
    return cn(
      baseStyles,
      "bg-white dark:bg-[#1a1a1c]",
      "border border-gray-200 dark:border-[#2a2a2d]",
      "hover:bg-gray-50 dark:hover:bg-[#252528]",
      "text-gray-700 dark:text-[#f0f0f0]",
      "hover:text-blue-600 dark:hover:text-blue-400",
      (status === "full" ||
        status === "no-permission" ||
        status === "no-team") &&
        "cursor-not-allowed opacity-70",
    );
  }

  switch (status) {
    case "full":
      return cn(
        baseStyles,
        "bg-gradient-to-r from-gray-400 to-gray-500",
        "dark:from-gray-600 dark:to-gray-700",
        "shadow-gray-400/25",
        "dark:shadow-[0_4px_12px_rgba(156,163,175,0.25)]",
        "text-white flex justify-center text-center",
        "cursor-not-allowed",
        "opacity-90",
      );

    case "warning":
      return cn(
        baseStyles,
        "bg-gradient-to-r from-amber-500 to-orange-500",
        "hover:from-amber-600 hover:to-orange-600",
        "dark:from-amber-600 dark:to-orange-700",
        "dark:hover:from-amber-700 dark:hover:to-orange-800",
        "shadow-lg shadow-amber-500/25",
        "hover:shadow-xl hover:shadow-amber-500/40",
        "dark:shadow-[0_4px_12px_rgba(245,158,11,0.25)]",
        "dark:hover:shadow-[0_8px_24px_rgba(245,158,11,0.35)]",
        "text-white flex justify-center text-center",
      );

    case "no-permission":
    case "no-team":
      return cn(
        baseStyles,
        "bg-gradient-to-r from-gray-400 to-gray-500",
        "dark:from-gray-600 dark:to-gray-700",
        "shadow-gray-400/25",
        "dark:shadow-[0_4px_12px_rgba(156,163,175,0.25)]",
        "text-white flex justify-center text-center",
        "cursor-not-allowed",
        "opacity-90",
      );

    default:
      return cn(
        baseStyles,
        "bg-gradient-to-r from-blue-600 to-indigo-600",
        "hover:from-blue-700 hover:to-indigo-700",
        "dark:from-blue-500 dark:to-indigo-600",
        "dark:hover:from-blue-600 dark:hover:to-indigo-700",
        "shadow-lg shadow-blue-500/25",
        "hover:shadow-xl hover:shadow-blue-500/40",
        "dark:shadow-[0_4px_12px_rgba(59,130,246,0.25)]",
        "dark:hover:shadow-[0_8px_24px_rgba(59,130,246,0.35)]",
        "text-white flex justify-center text-center",
      );
  }
};

export const getButtonText = (
  status: StorageStatus,
  plan: string = "FREE",
  percentage: number = 0,
) => {
  switch (status) {
    case "full":
      return "Storage Full";
    case "warning":
      if (percentage >= 90) {
        return plan === "FREE"
          ? "Almost Full"
          : `${percentage.toFixed(0)}% Full`;
      }
      return plan === "FREE" ? "Low Storage" : "New File";
    case "no-permission":
      return "No Permission";
    case "no-team":
      return "Select Team";
    default:
      return "New File";
  }
};
