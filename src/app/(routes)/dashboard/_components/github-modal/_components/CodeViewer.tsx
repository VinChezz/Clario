"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Monitor,
  WrapText,
  Check,
  FileCode,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/app/_context/AppearanceContext";
import { useEditorSettings } from "@/hooks/useEditorSettings";

interface CodeViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
  repoUrl: string;
  branch: string;
  teamId: string;
}

export function CodeViewerModal({
  open,
  onOpenChange,
  filePath,
  fileName,
  repoUrl,
  branch,
  teamId,
}: CodeViewerModalProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileInfo, setFileInfo] = useState({
    size: 0,
    lines: 0,
    language: "",
    encoding: "UTF-8",
    lineEndings: "LF",
  });

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [indentInfo, setIndentInfo] = useState({ type: "Spaces", size: 2 });

  const codeContainerRef = useRef<HTMLDivElement>(null);
  const { theme, fontSize, isDark, setTheme, setFontSize } = useTheme();
  const { settings: editorSettings, updateSettings } = useEditorSettings();

  const { wrapLines, lineNumbers } = editorSettings;

  const getFontSizeValue = (): string => {
    switch (fontSize) {
      case "SMALL":
        return "13px";
      case "MEDIUM":
        return "14px";
      case "LARGE":
        return "15px";
      default:
        return "14px";
    }
  };

  const fontSizeValue = getFontSizeValue();

  const detectLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const name = filename.toLowerCase();

    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "tsx",
      js: "javascript",
      jsx: "jsx",
      mjs: "javascript",
      cjs: "javascript",
      py: "python",
      pyw: "python",
      java: "java",
      go: "go",
      rs: "rust",
      css: "css",
      scss: "scss",
      sass: "sass",
      less: "less",
      html: "html",
      htm: "html",
      json: "json",
      xml: "xml",
      yml: "yaml",
      yaml: "yaml",
      rb: "ruby",
      php: "php",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      swift: "Swift",
      kt: "kotlin",
      scala: "scala",
      r: "r",
      pl: "perl",
      lua: "lua",
      sql: "sql",
      sh: "bash",
      bash: "bash",
      ps1: "powershell",
      bat: "batch",
      dockerfile: "dockerfile",
      md: "markdown",
      markdown: "markdown",
      txt: "text",
      env: "bash",
      gitignore: "git",
      dockerignore: "dockerfile",
      makefile: "makefile",
      lock: "json",
      svg: "xml",
      graphql: "graphql",
      gql: "graphql",
    };

    if (name === "dockerfile") return "dockerfile";
    if (name === "makefile") return "makefile";
    if (name === "gemfile") return "ruby";
    if (name === "rakefile") return "ruby";
    if (name === "readme") return "markdown";
    if (name === "license") return "text";
    if (name.includes("docker-compose")) return "yaml";

    return langMap[ext] || "text";
  };

  const getLanguageDisplayName = (lang: string): string => {
    const displayNames: Record<string, string> = {
      typescript: "TypeScript",
      tsx: "TypeScript React",
      javascript: "JavaScript",
      jsx: "JavaScript React",
      python: "Python",
      java: "Java",
      go: "Go",
      rust: "Rust",
      css: "CSS",
      scss: "SCSS",
      sass: "SASS",
      less: "LESS",
      html: "HTML",
      json: "JSON",
      xml: "XML",
      yaml: "YAML",
      ruby: "Ruby",
      php: "PHP",
      cpp: "C++",
      c: "C",
      csharp: "C#",
      swift: "Swift",
      kotlin: "Kotlin",
      scala: "Scala",
      r: "R",
      perl: "Perl",
      lua: "Lua",
      sql: "SQL",
      bash: "Bash",
      powershell: "PowerShell",
      batch: "Batch",
      git: "Git",
      dockerfile: "Dockerfile",
      makefile: "Makefile",
      markdown: "Markdown",
      text: "Text",
      toml: "TOML",
      ini: "INI",
      cmake: "CMake",
      graphql: "GraphQL",
    };

    return displayNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const detectIndentation = (content: string) => {
    const lines = content.split("\n");
    let spacesCount = 0;
    let tabsCount = 0;

    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i];
      if (line.startsWith(" ")) {
        const leadingSpaces = line.match(/^ +/)?.[0].length || 0;
        if (leadingSpaces > 0) {
          spacesCount++;
        }
      } else if (line.startsWith("\t")) {
        tabsCount++;
      }
    }

    if (tabsCount > spacesCount) {
      return { type: "Tabs", size: 1 };
    }

    if (spacesCount > 0) {
      for (let i = 0; i < Math.min(lines.length, 50); i++) {
        const line = lines[i];
        if (line.startsWith("  ") && !line.startsWith("   ")) {
          return { type: "Spaces", size: 2 };
        }
        if (line.startsWith("    ")) {
          return { type: "Spaces", size: 4 };
        }
      }
    }

    return { type: "Spaces", size: 2 };
  };

  const detectLineEndings = (content: string) => {
    if (content.includes("\r\n")) {
      return "CRLF";
    }
    return "LF";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const fetchFile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL("/api/github/file", window.location.origin);
      url.searchParams.set("teamId", teamId);
      url.searchParams.set("path", filePath);
      url.searchParams.set("branch", branch);

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        setContent(result.content);
        const detectedLang = detectLanguage(fileName);
        const indentInfo = detectIndentation(result.content);
        const lineEndings = detectLineEndings(result.content);

        setFileInfo({
          size: result.size,
          lines: result.content.split("\n").length,
          language: detectedLang,
          encoding: "UTF-8",
          lineEndings: lineEndings,
        });

        setIndentInfo(indentInfo);
      } else {
        setError(result.error || "Failed to load file");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [filePath, branch, teamId, fileName]);

  useEffect(() => {
    if (open) {
      fetchFile();
    } else {
      setContent("");
      setError(null);
      setIsFullscreen(false);
      setCopied(false);
    }
  }, [open, fetchFile]);

  useEffect(() => {
    const handleScroll = () => {
      if (!codeContainerRef.current || !content) return;

      const container = codeContainerRef.current;
      const scrollTop = container.scrollTop;
      const lineHeight = 24;
      const visibleLines = Math.floor(container.clientHeight / lineHeight);
      const currentLine = Math.floor(scrollTop / lineHeight) + 1;

      setCursorPosition({
        line: Math.min(currentLine, fileInfo.lines),
        column: 1,
      });
    };

    const container = codeContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [content, fileInfo.lines]);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInGithub = () => {
    const url = `${repoUrl}/blob/${branch}/${filePath}`;
    window.open(url, "_blank");
  };

  const cycleTheme = () => {
    const themes: Array<"LIGHT" | "DARK" | "AUTO"> = ["LIGHT", "DARK", "AUTO"];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(newTheme);
  };

  const scrollToTop = () =>
    codeContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    codeContainerRef.current?.scrollTo({
      top: codeContainerRef.current.scrollHeight,
      behavior: "smooth",
    });

  const getScrollPercentage = () => {
    if (!codeContainerRef.current || !content) return 0;
    const container = codeContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    return scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
  };

  const githubLightStyle = {
    ...vs,
    'code[class*="language-"]': {
      ...vs['code[class*="language-"]'],
      fontSize: fontSizeValue,
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    'pre[class*="language-"]': {
      ...vs['pre[class*="language-"]'],
      fontSize: fontSizeValue,
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      background: "#ffffff",
      margin: 0,
      padding: "16px 0",
    },
  };

  const githubDarkStyle = {
    ...vscDarkPlus,
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      fontSize: fontSizeValue,
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      fontSize: fontSizeValue,
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      background: "#0d1117",
      margin: 0,
      padding: "16px 0",
    },
  };

  const iconColorClass = isDark ? "text-gray-300" : "text-gray-600";
  const bgClass = isDark ? "bg-[#0d1117]" : "bg-white";
  const textClass = isDark ? "text-gray-100" : "text-gray-900";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={{
          width: isFullscreen ? "98vw" : "90vw",
          height: isFullscreen ? "98vh" : "85vh",
          maxWidth: "none",
          maxHeight: "none",
        }}
        className={cn(
          "p-0 gap-0 border-0 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
          bgClass,
          isDark ? "border border-gray-800" : "border border-gray-200",
        )}
      >
        <style jsx>{`
          :global([data-state="open"] [data-dialog-close]) {
            display: none;
          }
        `}</style>
        <DialogTitle>
          <VisuallyHidden>{fileName}</VisuallyHidden>
        </DialogTitle>

        <div
          className={cn(
            "flex items-center justify-between px-3 py-4 border-b shrink-0 backdrop-blur-xl",
            isDark
              ? "border-gray-800 bg-[#161b22]/95"
              : "border-gray-200 bg-white/95",
          )}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isDark
                  ? "bg-blue-900/30 text-blue-400 border border-blue-800/50"
                  : "bg-blue-50 text-blue-600 border border-blue-200",
              )}
            >
              <FileCode className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={cn("font-semibold text-lg truncate", textClass)}>
                  {fileName}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-mono",
                    isDark
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700",
                  )}
                >
                  {getLanguageDisplayName(fileInfo.language)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <p
                  className={cn(
                    "truncate font-mono text-sm",
                    isDark ? "text-gray-400" : "text-gray-600",
                  )}
                >
                  {filePath}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className={isDark ? "text-gray-500" : "text-gray-500"}>
                    {fileInfo.lines} lines
                  </span>
                  <span className={isDark ? "text-gray-500" : "text-gray-500"}>
                    {formatSize(fileInfo.size)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 pr-6">
            <Button
              size="sm"
              variant="ghost"
              onClick={cycleTheme}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title={`Theme: ${theme}`}
            >
              {theme === "AUTO" ? (
                <Monitor className={cn("w-4 h-4", iconColorClass)} />
              ) : theme === "LIGHT" ? (
                <Sun className={cn("w-4 h-4", iconColorClass)} />
              ) : (
                <Moon className={cn("w-4 h-4", iconColorClass)} />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={scrollToTop}
              disabled={!content}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title="Scroll to top"
            >
              <ArrowUp className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={scrollToBottom}
              disabled={!content}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title="Scroll to bottom"
            >
              <ArrowDown className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <div
              className={cn(
                "w-px h-6 mx-1",
                isDark ? "bg-gray-700" : "bg-gray-300",
              )}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className={cn("w-4 h-4", iconColorClass)} />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title="Download file"
            >
              <Download className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleOpenInGithub}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title="Open in GitHub"
            >
              <ExternalLink className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200",
              )}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className={cn("w-4 h-4", iconColorClass)} />
              ) : (
                <Maximize2 className={cn("w-4 h-4", iconColorClass)} />
              )}
            </Button>
            <div
              className={cn(
                "w-px h-6 mx-1",
                isDark ? "bg-gray-700" : "bg-gray-300",
              )}
            />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-9 w-9 p-0",
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-300",
              )}
            >
              <X
                className={cn(
                  "w-4 h-4",
                  isDark ? "text-white" : "text-gray-700",
                )}
              />
            </Button>
          </div>
        </div>

        <div
          ref={codeContainerRef}
          className="flex-1 overflow-auto relative"
          style={{
            scrollbarWidth: "thin",
            scrollbarGutter: "stable",
          }}
        >
          {isLoading ? (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                isDark ? "bg-[#0d1117]" : "bg-white",
              )}
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-gray-300" : "text-gray-600",
                  )}
                >
                  Loading...
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                isDark ? "bg-[#0d1117]" : "bg-white",
              )}
            >
              <div className="text-center">
                <div
                  className={cn(
                    "text-lg mb-2",
                    isDark ? "text-red-400" : "text-red-600",
                  )}
                >
                  Error loading file
                </div>
                <div
                  className={cn(
                    "text-sm",
                    isDark ? "text-gray-300" : "text-gray-600",
                  )}
                >
                  {error}
                </div>
              </div>
            </div>
          ) : (
            <SyntaxHighlighter
              language={fileInfo.language}
              style={isDark ? githubDarkStyle : githubLightStyle}
              showLineNumbers={lineNumbers}
              wrapLongLines={wrapLines}
              wrapLines={wrapLines}
              lineNumberStyle={{
                color: isDark ? "#888888" : "#1f2328",
                paddingRight: "16px",
                paddingLeft: "16px",
                minWidth: "50px",
                textAlign: "right",
                userSelect: "none",
                fontSize: "12px",
                fontWeight: "400",
                backgroundColor: isDark ? "#0d1117" : "#ffffff",
                borderRight: isDark ? "1px solid #30363d" : "1px solid #e1e4e8",
              }}
              lineNumberContainerStyle={{
                paddingRight: "0",
                float: "left",
                backgroundColor: isDark ? "#0d1117" : "#ffffff",
              }}
              customStyle={{
                margin: 0,
                padding: "16px 0",
                background: isDark ? "#0d1117" : "#ffffff",
                fontSize: fontSizeValue,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                fontWeight: "400",
                lineHeight: 1.5,
                color: isDark ? "#f0f6fc" : "#1f2328",
                border: "none",
              }}
              codeTagProps={{
                style: {
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                  fontWeight: "400",
                },
              }}
            >
              {content}
            </SyntaxHighlighter>
          )}
        </div>

        {!isLoading && !error && content && (
          <div
            className={cn(
              "flex items-center justify-between px-4 py-2 text-xs border-t",
              isDark
                ? "border-gray-800 bg-[#161b22]/80 text-gray-300"
                : "border-gray-200 bg-gray-50/80 text-gray-600",
            )}
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Branch: {branch}
              </span>
              <span>{fileInfo.encoding}</span>
              <span>{fileInfo.lineEndings}</span>
              <span>{getLanguageDisplayName(fileInfo.language)}</span>
              <span>Font: {fontSize}</span>
              <span>Wrap: {wrapLines ? "ON" : "OFF"}</span>
              <span>Line #: {lineNumbers ? "ON" : "OFF"}</span>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Ln {cursorPosition.line}, Col {cursorPosition.column}
              </span>
              <span>{getScrollPercentage()}%</span>
              <div
                className={cn(
                  "w-px h-4",
                  isDark ? "bg-gray-600" : "bg-gray-300",
                )}
              />
              <span>
                {indentInfo.type}: {indentInfo.size}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
