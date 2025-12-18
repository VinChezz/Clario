"use client";

import React from "react";
import { createPortal } from "react-dom";
import { ChangesPreview } from "./ChangesPreview";
import { X } from "lucide-react";

interface PortalChangesPreviewProps {
  version: any;
  previousVersion: any;
  onClose: () => void;
  isOpen: boolean;
}

export function PortalChangesPreview({
  version,
  previousVersion,
  onClose,
  isOpen,
}: PortalChangesPreviewProps) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-100 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden border border-gray-200 dark:border-[#2a2a2d]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-[#252528] dark:via-[#2a2a2d] dark:to-[#303035]">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-[#f0f0f0] text-xl">
              Version Comparison
            </h3>
            <p className="text-sm text-gray-600 dark:text-[#a0a0a0] mt-1">
              {version.name || `Version ${version.version}`} •{" "}
              {version.createdAt
                ? new Date(version.createdAt).toLocaleString()
                : "Unknown date"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-[#f0f0f0] p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252528] transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden bg-gray-50/50 dark:bg-[#1f1f21]">
          <ChangesPreview
            version={version}
            previousVersion={previousVersion}
            onClose={onClose}
            isOpen={isOpen}
            showCloseButton={false}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
