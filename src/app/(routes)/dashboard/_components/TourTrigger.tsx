"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useTour } from "../../../_context/TourContext";

interface TourTriggerProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function TourTrigger({
  className,
  variant = "outline",
  size = "sm",
}: TourTriggerProps) {
  const { startTour } = useTour();

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={startTour}
    >
      <Play className="h-4 w-4" />
      Show Tour
    </Button>
  );
}
