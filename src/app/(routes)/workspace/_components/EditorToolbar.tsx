"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ChevronDown,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  MoreHorizontal,
  Check,
  Palette,
  Highlighter as HighlighterIcon,
  Table as TableIcon,
  Strikethrough,
  Code as CodeIcon,
  Code2 as Code2Icon,
  Underline,
  Link,
  TextCursor,
  Trash2,
  Columns,
  Rows,
} from "lucide-react";
import { toast } from "sonner";
import { useFilePermissions } from "@/hooks/useFilePermissions";

interface EditorToolbarProps {
  editor: any;
  isDark?: boolean;
  permissions?: "VIEW" | "EDIT";
}

export const TableControls: React.FC<{ editor: any; isDark?: boolean }> = ({
  editor,
  isDark = false,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  const isTableActive = () => {
    return (
      editor?.isActive("table") ||
      editor?.isActive("tableCell") ||
      editor?.isActive("tableHeader")
    );
  };

  const getCellCoordinates = () => {
    if (!editor) return null;

    const { view } = editor;
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;

    const cellNode = $from.node(-1);
    if (
      !cellNode ||
      (cellNode.type.name !== "tableCell" &&
        cellNode.type.name !== "tableHeader")
    ) {
      return null;
    }

    const coords = view.coordsAtPos($from.pos);
    return coords;
  };

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e: Event) => {
      const mouseEvent = e as MouseEvent;

      const target = mouseEvent.target as HTMLElement;
      const isTableCell = target.closest(
        'td, th, [data-type="tableCell"], [data-type="tableHeader"]',
      );

      if (!isTableCell) {
        setVisible(false);
        return;
      }

      mouseEvent.preventDefault();

      if (!isTableActive()) {
        return;
      }

      const cellCoords = getCellCoordinates();
      if (!cellCoords) return;

      const editorElement = document.querySelector(".tiptap");
      if (!editorElement) return;

      const editorRect = editorElement.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      setPosition({
        top: mouseEvent.clientY - editorRect.top + scrollTop,
        left: mouseEvent.clientX - editorRect.left + scrollLeft,
      });

      setVisible(true);
    };

    const handleCellClick = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      const isTableCell = target.closest(
        'td, th, [data-type="tableCell"], [data-type="tableHeader"',
      );

      if (!isTableCell || !isTableActive()) {
        setVisible(false);
        return;
      }

      if (mouseEvent.button === 2) return;

      if (visible) {
        setVisible(false);
      }
    };

    let longPressTimer: NodeJS.Timeout;
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const target = touchEvent.target as HTMLElement;
      const isTableCell = target.closest(
        'td, th, [data-type="tableCell"], [data-type="tableHeader"]',
      );

      if (!isTableCell || !isTableActive()) return;

      longPressTimer = setTimeout(() => {
        const touch = touchEvent.touches[0];
        const fakeMouseEvent = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
        });

        target.dispatchEvent(fakeMouseEvent);
      }, 500);
    };

    const handleTouchEnd = () => {
      clearTimeout(longPressTimer);
    };

    const handleTouchCancel = () => {
      clearTimeout(longPressTimer);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    };

    const editorElement = document.querySelector(".tiptap");
    if (editorElement) {
      editorElement.addEventListener(
        "contextmenu",
        handleContextMenu as EventListener,
      );
      editorElement.addEventListener(
        "mousedown",
        handleCellClick as EventListener,
      );
      editorElement.addEventListener(
        "touchstart",
        handleTouchStart as EventListener,
      );
      editorElement.addEventListener("touchend", handleTouchEnd);
      editorElement.addEventListener("touchcancel", handleTouchCancel);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setVisible(false);
      }
    });

    const handleScroll = () => {
      if (visible) {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      const editorElement = document.querySelector(".tiptap");
      if (editorElement) {
        editorElement.removeEventListener(
          "contextmenu",
          handleContextMenu as EventListener,
        );
        editorElement.removeEventListener(
          "mousedown",
          handleCellClick as EventListener,
        );
        editorElement.removeEventListener(
          "touchstart",
          handleTouchStart as EventListener,
        );
        editorElement.removeEventListener("touchend", handleTouchEnd);
        editorElement.removeEventListener("touchcancel", handleTouchCancel);
      }

      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [editor, visible]);

  const buttonClass = `
    flex items-center justify-center gap-2
    px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium
    w-full text-left
    ${
      isDark
        ? "hover:bg-[#31303B] text-[#e0e0e0] hover:text-white"
        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
    }
  `;

  const deleteButtonClass = `
    flex items-center justify-center gap-2
    px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium
    w-full text-left
    ${
      isDark
        ? "text-red-400 hover:bg-red-900/20"
        : "text-red-600 hover:bg-red-50"
    }
  `;

  const deleteTableButtonClass = `
    flex items-center justify-center gap-2
    px-3 py-2 rounded-md transition-all duration-150 text-sm font-medium
    w-full text-left border-t
    ${
      isDark
        ? "text-red-400 hover:bg-red-900/20 border-[#404040]"
        : "text-red-600 hover:bg-red-50 border-gray-200"
    }
  `;

  const containerClass = `
    fixed z-[9999] flex flex-col gap-1 p-2 rounded-lg border shadow-xl
    ${
      isDark
        ? "bg-[#1e1e1e] border-[#404040] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        : "bg-white border-gray-300 shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
    }
  `;

  const sectionClass = "flex flex-col gap-0.5";

  const sectionTitleClass = `text-xs font-medium px-3 py-1.5 ${
    isDark ? "text-gray-400" : "text-gray-500"
  }`;

  if (!visible || !isTableActive()) {
    return null;
  }

  return (
    <div
      ref={controlsRef}
      className={containerClass}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: "200px",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={sectionClass}>
        <div className={sectionTitleClass}>Columns</div>
        <button
          onClick={() => {
            editor.chain().focus().addColumnBefore().run();
            setVisible(false);
          }}
          className={buttonClass}
          title="Insert column left"
        >
          <Columns className="w-4 h-4" />
          <span>Insert column left</span>
        </button>
        <button
          onClick={() => {
            editor.chain().focus().addColumnAfter().run();
            setVisible(false);
          }}
          className={buttonClass}
          title="Insert column right"
        >
          <Columns className="w-4 h-4 rotate-180" />
          <span>Insert column right</span>
        </button>
        <button
          onClick={() => {
            editor.chain().focus().deleteColumn().run();
            setVisible(false);
          }}
          className={deleteButtonClass}
          title="Delete column"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete column</span>
        </button>
      </div>

      <div
        className={`${sectionClass} pt-1 border-t ${
          isDark ? "border-[#404040]" : "border-gray-200"
        }`}
      >
        <div className={sectionTitleClass}>Rows</div>
        <button
          onClick={() => {
            editor.chain().focus().addRowBefore().run();
            setVisible(false);
          }}
          className={buttonClass}
          title="Insert row above"
        >
          <Rows className="w-4 h-4" />
          <span>Insert row above</span>
        </button>
        <button
          onClick={() => {
            editor.chain().focus().addRowAfter().run();
            setVisible(false);
          }}
          className={buttonClass}
          title="Insert row below"
        >
          <Rows className="w-4 h-4 rotate-180" />
          <span>Insert row below</span>
        </button>
        <button
          onClick={() => {
            editor.chain().focus().deleteRow().run();
            setVisible(false);
          }}
          className={deleteButtonClass}
          title="Delete row"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete row</span>
        </button>
      </div>

      <div
        className={`pt-1 border-t ${
          isDark ? "border-[#404040]" : "border-gray-200"
        }`}
      >
        <button
          onClick={() => {
            editor.chain().focus().deleteTable().run();
            setVisible(false);
          }}
          className={deleteTableButtonClass}
          title="Delete table"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete table</span>
        </button>
      </div>
    </div>
  );
};

interface EditorToolbarProps {
  editor: any;
  isDark?: boolean;
  isSplitMode?: boolean;
  handleEditorSave?: () => Promise<void>;
  fileId?: string;
}

interface EditorToolbarProps {
  editor: any;
  isDark?: boolean;
  isSplitMode?: boolean;
  handleEditorSave?: () => Promise<void>;
  fileId?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isDark = false,
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

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTabletWidth = width >= 768 && width < 1024;

      setIsMobile(width < 768);
      setIsTablet(isTabletWidth);

      if (isTabletWidth) {
        setIsPortrait(height > width);
      } else {
        setIsPortrait(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    window.addEventListener("orientationchange", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("orientationchange", checkScreenSize);
    };
  }, []);

  const getToolbarMaxWidth = () => {
    if (isMobile) return "max-w-[96vw]";
    if (isTablet && isPortrait) return "max-w-[85vw]";
    if (isTablet) return "max-w-[90vw]";
    return "max-w-[780px]";
  };

  const isHeadingActive = () => {
    return (
      editor?.isActive("heading", { level: 1 }) ||
      editor?.isActive("heading", { level: 2 }) ||
      editor?.isActive("heading", { level: 3 }) ||
      editor?.isActive("heading", { level: 4 })
    );
  };

  const getContainerClass = () => {
    const baseClass = `z-10 mx-auto flex justify-center items-center py-1.5 ${
      isMobile ? "px-2" : "px-4 sm:px-6"
    } rounded-md ${
      isDark
        ? "bg-[#232329] shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.02)]"
        : "bg-white shadow-[0_0.5px_1px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-black/5 backdrop-blur-sm"
    }`;

    return `
    ${baseClass}
    ${getToolbarMaxWidth()}
    transition-[max-width] duration-300 ease-in-out
  `;
  };

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

  const getButtonClass = (isActive = false) => {
    const sizeClass = isMobile ? "w-7 h-7" : "w-8 h-8";
    const baseClass = `
      group relative flex items-center justify-center
      ${sizeClass} rounded-md transition-all duration-150
    `;

    if (isActive) {
      return `${baseClass} ${
        isDark ? "bg-[#403E6A] text-white" : "bg-[#E0DFFF] text-gray-900"
      }`;
    }

    return `${baseClass} ${
      isDark
        ? "hover:bg-[#31303B] text-[#e0e0e0] hover:text-white hover:border-[#555]"
        : "hover:bg-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-400"
    }`;
  };

  const getMoreButtonClass = () => {
    const sizeClass = isMobile ? "w-7 h-7" : "w-8 h-8";
    return `
      group relative flex items-center justify-center
      ${sizeClass} rounded-md transition-all duration-150 ml-1
      ${
        isDark
          ? "hover:bg-[#31303B] text-[#e0e0e0] hover:text-white hover:border-[#555]"
          : "hover:bg-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-400"
      }
    `;
  };

  const getDropdownButtonClass = () => {
    const widthClass = isMobile ? "min-w-[70px]" : "min-w-[100px]";
    const heightClass = isMobile ? "h-7" : "h-8";
    const paddingClass = isMobile ? "px-1.5" : "px-3";

    return `
      group relative flex items-center justify-center
      ${widthClass} ${heightClass} ${paddingClass} rounded-md transition-all duration-150 ml-1
      ${
        isDark
          ? "hover:bg-[#232329] text-[#e0e0e0] hover:text-white border border-[#404040] hover:border-[#555]"
          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400"
      }
    `;
  };

  const dropdownClass = `
    absolute z-[9999] ${
      isMobile ? "min-w-[150px]" : "min-w-[180px]"
    } rounded-lg border shadow-xl
    ${
      isDark
        ? "bg-[#1e1e1e] border-[#404040] shadow-[0_12px_48px_rgba(0,0,0,0.48)]"
        : "bg-white border-gray-300 shadow-[0_12px_48px_rgba(0,0,0,0.16)]"
    }
  `;

  const dropdownItemClass = `
    w-full flex items-center justify-between px-3 py-2 ${
      isMobile ? "text-xs" : "text-sm"
    }
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
      className={`w-px h-5 mx-0.5 sm:mx-1 ${
        isDark ? "bg-[#404040]" : "bg-gray-300"
      }`}
    />
  );

  const getCurrentHeadingLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    if (editor.isActive("heading", { level: 4 })) return "H4";
    return isMobile ? "Text" : "Text";
  };

  const getCurrentHeadingIcon = () => {
    if (editor.isActive("heading", { level: 1 }))
      return <Heading1 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />;
    if (editor.isActive("heading", { level: 2 }))
      return <Heading2 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />;
    if (editor.isActive("heading", { level: 3 }))
      return <Heading3 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />;
    if (editor.isActive("heading", { level: 4 }))
      return <Heading4 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />;
    return <Type className={isMobile ? "w-3 h-3" : "w-4 h-4"} />;
  };

  const addTable = () => {
    if (!editor) return;

    try {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
      setShowMoreMenu(false);
    } catch (error) {
      console.error("Error inserting table:", error);
      toast.error("Failed to insert table");
    }
  };

  const clearFormat = () => {
    if (!editor) return;

    try {
      editor.chain().focus().clearNodes().unsetAllMarks().run();
      setShowMoreMenu(false);
    } catch (error) {
      console.error("Error clearing format:", error);
    }
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setShowMoreMenu(false);
  };

  const IconWrapper = ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <span className={isMobile ? "scale-85" : ""} title={title}>
      {" "}
      {children}
    </span>
  );

  const shouldHideButtons = isTablet && isPortrait;

  const renderFormattingButtons = () => (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={getButtonClass(editor.isActive("bold"))}
        title="Bold"
      >
        <IconWrapper title="Bold">
          <BoldIcon className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </IconWrapper>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={getButtonClass(editor.isActive("italic"))}
        title="Italic"
      >
        <IconWrapper title="Italic">
          <ItalicIcon className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </IconWrapper>
      </button>

      {!isMobile && !shouldHideButtons && (
        <>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={getButtonClass(editor.isActive("strike"))}
            title="Strikethrough"
          >
            <IconWrapper title="Strikethrough">
              <Strikethrough className="w-4 h-4" />
            </IconWrapper>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={getButtonClass(editor.isActive("code"))}
            title="Inline Code"
          >
            <IconWrapper title="Inline Code">
              <CodeIcon className="w-4 h-4" />
            </IconWrapper>
          </button>
        </>
      )}
    </div>
  );

  const renderAlignmentButtons = () => (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={getButtonClass(editor.isActive({ textAlign: "left" }))}
        title="Align Left"
      >
        <IconWrapper title="Align Left">
          <AlignLeft className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </IconWrapper>
      </button>
      {!isMobile && (
        <>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={getButtonClass(editor.isActive({ textAlign: "center" }))}
            title="Center"
          >
            <IconWrapper title="Center">
              <AlignCenter className="w-4 h-4" />
            </IconWrapper>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={getButtonClass(editor.isActive({ textAlign: "right" }))}
            title="Align Right"
          >
            <IconWrapper title="Align Right">
              <AlignRight className="w-4 h-4" />
            </IconWrapper>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={getButtonClass(
              editor.isActive({ textAlign: "justify" }),
            )}
            title="Justify"
          >
            <IconWrapper title="Justify">
              <AlignJustify className="w-4 h-4" />
            </IconWrapper>
          </button>
        </>
      )}
    </div>
  );

  const renderListButtons = () => (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={getButtonClass(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <IconWrapper title="Bullet List">
          <List className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </IconWrapper>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={getButtonClass(editor.isActive("orderedList"))}
        title="Numbered List"
      >
        <IconWrapper title="Numbered List">
          <ListOrdered className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </IconWrapper>
      </button>
    </div>
  );

  const renderBlockButtons = () => (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {!isMobile && !shouldHideButtons && (
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={getButtonClass(editor.isActive("codeBlock"))}
          title="Code Block"
        >
          <IconWrapper title="Code Block">
            <Code2Icon className="w-4 h-4" />
          </IconWrapper>
        </button>
      )}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={getButtonClass(editor.isActive("blockquote"))}
        title="Blockquote"
      >
        <IconWrapper title="Blockquote">
          <Quote className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </IconWrapper>
      </button>
      {!isMobile && !shouldHideButtons && (
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={getButtonClass()}
          title="Divider"
        >
          <IconWrapper title="Divider">
            <Minus className="w-4 h-4" />
          </IconWrapper>
        </button>
      )}
    </div>
  );

  return (
    <div className={getContainerClass()}>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${getButtonClass()} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Undo"
        >
          <Undo className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${getButtonClass()} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Redo"
        >
          <Redo className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
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
          className={getDropdownButtonClass()}
          title="Text Style"
        >
          <span className="flex items-center gap-1 sm:gap-2">
            {getCurrentHeadingIcon()}
            <span
              className={`${
                isMobile ? "text-xs" : "text-sm"
              } font-medium truncate ${
                isHeadingActive()
                  ? isMobile
                    ? "max-w-8"
                    : "max-w-[70px]"
                  : isMobile
                    ? "max-w-[25px]"
                    : "max-w-[60px]"
              }`}
            >
              {getCurrentHeadingLabel()}
            </span>
            <ChevronDown
              className={`${
                isMobile ? "w-2.5 h-2.5" : "w-3 h-3"
              } ml-0.5 sm:ml-1 shrink-0`}
            />
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
                  <Type className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                  <span>Text</span>
                </div>
                {editor.isActive("paragraph") && (
                  <Check className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
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
                  <Heading1 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                  <span>Heading 1</span>
                </div>
                {editor.isActive("heading", { level: 1 }) && (
                  <Check className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
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
                  <Heading2 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                  <span>Heading 2</span>
                </div>
                {editor.isActive("heading", { level: 2 }) && (
                  <Check className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
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
                  <Heading3 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                  <span>Heading 3</span>
                </div>
                {editor.isActive("heading", { level: 3 }) && (
                  <Check className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
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
                  <Heading4 className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                  <span>Heading 4</span>
                </div>
                {editor.isActive("heading", { level: 4 }) && (
                  <Check className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {renderFormattingButtons()}

      <Separator />

      {!isMobile && (
        <>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="relative" ref={colorWrapperRef}>
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowHeadingMenu(false);
                  setShowHighlightPicker(false);
                  setShowMoreMenu(false);
                }}
                className={getButtonClass()}
                title="Text Color"
              >
                <IconWrapper title="Text Color">
                  <Palette className="w-4 h-4" />
                </IconWrapper>
              </button>

              {showColorPicker && (
                <div
                  className={`${dropdownClass} p-3 ${
                    isMobile ? "w-40" : "w-[200px]"
                  } top-full left-0 mt-1`}
                >
                  <div
                    className={`grid ${
                      isMobile ? "grid-cols-4 gap-1" : "grid-cols-5 gap-2"
                    }`}
                  >
                    {textColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor.chain().focus().setColor(color).run();
                          setShowColorPicker(false);
                        }}
                        className={`${
                          isMobile ? "w-6 h-6" : "w-7 h-7"
                        } rounded-md border-2 border-transparent hover:border-blue-500 hover:scale-110 transition-all`}
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
                    className={`w-full mt-2 px-3 py-2 ${
                      isMobile ? "text-xs" : "text-sm"
                    } rounded-md transition-colors ${
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
                className={getButtonClass(editor.isActive("highlight"))}
                title="Highlight"
              >
                <IconWrapper title="Highlight">
                  <HighlighterIcon className="w-4 h-4" />
                </IconWrapper>
              </button>

              {showHighlightPicker && (
                <div
                  className={`${dropdownClass} p-3 ${
                    isMobile ? "w-[140px]" : "w-[180px]"
                  } top-full left-0 mt-1`}
                >
                  <div
                    className={`grid ${
                      isMobile ? "grid-cols-3 gap-1" : "grid-cols-4 gap-2"
                    }`}
                  >
                    {highlightColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor
                            .chain()
                            .focus()
                            .toggleHighlight({ color })
                            .run();
                          setShowHighlightPicker(false);
                        }}
                        className={`${
                          isMobile ? "w-6 h-6" : "w-8 h-8"
                        } rounded-md border-2 border-transparent hover:border-blue-500 hover:scale-110 transition-all`}
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
                    className={`w-full mt-2 px-3 py-2 ${
                      isMobile ? "text-xs" : "text-sm"
                    } rounded-md transition-colors ${
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
        </>
      )}

      {renderAlignmentButtons()}

      <Separator />

      {renderListButtons()}

      <Separator />

      {renderBlockButtons()}

      <div className="relative" ref={moreWrapperRef}>
        <button
          onClick={() => {
            setShowMoreMenu(!showMoreMenu);
            setShowHeadingMenu(false);
            setShowColorPicker(false);
            setShowHighlightPicker(false);
          }}
          className={getMoreButtonClass()}
          title="More"
        >
          <MoreHorizontal className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
        </button>

        {showMoreMenu && (
          <div
            className={`${dropdownClass} top-full ${
              isMobile ? "right-0" : "right-0"
            } mt-1`}
          >
            <div className="py-1">
              <button onClick={addTable} className={dropdownItemClass}>
                <div className="flex items-center gap-2">
                  <TableIcon className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                  <span>Insert Table</span>
                </div>
              </button>

              {isMobile && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                  <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Alignment
                  </div>
                  <button
                    onClick={() =>
                      editor.chain().focus().setTextAlign("left").run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Align Left</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().setTextAlign("center").run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Align Center</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().setTextAlign("right").run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <AlignRight className="w-3.5 h-3.5" />
                      <span>Align Right</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().setTextAlign("justify").run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <AlignJustify className="w-3.5 h-3.5" />
                      <span>Justify</span>
                    </div>
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                  <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Formatting
                  </div>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <Strikethrough className="w-3.5 h-3.5" />
                      <span>Strikethrough</span>
                    </div>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <CodeIcon className="w-3.5 h-3.5" />
                      <span>Inline Code</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <Underline className="w-3.5 h-3.5" />
                      <span>Underline</span>
                    </div>
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                  <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Blocks
                  </div>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleCodeBlock().run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <Code2Icon className="w-3.5 h-3.5" />
                      <span>Code Block</span>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().setHorizontalRule().run()
                    }
                    className={dropdownItemClass}
                  >
                    <div className="flex items-center gap-2">
                      <Minus className="w-3.5 h-3.5" />
                      <span>Divider</span>
                    </div>
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                  <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Media
                  </div>
                  <button onClick={insertLink} className={dropdownItemClass}>
                    <div className="flex items-center gap-2">
                      <Link className="w-3.5 h-3.5" />
                      <span>Insert Link</span>
                    </div>
                  </button>
                </>
              )}

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

              <button onClick={clearFormat} className={dropdownItemClass}>
                <div className="flex items-center gap-2">
                  <TextCursor
                    className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"}
                  />
                  <span>Clear Format</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
