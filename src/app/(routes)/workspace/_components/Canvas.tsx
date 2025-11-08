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

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading whiteboard...</div>
      </div>
    ),
  }
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
  const [permissions, setPermissions] = useState<"ADMIN" | "VIEW" | "EDIT">(
    "VIEW"
  );
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
        (u: any) => u.user?.id === user.user?.id
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
    [] as any[]
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

  const canEdit = permissions === "EDIT" || permissions === "ADMIN";

  useEffect(() => {
    if (activeTeam && !currentUser) {
      console.log("🔄 ActiveTeam loaded, fetching user permissions...");

      const fetchCurrentUser = async () => {
        try {
          const userRes = await fetch("/api/auth/user");
          if (!userRes.ok) throw new Error("Failed to fetch user");
          const dbUser = await userRes.json();
          setCurrentUser(dbUser);

          const savedPermissions = localStorage.getItem(
            `file_permissions_${fileId}`
          );
          if (savedPermissions) {
            const parsedPermissions = JSON.parse(savedPermissions);
            if (
              parsedPermissions.userId === dbUser.id &&
              parsedPermissions.teamId === activeTeam.id
            ) {
              console.log(
                "🔄 Restoring permissions from localStorage:",
                parsedPermissions.role
              );
              setPermissions(parsedPermissions.role);
              return;
            }
          }

          const isCreator = activeTeam.createdById === dbUser.id;
          const userMembership = activeTeam.members?.find(
            (member: any) => member.userId === dbUser.id
          );

          let userRole: "ADMIN" | "VIEW" | "EDIT" = "VIEW";

          if (isCreator) {
            userRole = "ADMIN";
          } else if (userMembership) {
            userRole = userMembership.role as "ADMIN" | "VIEW" | "EDIT";
          }

          console.log("🔐 Final permissions setting:", userRole);
          setPermissions(userRole);

          localStorage.setItem(
            `file_permissions_${fileId}`,
            JSON.stringify({
              userId: dbUser.id,
              teamId: activeTeam.id,
              role: userRole,
              timestamp: Date.now(),
            })
          );
        } catch (err) {
          console.error("Error:", err);
          setPermissions("VIEW");
        }
      };

      fetchCurrentUser();
    }
  }, [activeTeam, fileId, currentUser]);

  useEffect(() => {
    console.log("🔄 Canvas: fileData changed", {
      hasWhiteboard: !!fileData?.whiteboard,
      hasAppliedInitialData: hasAppliedInitialData.current,
      whiteboardLength: fileData?.whiteboard?.length || 0,
    });

    if (fileData?.whiteboard) {
      try {
        const data = JSON.parse(fileData.whiteboard);
        console.log("📁 Loaded whiteboard data:", data.length, "elements");

        setWhiteBoardData(data);
        lastSavedContent.current = fileData.whiteboard;

        if (excalidrawRef.current && isInitialized) {
          console.log("🔄 Applying whiteboard data to initialized Excalidraw");
          excalidrawRef.current.updateScene({
            elements: data,
            commitToHistory: false,
          });
          hasAppliedInitialData.current = true;
        } else if (!hasAppliedInitialData.current) {
          console.log("📝 Whiteboard data ready for Excalidraw initialization");
          hasAppliedInitialData.current = false;
        }

        setTimeout(() => {
          if (excalidrawRef.current && isInitialized) {
            const currentElements = excalidrawRef.current.getSceneElements();
            const currentContent = JSON.stringify(currentElements);

            if (currentContent !== fileData.whiteboard) {
              console.log(
                "⚠️ Content mismatch detected, setting unsaved changes"
              );
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
      console.log("📝 No whiteboard data, initializing empty");
      setWhiteBoardData([]);
      lastSavedContent.current = "[]";
      hasAppliedInitialData.current = false;
    }
  }, [fileData, isInitialized]);

  useEffect(() => {
    if (!currentUser) return;

    console.log("🔌 Starting realtime services...");

    fetchComments();

    const unsubscribeContent = subscribeToContentUpdates((content, user) => {
      console.log("🎉 RECEIVED content update from:", user?.name, {
        elements: content?.length || 0,
      });

      if (excalidrawRef.current && content) {
        const contentString = JSON.stringify(content);
        if (contentString === lastSentContent.current) {
          console.log("🔄 Ignoring own content (already sent)");
          return;
        }

        console.log("🔄 Applying remote content to canvas");
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
      console.log(
        "🔄 RECEIVED canvas_content_sync:",
        content?.length || 0,
        "elements"
      );

      if (excalidrawRef.current && content && content.length > 0) {
        console.log("🔄 Applying sync content to canvas");
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
      console.log("🧹 Cleaning up realtime services");
      unsubscribeContent();
      unsubscribeSync();
      unsubscribeCursors();
    };
  }, [
    currentUser,
    canEdit,
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
    [isConnected, currentUser, canEdit, sendContentUpdate]
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
        console.log("🔄 Auto-saving whiteboard due to significant changes");

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
              console.log("✅ Whiteboard auto-saved");
              lastSavedContent.current = contentString;
              setHasUnsavedChanges(false);
            }
          })
          .catch((error) => {
            console.error("❌ Auto-save failed:", error);
          });
      }
    }, 5000),
    [fileId, canEdit, hasUnsavedChanges, fileData]
  );

  const sendImmediateUpdate = useCallback(
    (elements: any) => {
      if (isConnected && currentUser && canEdit) {
        const contentString = JSON.stringify(elements);
        if (contentString === lastSentContent.current) {
          return;
        }

        console.log("⚡📤 SENDING CONTENT immediately:", {
          elements: elements.length,
          user: currentUser.name,
        });

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
    ]
  );

  const handleCanvasSave = useCallback(async () => {
    if (!canEdit) {
      console.log("❌ No permission to save whiteboard");
      if (windowMode === "split") {
        toast.error("No permission to save");
      }
      return;
    }

    try {
      console.log("💾 Canvas manual save triggered...");

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

      console.log("🔍 Content comparison:", {
        current: normalizedCurrent.length,
        new: normalizedNew.length,
        hasChanges: normalizedNew !== normalizedCurrent,
      });

      if (normalizedNew === normalizedCurrent) {
        console.log("✅ No changes detected, skipping save");
        toast.info("No changes to save");
        return;
      }

      console.log("💾 Saving whiteboard to database...");
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

      console.log("✅ Whiteboard saved successfully!");

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
          console.log("📝 Version created for whiteboard changes");
        } catch (versionError) {
          console.error("⚠️ Version creation failed:", versionError);
        }
      } else if (hasRealChanges && elements.length === 0) {
        try {
          console.log("🆕 Creating empty whiteboard version...");
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
        console.log("🔄 No version created - no significant changes");
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

  const handleClearCanvas = useCallback(() => {
    if (excalidrawRef.current && canEdit) {
      excalidrawRef.current.updateScene({
        elements: [],
        commitToHistory: true,
      });

      setTimeout(() => {
        if (excalidrawRef.current) {
          const elements = excalidrawRef.current.getSceneElements();
          sendImmediateUpdate(elements);
          setHasUnsavedChanges(true);
          toast.info("Canvas cleared");
        }
      }, 100);
    }
  }, [canEdit, sendImmediateUpdate]);

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
      console.log("🔄 Fetching versions for VersionHistory...");
    }
  }, [showVersionHistory]);

  const handleRestoreVersion = useCallback(
    async (version: any) => {
      try {
        console.log("🎯 CANVAS: Starting whiteboard version restore", {
          versionId: version.id,
          versionType: version.type,
          componentType: "canvas",
        });

        await restoreVersion(version.id, "whiteboard");

        toast.success(`Version ${version.version} restored successfully!`);

        setShowVersionHistory(false);
      } catch (error) {
        console.error("❌ CANVAS: Failed to restore version:", error);

        if (error instanceof Error) {
          if (error.message.includes("Type mismatch")) {
            toast.error(
              "This version can only be restored in the Document panel"
            );
          } else {
            toast.error(`Restore failed: ${error.message}`);
          }
        } else {
          toast.error("Failed to restore version");
        }
      }
    },
    [restoreVersion]
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
    [canEdit, sendContentUpdateThrottled, updateLightPresence, fileData]
  );

  const handleExcalidrawReady = useCallback(
    (api: any) => {
      console.log("🎉 Excalidraw ready");
      excalidrawRef.current = api;
      setIsInitialized(true);

      if (whiteBoardData && whiteBoardData.length > 0) {
        console.log("🔄 Applying whiteboard data to ready Excalidraw");
        api.updateScene({
          elements: whiteBoardData,
          commitToHistory: false,
        });
        hasAppliedInitialData.current = true;
        lastSentContent.current = JSON.stringify(whiteBoardData);
      } else if (fileData?.whiteboard && !hasAppliedInitialData.current) {
        try {
          const data = JSON.parse(fileData.whiteboard);
          console.log("🔄 Loading data from fileData to Excalidraw");
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
    [whiteBoardData, fileData]
  );

  const handleCanvasMouseMove = useCallback(
    throttle((event: React.MouseEvent) => {
      if (!currentUser || !canEdit || !canvasContainerRef.current) {
        return;
      }

      const canvasElement =
        canvasContainerRef.current.querySelector(".excalidraw");
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

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

      const now = Date.now();
      if (now - lastMousePresenceUpdate.current > 5000) {
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
          tool: currentTool,
          isActive: false,
        });
      }, 1000);
    }, 20),
    [
      currentUser,
      canEdit,
      sendCursorUpdate,
      currentTool,
      updatePresence,
      updateLightPresence,
    ]
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
      createComment({
        content,
        type: type,
        selection: selection,
      }).then(() => {
        setSelection(null);
      });
    },
    [createComment, selection]
  );

  const handleReplyComment = useCallback(
    (commentId: string, content: string) => {
      createReply(commentId, content);
    },
    [createReply]
  );

  const handleUpdateComment = useCallback(
    (commentId: string, content: string) => {
      console.log("✏️ Updating comment:", commentId, content);
      updateComment(commentId, { content })
        .then((updatedComment) => {
          console.log("✅ Comment updated successfully:", updatedComment);
        })
        .catch((error) => {
          console.error("❌ Failed to update comment:", error);
        });
    },
    [updateComment]
  );

  const handleResolveComment = useCallback(
    (commentId: string) => {
      console.log("🔄 Resolving comment:", commentId);
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        const newStatus = comment.status === "OPEN" ? "RESOLVED" : "OPEN";
        console.log("📝 Updating status:", {
          from: comment.status,
          to: newStatus,
        });
        updateComment(commentId, { status: newStatus })
          .then((updatedComment) => {
            console.log("✅ Comment updated:", updatedComment);
          })
          .catch((error) => {
            console.error("❌ Failed to update comment:", error);
          });
      } else {
        console.error("❌ Comment not found:", commentId);
      }
    },
    [comments, updateComment]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      deleteComment(commentId);
    },
    [deleteComment]
  );

  const handleDeleteReply = useCallback(
    (commentId: string, replyId: string) => {
      deleteReply(commentId, replyId);
    },
    [deleteReply]
  );

  const handleToggleComments = useCallback(() => {
    setShowCommentSidebar(!showCommentSidebar);
    if (!showCommentSidebar) {
      setShowVersionHistory(false);
    }
  }, [showCommentSidebar]);

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
      if (hasUnsavedChanges) {
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
  }, [hasUnsavedChanges]);

  const showCommentsButton =
    windowMode === "fullscreen" && currentComponent === "canvas";

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden">
      <div
        className={`flex-1 relative transition-all duration-200 ${
          showVersionHistory || showCommentSidebar
            ? "border-r border-gray-200"
            : ""
        } ${isFullscreen ? "bg-white" : ""}`}
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
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            >
              <Excalidraw
                excalidrawAPI={handleExcalidrawReady}
                theme="light"
                initialData={{ elements: whiteBoardData }}
                onChange={onChange}
                onPointerDown={() => {
                  if (excalidrawRef.current) {
                    const elements = excalidrawRef.current.getSceneElements();
                    sendImmediateUpdate(elements);
                  }
                }}
                onPointerUp={handlePointerUp}
                onPaste={(data, event) => {
                  setTimeout(() => {
                    if (excalidrawRef.current) {
                      const elements = excalidrawRef.current.getSceneElements();
                      sendImmediateUpdate(elements);
                      setHasUnsavedChanges(true);
                    }
                  }, 100);

                  return false;
                }}
                viewModeEnabled={permissions === "VIEW"}
                UIOptions={{
                  canvasActions: {
                    saveToActiveFile: false,
                    loadScene: false,
                    export: false,
                    toggleTheme: false,
                    changeViewBackgroundColor: canEdit,
                  },
                  tools: {
                    image: canEdit,
                  },
                }}
              >
                <MainMenu>
                  <MainMenu.Item onSelect={handleClearCanvas}>
                    Clear Canvas
                  </MainMenu.Item>
                  <MainMenu.DefaultItems.SaveAsImage />
                  <MainMenu.DefaultItems.ChangeCanvasBackground />
                </MainMenu>

                <WelcomeScreen>
                  <WelcomeScreen.Hints.MenuHint />
                  <WelcomeScreen.Hints.ToolbarHint />
                  <WelcomeScreen.Center>
                    <WelcomeScreen.Center.MenuItemHelp />
                  </WelcomeScreen.Center>
                </WelcomeScreen>
              </Excalidraw>

              <CanvasCursorOverlay
                cursors={cursors}
                containerRef={canvasContainerRef}
              />
            </div>
          </div>
        )}
      </div>

      {showCommentSidebar && (
        <div
          className={`${
            isMobile ? "fixed inset-0 z-50" : "w-96"
          } bg-white border-l border-gray-200 shadow-lg flex flex-col`}
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
          } bg-white border-l border-gray-200 shadow-lg flex flex-col`}
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
