"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ActiveComponent, WindowMode } from "@/types/window.interface";

const SplitViewIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FullscreenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22 9H2M2 7.8L2 16.2C2 17.8802 2 18.7202 2.32698 19.362C2.6146 19.9265 3.07354 20.3854 3.63803 20.673C4.27976 21 5.11984 21 6.8 21H17.2C18.8802 21 19.7202 21 20.362 20.673C20.9265 20.3854 21.3854 19.9265 21.673 19.362C22 18.7202 22 17.8802 22 16.2V7.8C22 6.11984 22 5.27977 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3L6.8 3C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function WindowControlsPopover({
  windowMode,
  activeComponent,
  onWindowModeChange,
  onActiveComponentChange,
  currentComponent,
}: {
  windowMode: WindowMode;
  activeComponent: ActiveComponent;
  onWindowModeChange?: (mode: WindowMode) => void;
  onActiveComponentChange?: (component: ActiveComponent) => void;
  currentComponent: "editor" | "canvas";
}) {
  const [open, setOpen] = useState(false);

  const handleToggleFullscreen = () => {
    if (windowMode === "split") {
      onWindowModeChange?.("fullscreen");
      onActiveComponentChange?.(currentComponent);
    } else {
      onWindowModeChange?.("split");
    }
    setOpen(false);
  };

  const handleSwitchComponent = () => {
    const newComponent = activeComponent === "editor" ? "canvas" : "editor";
    onActiveComponentChange?.(newComponent);
    setOpen(false);
  };

  const hasWindowControls = onWindowModeChange && onActiveComponentChange;

  if (!hasWindowControls) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
        >
          {windowMode === "split" ? <SplitViewIcon /> : <FullscreenIcon />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <button
            onClick={handleToggleFullscreen}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              windowMode === "split"
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <div
              className={`p-1 rounded ${
                windowMode === "split" ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <SplitViewIcon />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">Split View</span>
              <span className="text-xs text-gray-500">Both panels visible</span>
            </div>
          </button>

          <div className="space-y-1">
            <button
              onClick={() => {
                onWindowModeChange?.("fullscreen");
                onActiveComponentChange?.("editor");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                windowMode === "fullscreen" && activeComponent === "editor"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div
                className={`p-1 rounded ${
                  windowMode === "fullscreen" && activeComponent === "editor"
                    ? "bg-blue-100"
                    : "bg-gray-100"
                }`}
              >
                <FullscreenIcon />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">Fullscreen Editor</span>
                <span className="text-xs text-gray-500">Text editor only</span>
              </div>
            </button>

            <button
              onClick={() => {
                onWindowModeChange?.("fullscreen");
                onActiveComponentChange?.("canvas");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                windowMode === "fullscreen" && activeComponent === "canvas"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div
                className={`p-1 rounded ${
                  windowMode === "fullscreen" && activeComponent === "canvas"
                    ? "bg-blue-100"
                    : "bg-gray-100"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.5 17H6.5M17.5 13H6.5M3 9H21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">Fullscreen Canvas</span>
                <span className="text-xs text-gray-500">Whiteboard only</span>
              </div>
            </button>
          </div>

          {windowMode === "fullscreen" && (
            <button
              onClick={handleSwitchComponent}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <div className="p-1 rounded bg-gray-100">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 7L20 7M20 7L16 3M20 7L16 11M16 17L4 17M4 17L8 21M4 17L8 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  Switch to {activeComponent === "editor" ? "Canvas" : "Editor"}
                </span>
                <span className="text-xs text-gray-500">
                  Change active panel
                </span>
              </div>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
