"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FILE } from "@/shared/types/file.interface";
import type EditorJS from "@editorjs/editorjs";
import { toast } from "sonner";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { useComments } from "@/hooks/useComments";
import { usePresence } from "@/hooks/usePresence";
import { useVersionManager } from "@/hooks/useVersionManager";
import { useRealtimeSelection } from "@/hooks/useRealtimeSelection";
import { CommentThread } from "./CommentThread";
import { VersionHistory } from "./VersionHistory";
import { EditorCanvasHeader } from "./header/EditorCanvasHeader";
import { UserSelections } from "./collaboration/UserSelection";
import { useSocket } from "@/hooks/useSocket";
import { useRealtimeTyping } from "@/hooks/useRealtimeTyping";
import { useRealtimeContent } from "@/hooks/useRealtimeContent";
import { throttle } from "lodash";
import { UserCursorEditor } from "./collaboration/UserCursorEditor";
import { useRealtimeCursor } from "@/hooks/useRealTimeCursor";
import { useLightweightPresence } from "@/hooks/useLightweightPresence";

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

export const generateUserColor = (userId: string): string => {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];
  const index =
    userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
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
  const [editorData, setEditorData] = useState<any>(null);
  const { activeTeam } = useActiveTeam();
  const [permissions, setPermissions] = useState<"VIEW" | "EDIT">("VIEW");
  const [selection, setSelection] = useState<any>(null);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const editorRef = useRef<EditorJS | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);
  const isApplyingRemoteContent = useRef(false);
  const lastMousePresenceUpdate = useRef<number>(0);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);
  const { typingCursors, sendTypingUpdate, subscribeToTypingUpdates } =
    useRealtimeTyping(fileId, currentUser);

  const { selections, sendSelectionUpdate, subscribeToSelectionUpdates } =
    useRealtimeSelection(fileId, currentUser);

  const { cursors, sendCursorUpdate, subscribeToCursorUpdates } =
    useRealtimeCursor(fileId, currentUser);

  const {
    remoteContent,
    sendContentUpdate,
    sendContentUpdateImmediate,
    subscribeToContentUpdates,
    subscribeToContentSync,
    resetLastSentContent,
  } = useRealtimeContent(fileId, currentUser);

  const { comments, createComment, fetchComments } = useComments(fileId);
  const { activeUsers, updatePresence, startPresenceUpdates } =
    usePresence(fileId);
  const { updateLightPresence } = useLightweightPresence(fileId, currentUser);
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
    const fetchCurrentUser = async () => {
      try {
        const userRes = await fetch("/api/auth/user");
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const dbUser = await userRes.json();
        setCurrentUser(dbUser);

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
        console.error("Error:", err);
        setPermissions("VIEW");
      }
    };

    fetchCurrentUser();
  }, [activeTeam]);

  useEffect(() => {
    if (!fileData) {
      console.log("📄 No file data, using default");
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
    resetLastSentContent();
  }, [fileData, resetLastSentContent]);

  useEffect(() => {
    if (!currentUser || permissions !== "EDIT") return;

    console.log("🔌 Starting realtime services for Editor...");

    fetchComments();
    const cleanup = startPresenceUpdates();

    const unsubscribeContent = subscribeToContentUpdates((content, user) => {
      console.log("🎯 EDITOR: Processing content update from:", user?.name, {
        blocks: content?.blocks?.length,
      });

      if (editorRef.current && content && isInitialized.current) {
        console.log("🎯 EDITOR: Rendering remote content");
        isApplyingRemoteContent.current = true;

        editorRef.current
          .render(content)
          .then(() => {
            console.log("✅ EDITOR: Successfully rendered remote content");
            setEditorData(content);
          })
          .catch((error) => {
            console.error("❌ EDITOR: Error rendering remote content:", error);
          })
          .finally(() => {
            isApplyingRemoteContent.current = false;
          });
      }
    });

    const unsubscribeSync = subscribeToContentSync((content) => {
      console.log("🔄 EDITOR: Received initial content sync", {
        blocks: content?.blocks?.length,
      });

      if (editorRef.current && content && isInitialized.current) {
        console.log("🔄 EDITOR: Applying sync content");
        isApplyingRemoteContent.current = true;

        editorRef.current
          .render(content)
          .then(() => {
            console.log("✅ EDITOR: Successfully applied sync content");
            setEditorData(content);
          })
          .catch((error) => {
            console.error("❌ EDITOR: Error applying sync content:", error);
          })
          .finally(() => {
            isApplyingRemoteContent.current = false;
          });
      }
    });

    const unsubscribeSelections = subscribeToSelectionUpdates();
    const unsubscribeTyping = subscribeToTypingUpdates();

    return () => {
      console.log("🧹 Cleaning up Editor realtime services");
      cleanup();
      unsubscribeContent();
      unsubscribeSync();
      unsubscribeSelections();
      unsubscribeTyping();
    };
  }, [
    currentUser,
    permissions,
    fileId,
    fetchComments,
    startPresenceUpdates,
    subscribeToContentUpdates,
    subscribeToContentSync,
    subscribeToSelectionUpdates,
    subscribeToTypingUpdates,
  ]);

  const sendContentToOthers = useCallback(async () => {
    if (!editorRef.current || !currentUser || permissions !== "EDIT") {
      console.log("❌ Cannot send: editor not ready or no permissions");
      return;
    }

    if (isApplyingRemoteContent.current) {
      console.log("🔄 Skipping send - applying remote content");
      return;
    }

    try {
      const outputData = await editorRef.current.save();
      console.log("🚀 EDITOR: Sending content to others", {
        blocks: outputData.blocks?.length,
      });

      sendContentUpdateImmediate(outputData);
    } catch (error) {
      console.error("❌ Error sending content update:", error);
    }
  }, [sendContentUpdateImmediate, currentUser, permissions]);

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

  const handleTextSelection = useCallback(() => {
    if (!currentUser) return;

    const selection = window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.toString().trim() === ""
    ) {
      setSelection(null);

      if (permissions === "EDIT") {
        sendSelectionUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          selection: {
            start: 0,
            end: 0,
            text: "",
          },
        });
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (selectedText && editorRef.current) {
      const editorElement = document.getElementById("editorjs");
      if (
        editorElement &&
        editorElement.contains(range.commonAncestorContainer)
      ) {
        const newSelection = {
          start: 0,
          end: selectedText.length,
          text: selectedText,
        };

        setSelection(newSelection);

        if (permissions === "EDIT") {
          console.log("📤 Sending selection:", {
            text: selectedText,
            length: selectedText.length,
          });

          sendSelectionUpdate({
            userId: currentUser.id,
            userColor: generateUserColor(currentUser.id),
            selection: newSelection,
          });
        }
      }
    } else {
      setSelection(null);

      if (permissions === "EDIT") {
        sendSelectionUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          selection: {
            start: 0,
            end: 0,
            text: "",
          },
        });
      }
    }
  }, [currentUser, permissions, sendSelectionUpdate]);

  const handleEditorClick = useCallback(
    (event: React.MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") {
        setSelection(null);

        if (permissions === "EDIT" && currentUser) {
          sendSelectionUpdate({
            userId: currentUser.id,
            userColor: generateUserColor(currentUser.id),
            selection: {
              start: 0,
              end: 0,
              text: "",
            },
          });
        }
      }
    },
    [currentUser, permissions, sendSelectionUpdate]
  );

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
    if (!editorData || !currentUser) return;

    let isMounted = true;
    let editorInstance: EditorJS | null = null;

    const initEditor = async () => {
      try {
        console.log("🚀 Initializing EditorJS...");

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
          },
          onChange: async (api, event) => {
            console.log("⌨️ EDITOR: onChange triggered", event);

            if (
              isMounted &&
              permissions === "EDIT" &&
              !isApplyingRemoteContent.current
            ) {
              try {
                const outputData = await api.saver.save();
                console.log("⌨️ EDITOR: Content changed", {
                  blocks: outputData.blocks?.length,
                });

                await sendContentToOthers();

                updatePresence({
                  status: "EDITING",
                  cursor: { position: 0 },
                }).catch(console.error);
                updateLightPresence("EDITING");

                if (autoVersioning) {
                  const contentString = JSON.stringify(outputData);
                  await checkAndCreateAutoVersion(contentString);
                }
              } catch (error) {
                console.error("❌ Error in editor onChange:", error);
              }
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
  }, [
    editorData,
    currentUser,
    permissions,
    sendContentToOthers,
    updatePresence,
    checkAndCreateAutoVersion,
    autoVersioning,
  ]);

  const handleEditorMouseMove = useCallback(
    throttle((event: React.MouseEvent) => {
      if (!currentUser || permissions !== "EDIT") return;

      const editorElement = document.getElementById("editorjs");
      if (!editorElement) return;

      const rect = editorElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return;
      }

      sendTypingUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: { x, y },
        isTyping: true,
        isActive: true,
      });

      const now = Date.now();
      if (now - lastMousePresenceUpdate.current > 10000) {
        updatePresence({
          status: "VIEWING",
          cursor: { x, y },
        }).catch(console.error);
        updateLightPresence("VIEWING", { x, y });
        lastMousePresenceUpdate.current = now;
      }

      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }

      mouseMoveTimeoutRef.current = setTimeout(() => {
        sendCursorUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          position: { x, y },
          isActive: false,
        });
      }, 1000);
    }, 100),
    [currentUser, permissions, sendCursorUpdate, sendTypingUpdate]
  );

  const handleEditorMouseLeave = useCallback(() => {
    if (currentUser && permissions === "EDIT") {
      sendCursorUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: { x: 0, y: 0 },
        isActive: false,
      });

      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    }
  }, [currentUser, permissions, sendCursorUpdate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!currentUser || permissions !== "EDIT") return;

      const editorElement = document.getElementById("editorjs");
      let position = { x: 0, y: 0 };

      if (editorElement) {
        const rect = editorElement.getBoundingClientRect();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const cursorRect = range.getBoundingClientRect();
          position = {
            x: cursorRect.left - rect.left,
            y: cursorRect.top - rect.top,
          };
        }
      }

      sendTypingUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: position,
        isTyping: true,
      });

      setTimeout(() => {
        sendTypingUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          position: position,
          isTyping: false,
        });
      }, 2000);
    },
    [currentUser, permissions, sendTypingUpdate]
  );

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
          ref={editorContainerRef}
          className={`relative flex-1 min-h-[500px] bg-white ${
            permissions === "VIEW" ? "opacity-50 pointer-events-none" : ""
          }`}
          onMouseMove={handleEditorMouseMove}
          onMouseLeave={handleEditorMouseLeave}
        >
          <div
            id="editorjs"
            className="h-full p-4"
            onMouseUp={handleTextSelection}
            onKeyDown={handleKeyDown}
            onClick={handleEditorClick}
          ></div>

          {editorContainerRef.current && (
            <>
              <UserSelections
                users={selections}
                containerRef={editorContainerRef}
              />

              <UserCursorEditor
                cursors={typingCursors}
                containerRef={editorContainerRef}
              />
            </>
          )}
        </div>

        {selection && selection.text && permissions === "EDIT" && (
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
