"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FILE } from "@/shared/types/file.interface";
import type EditorJS from "@editorjs/editorjs";
import { toast } from "sonner";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useComments } from "@/hooks/useComments";
import { usePresence } from "@/hooks/usePresence";
import { useVersionManager } from "@/hooks/useVersionManager";
import { CommentThread } from "./CommentThread";
import { VersionHistory } from "./VersionHistory";
import { EditorCanvasHeader } from "./header/EditorCanvasHeader";

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
  onVersionRestore?: (content: string, type: "document" | "whiteboard") => void;
}

export default function Editor({
  fileId,
  fileData,
  onSaveTrigger,
  onSaveSuccess,
  onVersionRestore,
}: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);
  const [editorData, setEditorData] = useState<any>(null);
  const { activeTeam } = useActiveTeam();
  const [permissions, setPermissions] = useState<"VIEW" | "EDIT">("VIEW");
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);

  const { comments, createComment, fetchComments } = useComments(fileId);
  const { activeUsers, updatePresence, startPresenceUpdates } =
    usePresence(fileId);

  const versionManager = useVersionManager({
    fileId,
    fileData,
    onVersionRestore,
  });

  const {
    versions,
    showVersionHistory,
    setShowVersionHistory,
    fetchVersions,
    createManualVersion,
    restoreVersion,
    hasSignificantChanges,
    lastContent,
    autoVersioning,
    isLoading: versionsLoading,
  } = versionManager;

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
      } catch (err) {
        console.error("Error determining permissions:", err);
        setPermissions("VIEW");
      }
    };

    determinePermissions();
  }, [activeTeam]);

  useEffect(() => {
    if (fileId && permissions === "EDIT") {
      fetchComments();
      const cleanup = startPresenceUpdates();
      return cleanup;
    }
  }, [fileId, permissions, fetchComments, startPresenceUpdates]);

  const checkAndCreateAutoVersion = useCallback(
    async (content: string) => {
      if (!autoVersioning) return;

      try {
        if (hasSignificantChanges(content, lastContent.current)) {
          console.log("🎯 Significant changes detected, creating auto-version");

          await createManualVersion({
            name: `Auto-save ${new Date().toLocaleString()}`,
            description:
              "Automatically created version after significant changes",
            content: content,
            type: "document",
          });

          lastContent.current = content;
        }
      } catch (error) {
        console.error("❌ Failed to create auto-version:", error);
      }
    },
    [createManualVersion, autoVersioning, hasSignificantChanges]
  );

  const handleManualSave = useCallback(async () => {
    if (!editorRef.current || isSaving.current) {
      console.log("❌ Editor not ready or already saving, skipping save");
      return;
    }

    isSaving.current = true;
    console.log("💾 Starting manual save process...");

    try {
      const outputData = await editorRef.current.save();
      console.log("📦 Data to save:", outputData);

      if (!outputData.blocks || outputData.blocks.length === 0) {
        console.log("⚠️ No content to save");
        toast.info("No content to save");
        return;
      }

      const contentString = JSON.stringify(outputData);

      console.log("🔄 Saving document to API...");
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: contentString,
        }),
      });

      console.log("📨 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Save error response:", errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const updatedFile = await res.json();
      console.log("✅ Document saved successfully! Updated file:", updatedFile);

      try {
        await createManualVersion({
          name: `Manual save ${new Date().toLocaleString()}`,
          description: "Manually created version",
          content: contentString,
          type: "document",
        });
        toast.success("Document saved with new version!");
      } catch (versionError) {
        console.error("⚠️ Version creation failed:", versionError);
        toast.success("Document saved! (Version creation failed)");
      }

      lastContent.current = contentString;

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
  }, [fileId, onSaveSuccess, createManualVersion]);

  const handleContentChange = useCallback(async () => {
    if (!editorRef.current || permissions !== "EDIT") {
      return;
    }

    try {
      const outputData = await editorRef.current.save();
      const contentString = JSON.stringify(outputData);

      updatePresence({
        status: "EDITING",
        cursor: { position: 0 },
      });

      if (autoVersioning) {
        await checkAndCreateAutoVersion(contentString);
      }
    } catch (error) {
      console.error("Error handling content change:", error);
    }
  }, [permissions, autoVersioning, checkAndCreateAutoVersion, updatePresence]);

  useEffect(() => {
    if (showVersionHistory) {
      fetchVersions();
    }
  }, [showVersionHistory, fetchVersions]);

  const handleRestoreVersion = useCallback(
    async (version: any) => {
      try {
        console.log("🔄 Starting version restore in Editor...", {
          versionId: version.id,
          versionNumber: version.version,
        });

        if (version.fileId !== fileId) {
          console.log("❌ Version file mismatch");
          toast.error("Version does not belong to this file");
          return;
        }

        console.log("📞 Calling restore API...");
        await restoreVersion(version.id, "document");

        toast.success(`Version ${version.version} restored successfully!`);
        setShowVersionHistory(false);

        if (onSaveSuccess) {
          console.log("🔄 Triggering parent refresh...");
          onSaveSuccess();
        }
      } catch (error) {
        console.error("💥 Restore failed:", error);

        if (error instanceof Error) {
          if (error.message.includes("404")) {
            toast.error("Version or file not found");
          } else if (
            error.message.includes("401") ||
            error.message.includes("403")
          ) {
            toast.error("Access denied");
          } else if (error.message.includes("400")) {
            toast.error("Invalid version data");
          } else {
            toast.error(`Restore failed: ${error.message}`);
          }
        } else {
          toast.error("Failed to restore version");
        }
      }
    },
    [restoreVersion, onSaveSuccess, fileId]
  );

  useEffect(() => {
    console.log("🎯 Save triggered, initialized:", isInitialized.current);

    if (!isInitialized.current) {
      console.log(
        "⏳ Editor not initialized yet, save will be triggered after init"
      );
      return;
    }

    handleManualSave();
  }, [onSaveTrigger, handleManualSave]);

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

          lastContent.current = fileData.document;
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

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (selectedText && editorRef.current) {
      const editorElement = document.getElementById("editorjs");
      if (
        editorElement &&
        editorElement.contains(range.commonAncestorContainer)
      ) {
        setSelection({
          start: 0,
          end: selectedText.length,
          text: selectedText,
        });
      }
    } else {
      setSelection(null);
    }
  }, []);

  const handleAddComment = useCallback(
    async (commentText: string) => {
      if (!selection || permissions !== "EDIT") return;

      try {
        await createComment({
          content: commentText,
          type: "QUESTION",
          selection: selection,
        });
        setSelection(null);
        toast.success("Comment added");
      } catch (error) {
        console.error("Failed to add comment:", error);
        toast.error("Failed to add comment");
      }
    },
    [selection, permissions, createComment]
  );

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
          autofocus: false,
          placeholder: "Start writing your notes...",
          onReady: () => {
            console.log("🎉 Editor.js is ready!");
            console.log("📊 Current editor data:", editorData);
          },
          onChange: async (api, event) => {
            console.log("📝 Content changed");

            if (isMounted) {
              await handleContentChange();
            }
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
  }, [editorData, handleContentChange]);

  return (
    <div className="h-full flex relative">
      <div className="flex-1 flex flex-col">
        <EditorCanvasHeader
          permissions={permissions}
          fileType="document"
          activeUsers={activeUsers}
          versions={versions}
          versionsLoading={versionsLoading}
          onToggleVersionHistory={() =>
            setShowVersionHistory(!showVersionHistory)
          }
          onToggleCommentSidebar={() =>
            setShowCommentSidebar(!showCommentSidebar)
          }
          showCommentSidebar={showCommentSidebar}
          fetchVersions={fetchVersions}
        />

        <div
          id="editorjs"
          className={`flex-1 min-h-[500px] p-4 bg-white ${
            permissions === "VIEW" ? "opacity-50 pointer-events-none" : ""
          }`}
          onMouseUp={handleTextSelection}
        ></div>

        {selection && permissions === "EDIT" && (
          <div className="absolute bg-white border rounded-lg shadow-lg p-3 z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Add comment to:</span>
              <span className="text-sm font-medium bg-yellow-100 px-2 py-1 rounded">
                "{selection.text}"
              </span>
            </div>
            <button
              onClick={() => handleAddComment("Comment on selected text")}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600"
            >
              Add Comment
            </button>
          </div>
        )}
      </div>

      {/* Сайдбар коментарів */}
      {showCommentSidebar && (
        <div className="w-80 border-l bg-gray-50">
          <CommentThread
            comments={comments}
            onAddComment={handleAddComment}
            onReplyComment={() => {}}
            onResolveComment={() => {}}
            fileId={fileId}
            permissions={permissions}
          />
        </div>
      )}

      {showVersionHistory && (
        <div className="w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <VersionHistory
              versions={versions}
              onRestoreVersion={handleRestoreVersion}
              onClose={() => setShowVersionHistory(false)}
              isLoading={versionsLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
