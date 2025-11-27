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
  ChevronDown,
  FileCode,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
  repoUrl: string;
  branch: string;
  teamId: string;
}

type Theme = "light" | "dark" | "auto";

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
  const [theme, setTheme] = useState<Theme>("auto");
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("dark");
  const [wrapLines, setWrapLines] = useState(false);
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
      pyc: "python",
      java: "java",
      class: "java",
      jar: "java",
      go: "go",
      rs: "rust",
      rlib: "rust",
      css: "css",
      scss: "scss",
      sass: "sass",
      less: "less",
      html: "html",
      htm: "html",
      xhtml: "html",
      json: "json",
      json5: "json",
      jsonc: "json",
      xml: "xml",
      yml: "yaml",
      yaml: "yaml",
      rb: "ruby",
      erb: "ruby",
      php: "php",
      phtml: "php",
      php4: "php",
      php5: "php",
      php7: "php",
      phps: "php",
      cpp: "cpp",
      cc: "cpp",
      cxx: "cpp",
      c: "c",
      h: "c",
      cs: "csharp",
      swift: "swift",
      kt: "kotlin",
      kts: "kotlin",
      scala: "scala",
      sc: "scala",
      r: "r",
      R: "r",
      pl: "perl",
      pm: "perl",
      t: "perl",
      lua: "lua",
      sql: "sql",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      fish: "bash",
      ps1: "powershell",
      psd1: "powershell",
      psm1: "powershell",
      bat: "batch",
      cmd: "batch",

      env: "bash",
      gitignore: "git",
      gitattributes: "git",
      gitmodules: "git",
      dockerfile: "dockerfile",
      dockerignore: "dockerfile",
      makefile: "makefile",
      mk: "makefile",

      md: "markdown",
      markdown: "markdown",
      mdx: "markdown",
      rst: "rest",
      tex: "latex",
      txt: "text",

      csv: "csv",
      tsv: "csv",
      toml: "toml",
      ini: "ini",
      cfg: "ini",
      conf: "ini",

      lock: "json",
      gemfile: "ruby",
      rakefile: "ruby",
      cmake: "cmake",
      gradle: "gradle",
      properties: "properties",

      svg: "xml",
      graphql: "graphql",
      gql: "graphql",
    };

    if (name === "dockerfile") return "dockerfile";
    if (name === "makefile") return "makefile";
    if (name === "gemfile") return "ruby";
    if (name === "rakefile") return "ruby";
    if (name === "procfile") return "yaml";
    if (name === "readme") return "markdown";
    if (name === "license") return "text";
    if (name === "docker-compose.yml" || name === "docker-compose.yaml")
      return "yaml";
    if (
      name === ".env.example" ||
      name === ".env.local" ||
      name === ".env.production"
    )
      return "bash";

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
      rest: "reStructuredText",
      latex: "LaTeX",
      text: "Text",
      csv: "CSV",
      toml: "TOML",
      ini: "INI",
      cmake: "CMake",
      gradle: "Gradle",
      properties: "Properties",
      jinja2: "Jinja2",
      twig: "Twig",
      graphql: "GraphQL",
      wasm: "WebAssembly",
      lisp: "WebAssembly Text",
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

  const getSystemTheme = (): "light" | "dark" =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  useEffect(() => {
    if (theme === "auto") setActiveTheme(getSystemTheme());
    else setActiveTheme(theme);
  }, [theme, open]);

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
    if (open) fetchFile();
    else {
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
    const themes: Theme[] = ["light", "dark", "auto"];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const scrollToTop = () =>
    codeContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    codeContainerRef.current?.scrollTo({
      top: codeContainerRef.current.scrollHeight,
      behavior: "smooth",
    });

  const ThemeIcon =
    theme === "auto" ? Monitor : activeTheme === "light" ? Sun : Moon;
  const bgClass = activeTheme === "light" ? "bg-white" : "bg-[#0d1117]";
  const textClass = activeTheme === "light" ? "text-gray-900" : "text-gray-100";

  const iconColorClass =
    activeTheme === "light" ? "text-gray-600" : "text-gray-300";

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
      fontSize: "14px",
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    'pre[class*="language-"]': {
      ...vs['pre[class*="language-"]'],
      fontSize: "14px",
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
      fontSize: "14px",
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      fontSize: "14px",
      lineHeight: "1.5",
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      background: "#0d1117",
      margin: 0,
      padding: "16px 0",
    },
  };

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
          activeTheme === "light"
            ? "border border-gray-200"
            : "border border-gray-800"
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
            activeTheme === "light"
              ? "border-gray-200 bg-white/95"
              : "border-gray-800 bg-[#161b22]/95"
          )}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                activeTheme === "light"
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-blue-900/30 text-blue-400 border border-blue-800/50"
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
                    activeTheme === "light"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-gray-800 text-gray-300"
                  )}
                >
                  {getLanguageDisplayName(fileInfo.language)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <p
                  className={cn(
                    "truncate font-mono text-sm",
                    activeTheme === "light" ? "text-gray-600" : "text-gray-400"
                  )}
                >
                  {filePath}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span
                    className={
                      activeTheme === "light"
                        ? "text-gray-500"
                        : "text-gray-500"
                    }
                  >
                    {fileInfo.lines} lines
                  </span>
                  <span
                    className={
                      activeTheme === "light"
                        ? "text-gray-500"
                        : "text-gray-500"
                    }
                  >
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
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
              )}
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWrapLines(!wrapLines)}
              className={cn(
                "h-9 w-9 p-0",
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700",
                wrapLines &&
                  (activeTheme === "light"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-blue-900/50 text-blue-400")
              )}
              title="Wrap lines"
            >
              <WrapText className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={scrollToTop}
              disabled={!content}
              className={cn(
                "h-9 w-9 p-0",
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
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
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
              )}
              title="Scroll to bottom"
            >
              <ArrowDown className={cn("w-4 h-4", iconColorClass)} />
            </Button>
            <div
              className={cn(
                "w-px h-6 mx-1",
                activeTheme === "light" ? "bg-gray-300" : "bg-gray-700"
              )}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className={cn(
                "h-9 w-9 p-0",
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
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
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
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
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
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
                activeTheme === "light"
                  ? "hover:bg-gray-200"
                  : "hover:bg-gray-700"
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
                activeTheme === "light" ? "bg-gray-300" : "bg-gray-700"
              )}
            />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className={cn(
                "h-9 w-9 p-0",
                activeTheme === "light"
                  ? "hover:bg-gray-300"
                  : "hover:bg-gray-700"
              )}
            >
              <X
                className={cn(
                  "w-px h-6 mx-1",
                  activeTheme === "light" ? "text-gray-700" : "text-white"
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
                activeTheme === "light" ? "bg-white" : "bg-[#0d1117]"
              )}
            >
              <div
                className={cn(
                  "animate-pulse text-lg",
                  activeTheme === "light" ? "text-gray-600" : "text-gray-300"
                )}
              >
                Loading...
              </div>
            </div>
          ) : error ? (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                activeTheme === "light" ? "bg-white" : "bg-[#0d1117]"
              )}
            >
              <div className="text-center">
                <div
                  className={cn(
                    "text-lg mb-2",
                    activeTheme === "light" ? "text-red-600" : "text-red-400"
                  )}
                >
                  Error loading file
                </div>
                <div
                  className={cn(
                    "text-sm",
                    activeTheme === "light" ? "text-gray-600" : "text-gray-300"
                  )}
                >
                  {error}
                </div>
              </div>
            </div>
          ) : (
            <SyntaxHighlighter
              language={fileInfo.language}
              style={
                activeTheme === "light" ? githubLightStyle : githubDarkStyle
              }
              showLineNumbers
              wrapLongLines={wrapLines}
              wrapLines={wrapLines}
              lineNumberStyle={{
                color: activeTheme === "light" ? "#1f2328" : "#888888",
                paddingRight: "16px",
                paddingLeft: "16px",
                minWidth: "50px",
                textAlign: "right",
                userSelect: "none",
                fontSize: "12px",
                fontWeight: "400",
                backgroundColor:
                  activeTheme === "light" ? "#ffffff" : "#0d1117",
                borderRight:
                  activeTheme === "light"
                    ? "1px solid #e1e4e8"
                    : "1px solid #30363d",
              }}
              lineNumberContainerStyle={{
                paddingRight: "0",
                float: "left",
                backgroundColor:
                  activeTheme === "light" ? "#ffffff" : "#0d1117",
              }}
              customStyle={{
                margin: 0,
                padding: "16px 0",
                background: activeTheme === "light" ? "#ffffff" : "#0d1117",
                fontSize: "14px",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                fontWeight: "400",
                lineHeight: 1.5,
                color: activeTheme === "light" ? "#1f2328" : "#f0f6fc",
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
              activeTheme === "light"
                ? "border-gray-200 bg-gray-50/80 text-gray-600"
                : "border-gray-800 bg-[#161b22]/80 text-gray-300"
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
            </div>

            <div className="flex items-center gap-3">
              <span>
                Ln {cursorPosition.line}, Col {cursorPosition.column}
              </span>
              <span>{getScrollPercentage()}%</span>
              <div
                className={cn(
                  "w-px h-4",
                  activeTheme === "light" ? "bg-gray-300" : "bg-gray-600"
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
