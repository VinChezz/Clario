"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FILE } from "@/shared/types/file.interface";
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
import { ActiveComponent, WindowMode } from "@/types/window.interface";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/app/_context/AppearanceContext";

import {
  BoldIcon,
  ItalicIcon,
  Strikethrough,
  Code2Icon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  TableIcon,
  Type,
  MoreHorizontal,
  ChevronDown,
  Check,
  CodeIcon,
  Highlighter as HighlighterIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  TextCursor,
  Palette,
  Plus,
  Trash2,
  Columns,
  Rows,
  MessageSquare,
  X,
  Subscript,
  Superscript,
  Underline,
  Link,
} from "lucide-react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlock from "@tiptap/extension-code-block";
import Code from "@tiptap/extension-code";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Markdown } from "tiptap-markdown";
import { useFilePermissions } from "@/hooks/useFilePermissions";
import { CommentPopup } from "@/components/CommentPopup";
import { EditorToolbar, TableControls } from "./EditorToolbar";

const defaultContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Start writing your notes here...",
        },
      ],
    },
  ],
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

export default function Editor({
  fileId,
  fileData,
  onSaveSuccess,
  onVersionRestore,
  isFullscreen,
  activeComponent,
  windowMode,
  onSaveHandlerChange,
  versions = [],
  versionsLoading = false,
  onRefreshVersions,
}: EditorProps) {
  const [editorData, setEditorData] = useState<any>(null);
  const { activeTeam } = useActiveTeam();
  const [selection, setSelection] = useState<any>(null);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);
  const isApplyingRemoteContent = useRef(false);
  const lastMousePresenceUpdate = useRef<number>(0);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isApplyingRemoteUpdate = useRef(false);
  const lastSentContent = useRef<string>("");
  const editorDestroyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorDataRef = useRef<any>(null);
  const renderInProgress = useRef(false);
  const initializationInProgress = useRef(false);
  const isMobile = useIsMobile();
  const lastSavedContent = useRef<string>("");
  const lastPresenceUpdate = useRef<number>(0);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);

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
  const { activeUsers, updatePresence, startPresenceUpdates } =
    usePresence(fileId);
  const { updateLightPresence } = useLightweightPresence(fileId, currentUser);

  const { createManualVersion, restoreVersion } = useVersionManager({
    fileId,
    fileData,
    onVersionRestore,
  });

  const {
    permissions,
    canEdit,
    isLoading: permissionsLoading,
  } = useFilePermissions();

  const { isDark } = useTheme();

  const isSplitMode = windowMode === "split";

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
      }),

      Placeholder.configure({
        placeholder: "Start writing your notes here...",
      }),

      Heading.configure({
        levels: [1, 2, 3, 4],
        HTMLAttributes: {
          class: "ce-header",
        },
      }),

      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc pl-6 my-2",
        },
      }),

      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal pl-6 my-2",
        },
      }),

      ListItem,

      CodeBlock.configure({
        HTMLAttributes: {
          class:
            "bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm my-4 border border-gray-200 dark:border-gray-700",
        },
      }),

      Code.configure({
        HTMLAttributes: {
          class:
            "bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono",
        },
      }),

      Blockquote.configure({
        HTMLAttributes: {
          class:
            "border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-4 italic text-gray-700 dark:text-gray-300",
        },
      }),

      HorizontalRule.configure({
        HTMLAttributes: {
          class: "my-6 border-gray-300 dark:border-gray-600",
        },
      }),

      Bold,
      Italic,
      Strike,
      TextStyle,
      Color,

      Highlight.configure({
        multicolor: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "editor-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,

      Markdown,
    ],
    content: editorData || defaultContent,
    editable: canEdit,
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert focus:outline-none ${
          isSplitMode ? "max-w-full" : "max-w-none"
        } min-h-[800px] p-4 ${isDark ? "dark-editor" : ""} ${
          !canEdit ? "cursor-default pointer-events-none" : ""
        }`,
      },
    },
    onUpdate: ({ editor }) => {
      if (!canEdit || isApplyingRemoteContent.current) return;

      const json = editor.getJSON();
      const contentString = JSON.stringify(json);

      const normalizeEditorData = (data: any): string => {
        if (!data || typeof data !== "object") return "{}";
        return JSON.stringify({
          type: data.type || "doc",
          content: data.content || [],
        });
      };

      let savedContent = "{}";
      if (fileData?.document && fileData.document !== '""') {
        try {
          savedContent = fileData.document;
        } catch (e) {
          console.error("❌ Error parsing saved document:", e);
        }
      }

      let normalizedCurrent: string;
      let normalizedNew: string;

      try {
        const currentData = savedContent
          ? JSON.parse(savedContent)
          : defaultContent;
        normalizedCurrent = normalizeEditorData(currentData);
      } catch (e) {
        console.error("❌ Error normalizing current content:", e);
        normalizedCurrent = "{}";
      }

      try {
        normalizedNew = normalizeEditorData(json);
      } catch (e) {
        console.error("❌ Error normalizing new content:", e);
        normalizedNew = "{}";
      }

      if (normalizedNew !== normalizedCurrent) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }

      updateEditingPresence();
      sendContentUpdateImmediate(json);
      sendContentUpdateThrottled(json);
    },
    onSelectionUpdate: ({ editor }) => {
      handleTextSelection();
    },
    onTransaction: ({ transaction }) => {
      if (transaction.getMeta("init") && !isEditorReady) {
        setIsEditorReady(true);
      }
    },
  });

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
    if (editor && !permissionsLoading) {
      if (editor.isEditable !== canEdit) {
        editor.setEditable(canEdit);
      }
    }
  }, [editor, canEdit, permissions, permissionsLoading]);

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      isInitialized.current = true;
      setIsEditorReady(true);
    }
  }, [editor]);

  useEffect(() => {
    if (editor && editorData) {
      try {
        editor.commands.setContent(editorData);
      } catch (error) {
        console.error("❌ Error setting editor content:", error);
      }
    }
  }, [editor, editorData]);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  const updateEditorTheme = useCallback(
    (isDark: boolean) => {
      if (!mounted || !editor) return;

      const editorElement = document.querySelector(".tiptap");
      if (editorElement) {
        if (isDark) {
          editorElement.classList.add("dark-theme");
          editorElement.classList.add("dark");
        } else {
          editorElement.classList.remove("dark-theme");
          editorElement.classList.remove("dark");
        }
      }
    },
    [mounted, editor],
  );

  useEffect(() => {
    if (mounted) {
      updateEditorTheme(isDark);
    }
  }, [isDark, mounted, updateEditorTheme]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (fileData?.document) {
      lastSavedContent.current = fileData.document;
    }
  }, [fileData?.document]);

  useEffect(() => {
    if (editorDataRef.current && fileData?.document) {
      const currentContent = JSON.stringify(editorDataRef.current);
      const savedContent = fileData.document;

      if (currentContent !== savedContent) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }
    }
  }, [editorDataRef.current, fileData?.document]);

  useEffect(() => {
    return () => {
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!fileData) {
      setEditorData(defaultContent);
      editorDataRef.current = defaultContent;
      return;
    }

    let initialData = defaultContent;

    if (fileData.document && fileData.document !== '""') {
      try {
        const parsedData = JSON.parse(fileData.document);

        if (
          parsedData &&
          typeof parsedData === "object" &&
          parsedData.content &&
          Array.isArray(parsedData.content) &&
          parsedData.content.length > 0
        ) {
          initialData = parsedData;
        } else {
          console.warn("⚠️ No content in saved data, using default");
          initialData = defaultContent;
        }
      } catch (parseError) {
        console.error("❌ Error parsing document data:", parseError);
        initialData = defaultContent;
      }
    } else {
      initialData = defaultContent;
    }

    const currentDataString = JSON.stringify(editorDataRef.current);
    const newDataString = JSON.stringify(initialData);

    if (currentDataString !== newDataString) {
      setEditorData(initialData);
      editorDataRef.current = initialData;
      resetLastSentContent();

      setHasUnsavedChanges(false);
      lastSavedContent.current = fileData?.document || "";
    } else {
      return;
    }
  }, [fileData, resetLastSentContent]);

  useEffect(() => {
    if (!currentUser) return;

    fetchComments();
    const cleanup = startPresenceUpdates();

    if (!canEdit) return;

    const unsubscribeContent = subscribeToContentUpdates((content, user) => {
      if (
        editor &&
        content &&
        isInitialized.current &&
        !isApplyingRemoteContent.current
      ) {
        const contentString = JSON.stringify(content);
        const currentContentString = JSON.stringify(editorDataRef.current);

        if (contentString === currentContentString) {
          return;
        }

        isApplyingRemoteContent.current = true;

        try {
          editor.commands.setContent(content);
          setEditorData(content);
          editorDataRef.current = content;

          const newContentString = JSON.stringify(content);
          const savedContent = fileData?.document || "{}";

          const normalizeContent = (content: string) => {
            if (!content || content === '""') return "{}";
            try {
              return JSON.stringify(JSON.parse(content));
            } catch {
              return "{}";
            }
          };

          const normalizedCurrent = normalizeContent(savedContent);
          const normalizedNew = normalizeContent(newContentString);

          if (normalizedNew !== normalizedCurrent) {
            setHasUnsavedChanges(true);
          } else {
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error("❌ EDITOR: Error rendering remote content:", error);
        } finally {
          isApplyingRemoteContent.current = false;
        }
      }
    });

    const unsubscribeSync = subscribeToContentSync((content) => {
      if (editor && content && isInitialized.current) {
        const contentString = JSON.stringify(content);

        if (contentString === lastSentContent.current) {
          return;
        }

        isApplyingRemoteContent.current = true;

        try {
          editor.commands.setContent(content);
          setEditorData(content);
          editorDataRef.current = content;

          const newContentString = JSON.stringify(content);
          const savedContent = fileData?.document || "{}";

          const normalizeContent = (content: string) => {
            if (!content || content === '""') return "{}";
            try {
              return JSON.stringify(JSON.parse(content));
            } catch {
              return "{}";
            }
          };

          const normalizedCurrent = normalizeContent(savedContent);
          const normalizedNew = normalizeContent(newContentString);

          if (normalizedNew !== normalizedCurrent) {
            setHasUnsavedChanges(true);
          } else {
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error("❌ EDITOR: Error applying sync content:", error);
        } finally {
          isApplyingRemoteContent.current = false;
        }
      }
    });

    const unsubscribeSelections = subscribeToSelectionUpdates();
    const unsubscribeTyping = subscribeToTypingUpdates();

    return () => {
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
    editor,
    fileData?.document,
    canEdit,
  ]);

  const sendContentUpdateThrottled = useCallback(
    throttle((content: any) => {
      if (
        (isConnected && currentUser && permissions === "EDIT") ||
        (permissions === "ADMIN" && !isApplyingRemoteUpdate.current)
      ) {
        const contentString = JSON.stringify(content);
        if (contentString === lastSentContent.current) {
          return;
        }

        lastSentContent.current = contentString;
        sendContentUpdate(content);
      }
    }, 50),
    [isConnected, currentUser, permissions, sendContentUpdate],
  );

  const updateEditingPresence = useCallback(() => {
    if (!currentUser || !canEdit) return;

    const now = Date.now();

    if (now - lastPresenceUpdate.current > 2000) {
      updateLightPresence("EDITING");

      updatePresence({
        status: "EDITING",
      }).catch(console.error);

      lastPresenceUpdate.current = now;
    }

    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }

    editingTimeoutRef.current = setTimeout(() => {
      updateLightPresence("VIEWING");
      updatePresence({
        status: "VIEWING",
      }).catch(console.error);
    }, 3000);
  }, [currentUser, canEdit, updateLightPresence, updatePresence]);

  const handleEditorSave = useCallback(async () => {
    if (!editor || isSaving.current || !canEdit) {
      return;
    }

    isSaving.current = true;

    try {
      const outputData = editor.getJSON();

      if (!outputData.content || outputData.content.length === 0) {
        return;
      }

      const contentString = JSON.stringify(outputData);

      const normalizeEditorData = (data: any): string => {
        if (!data || typeof data !== "object") return "{}";

        const normalized = {
          type: data.type || "doc",
          content: data.content || [],
        };

        return JSON.stringify(normalized);
      };

      let currentContent = "{}";
      if (fileData?.document && fileData.document !== '""') {
        try {
          currentContent = fileData.document;
        } catch (e) {
          console.error("❌ Error parsing current document:", e);
        }
      }

      let normalizedCurrent: string;
      let normalizedNew: string;

      try {
        const currentData = currentContent
          ? JSON.parse(currentContent)
          : defaultContent;
        normalizedCurrent = normalizeEditorData(currentData);
      } catch (e) {
        console.error("❌ Error normalizing current content:", e);
        normalizedCurrent = "{}";
      }

      try {
        normalizedNew = normalizeEditorData(outputData);
      } catch (e) {
        console.error("❌ Error normalizing new content:", e);
        normalizedNew = "{}";
      }

      if (normalizedNew === normalizedCurrent) {
        toast.info("No changes to save");
        setHasUnsavedChanges(false);
        return;
      }

      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: contentString,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Save error response:", errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const updatedFile = await res.json();

      lastSavedContent.current = contentString;
      setHasUnsavedChanges(false);

      if (normalizedNew !== normalizedCurrent) {
        try {
          await createManualVersion({
            name: `Document - ${new Date().toLocaleString()}`,
            description: "Manually saved version",
            content: contentString,
            type: "document",
          });
        } catch (versionError) {
          console.error("⚠️ Version creation failed:", versionError);
        }
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error("❌ Error saving document:", error);
      if (windowMode === "split") {
        toast.error("Failed to save document");
      }
    } finally {
      isSaving.current = false;
    }
  }, [
    editor,
    fileId,
    onSaveSuccess,
    createManualVersion,
    fileData,
    windowMode,
    canEdit,
  ]);

  useEffect(() => {
    if (onSaveHandlerChange) {
      onSaveHandlerChange(handleEditorSave);
    }
  }, [handleEditorSave, onSaveHandlerChange]);

  const handleRestoreVersion = useCallback(
    async (version: any) => {
      try {
        await restoreVersion(version.id, "document");

        setShowVersionHistory(false);

        setHasUnsavedChanges(false);

        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } catch (error) {
        console.error("❌ EDITOR: Restore failed:", error);

        if (error instanceof Error) {
          if (error.message.includes("Type mismatch")) {
            toast.error(
              "This version can only be restored in the Whiteboard panel",
            );
          } else if (error.message.includes("404")) {
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
    [restoreVersion, onSaveSuccess, fileId],
  );

  const handleTextSelection = useCallback(() => {
    if (!currentUser || !editor) return;

    const selection = window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.toString().trim() === ""
    ) {
      setSelection(null);

      if (permissions === "EDIT" || permissions === "ADMIN") {
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

    const selectedText = selection.toString().trim();

    if (selectedText) {
      const editorElement = document.querySelector(".tiptap");
      if (editorElement && editorElement.contains(selection.anchorNode)) {
        const newSelection = {
          start: 0,
          end: selectedText.length,
          text: selectedText,
        };

        setSelection(newSelection);

        if (permissions === "EDIT" || permissions === "ADMIN") {
          sendSelectionUpdate({
            userId: currentUser.id,
            userColor: generateUserColor(currentUser.id),
            selection: newSelection,
          });
        }
      }
    } else {
      setSelection(null);

      if (permissions === "EDIT" || permissions === "ADMIN") {
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
  }, [currentUser, permissions, sendSelectionUpdate, editor]);

  const handleEditorClick = useCallback(
    (event: React.MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") {
        setSelection(null);

        if (
          permissions === "EDIT" ||
          (permissions === "ADMIN" && currentUser)
        ) {
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
    [currentUser, permissions, sendSelectionUpdate],
  );

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
    [createComment, selection],
  );

  const handleReplyComment = useCallback(
    (commentId: string, content: string) => {
      createReply(commentId, content);
    },
    [createReply],
  );

  const handleUpdateComment = useCallback(
    (commentId: string, content: string) => {
      updateComment(commentId, { content })
        .then((updatedComment) => {
          updatedComment;
        })
        .catch((error) => {
          console.error("❌ Failed to update comment:", error);
        });
    },
    [updateComment],
  );

  const handleResolveComment = useCallback(
    (commentId: string) => {
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
    [comments, updateComment],
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      deleteComment(commentId);
    },
    [deleteComment],
  );

  const handleDeleteReply = useCallback(
    (commentId: string, replyId: string) => {
      deleteReply(commentId, replyId);
    },
    [deleteReply],
  );

  const handleEditorMouseMove = useCallback(
    throttle((event: React.MouseEvent) => {
      if (!currentUser || !canEdit) return;

      const editorElement = document.querySelector(".tiptap");
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
        lastActive: Date.now(),
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
      }, 100);
    }, 20),
    [
      currentUser,
      permissions,
      sendCursorUpdate,
      sendTypingUpdate,
      updatePresence,
      updateLightPresence,
      canEdit,
    ],
  );

  const handleEditorMouseLeave = useCallback(() => {
    if (currentUser && (permissions === "EDIT" || permissions === "ADMIN")) {
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
      if (!currentUser || !(permissions === "EDIT" || permissions === "ADMIN"))
        return;

      updateEditingPresence();

      const editorElement = document.querySelector(".tiptap");
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
    [currentUser, permissions, sendTypingUpdate, updateEditingPresence],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes in the document. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (!editor) {
    return (
      <div
        className={`flex h-full w-full${
          isDark ? "bg-[#171717]" : "bg-gray-100"
        }`}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full ${
        isDark ? "bg-[#171717]" : "bg-gray-100"
      }`}
    >
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
          fetchVersions={onRefreshVersions}
          windowMode={windowMode}
          activeComponent={activeComponent}
          commentsCount={comments.length}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <div
          ref={editorContainerRef}
          className={`flex-1 relative overflow-y-auto ${
            showVersionHistory || showCommentSidebar
              ? `border-r ${isDark ? "border-[#2b3133]" : "border-gray-200"}`
              : ""
          } ${isFullscreen ? "" : isDark ? "bg-[#171717]" : "bg-white"}`}
        >
          <div
            className={`${
              isSplitMode
                ? "ml-4 sm:ml-6 mr-4 sm:mr-6"
                : "ml-4 sm:ml-12 mr-4 sm:mr-12"
            }`}
          >
            {canEdit && (
              <div className="sticky top-0 z-10 pt-3.5 bg-inherit">
                <EditorToolbar
                  editor={editor}
                  isDark={isDark}
                  isSplitMode={isSplitMode}
                  handleEditorSave={handleEditorSave}
                  fileId={fileId}
                />
              </div>
            )}

            <div
              className={`tiptap-editor ${isDark ? "dark-editor dark" : ""} ${
                !canEdit ? "select-none" : ""
              }`}
              onMouseMove={canEdit ? handleEditorMouseMove : undefined}
              onMouseLeave={canEdit ? handleEditorMouseLeave : undefined}
              onMouseUp={canEdit ? handleTextSelection : undefined}
              onKeyDown={canEdit ? handleKeyDown : undefined}
              onClick={canEdit ? handleEditorClick : undefined}
            >
              {editor && canEdit && (
                <TableControls editor={editor} isDark={isDark} />
              )}

              <EditorContent editor={editor} />
            </div>
            <div className="h-20"></div>
          </div>

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
          <CommentPopup
            selection={selection}
            permissions={permissions}
            isDark={isDark}
            onAddComment={handleAddComment}
            onClose={() => setSelection(null)}
          />
        )}
      </div>

      {showCommentSidebar && (
        <div
          className={`w-full sm:w-80 lg:w-96 border-l shadow-lg flex flex-col fixed inset-0 sm:relative z-50 ${
            isDark
              ? "bg-[#1a1a1c] border-[#2a2a2d]"
              : "bg-white border-gray-200"
          }`}
        >
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
      )}

      {showVersionHistory && (
        <div
          className={`${
            isMobile ? "fixed inset-0 z-50" : "w-96"
          } border-l shadow-lg flex flex-col ${
            isDark
              ? "bg-[#1a1a1c] border-[#2a2a2d]"
              : "bg-white border-gray-200"
          }`}
        >
          <VersionHistory
            versions={versions}
            onRestoreVersion={handleRestoreVersion}
            onClose={() => setShowVersionHistory(false)}
            isLoading={versionsLoading}
            onRefreshVersions={onRefreshVersions}
            componentType="editor"
            canRestoreDocument={true}
            canRestoreWhiteboard={true}
          />
        </div>
      )}
    </div>
  );
}
