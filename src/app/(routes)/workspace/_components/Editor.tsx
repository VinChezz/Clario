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
  Pilcrow,
  Palette,
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

interface EditorToolbarProps {
  editor: any;
  isDark?: boolean;
  isSplitMode?: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isDark = false,
  isSplitMode = false,
}) => {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const headingWrapperRef = useRef<HTMLDivElement>(null);
  const colorWrapperRef = useRef<HTMLDivElement>(null);
  const highlightWrapperRef = useRef<HTMLDivElement>(null);
  const moreWrapperRef = useRef<HTMLDivElement>(null);
  const { canEdit } = useFilePermissions();

  useEffect(() => {
    if (!showHeadingMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        headingWrapperRef.current &&
        !headingWrapperRef.current.contains(e.target as Node)
      ) {
        setShowHeadingMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHeadingMenu]);

  if (!editor) {
    return null;
  }

  if (!canEdit) {
    return null;
  }

  const containerClass = `sticky z-10 mx-auto my-4 flex justify-center items-center py-1.5 px-6 rounded-md max-w-[700px] ${
    isDark
      ? "bg-[#232329] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.02)]"
      : "bg-white shadow-[0_0.5px_1px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-black/5 backdrop-blur-sm"
  }`;

  const buttonClass = `
    group relative flex items-center justify-center
    w-8 h-8 rounded-md transition-all duration-150
    ${
      isDark
        ? "hover:bg-[#31303B] text-[#e0e0e0] hover:text-white hover:border-[#555]"
        : "hover:bg-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-400"
    }
  `;

  const activeButtonClass = `
    group relative flex items-center justify-center
    w-8 h-8 rounded-md transition-all duration-150
    ${isDark ? "bg-[#403E6A] text-white" : "bg-[#E0DFFF] text-gray-900"}
  `;

  const moreButtonClass = `
    group relative flex items-center justify-center
    w-8 h-8 rounded-md transition-all duration-150 ml-1
    ${
      isDark
        ? "hover:bg-[#31303B text-[#e0e0e0] hover:text-white hover:border-[#555]"
        : "hover:bg-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-400"
    }
  `;

  const dropdownButtonClass = `
    group relative flex items-center justify-center
    min-w-[100px] h-8 px-3 rounded-md transition-all duration-150 ml-1
    ${
      isDark
        ? "hover:bg-[#232329] text-[#e0e0e0] hover:text-white border border-[#404040] hover:border-[#555]"
        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400"
    }
  `;

  const dropdownClass = `
    absolute z-[9999] min-w-[160px] rounded-lg border shadow-xl
    ${
      isDark
        ? "bg-[#1e1e1e] border-[#404040] shadow-[0_12px_48px_rgba(0,0,0,0.48)]"
        : "bg-white border-gray-300 shadow-[0_12px_48px_rgba(0,0,0,0.16)]"
    }
  `;

  const dropdownItemClass = `
    w-full flex items-center justify-between px-3 py-2 text-sm
    transition-colors first:rounded-t-lg last:rounded-b-lg
    ${
      isDark
        ? "hover:bg-[#232329] text-[#e0e0e0] hover:text-white"
        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
    }
  `;

  const textColors = [
    "#1d1d1d",
    "#37352f",
    "#9b9a97",
    "#64473a",
    "#e03e3e",
    "#e5484d",
    "#d73a4a",
    "#ad1a72",
    "#702ec2",
    "#8e4db6",
    "#0b6eaa",
    "#0969da",
    "#0f6bcc",
    "#2da44e",
    "#238636",
    "#1a7f37",
    "#f6c950",
    "#f9a825",
    "#f2711c",
  ];

  const highlightColors = [
    "#fff8db",
    "#d4f1ff",
    "#dafbe1",
    "#ffd8d3",
    "#f1dfff",
    "#ffcecc",
    "#dcffe4",
    "#e6f7ff",
    "#f0f4ff",
  ];

  const Separator = () => (
    <div
      className={`w-px h-5 mx-1 ${isDark ? "bg-[#404040]" : "bg-gray-300"}`}
    />
  );

  const getCurrentHeadingLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor.isActive("heading", { level: 4 })) return "Heading 4";
    return "Text";
  };

  const getCurrentHeadingIcon = () => {
    if (editor.isActive("heading", { level: 1 }))
      return <Heading1 className="w-4 h-4" />;
    if (editor.isActive("heading", { level: 2 }))
      return <Heading2 className="w-4 h-4" />;
    if (editor.isActive("heading", { level: 3 }))
      return <Heading3 className="w-4 h-4" />;
    if (editor.isActive("heading", { level: 4 }))
      return <Heading4 className="w-4 h-4" />;
    return <Type className="w-4 h-4" />;
  };

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${buttonClass} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${buttonClass} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <Separator />

      <div className="relative" ref={headingWrapperRef}>
        <button
          onClick={() => {
            setShowHeadingMenu(!showHeadingMenu);
            setShowColorPicker(false);
            setShowHighlightPicker(false);
            setShowMoreMenu(false);
          }}
          className={dropdownButtonClass}
          title="Text Style"
        >
          <span className="flex items-center gap-2">
            {getCurrentHeadingIcon()}
            <span className="text-sm font-medium truncate max-w-[60px]">
              {getCurrentHeadingLabel()}
            </span>
            <ChevronDown className="w-3 h-3 ml-1 shrink-0" />
          </span>
        </button>

        {showHeadingMenu && (
          <div className={`${dropdownClass} top-full left-0 mt-1`}>
            <div className="py-1">
              <button
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingMenu(false);
                }}
                className={dropdownItemClass}
              >
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <span>Text</span>
                </div>
                {editor.isActive("paragraph") && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowHeadingMenu(false);
                }}
                className={dropdownItemClass}
              >
                <div className="flex items-center gap-2">
                  <Heading1 className="w-4 h-4" />
                  <span>Heading 1</span>
                </div>
                {editor.isActive("heading", { level: 1 }) && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowHeadingMenu(false);
                }}
                className={dropdownItemClass}
              >
                <div className="flex items-center gap-2">
                  <Heading2 className="w-4 h-4" />
                  <span>Heading 2</span>
                </div>
                {editor.isActive("heading", { level: 2 }) && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setShowHeadingMenu(false);
                }}
                className={dropdownItemClass}
              >
                <div className="flex items-center gap-2">
                  <Heading3 className="w-4 h-4" />
                  <span>Heading 3</span>
                </div>
                {editor.isActive("heading", { level: 3 }) && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 4 }).run();
                  setShowHeadingMenu(false);
                }}
                className={dropdownItemClass}
              >
                <div className="flex items-center gap-2">
                  <Heading4 className="w-4 h-4" />
                  <span>Heading 4</span>
                </div>
                {editor.isActive("heading", { level: 4 }) && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? activeButtonClass : buttonClass}
          title="Bold"
        >
          <BoldIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={
            editor.isActive("italic") ? activeButtonClass : buttonClass
          }
          title="Italic"
        >
          <ItalicIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={
            editor.isActive("strike") ? activeButtonClass : buttonClass
          }
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? activeButtonClass : buttonClass}
          title="Inline Code"
        >
          <CodeIcon className="w-4 h-4" />
        </button>
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <div className="relative" ref={colorWrapperRef}>
          <button
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHeadingMenu(false);
              setShowHighlightPicker(false);
              setShowMoreMenu(false);
            }}
            className={buttonClass}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showColorPicker && (
            <div
              className={`${dropdownClass} p-3 w-[200px] top-full left-0 mt-1`}
            >
              <div className="grid grid-cols-5 gap-2">
                {textColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-7 h-7 rounded-md border-2 border-transparent hover:border-blue-500 hover:scale-110 transition-all"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className={`w-full mt-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  isDark
                    ? "bg-[#2a2a2a] hover:bg-[#323232] text-[#e0e0e0]"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Reset Color
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={highlightWrapperRef}>
          <button
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowHeadingMenu(false);
              setShowColorPicker(false);
              setShowMoreMenu(false);
            }}
            className={
              editor.isActive("highlight") ? activeButtonClass : buttonClass
            }
            title="Highlight"
          >
            <HighlighterIcon className="w-4 h-4" />
          </button>

          {showHighlightPicker && (
            <div
              className={`${dropdownClass} p-3 w-[180px] top-full left-0 mt-1`}
            >
              <div className="grid grid-cols-4 gap-2">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-8 h-8 rounded-md border-2 border-transparent hover:border-blue-500 hover:scale-110 transition-all"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightPicker(false);
                }}
                className={`w-full mt-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  isDark
                    ? "bg-[#2a2a2a] hover:bg-[#323232] text-[#e0e0e0]"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Remove Highlight
              </button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={
            editor.isActive({ textAlign: "left" })
              ? activeButtonClass
              : buttonClass
          }
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={
            editor.isActive({ textAlign: "center" })
              ? activeButtonClass
              : buttonClass
          }
          title="Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={
            editor.isActive({ textAlign: "right" })
              ? activeButtonClass
              : buttonClass
          }
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={
            editor.isActive({ textAlign: "justify" })
              ? activeButtonClass
              : buttonClass
          }
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={
            editor.isActive("bulletList") ? activeButtonClass : buttonClass
          }
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={
            editor.isActive("orderedList") ? activeButtonClass : buttonClass
          }
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={
            editor.isActive("codeBlock") ? activeButtonClass : buttonClass
          }
          title="Code Block"
        >
          <Code2Icon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={
            editor.isActive("blockquote") ? activeButtonClass : buttonClass
          }
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={buttonClass}
          title="Divider"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="relative" ref={moreWrapperRef}>
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowHeadingMenu(false);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            className={moreButtonClass}
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className={`${dropdownClass} top-full right-0 mt-1`}>
              <div className="py-1">
                <button
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run();
                    setShowMoreMenu(false);
                  }}
                  className={dropdownItemClass}
                >
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    <span>Insert Table</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className={dropdownItemClass}
                >
                  <div className="flex items-center gap-2">
                    <TextCursor className="w-4 h-4" />
                    <span>Clear Format</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  currentComponent,
  onActiveComponentChange,
  onWindowModeChange,
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
          class:
            "border-collapse table-auto w-full my-4 border border-gray-300 dark:border-gray-600",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-bold p-2",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 dark:border-gray-600 p-2",
        },
      }),
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
      console.log("✅ Editor ready with permissions:", {
        permissions,
        canEdit,
        isLoading: permissionsLoading,
      });

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
        console.log("✅ Editor content set successfully");
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
    [mounted, editor]
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
      console.log("📄 No file data, using default");
      setEditorData(defaultContent);
      editorDataRef.current = defaultContent;
      return;
    }

    let initialData = defaultContent;

    if (fileData.document && fileData.document !== '""') {
      try {
        const parsedData = JSON.parse(fileData.document);
        console.log("📖 Parsed document data:", parsedData);

        if (
          parsedData &&
          typeof parsedData === "object" &&
          parsedData.content &&
          Array.isArray(parsedData.content) &&
          parsedData.content.length > 0
        ) {
          initialData = parsedData;
          console.log(
            "✅ Using saved document data with content:",
            parsedData.content.length
          );
        } else {
          console.warn("⚠️ No content in saved data, using default");
          initialData = defaultContent;
        }
      } catch (parseError) {
        console.error("❌ Error parsing document data:", parseError);
        initialData = defaultContent;
      }
    } else {
      console.log("📝 No document data, using default");
      initialData = defaultContent;
    }

    const currentDataString = JSON.stringify(editorDataRef.current);
    const newDataString = JSON.stringify(initialData);

    if (currentDataString !== newDataString) {
      console.log("🔄 Editor data changed, updating state");
      setEditorData(initialData);
      editorDataRef.current = initialData;
      resetLastSentContent();

      setHasUnsavedChanges(false);
      lastSavedContent.current = fileData?.document || "";
    } else {
      console.log("🔄 Editor data unchanged, skipping update");
    }
  }, [fileData, resetLastSentContent]);

  useEffect(() => {
    if (!currentUser) return;
    console.log("🔌 Starting realtime services for Editor...");

    fetchComments();
    const cleanup = startPresenceUpdates();

    if (!canEdit) return;

    const unsubscribeContent = subscribeToContentUpdates((content, user) => {
      console.log("🎯 EDITOR: Processing content update from:", user?.name);

      if (
        editor &&
        content &&
        isInitialized.current &&
        !isApplyingRemoteContent.current
      ) {
        const contentString = JSON.stringify(content);
        const currentContentString = JSON.stringify(editorDataRef.current);

        if (contentString === currentContentString) {
          console.log("🔄 EDITOR: Ignoring duplicate content update");
          return;
        }

        console.log("🎯 EDITOR: Rendering remote content");
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
          console.log("✅ EDITOR: Successfully rendered remote content");
        } catch (error) {
          console.error("❌ EDITOR: Error rendering remote content:", error);
        } finally {
          isApplyingRemoteContent.current = false;
        }
      }
    });

    const unsubscribeSync = subscribeToContentSync((content) => {
      console.log("🔄 EDITOR: Received initial content sync", {
        blocks: content?.content?.length,
      });

      if (editor && content && isInitialized.current) {
        const contentString = JSON.stringify(content);

        if (contentString === lastSentContent.current) {
          console.log("🔄 Ignoring own content (already sent)");
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
          console.log("✅ EDITOR: Successfully applied sync content");
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
    [isConnected, currentUser, permissions, sendContentUpdate]
  );

  const updateEditingPresence = useCallback(() => {
    if (!currentUser || !canEdit) return;

    const now = Date.now();

    if (now - lastPresenceUpdate.current > 2000) {
      console.log("✏️ Updating presence to EDITING");
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
      console.log("👀 Updating presence to VIEWING (idle)");
      updateLightPresence("VIEWING");
      updatePresence({
        status: "VIEWING",
      }).catch(console.error);
    }, 3000);
  }, [currentUser, canEdit, updateLightPresence, updatePresence]);

  const handleEditorSave = useCallback(async () => {
    if (!editor || isSaving.current || !canEdit) {
      console.log("❌ Editor not ready or already saving, skipping save");
      return;
    }

    isSaving.current = true;
    console.log("💾 Editor manual save triggered...");

    try {
      const outputData = editor.getJSON();
      console.log("📦 Data to save:", outputData);

      if (!outputData.content || outputData.content.length === 0) {
        console.log("⚠️ No content to save");
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

      console.log("🔍 Content comparison:", {
        currentLength: normalizedCurrent.length,
        newLength: normalizedNew.length,
        hasChanges: normalizedNew !== normalizedCurrent,
      });

      if (normalizedNew === normalizedCurrent) {
        console.log("✅ No changes detected, skipping save");
        toast.info("No changes to save");
        setHasUnsavedChanges(false);
        return;
      }

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
          console.log("📝 Version created for document changes");
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
      console.log("🏁 Save process finished");
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
        console.log("🎯 EDITOR: Starting document version restore", {
          versionId: version.id,
          versionNumber: version.version,
          versionType: version.type,
          windowMode,
          activeComponent,
          currentComponent: "editor",
        });

        await restoreVersion(version.id, "document");

        console.log("✅ EDITOR: Document version restore completed");

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
              "This version can only be restored in the Whiteboard panel"
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
    [restoreVersion, onSaveSuccess, fileId]
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
    [currentUser, permissions, sendSelectionUpdate]
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
    ]
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
    [currentUser, permissions, sendTypingUpdate, updateEditingPresence]
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
          isDark ? "bg-[#121212]" : "bg-gray-100"
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
        isDark ? "bg-[#121212]" : "bg-gray-100"
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
          className={`flex-1 relative transition-all duration-200 overflow-hidden ${
            showVersionHistory || showCommentSidebar
              ? `border-r ${isDark ? "border-[#2b3133]" : "border-gray-200"}`
              : ""
          } ${isFullscreen ? "" : isDark ? "bg-[#171717]" : "bg-white"}`}
        >
          {canEdit && (
            <EditorToolbar
              editor={editor}
              isDark={isDark}
              isSplitMode={isSplitMode}
            />
          )}

          <div
            className={`h-full overflow-y-auto ${
              isSplitMode
                ? "ml-4 sm:ml-6 mr-4 sm:mr-6 mt-4 sm:mt-6"
                : "ml-4 sm:ml-12 mt-4 sm:mt-6 mr-4 sm:mr-6"
            } tiptap-editor ${isDark ? "dark-editor dark" : ""} ${
              !canEdit ? "select-none" : ""
            }`}
            onMouseMove={canEdit ? handleEditorMouseMove : undefined}
            onMouseLeave={canEdit ? handleEditorMouseLeave : undefined}
            onMouseUp={canEdit ? handleTextSelection : undefined}
            onKeyDown={canEdit ? handleKeyDown : undefined}
            onClick={canEdit ? handleEditorClick : undefined}
          >
            <EditorContent editor={editor} />
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
          <div
            className={`absolute ${
              isDark
                ? "bg-[#252528] border-[#2a2a2d]"
                : "bg-white border-gray-200"
            } border rounded-lg shadow-lg p-3 z-10`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-sm ${
                  isDark ? "text-[#a0a0a0]" : "text-gray-600"
                }`}
              >
                Add comment to:
              </span>
              <span
                className={`text-sm font-medium px-2 py-1 rounded ${
                  isDark ? "bg-yellow-900/30" : "bg-yellow-100"
                }`}
              >
                "{selection.text}"
              </span>
            </div>
            <button
              onClick={() => handleAddComment("Comment on selected text")}
              className={`w-full text-white py-2 px-4 rounded text-sm ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Add Comment
            </button>
          </div>
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
