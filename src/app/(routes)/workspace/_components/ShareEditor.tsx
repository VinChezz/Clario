"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FILE } from "@/shared/types/file.interface";
import { toast } from "sonner";
import { Save, CheckCircle2, Loader2 } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";
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

interface EditorProps {
  fileId: string;
  fileData: any | null;
  onSaveTrigger: number;
  onSaveSuccess?: () => void;
  isPublicAccess?: boolean;
  permissions?: "VIEW" | "EDIT";
}

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

export default function ShareEditor({
  fileId,
  fileData,
  onSaveTrigger,
  onSaveSuccess,
  isPublicAccess = false,
  permissions = "EDIT",
}: EditorProps) {
  const [editorData, setEditorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialRender = useRef(true);
  const lastSavedContent = useRef<string>("");
  const originalContent = useRef<string>("");

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
    editable: permissions === "EDIT",
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert focus:outline-none max-w-none min-h-[800px] p-4 ${
          isDarkMode ? "dark-editor" : ""
        } ${
          permissions === "VIEW" ? "cursor-default pointer-events-none" : ""
        }`,
      },
    },
    onUpdate: ({ editor }) => {
      if (permissions === "VIEW") return;

      const json = editor.getJSON();
      const contentString = JSON.stringify(json);

      if (originalContent.current !== contentString) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }
    },
  });

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        window.matchMedia("(prefers-color-scheme: dark)").matches ||
        document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => mediaQuery.removeEventListener("change", checkDarkMode);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const editorElement = document.querySelector(".tiptap");
    if (editorElement) {
      if (isDarkMode) {
        editorElement.classList.add("dark-theme");
        editorElement.classList.add("dark");
      } else {
        editorElement.classList.remove("dark-theme");
        editorElement.classList.remove("dark");
      }
    }
  }, [isDarkMode, editor]);

  useEffect(() => {
    if (!fileData) {
      setEditorData(defaultContent);
      originalContent.current = JSON.stringify(defaultContent);
      setLoading(false);
      return;
    }

    if (isInitialRender.current) {
      let initialData = defaultContent;

      if (fileData.document) {
        try {
          if (typeof fileData.document === "string") {
            console.log("🔤 Parsing string document");
            try {
              const parsedData = JSON.parse(fileData.document);
              console.log("✅ Parsed document:", parsedData);

              if (parsedData?.content?.length > 0) {
                initialData = parsedData;
                console.log("✅ Loaded document from string");
                lastSavedContent.current = fileData.document;
                originalContent.current = fileData.document;
              } else {
                console.log("⚠️ Parsed document has no content");
                originalContent.current = JSON.stringify(defaultContent);
              }
            } catch (parseError) {
              console.error("❌ Error parsing document as JSON:", parseError);

              if (typeof fileData.document === "object") {
                initialData = fileData.document;
                originalContent.current = JSON.stringify(fileData.document);
              } else {
                originalContent.current = JSON.stringify(defaultContent);
              }
            }
          } else if (
            typeof fileData.document === "object" &&
            fileData.document !== null
          ) {
            console.log("📦 Using object document:", fileData.document);

            if (fileData.document.content?.length > 0) {
              initialData = fileData.document;
              console.log("✅ Loaded document from object");
              lastSavedContent.current = JSON.stringify(fileData.document);
              originalContent.current = JSON.stringify(fileData.document);
            } else {
              console.log("⚠️ Object document has no content");
              originalContent.current = JSON.stringify(defaultContent);
            }
          }
        } catch (parseError) {
          console.error("❌ Error parsing document:", parseError);
          originalContent.current = JSON.stringify(defaultContent);
        }
      } else {
        console.log("⚠️ No document data found in fileData");
        originalContent.current = JSON.stringify(defaultContent);
      }

      console.log("🚀 Setting editor data:", initialData);
      setEditorData(initialData);
      setLoading(false);
      isInitialRender.current = false;
    }
  }, [fileData]);

  useEffect(() => {
    if (editor && editorData) {
      try {
        editor.commands.setContent(editorData);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("❌ Error setting editor content:", error);
      }
    }
  }, [editor, editorData]);

  const saveDocument = useCallback(async () => {
    if (!editor || isSaving || permissions === "VIEW") {
      console.log("❌ Editor not ready, already saving, or view-only mode");
      return;
    }

    setIsSaving(true);

    try {
      const outputData = editor.getJSON();
      console.log("💾 Saving document:", outputData);

      if (!outputData.content || outputData.content.length === 0) {
        console.log("⚠️ No content to save");
        toast.info("No content to save");
        setIsSaving(false);
        return;
      }

      const contentString = JSON.stringify(outputData);

      if (originalContent.current === contentString) {
        toast.info("No changes to save");
        setHasUnsavedChanges(false);
        setIsSaving(false);
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

      console.log("✅ Save successful!");
      toast.success("Document saved successfully!");

      originalContent.current = contentString;
      lastSavedContent.current = contentString;
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      console.error("💥 Save error:", err);
      toast.error(
        err instanceof Error ? err.message : "Error saving document!",
      );
    } finally {
      setIsSaving(false);
    }
  }, [editor, fileId, onSaveSuccess, permissions]);

  useEffect(() => {
    if (onSaveTrigger > 0 && permissions === "EDIT") {
      saveDocument();
    }
  }, [onSaveTrigger, saveDocument, permissions]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

    if (diff < 60) return "Saved just now";
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} min ago`;
    return `Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading editor...</div>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg text-gray-500">Initializing editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode
            ? "bg-[#1e1e1e] border-[#333]"
            : "bg-gray-50/80 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Document
          </span>
        </div>

        <div className="flex items-center gap-3">
          {permissions === "EDIT" && (
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <span
                  className={`text-xs ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                >
                  Unsaved changes
                </span>
              ) : lastSaved ? (
                <span
                  className={`text-xs flex items-center gap-1.5 ${
                    isDarkMode ? "text-emerald-400" : "text-emerald-600"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {formatLastSaved()}
                </span>
              ) : null}

              <button
                onClick={saveDocument}
                disabled={isSaving || !hasUnsavedChanges}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    hasUnsavedChanges
                      ? isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                      : isDarkMode
                        ? "bg-emerald-600/80 text-white"
                        : "bg-emerald-600/90 text-white"
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Saved</span>
                  </>
                )}
              </button>
            </div>
          )}

          {permissions === "VIEW" && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span>Read-only mode</span>
            </div>
          )}
        </div>
      </div>

      {permissions === "EDIT" && (
        <div
          className={`flex items-center justify-center pt-3 ${
            isDarkMode
              ? "bg-[#171717] border-[#333]"
              : "bg-gray-50/80 border-gray-200"
          }`}
        >
          <EditorToolbar
            editor={editor}
            isDark={isDarkMode}
            permissions={permissions}
          />
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto ${
          isDarkMode ? "bg-[#171717]" : "bg-white"
        }`}
      >
        <div
          className={`tiptap-editor ${isDarkMode ? "dark-editor dark" : ""} ${
            permissions === "VIEW" ? "select-none" : ""
          }`}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
