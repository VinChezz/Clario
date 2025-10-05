"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FILE } from "@/shared/types/file.interface";
import type EditorJS from "@editorjs/editorjs";
import { toast } from "sonner";

interface EditorProps {
  fileId: string;
  fileData: FILE | null;
  onSaveTrigger: number;
  onSaveSuccess?: () => void;
  isPublicAccess?: boolean;
  permissions?: "VIEW" | "EDIT";
}

export default function ShareEditor({
  fileId,
  fileData,
  onSaveTrigger,
  onSaveSuccess,
  isPublicAccess = false,
  permissions = "EDIT",
}: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);
  const [editorData, setEditorData] = useState<any>(null);

  const saveDocument = useCallback(async () => {
    if (!editorRef.current || isSaving.current) {
      console.log("❌ Editor not ready or already saving");
      return;
    }

    isSaving.current = true;
    
    try {
      const outputData = await editorRef.current.save();
      console.log("💾 Saving document...");

      if (!outputData.blocks || outputData.blocks.length === 0) {
        console.log("⚠️ No content to save");
        toast.info("No content to save");
        return;
      }

      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: JSON.stringify(outputData),
        }),
      });

      if (!res.ok) {
        throw new Error(`Save failed: ${res.status}`);
      }

      const updatedFile = await res.json();
      console.log("✅ Save successful!");

      toast.success("Document saved successfully!");

      if (onSaveSuccess) {
        onSaveSuccess();
      }

    } catch (err) {
      console.error("💥 Save error:", err);
      toast.error(
        err instanceof Error ? err.message : "Error saving document!"
      );
    } finally {
      isSaving.current = false;
    }
  }, [fileId, onSaveSuccess]);

  useEffect(() => {
    if (!isInitialized.current) {
      console.log("⏳ Editor not initialized yet");
      return;
    }

    saveDocument();
  }, [onSaveTrigger, saveDocument]);

  useEffect(() => {
    if (!fileData) {
      setEditorData(rawDocument);
      return;
    }

    let initialData = rawDocument;

    if (fileData.document && fileData.document !== '""') {
      try {
        const parsedData = JSON.parse(fileData.document);
        if (parsedData?.blocks?.length > 0) {
          initialData = parsedData;
          console.log("✅ Loaded saved document");
        }
      } catch (parseError) {
        console.error("❌ Error parsing document:", parseError);
      }
    }

    setEditorData(initialData);
  }, [fileData]);

  useEffect(() => {
    if (!editorData) return;

    let isMounted = true;
    let editorInstance: EditorJS | null = null;

    const initEditor = async () => {
      try {
        const [
          { default: EditorJS },
          { default: Header },
          { default: List },
          { default: Checklist },
          { default: Paragraph },
          { default: Warning },
        ] = await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
          import("@editorjs/checklist"),
          import("@editorjs/paragraph"),
          import("@editorjs/warning"),
        ]);

        if (editorRef.current) {
          editorRef.current.destroy();
          editorRef.current = null;
        }

        const editor = new EditorJS({
          holder: "editorjs",
          tools: {
            header: { 
              class: Header, 
              shortcut: "CMD+SHIFT+H",
              config: {
                placeholder: "Enter a header",
                levels: [1, 2, 3, 4],
                defaultLevel: 2,
              }
            },
            list: { 
              class: List, 
              inlineToolbar: true,
              shortcut: "CMD+SHIFT+L" 
            },
            checklist: { 
              class: Checklist, 
              inlineToolbar: true,
              shortcut: "CMD+SHIFT+C" 
            },
            paragraph: { 
              class: Paragraph, 
              inlineToolbar: true 
            },
            warning: { 
              class: Warning, 
              inlineToolbar: true,
              shortcut: "CMD+SHIFT+W" 
            },
          },
          data: editorData,
          readOnly: permissions === "VIEW",
          autofocus: false,
          placeholder: permissions === "VIEW" 
            ? "Read-only mode" 
            : "Start writing your notes...",
          onReady: () => {
            console.log("🎉 Editor.js is ready!");
          },
        });

        await editor.isReady;

        if (isMounted) {
          editorInstance = editor;
          editorRef.current = editor;
          isInitialized.current = true;
          console.log("✅ Editor initialized successfully!");
        }
      } catch (err) {
        console.error("💥 Editor initialization failed:", err);
        toast.error("Failed to initialize editor");
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      if (editorInstance) {
        editorInstance.destroy();
      }
    };
  }, [editorData, permissions]);

  return (
    <div className="h-full">
      <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
        <div className="flex gap-2">
            {permissions !== "VIEW" && (
                <button
                    onClick={saveDocument}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                    disabled={isSaving.current}
                >
                    {isSaving.current ? "Saving..." : "Save"}
                </button>
            )}
          
          {permissions === "VIEW" && (
            <span className="px-3 py-1 bg-yellow-200 rounded text-sm">
              Read-only
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {permissions === "EDIT" ? "Manual save only" : "Viewing only"}
        </div>
      </div>
      
      <div
        id="editorjs"
        className="h-full min-h-[500px] border rounded-lg p-4 bg-white"
      ></div>
    </div>
  );
}

const rawDocument = {
  time: Date.now(),
  blocks: [
    {
      id: "1",
      type: "paragraph",
      data: { text: "Start writing your notes here..." },
    },
  ],
  version: "2.8.1",
};