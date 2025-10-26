"use client";

import React, { useEffect, useState, useCallback } from "react";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import { FILE } from "@/shared/types/file.interface";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import LogoClarioLoader from "@/app/_loaders/ClarioLoader";

const Editor = dynamic(() => import("../_components/Editor"), {
  loading: () => <div>Loading Editor...</div>,
  ssr: false,
});

const Canvas = dynamic(() => import("../_components/Canvas"), {
  loading: () => <div>Loading Canvas...</div>,
  ssr: false,
});

export default function WorkspacePage() {
  const params = useParams();
  const fileId = params.fieldId as string;

  const [fileData, setFileData] = useState<FILE | null>(null);
  const [triggerSave, setTriggerSave] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dividerX, setDividerX] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = (e.clientX / window.innerWidth) * 100;
    if (newX > 20 && newX < 80) setDividerX(newX);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isDragging]);

  const refreshFileData = useCallback(async () => {
    if (!fileId) return;

    try {
      const res = await fetch(`/api/files/${fileId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setFileData(data);
    } catch (err) {
      console.error("Error refreshing file data:", err);
      toast.error("Failed to refresh file data");
    }
  }, [fileId]);

  const handleVersionRestore = useCallback(
    async (content: string, contentType: "document" | "whiteboard") => {
      console.log(`🔄 Version restored in ${contentType}, syncing...`);

      try {
        const updateData =
          contentType === "document"
            ? { document: content }
            : { whiteboard: content };

        const res = await fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) throw new Error("Failed to update file");

        setFileData((prev) =>
          prev
            ? {
                ...prev,
                document: contentType === "document" ? content : prev.document,
                whiteboard:
                  contentType === "whiteboard" ? content : prev.whiteboard,
              }
            : null
        );

        toast.success(
          `Version synchronized in ${
            contentType === "document" ? "Editor" : "Canvas"
          }`
        );

        await refreshFileData();
      } catch (error) {
        console.error("Error syncing version:", error);
        toast.error("Failed to sync version");
      }
    },
    [fileId, refreshFileData]
  );

  const handleSaveSuccess = useCallback(async () => {
    console.log("🔄 Refreshing file data after save...");
    await refreshFileData();
  }, [refreshFileData]);

  useEffect(() => {
    const fetchFileData = async () => {
      if (!fileId) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/files/${fileId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setFileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setFileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileData();
  }, [fileId]);

  if (!fileId || isLoading) return <LogoClarioLoader />;

  if (error)
    return (
      <div className="p-4">
        <h2>Error loading file</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reload
        </button>
      </div>
    );

  if (!fileData)
    return (
      <div className="p-4">
        <h2>File not found</h2>
        <p>File with ID {fileId} was not found.</p>
      </div>
    );

  return (
    <div className="h-screen flex flex-col">
      <WorkspaceHeader
        file={fileData}
        onSave={() => setTriggerSave((prev) => prev + 1)}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${dividerX}%`,
            transition: isDragging ? "none" : "0.1s",
          }}
        >
          <Editor
            key={`editor-${fileData.document}-${fileData.whiteboard}`}
            onSaveTrigger={triggerSave}
            fileId={fileId}
            fileData={fileData}
            onSaveSuccess={handleSaveSuccess}
            onVersionRestore={handleVersionRestore}
          />
        </div>

        <div
          onMouseDown={handleMouseDown}
          className="w-[5px] bg-gray-200 hover:bg-gray-400 cursor-col-resize transition-colors"
        ></div>

        <div
          className="flex-1 h-full border-l"
          style={{
            width: `calc(100% - ${dividerX}% - 5px)`,
            transition: isDragging ? "none" : "0.1s",
          }}
        >
          <Canvas
            key={`canvas-${fileData.whiteboard}-${fileData.document}`}
            onSaveTrigger={triggerSave}
            fileId={fileId}
            fileData={fileData}
            onVersionRestore={handleVersionRestore}
          />
        </div>
      </div>
    </div>
  );
}
