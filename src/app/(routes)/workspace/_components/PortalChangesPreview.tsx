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
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div>
            <h3 className="font-bold text-gray-900 text-xl">
              Version Comparison
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {version.name || `Version ${version.version}`} •{" "}
              {version.createdAt
                ? new Date(version.createdAt).toLocaleString()
                : "Unknown date"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/80 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-hidden">
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
