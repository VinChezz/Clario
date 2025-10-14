"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FILE } from "@/shared/types/file.interface";
import type EditorJS from "@editorjs/editorjs";
import { toast } from "sonner";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";

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

interface EditorProps {
  fileId: string;
  fileData: FILE | null;
  onSaveTrigger: number;
  onSaveSuccess?: () => void;
}

export default function Editor({
  fileId,
  fileData,
  onSaveTrigger,
  onSaveSuccess,
}: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);
  const [editorData, setEditorData] = useState<any>(null);
  const { activeTeam } = useActiveTeam();
  const [permissions, setPermissions] = useState<"VIEW" | "EDIT">("VIEW");

  useEffect(() => {
    const determinePermissions = async () => {
      try {
        const userRes = await fetch("/api/auth/user");
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const dbUser = await userRes.json();

        if (!activeTeam || !dbUser) {
          setPermissions("VIEW");
          return;
        }

        const isCreator = activeTeam.createdById === dbUser.id;

        const isEditor = activeTeam.members?.some(
          (member: any) => member.userId === dbUser.id && member.role === "EDIT"
        );

        setPermissions(isCreator || isEditor ? "EDIT" : "VIEW");

        console.log("🔐 Permissions:", {
          isCreator,
          isEditor,
          permissions: isCreator || isEditor ? "EDIT" : "VIEW",
        });
      } catch (err) {
        console.error("Error determining permissions:", err);
        setPermissions("VIEW");
      }
    };

    determinePermissions();
  }, [activeTeam]);

  const saveDocument = useCallback(async () => {
    if (!editorRef.current || isSaving.current) {
      console.log("❌ Editor not ready or already saving, skipping save");
      return;
    }

    isSaving.current = true;
    console.log("💾 Starting save process...");

    try {
      const outputData = await editorRef.current.save();
      console.log("📦 Data to save:", outputData);

      if (!outputData.blocks || outputData.blocks.length === 0) {
        console.log("⚠️ No content to save");
        toast.info("No content to save");
        return;
      }

      console.log("🔄 Sending to API...");

      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: JSON.stringify(outputData),
        }),
      });

      console.log("📨 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Save error response:", errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const updatedFile = await res.json();
      console.log("✅ Save successful! Updated file:", updatedFile);

      toast.success("Document saved successfully!");

      if (onSaveSuccess) {
        console.log("🔄 Triggering data refresh...");
        onSaveSuccess();
      }
    } catch (err) {
      console.error("💥 Save error:", err);
      toast.error(
        err instanceof Error ? err.message : "Error saving document!"
      );
    } finally {
      isSaving.current = false;
      console.log("🏁 Save process finished");
    }
  }, [fileId, onSaveSuccess]);

  useEffect(() => {
    console.log("🎯 Save triggered, initialized:", isInitialized.current);

    if (!isInitialized.current) {
      console.log(
        "⏳ Editor not initialized yet, save will be triggered after init"
      );
      return;
    }

    saveDocument();
  }, [onSaveTrigger, saveDocument]);

  useEffect(() => {
    if (!fileData) {
      console.log("📄 No file data");
      setEditorData(rawDocument);
      return;
    }

    let initialData = rawDocument;

    if (fileData.document && fileData.document !== '""') {
      try {
        const parsedData = JSON.parse(fileData.document);
        console.log("📖 Parsed document data:", parsedData);

        if (
          parsedData &&
          typeof parsedData === "object" &&
          Array.isArray(parsedData.blocks) &&
          parsedData.blocks.length > 0
        ) {
          initialData = parsedData;
          console.log(
            "✅ Using saved document data with blocks:",
            parsedData.blocks.length
          );
        } else {
          console.warn("⚠️ No blocks in saved data, using default");
          initialData = rawDocument;
        }
      } catch (parseError) {
        console.error("❌ Error parsing document data:", parseError);
        initialData = rawDocument;
      }
    } else {
      console.log("📝 No document data, using default");
      initialData = rawDocument;
    }

    setEditorData(initialData);
  }, [fileData]);

  // --- Инициализация редактора ---
  useEffect(() => {
    if (!editorData) {
      console.log("⏳ Waiting for editor data...");
      return;
    }

    let isMounted = true;
    let editorInstance: EditorJS | null = null;

    const initEditor = async () => {
      try {
        console.log("🚀 Initializing EditorJS with data:", editorData);

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

        // Очищаем предыдущий редактор
        if (editorRef.current) {
          console.log("🧹 Destroying previous editor instance");
          editorRef.current.destroy();
          editorRef.current = null;
        }

        console.log("🎨 Creating EditorJS instance...");
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
              },
            },
            list: {
              class: List,
              inlineToolbar: true,
              shortcut: "CMD+SHIFT+L",
            },
            checklist: {
              class: Checklist,
              inlineToolbar: true,
              shortcut: "CMD+SHIFT+C",
            },
            paragraph: {
              class: Paragraph,
              inlineToolbar: true,
            },
            warning: {
              class: Warning,
              inlineToolbar: true,
              shortcut: "CMD+SHIFT+W",
            },
          },
          data: editorData,
          autofocus: false, // Отключаем автофокус чтобы избежать проблем
          placeholder: "Start writing your notes...",
          onReady: () => {
            console.log("🎉 Editor.js is ready!");
            console.log("📊 Current editor data:", editorData);
          },
          onChange: async (api, event) => {
            console.log("📝 Content changed");
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
      console.log("🧹 Cleaning up editor...");
      isMounted = false;
      if (editorInstance) {
        try {
          editorInstance.destroy();
        } catch (e) {
          console.error("Error destroying editor:", e);
        }
        editorInstance = null;
        editorRef.current = null;
        isInitialized.current = false;
      }
    };
  }, [editorData]);

  return (
    <div className="h-full">
      <div className="p-2 bg-gray-100 border-b">
        <div className="text-sm text-gray-600">
          {permissions === "EDIT"
            ? "Manual save available"
            : "Viewing only - no editing permissions"}
        </div>
      </div>
      <div
        id="editorjs"
        className={`h-full min-h-[500px] border rounded-lg p-4 bg-white ${
          permissions === "VIEW" ? "opacity-50 pointer-events-none" : ""
        }`}
      ></div>
    </div>
  );
}
