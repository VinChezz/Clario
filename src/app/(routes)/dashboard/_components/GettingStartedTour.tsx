"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X,
  ArrowRight,
  FileText,
  Users,
  Plus,
  Search,
  Zap,
  Crown,
  Play,
  Database,
} from "lucide-react";
import { createPortal } from "react-dom";

import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useTour } from "./TourContext";

interface TourStep {
  id: number;
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

export default function GettingStartedTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetElements, setTargetElements] = useState<{
    [key: string]: DOMRect | null;
  }>({});
  const observerRef = useRef<ResizeObserver | null>(null);
  const { setIsTourActive } = useTour();
  const { activeTeam } = useActiveTeam();

  useEffect(() => {
    setIsTourActive(isOpen);

    if (typeof document !== "undefined") {
      if (isOpen) {
        document.documentElement.style.setProperty("--tour-active", "1");
        document.body.classList.add("getting-started-open");
      } else {
        document.documentElement.style.setProperty("--tour-active", "0");
        document.body.classList.remove("getting-started-open");
      }
    }
  }, [isOpen, setIsTourActive]);

  useEffect(() => {
    if (!activeTeam?.id) return;

    const hasSeenTourForTeam = localStorage.getItem(
      `getting-started-tour-completed-${activeTeam.id}`
    );
    const isNewTeam = sessionStorage.getItem("new-team-created");

    if (!hasSeenTourForTeam && isNewTeam) {
      setTimeout(() => {
        setIsOpen(true);
        sessionStorage.removeItem("new-team-created");
      }, 1000);
    }
  }, [activeTeam?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const updateTargetPositions = () => {
      const elements: { [key: string]: DOMRect | null } = {};
      tourSteps.forEach((step) => {
        const element = document.getElementById(step.target);
        elements[step.target] = element
          ? element.getBoundingClientRect()
          : null;
      });
      setTargetElements(elements);
    };

    window.addEventListener("resize", updateTargetPositions);
    updateTargetPositions();

    observerRef.current = new ResizeObserver(updateTargetPositions);
    tourSteps.forEach((step) => {
      const element = document.getElementById(step.target);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      window.removeEventListener("resize", updateTargetPositions);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, currentStep]);

  const tourSteps: TourStep[] = [
    {
      id: 1,
      target: "members-check",
      title: "Team Members Hub",
      description:
        "Manage your team members, assign roles (Admin, Editor, Viewer) and control access permissions.",
      position: "bottom",
    },
    {
      id: 2,
      target: "team-switcher",
      title: "Your Team Workspace",
      description:
        "This is your team dashboard. Switch between teams or manage members here.",
      position: "bottom",
    },
    {
      id: 3,
      target: "create-file-button",
      title: "Create Your First File",
      description:
        "Click here to create new documents, whiteboards, or text files.",
      position: "top",
    },
    {
      id: 4,
      target: "storage-section",
      title: "Storage Usage",
      description:
        "Keep track of your storage usage. Upgrade to Pro for unlimited files and advanced features.",
      position: "top",
    },
    {
      id: 5,
      target: "total-files-card",
      title: "File Management",
      description:
        "Track your total files and documents. Keep an eye on your team's productivity.",
      position: "top",
    },
    {
      id: 6,
      target: "team-members-card",
      title: "Team Size",
      description:
        "See how many members are in your team. Grow your collaboration network.",
      position: "top",
    },
    {
      id: 7,
      target: "storage-card",
      title: "Storage Status",
      description:
        "Monitor your storage usage. Upgrade your plan if you're running low on space.",
      position: "top",
    },
    {
      id: 8,
      target: "file-list-container",
      title: "Your Files & Documents",
      description:
        "All your team's files appear here. Organize them with different views.",
      position: "left",
    },
  ];

  const completeTour = () => {
    setIsCompleted(true);
    setIsOpen(false);

    if (activeTeam?.id) {
      localStorage.setItem(
        `getting-started-tour-completed-${activeTeam.id}`,
        "true"
      );
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = tourSteps[currentStep];
  const targetRect = targetElements[currentStepData.target];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-30 bg-black/40"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 100px, black calc(100% - 100px), transparent 100%)",
              }}
              onClick={skipTour}
            />

            {targetRect && (
              <motion.div
                key={`highlight-${currentStep}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed z-80 border-2 inset-0 bg-linear-to-r from-indigo-300/50 to-indigo-200/25 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-500 rounded-xl shadow-2xl shadow-indigo-400/30 bg-yellow-100/20 pointer-events-none"
                style={{
                  top: targetRect.top - 4,
                  left: targetRect.left - 4,
                  width: targetRect.width + 8,
                  height: targetRect.height + 8,
                }}
              />
            )}

            {targetRect && (
              <motion.div
                key={`tooltip-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed z-50 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm"
                style={getTooltipPosition(currentStepData.position, targetRect)}
              >
                <div
                  className={`absolute w-4 h-4 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45 ${getArrowPosition(
                    currentStepData.position
                  )}`}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {currentStep + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                      {currentStepData.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={skipTour}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                    {currentStepData.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {tourSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentStep
                              ? "bg-blue-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <Button variant="outline" size="sm" onClick={prevStep}>
                          Back
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={nextStep}
                      >
                        {currentStep === tourSteps.length - 1
                          ? "Get Started"
                          : "Next"}
                        <ArrowRight className="h-4 w-4" />
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

function getTooltipPosition(position: string, targetRect: DOMRect) {
  const styles: any = {};
  const offset = 20;
  const viewportPadding = 20;

  switch (position) {
    case "top":
      styles.bottom = `${window.innerHeight - targetRect.top + offset}px`;
      styles.left = `${Math.max(
        viewportPadding,
        Math.min(
          window.innerWidth - viewportPadding - 320,
          targetRect.left + targetRect.width / 2 - 160
        )
      )}px`;
      break;
    case "bottom":
      styles.top = `${targetRect.bottom + offset}px`;
      styles.left = `${Math.max(
        viewportPadding,
        Math.min(
          window.innerWidth - viewportPadding - 320,
          targetRect.left + targetRect.width / 2 - 160
        )
      )}px`;
      break;
    case "left":
      styles.top = `${targetRect.top + targetRect.height / 2}px`;
      styles.right = `${window.innerWidth - targetRect.left + offset}px`;
      styles.transform = "translateY(-50%)";
      break;
    case "right":
      styles.top = `${targetRect.top + targetRect.height / 2}px`;
      styles.left = `${targetRect.right + offset}px`;
      styles.transform = "translateY(-50%)";
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
