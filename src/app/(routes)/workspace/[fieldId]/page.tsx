"use client";

import React, { useEffect, useState } from "react";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import { FILE } from "@/shared/types/file.interface";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import EraserLoader from "@/app/_loaders/ErasorLoader";

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

  if (!fileId || isLoading) return <EraserLoader />;

  if (error)
    return (
      <div className="p-4">
        <h2>Error loading file</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
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
    <div>
      <WorkspaceHeader
        file={fileData}
        onSave={() => setTriggerSave((prev) => prev + 1)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="h-screen">
          <Editor
            key={fileData.document}
            onSaveTrigger={triggerSave}
            fileId={fileId}
            fileData={fileData}
          />
        </div>
        <div className="h-screen border-l">
          <Canvas
            onSaveTrigger={triggerSave}
            fileId={fileId}
            fileData={fileData}
          />
        </div>
      </div>
    </div>
  );
}
