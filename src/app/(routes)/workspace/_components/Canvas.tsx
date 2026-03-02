"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { FILE } from "@/shared/types/file.interface";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { usePresence } from "@/hooks/usePresence";
import { useVersionManager } from "@/hooks/useVersionManager";
import { useComments } from "@/hooks/useComments";
import { VersionHistory } from "./VersionHistory";
import { toast } from "sonner";
import { EditorCanvasHeader } from "./header/EditorCanvasHeader";
import { throttle } from "lodash";
import { useRealtimeCanvasCursor } from "@/hooks/useRealtimeCanvasCursor";
import { useRealtimeCanvasContent } from "@/hooks/useRealtimeCanvasContent";
import { useSocket } from "@/hooks/useSocket";
import { CanvasCursorOverlay } from "./collaboration/UserCursorCanvas";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useLightweightPresence } from "@/hooks/useLightweightPresence";
import { ActiveComponent, WindowMode } from "@/types/window.interface";
import { CommentThread } from "./CommentThread";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/app/_context/AppearanceContext";
import { useFilePermissions } from "@/hooks/useFilePermissions";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#1a1a1c]">
        <div className="text-gray-500 dark:text-gray-400">
          Loading whiteboard...
        </div>
      </div>
    ),
  },
);

interface CanvasProps {
  fileId: string;
  fileData: FILE | null;
  onSaveSuccess?: () => void;
  onVersionRestore?: (content: string, type: "document" | "whiteboard") => void;
  windowMode: WindowMode;
  activeComponent: ActiveComponent;
  onWindowModeChange: (mode: WindowMode) => void;
  onActiveComponentChange: (component: ActiveComponent) => void;
  currentComponent: "editor" | "canvas" | "both";
  isFullscreen?: boolean;
  onSaveHandlerChange?: (handler: () => Promise<void>) => void;
  versions?: any[];
  versionsLoading?: boolean;
  onRefreshVersions?: () => Promise<void>;
}

export default function Canvas({
  fileId,
  fileData,
  onSaveSuccess,
  onVersionRestore,
  activeComponent,
  currentComponent,
  onActiveComponentChange,
  onWindowModeChange,
  windowMode,
  isFullscreen,
  onSaveHandlerChange,
  versions = [],
  versionsLoading = false,
  onRefreshVersions,
}: CanvasProps) {
  const [whiteBoardData, setWhiteBoardData] = useState<any>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTool, setCurrentTool] = useState<
    "selection" | "rectangle" | "ellipse" | "arrow" | "line" | "text" | "hand"
  >("selection");
  const [isInitialized, setIsInitialized] = useState(false);
  const [selection, setSelection] = useState<any>(null);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const lastSavedContent = useRef<string>("");
  const excalidrawRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout>(null);
  const lastMousePresenceUpdate = useRef<number>(0);
  const hasAppliedInitialData = useRef(false);
  const lastSentContent = useRef<string>("");
  const isApplyingRemoteUpdate = useRef(false);
  const isMobile = useIsMobile();

  const { isDark } = useTheme();
  const theme = isDark ? "dark" : "light";

  const { activeTeam } = useActiveTeam();

  const { emitEvent, subscribe, isConnected } = useSocket(fileId, currentUser);

  const {
    activeUsers: httpActiveUsers,
    updatePresence,
    startPresenceUpdates,
  } = usePresence(fileId);
  const { activeUsers: wsActiveUsers, updateRealtimePresence } =
    useRealtimePresence(fileId, currentUser);
  const { updateLightPresence } = useLightweightPresence(fileId, currentUser);

  const allActiveUsers = [...httpActiveUsers, ...wsActiveUsers].reduce(
    (acc, user) => {
      const existingIndex = acc.findIndex(
        (u: any) => u.user?.id === user.user?.id,
      );
      if (existingIndex === -1) {
        acc.push(user);
      } else {
        const existingUser = acc[existingIndex];
        const existingTime = new Date(existingUser.lastActive).getTime();
        const newTime = new Date(user.lastActive).getTime();

        if (newTime > existingTime) {
          acc[existingIndex] = user;
        }
      }
      return acc;
    },
    [] as any[],
  );

  const { cursors, sendCursorUpdate, subscribeToCursorUpdates } =
    useRealtimeCanvasCursor(fileId, currentUser);
  const {
    remoteContent,
    sendContentUpdate,
    subscribeToContentUpdates,
    subscribeToContentSync,
  } = useRealtimeCanvasContent(fileId, currentUser);

  const { createManualVersion, restoreVersion } = useVersionManager({
    fileId,
    fileData,
    onVersionRestore,
  });

  const {
    comments,
    isLoading,
    createComment,
    createReply,
    updateComment,
    deleteComment,
    deleteReply,
    fetchComments,
  } = useComments(fileId, currentUser);

  const {
    permissions,
    canEdit,
    isLoading: permissionsLoading,
  } = useFilePermissions();

  useEffect(() => {
    if (excalidrawRef.current && isInitialized) {
      excalidrawRef.current.updateScene({
        appState: { theme: isDark ? "dark" : "light" },
      });
    }
  }, [isDark, isInitialized]);

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser) {
        try {
          const userRes = await fetch("/api/auth/user");
          if (!userRes.ok) throw new Error("Failed to fetch user");
          const dbUser = await userRes.json();
          setCurrentUser(dbUser);
        } catch (err) {
          console.error("Error fetching user:", err);
        }
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (fileData?.whiteboard) {
      try {
        const data = JSON.parse(fileData.whiteboard);

        setWhiteBoardData(data);
        lastSavedContent.current = fileData.whiteboard;

        if (excalidrawRef.current && isInitialized) {
          excalidrawRef.current.updateScene({
            elements: data,
            commitToHistory: false,
          });
          hasAppliedInitialData.current = true;
        } else if (!hasAppliedInitialData.current) {
          hasAppliedInitialData.current = false;
        }

        setTimeout(() => {
          if (excalidrawRef.current && isInitialized) {
            const currentElements = excalidrawRef.current.getSceneElements();
            const currentContent = JSON.stringify(currentElements);

            if (currentContent !== fileData.whiteboard) {
              setHasUnsavedChanges(true);
            } else {
              setHasUnsavedChanges(false);
            }
          }
        }, 500);
      } catch (e) {
        console.error("Failed to parse whiteboard data:", e);
      }
    } else if (fileData && !fileData.whiteboard) {
      setWhiteBoardData([]);
      lastSavedContent.current = "[]";
      hasAppliedInitialData.current = false;
    }
  }, [fileData, isInitialized]);

  useEffect(() => {
    if (!currentUser) return;

    fetchComments();

    if (!canEdit) return;

    const unsubscribeContent = subscribeToContentUpdates((content, user) => {
      if (excalidrawRef.current && content) {
        const contentString = JSON.stringify(content);
        if (contentString === lastSentContent.current) {
          return;
        }

        isApplyingRemoteUpdate.current = true;

        excalidrawRef.current.updateScene({
          elements: content,
          commitToHistory: false,
        });

        setWhiteBoardData(content);
        lastSentContent.current = contentString;

        setTimeout(() => {
          if (excalidrawRef.current) {
            excalidrawRef.current.refresh();
          }
          isApplyingRemoteUpdate.current = false;
        }, 0);
      }
    });

    const unsubscribeSync = subscribeToContentSync((content) => {
      if (excalidrawRef.current && content && content.length > 0) {
        isApplyingRemoteUpdate.current = true;

        excalidrawRef.current.updateScene({
          elements: content,
          commitToHistory: false,
        });

        setWhiteBoardData(content);
        hasAppliedInitialData.current = true;
        lastSentContent.current = JSON.stringify(content);

        setTimeout(() => {
          if (excalidrawRef.current) {
            excalidrawRef.current.refresh();
          }
          isApplyingRemoteUpdate.current = false;
        }, 0);
      }
    });

    const unsubscribeCursors = subscribeToCursorUpdates();

    return () => {
      unsubscribeContent();
      unsubscribeSync();
      unsubscribeCursors();
    };
  }, [
    currentUser,
    canEdit,
    permissions,
    subscribeToContentUpdates,
    subscribeToContentSync,
    subscribeToCursorUpdates,
    fetchComments,
  ]);

  const generateUserColor = (userId: string): string => {
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

  const sendContentUpdateThrottled = useCallback(
    throttle((elements: any) => {
      if (
        isConnected &&
        currentUser &&
        canEdit &&
        !isApplyingRemoteUpdate.current
      ) {
        const contentString = JSON.stringify(elements);
        if (contentString === lastSentContent.current) {
          return;
        }

        lastSentContent.current = contentString;
        sendContentUpdate(elements);
      }
    }, 50),
    [isConnected, currentUser, canEdit, sendContentUpdate],
  );

  const handleSignificantChange = useCallback(
    throttle((elements: any) => {
      if (!canEdit || !hasUnsavedChanges) return;

      const contentString = JSON.stringify(elements);
      const savedContent = fileData?.whiteboard || "[]";

      const normalizeContent = (content: string) => {
        if (!content || content === '""' || content === "[]") return "[]";
        try {
          return JSON.stringify(JSON.parse(content));
        } catch {
          return "[]";
        }
      };

      const normalizedCurrent = normalizeContent(savedContent);
      const normalizedNew = normalizeContent(contentString);

      if (normalizedNew !== normalizedCurrent) {
        fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whiteboard: contentString,
          }),
        })
          .then((res) => {
            if (res.ok) {
              lastSavedContent.current = contentString;
              setHasUnsavedChanges(false);
            }
          })
          .catch((error) => {
            console.error("❌ Auto-save failed:", error);
          });
      }
    }, 5000),
    [fileId, canEdit, hasUnsavedChanges, fileData],
  );

  const sendImmediateUpdate = useCallback(
    (elements: any) => {
      if (isConnected && currentUser && canEdit) {
        const contentString = JSON.stringify(elements);
        if (contentString === lastSentContent.current) {
          return;
        }

        lastSentContent.current = contentString;
        sendContentUpdate(elements);

        handleSignificantChange(elements);
      }
    },
    [
      isConnected,
      currentUser,
      canEdit,
      sendContentUpdate,
      handleSignificantChange,
    ],
  );

  const handleCanvasSave = useCallback(async () => {
    if (!canEdit) {
      if (windowMode === "split") {
        toast.error("No permission to save");
      }
      return;
    }

    try {
      const elements = excalidrawRef.current?.getSceneElements() || [];
      const contentString = JSON.stringify(elements);

      const currentContent = fileData?.whiteboard;

      const normalizeContent = (content: string | null | undefined) => {
        if (!content || content === '""' || content === "[]") return "[]";
        try {
          return JSON.stringify(JSON.parse(content));
        } catch {
          return "[]";
        }
      };

      const normalizedCurrent = normalizeContent(currentContent);
      const normalizedNew = normalizeContent(contentString);

      if (normalizedNew === normalizedCurrent) {
        return;
      }

      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteboard: contentString,
        }),
      });

      if (!res.ok) throw new Error("Failed to save whiteboard");

      lastSavedContent.current = contentString;
      setHasUnsavedChanges(false);

      const hasRealChanges = normalizedNew !== normalizedCurrent;

      if (hasRealChanges && elements.length > 0) {
        try {
          await createManualVersion({
            name: `Whiteboard - ${new Date().toLocaleString()}`,
            description: "Manually saved version",
            content: contentString,
            type: "whiteboard",
          });
        } catch (versionError) {
          console.error("⚠️ Version creation failed:", versionError);
        }
      } else if (hasRealChanges && elements.length === 0) {
        try {
          await createManualVersion({
            name: `Whiteboard cleared - ${new Date().toLocaleString()}`,
            description: "Whiteboard cleared",
            content: contentString,
            type: "whiteboard",
          });
        } catch (versionError) {
          console.error("⚠️ Version creation failed:", versionError);
        }
      } else {
        return;
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error("❌ Error saving whiteboard:", error);
      if (windowMode === "split") {
        toast.error("Failed to save whiteboard");
      }
    }
  }, [
    fileId,
    canEdit,
    createManualVersion,
    fileData,
    onSaveSuccess,
    windowMode,
  ]);

  const handlePointerUp = useCallback(() => {
    setTimeout(() => {
      if (excalidrawRef.current) {
        const elements = excalidrawRef.current.getSceneElements();
        sendImmediateUpdate(elements);

        const contentString = JSON.stringify(elements);
        const savedContent = fileData?.whiteboard || "[]";

        if (contentString !== savedContent) {
          setHasUnsavedChanges(true);
        }
      }
    }, 100);
  }, [sendImmediateUpdate, fileData]);

  useEffect(() => {
    if (fileData?.whiteboard) {
      lastSavedContent.current = fileData.whiteboard;
    }
  }, [fileData?.whiteboard]);

  useEffect(() => {
    if (onSaveHandlerChange) {
      onSaveHandlerChange(handleCanvasSave);
    }
  }, [handleCanvasSave, onSaveHandlerChange]);

  useEffect(() => {
    if (showVersionHistory) {
      return;
    }
  }, [showVersionHistory]);

  const handleRestoreVersion = useCallback(
    async (version: any) => {
      try {
        await restoreVersion(version.id, "whiteboard");

        setShowVersionHistory(false);
      } catch (error) {
        console.error("❌ CANVAS: Failed to restore version:", error);

        if (error instanceof Error) {
          if (error.message.includes("Type mismatch")) {
            toast.error(
              "This version can only be restored in the Document panel",
            );
          } else {
            toast.error(`Restore failed: ${error.message}`);
          }
        } else {
          toast.error("Failed to restore version");
        }
      }
    },
    [restoreVersion],
  );

  const onChange = useCallback(
    (elements: any, appState: any) => {
      if (canEdit) {
        setWhiteBoardData(elements);
        updateLightPresence("EDITING");
        sendContentUpdateThrottled(elements);

        const currentContent = JSON.stringify(elements);
        const savedContent = fileData?.whiteboard || "[]";

        if (
          currentContent !== savedContent &&
          currentContent !== lastSavedContent.current
        ) {
          setHasUnsavedChanges(true);
        }
      }
    },
    [canEdit, sendContentUpdateThrottled, updateLightPresence, fileData],
  );

  const handleExcalidrawReady = useCallback(
    (api: any) => {
      excalidrawRef.current = api;
      setIsInitialized(true);

      if (whiteBoardData && whiteBoardData.length > 0) {
        api.updateScene({
          elements: whiteBoardData,
          commitToHistory: false,
        });
        hasAppliedInitialData.current = true;
        lastSentContent.current = JSON.stringify(whiteBoardData);
      } else if (fileData?.whiteboard && !hasAppliedInitialData.current) {
        try {
          const data = JSON.parse(fileData.whiteboard);

          api.updateScene({
            elements: data,
            commitToHistory: false,
          });
          setWhiteBoardData(data);
          hasAppliedInitialData.current = true;
          lastSentContent.current = fileData.whiteboard;
        } catch (e) {
          console.error("Failed to parse whiteboard data on ready:", e);
        }
      }
    },
    [whiteBoardData, fileData],
  );

  const handleCanvasMouseMove = useCallback(
    throttle((event: React.MouseEvent) => {
      if (!currentUser || !canEdit || !canvasContainerRef.current) return;

      const container = canvasContainerRef.current;
      const rect = container.getBoundingClientRect();

      const x = event.clientX - rect.left + container.scrollLeft;
      const y = event.clientY - rect.top + container.scrollTop;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        sendCursorUpdate({
          userId: currentUser.id,
          userColor: generateUserColor(currentUser.id),
          position: { x: 0, y: 0 },
          tool: currentTool,
          isActive: false,
        });
        return;
      }

      sendCursorUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: { x, y },
        tool: currentTool,
        isActive: true,
      });
    }, 20),
    [currentUser, canEdit, sendCursorUpdate, currentTool],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    if (currentUser && canEdit) {
      sendCursorUpdate({
        userId: currentUser.id,
        userColor: generateUserColor(currentUser.id),
        position: { x: 0, y: 0 },
        tool: currentTool,
        isActive: false,
      });

      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    }
  }, [currentUser, canEdit, sendCursorUpdate, currentTool]);

  const handleAddComment = useCallback(
    (content: string, type = "QUESTION") => {
      if (!canEdit) {
        toast.error("No permission to add comments");
        return;
      }

      createComment({
        content,
        type: type,
        selection: selection,
      }).then(() => {
        setSelection(null);
      });
    },
    [createComment, selection, canEdit],
  );

  const handleReplyComment = useCallback(
    (commentId: string, content: string) => {
      if (!canEdit) {
        toast.error("No permission to reply to comments");
        return;
      }

      createReply(commentId, content);
    },
    [createReply, canEdit],
  );

  const handleUpdateComment = useCallback(
    (commentId: string, content: string) => {
      if (!canEdit) {
        toast.error("No permission to update comments");
        return;
      }

      updateComment(commentId, { content })
        .then((updatedComment) => {
          updatedComment;
        })
        .catch((error) => {
          console.error("❌ Failed to update comment:", error);
        });
    },
    [updateComment, canEdit],
  );

  const handleResolveComment = useCallback(
    (commentId: string) => {
      if (!canEdit) {
        toast.error("No permission to resolve comments");
        return;
      }

      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        const newStatus = comment.status === "OPEN" ? "RESOLVED" : "OPEN";
        updateComment(commentId, { status: newStatus })
          .then((updatedComment) => {
            updatedComment;
          })
          .catch((error) => {
            console.error("❌ Failed to update comment:", error);
          });
      } else {
        console.error("❌ Comment not found:", commentId);
      }
    },
    [comments, updateComment, canEdit],
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!canEdit) {
        toast.error("No permission to delete comments");
        return;
      }

      deleteComment(commentId);
    },
    [deleteComment, canEdit],
  );

  const handleDeleteReply = useCallback(
    (commentId: string, replyId: string) => {
      if (!canEdit) {
        toast.error("No permission to delete replies");
        return;
      }

      deleteReply(commentId, replyId);
    },
    [deleteReply, canEdit],
  );

  const handleToggleComments = useCallback(() => {
    if (!canEdit) {
      toast.error("No permission to view comments");
      return;
    }

    setShowCommentSidebar(!showCommentSidebar);
    if (!showCommentSidebar) {
      setShowVersionHistory(false);
    }
  }, [showCommentSidebar, canEdit]);

  const handleToggleVersionHistory = useCallback(() => {
    setShowVersionHistory(!showVersionHistory);
    if (!showVersionHistory) {
      setShowCommentSidebar(false);
    }
  }, [showVersionHistory]);

  useEffect(() => {
    if (!excalidrawRef.current) return;

    const checkForChanges = () => {
      setTimeout(() => {
        if (excalidrawRef.current) {
          const elements = excalidrawRef.current.getSceneElements();
          const contentString = JSON.stringify(elements);
          const savedContent = fileData?.whiteboard || "[]";

          if (contentString !== savedContent) {
            setHasUnsavedChanges(true);
            sendImmediateUpdate(elements);
          }
        }
      }, 200);
    };

    const interval = setInterval(checkForChanges, 1000);

    return () => clearInterval(interval);
  }, [fileData, sendImmediateUpdate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && canEdit) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes in the whiteboard. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, canEdit]);

  const showCommentsButton =
    windowMode === "fullscreen" && currentComponent === "canvas" && canEdit;

  return (
    <div className="flex h-full w-full bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden">
      <div
        className={`flex-1 relative transition-all duration-200 ${
          showVersionHistory || showCommentSidebar
            ? "border-r border-gray-200 dark:border-[#2a2a2d]"
            : ""
        } ${isFullscreen ? "bg-white dark:bg-[#1a1a1c]" : ""}`}
      >
        {fileData && (
          <div className="w-full h-full flex flex-col">
            <EditorCanvasHeader
              permissions={permissions}
              fileType="whiteboard"
              activeUsers={allActiveUsers}
              versions={versions}
              versionsLoading={versionsLoading}
              onToggleVersionHistory={handleToggleVersionHistory}
              onToggleCommentSidebar={
                showCommentsButton ? handleToggleComments : undefined
              }
              showCommentSidebar={showCommentSidebar}
              fetchVersions={onRefreshVersions}
              windowMode={windowMode}
              activeComponent={activeComponent}
              commentsCount={comments.length}
              hasUnsavedChanges={hasUnsavedChanges}
            />

            <div
              ref={canvasContainerRef}
              className="flex-1 relative"
              onMouseMove={canEdit ? handleCanvasMouseMove : undefined}
              onMouseLeave={canEdit ? handleCanvasMouseLeave : undefined}
            >
              <Excalidraw
                excalidrawAPI={handleExcalidrawReady}
                theme={theme}
                initialData={{ elements: whiteBoardData }}
                onChange={canEdit ? onChange : undefined}
                onPointerDown={() => {
                  if (canEdit && excalidrawRef.current) {
                    const elements = excalidrawRef.current.getSceneElements();
                    sendImmediateUpdate(elements);
                  }
                }}
                onPointerUp={canEdit ? handlePointerUp : undefined}
                onPaste={
                  canEdit
                    ? (data, event) => {
                        setTimeout(() => {
                          if (excalidrawRef.current) {
                            const elements =
                              excalidrawRef.current.getSceneElements();
                            sendImmediateUpdate(elements);
                            setHasUnsavedChanges(true);
                          }
                        }, 100);
                        return false;
                      }
                    : undefined
                }
                viewModeEnabled={!canEdit}
                UIOptions={{
                  canvasActions: {
                    saveToActiveFile: false,
                    loadScene: false,
                    toggleTheme: true,
                    changeViewBackgroundColor: canEdit,
                  },
                  tools: {
                    image: canEdit,
                  },
                }}
              >
                <>
                  <WelcomeScreen>
                    <WelcomeScreen.Hints.MenuHint />
                    <WelcomeScreen.Hints.ToolbarHint />
                    <WelcomeScreen.Center>
                      <WelcomeScreen.Center.MenuItemHelp />
                    </WelcomeScreen.Center>
                  </WelcomeScreen>
                </>
              </Excalidraw>

              {canEdit && (
                <CanvasCursorOverlay
                  cursors={cursors}
                  containerRef={canvasContainerRef}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {showCommentSidebar && canEdit && (
        <div
          className={`${
            isMobile ? "fixed inset-0 z-50" : "w-96"
          } bg-white dark:bg-[#1a1a1c] border-l border-gray-200 dark:border-[#2a2a2d] shadow-lg flex flex-col`}
        >
          <div className="flex-1 overflow-y-auto">
            <CommentThread
              comments={comments}
              onAddComment={handleAddComment}
              onReplyComment={handleReplyComment}
              onResolveComment={handleResolveComment}
              onDeleteComment={handleDeleteComment}
              onDeleteReply={handleDeleteReply}
              onUpdateComment={handleUpdateComment}
              fileId={fileId}
              permissions={permissions}
              currentUser={currentUser}
              onClose={() => setShowCommentSidebar(false)}
            />
          </div>
        </div>
      )}

      {showVersionHistory && (
        <div
          className={`${
            isMobile ? "fixed inset-0 z-50" : "w-96"
          } bg-white dark:bg-[#1a1a1c] border-l border-gray-200 dark:border-[#2a2a2d] shadow-lg flex flex-col`}
        >
          <VersionHistory
            versions={versions}
            onRestoreVersion={handleRestoreVersion}
            onClose={() => setShowVersionHistory(false)}
            isLoading={versionsLoading}
            onRefreshVersions={onRefreshVersions}
            componentType="canvas"
            canRestoreDocument={true}
            canRestoreWhiteboard={true}
          />
        </div>
      )}
    </div>
  );
}
