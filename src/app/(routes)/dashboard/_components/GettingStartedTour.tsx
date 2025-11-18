"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ChevronLeft } from "lucide-react";
import { useTour } from "../../../_context/TourContext";

import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { TourStep, tourSteps } from "@/types/tour-steps";
import { useFileData } from "../../../_context/FileDataContext";

export default function GettingStartedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Map<string, DOMRect>>(
    new Map()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  const {
    isTourActive,
    setIsTourActive,
    startTour,
    completeTour,
    hasCompletedTour,
  } = useTour();
  const { activeTeam } = useActiveTeam();
  const { hasFiles, isStorageFull, fileCount } = useFileData();

  const filteredSteps = tourSteps.filter(
    (step) => !step.condition || step.condition(hasFiles, isStorageFull)
  );

  useEffect(() => {
    if (!activeTeam?.id || isInitialized) return;

    console.log("🔍 Checking tour conditions:", {
      activeTeamId: activeTeam.id,
      hasCompletedTour: hasCompletedTour(activeTeam.id),
      sessionStorage: sessionStorage.getItem("new-team-created"),
    });

    const isNewTeam = sessionStorage.getItem("new-team-created") === "true";
    const hasSeenTour = hasCompletedTour(activeTeam.id);

    if (isNewTeam && !hasSeenTour) {
      console.log("🎯 Auto-starting tour for new team");
      setTimeout(() => {
        setIsTourActive(true);
        sessionStorage.removeItem("new-team-created");
        setIsInitialized(true);
      }, 2000);
    } else {
      setIsInitialized(true);
    }
  }, [activeTeam?.id, hasCompletedTour, setIsTourActive, isInitialized]);

  useEffect(() => {
    if (!activeTeam?.id) return;

    const isNewTeam = sessionStorage.getItem("new-team-created");
    const hasSeenTour = hasCompletedTour(activeTeam.id);

    if (isNewTeam && !hasSeenTour) {
      setTimeout(() => {
        setIsTourActive(true);
        sessionStorage.removeItem("new-team-created");
      }, 1500);
    }
  }, [activeTeam?.id, hasCompletedTour, setIsTourActive]);

  const updateTargetPositions = useCallback(() => {
    const elements = new Map<string, DOMRect>();

    filteredSteps.forEach((step) => {
      const element = document.getElementById(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        elements.set(
          step.target,
          new DOMRect(
            rect.left + window.scrollX,
            rect.top + window.scrollY,
            rect.width,
            rect.height
          )
        );
      }
    });

    setTargetElements(elements);
  }, [filteredSteps]);

  useEffect(() => {
    if (!isTourActive) {
      setCurrentStep(0);
      return;
    }

    const timeoutId = setTimeout(updateTargetPositions, 100);

    window.addEventListener("resize", updateTargetPositions);
    window.addEventListener("scroll", updateTargetPositions, { passive: true });

    observerRef.current = new ResizeObserver(updateTargetPositions);

    filteredSteps.forEach((step) => {
      const element = document.getElementById(step.target);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    if (observerRef.current && document.body) {
      observerRef.current.observe(document.body);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateTargetPositions);
      window.removeEventListener("scroll", updateTargetPositions);
      observerRef.current?.disconnect();
    };
  }, [isTourActive, updateTargetPositions, filteredSteps]);

  const handleCompleteTour = useCallback(() => {
    if (activeTeam?.id) {
      completeTour(activeTeam.id);
    }
    setCurrentStep(0);
    setIsTourActive(false);
  }, [activeTeam?.id, completeTour, setIsTourActive]);

  const handleSkipTour = useCallback(() => {
    handleCompleteTour();
  }, [handleCompleteTour]);

  const handleNextStep = useCallback(() => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteTour();
    }
  }, [currentStep, handleCompleteTour, filteredSteps.length]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkipTour();
      if (e.key === "ArrowRight") handleNextStep();
      if (e.key === "ArrowLeft") handlePrevStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, handleSkipTour, handleNextStep, handlePrevStep]);

  const currentStepData = filteredSteps[currentStep];
  const targetRect = targetElements.get(currentStepData?.target);

  if (!isTourActive || !currentStepData) return null;

  return (
    <>
      <AnimatePresence>
        {isTourActive && (
          <>
            <motion.div
              key="tour-overlay"
              className="fixed inset-0 z-100 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleSkipTour}
            />

            {targetRect && (
              <motion.div
                key={`highlight-${currentStep}`}
                className="fixed z-101 pointer-events-none"
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                transition={{ duration: 0.4 }}
                style={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
              >
                <div
                  className="absolute inset-0 rounded-lg border-2 border-blue-500"
                  style={{
                    boxShadow: `
                      0 0 0 4px rgba(59, 130, 246, 0.4),
                      0 0 0 8px rgba(59, 130, 246, 0.2),
                      0 0 20px rgba(59, 130, 246, 0.3)
                    `,
                  }}
                />

                <motion.div
                  className="absolute inset-2 rounded-md bg-white/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: `
                      radial-gradient(
                        ellipse at center,
                        rgba(165, 180, 252, 0.3) 0%,
                        rgba(165, 180, 252, 0.15) 50%,
                        rgba(165, 180, 252, 0.05) 100%
                      )
                    `,
                  }}
                />

                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-blue-400"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.1 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                />

                <motion.div
                  className="absolute inset-0 rounded-lg bg-blue-500/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            )}

            {targetRect && (
              <motion.div
                key={`tooltip-${currentStep}`}
                className="fixed z-102 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.3, type: "spring" }}
                style={getTooltipPosition(currentStepData, targetRect)}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`absolute w-3 h-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transform rotate-45 ${getArrowPosition(
                    currentStepData.position
                  )}`}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">
                        {currentStep + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex-1 text-sm">
                      {currentStepData.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSkipTour}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-4 leading-relaxed">
                    {currentStepData.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {filteredSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            index === currentStep
                              ? "bg-blue-500 w-4"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevStep}
                          className="h-8 text-xs"
                        >
                          <ChevronLeft className="h-3 w-3 mr-1" />
                          Back
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-xs"
                        onClick={handleNextStep}
                      >
                        {currentStep === filteredSteps.length - 1
                          ? "Finish"
                          : "Next"}
                        {currentStep < filteredSteps.length - 1 && (
                          <ArrowRight className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function getTooltipPosition(step: TourStep, targetRect: DOMRect) {
  const styles: any = {};
  const offset = 16;
  const tooltipWidth = 320;
  const tooltipHeight = 180;
  const viewportPadding = 16;

  const horizontalCenter = Math.max(
    viewportPadding,
    Math.min(
      window.innerWidth - viewportPadding - tooltipWidth,
      targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    )
  );

  const verticalCenter =
    targetRect.top + targetRect.height / 2 - tooltipHeight / 2;

  switch (step.position) {
    case "top":
      styles.bottom = `${window.innerHeight - targetRect.top + offset}px`;
      styles.left = `${horizontalCenter}px`;
      break;
    case "bottom":
      styles.top = `${targetRect.bottom + offset}px`;
      styles.left = `${horizontalCenter}px`;
      break;
    case "left":
      styles.top = `${Math.max(
        viewportPadding,
        Math.min(
          window.innerHeight - viewportPadding - tooltipHeight,
          verticalCenter
        )
      )}px`;
      styles.right = `${window.innerWidth - targetRect.left + offset}px`;
      break;
    case "right":
      styles.top = `${Math.max(
        viewportPadding,
        Math.min(
          window.innerHeight - viewportPadding - tooltipHeight,
          verticalCenter
        )
      )}px`;
      styles.left = `${targetRect.right + offset}px`;
      break;
  }

  return styles;
}

function getArrowPosition(position: string) {
  switch (position) {
    case "top":
      return "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0";
    case "bottom":
      return "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0";
    case "left":
      return "right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-l-0 border-b-0";
    case "right":
      return "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-r-0 border-t-0";
    default:
      return "";
  }
}
