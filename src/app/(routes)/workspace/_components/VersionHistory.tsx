"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  Eye,
  X,
  Search,
  Filter,
  RotateCcw,
  Copy,
  GitCompare,
  History,
  Clock,
  Users,
  FileText,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  File,
  Palette,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PortalChangesPreview } from "./PortalChangesPreview";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Author {
  id: string;
  name: string;
  email?: string;
  image?: string;
}

export interface Version {
  id: string;
  version: number;
  name?: string;
  type?: string;
  description?: string;
  createdAt: string;
  author: Author;
  content: string;
  fileSize?: number;
  additionalData?: any;
}

interface VersionHistoryProps {
  versions: Version[];
  onRestoreVersion: (version: Version) => void;
  onClose: () => void;
  isLoading: boolean;
  onRefreshVersions?: () => Promise<void>;
  componentType?: "editor" | "canvas";

  canRestoreDocument?: boolean;
  canRestoreWhiteboard?: boolean;
}

export function VersionHistory({
  versions = [],
  onRestoreVersion,
  onClose,
  isLoading,
  onRefreshVersions,
  componentType = "editor",
  canRestoreDocument = componentType === "editor",
  canRestoreWhiteboard = componentType === "canvas",
}: VersionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByAuthor, setFilterByAuthor] = useState("");
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [portalDiff, setPortalDiff] = useState<{
    version: Version;
    previousVersion?: Version;
  } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Version | null>(null);
  const [filterByType, setFilterByType] = useState<
    "all" | "document" | "whiteboard"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const isMobile = useIsMobile();

  const canRestoreVersion = (version: Version): boolean => {
    if (version.type === "document") {
      return canRestoreDocument;
    }
    if (version.type === "whiteboard") {
      return canRestoreWhiteboard;
    }

    return true;
  };

  const getRestoreDisabledReason = (version: Version): string => {
    if (version.type === "document" && !canRestoreDocument) {
      return "Switch to document editor to restore this version";
    }
    if (version.type === "whiteboard" && !canRestoreWhiteboard) {
      return "Switch to whiteboard to restore this version";
    }
    return "";
  };

  const handleRefreshVersions = async () => {
    if (!onRefreshVersions) {
      console.warn("⚠️ onRefreshVersions function not provided");
      return;
    }

    setIsRefreshing(true);
    try {
      console.log("🔄 Manually refreshing versions...");
      await onRefreshVersions();
      setLastRefreshTime(new Date());
      console.log("✅ Versions refreshed successfully");
    } catch (error) {
      console.error("❌ Failed to refresh versions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (onRefreshVersions && versions.length === 0) {
      console.log("🔄 Auto-refreshing versions on open");
      handleRefreshVersions();
    }
  }, [onRefreshVersions, versions.length]);

  const currentVersions = useMemo(() => {
    if (filterByType === "all") {
      return versions;
    }
    return versions.filter((v) => v.type === filterByType);
  }, [versions, filterByType]);

  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalVersions: currentVersions.length,
      last30Days: currentVersions.filter(
        (v) => new Date(v.createdAt) > last30Days
      ).length,
      last7Days: currentVersions.filter(
        (v) => new Date(v.createdAt) > last7Days
      ).length,
      uniqueAuthors: new Set(currentVersions.map((v) => v.author.id)).size,
      totalSize: currentVersions.reduce(
        (sum, v) => sum + (v.content?.length || 0),
        0
      ),
      avgSize:
        currentVersions.length > 0
          ? Math.round(
              currentVersions.reduce(
                (sum, v) => sum + (v.content?.length || 0),
                0
              ) / currentVersions.length
            )
          : 0,
    };
  }, [currentVersions]);

  const typeStats = useMemo(() => {
    const documentVersions = versions.filter((v) => v.type === "document");
    const whiteboardVersions = versions.filter((v) => v.type === "whiteboard");

    return {
      document: documentVersions.length,
      whiteboard: whiteboardVersions.length,
      all: versions.length,
    };
  }, [versions]);

  const uniqueAuthors = useMemo(() => {
    const authors = currentVersions.reduce((acc: Author[], version) => {
      if (!acc.find((a) => a.id === version.author.id)) {
        acc.push(version.author);
      }
      return acc;
    }, []);
    return authors;
  }, [currentVersions]);

  const filteredVersions = useMemo(() => {
    return currentVersions.filter((version) => {
      const matchesSearch =
        version.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.author.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAuthor =
        !filterByAuthor || version.author.id === filterByAuthor;

      return matchesSearch && matchesAuthor;
    });
  }, [currentVersions, searchTerm, filterByAuthor]);

  const groupedVersions = useMemo(() => {
    const groups: { [key: string]: Version[] } = {};

    const safeFilteredVersions = Array.isArray(filteredVersions)
      ? filteredVersions
      : [];

    safeFilteredVersions.forEach((version) => {
      const date = new Date(version.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(version);
    });
    return groups;
  }, [filteredVersions]);

  const downloadVersion = (version: Version) => {
    const versionData = {
      metadata: {
        version: version.version,
        name: version.name || `Version ${version.version}`,
        type: version.type || "document",
        description: version.description || "",
        createdAt: version.createdAt,
        author: version.author,
        exportedAt: new Date().toISOString(),
      },
      content: version.content,
    };
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(versionData, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${version.name || `version-${version.version}`}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyVersionAsJSON = async (version: Version) => {
    const versionData = {
      metadata: {
        version: version.version,
        name: version.name || `Version ${version.version}`,
        type: version.type || "document",
        description: version.description || "",
        createdAt: version.createdAt,
        author: version.author,
        exportedAt: new Date().toISOString(),
      },
      content: version.content,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(versionData, null, 2));
    } catch (err) {
      console.error("Failed to copy version: ", err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const compareVersions = (version1: Version, version2: Version) => {
    const newerVersion =
      new Date(version1.createdAt) > new Date(version2.createdAt)
        ? version1
        : version2;
    const olderVersion = newerVersion === version1 ? version2 : version1;

    setPortalDiff({
      version: newerVersion,
      previousVersion: olderVersion,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const VersionDiffPreview = ({ version }: { version: Version }) => {
    const isExpanded = expandedVersion === version.id;
    if (!isExpanded) return null;

    const sameTypeVersions = versions
      .filter((v) => v.type === version.type)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const currentIndex = sameTypeVersions.findIndex((v) => v.id === version.id);
    const previousVersion =
      currentIndex < sameTypeVersions.length - 1
        ? sameTypeVersions[currentIndex + 1]
        : null;

    const handleOpenPortal = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPortalDiff({
        version,
        previousVersion: previousVersion || undefined,
      });
    };

    const getElementCount = (content: string) => {
      try {
        const data = JSON.parse(content);
        return Array.isArray(data) ? data.length : 0;
      } catch {
        return 0;
      }
    };

    const getWordCount = (content: string) => {
      return content.trim() ? content.trim().split(/\s+/).length : 0;
    };

    const getCharacterStats = (content: string) => {
      const chars = content.length;
      const withoutSpaces = content.replace(/\s/g, "").length;
      return { total: chars, withoutSpaces };
    };

    const getLinesCount = (content: string) => {
      return content.split("\n").length;
    };

    const getFileTypeInfo = (
      content: string,
      type?: string
    ): Record<string, number> => {
      if (type === "whiteboard") {
        try {
          const data = JSON.parse(content);
          const elementTypes: Record<string, number> = {};
          if (Array.isArray(data)) {
            data.forEach((element: any) => {
              const elementType = element.type || "unknown";
              elementTypes[elementType] = (elementTypes[elementType] || 0) + 1;
            });
          }
          return elementTypes;
        } catch {
          return {};
        }
      }
      return {};
    };

    const characterStats = getCharacterStats(version.content);
    const wordCount = getWordCount(version.content);
    const linesCount = getLinesCount(version.content);
    const elementTypes = getFileTypeInfo(version.content, version.type);
    const elementCount = getElementCount(version.content);

    const getChangeStats = () => {
      if (!previousVersion) return null;

      const currentChars = characterStats.total;
      const previousChars = getCharacterStats(previousVersion.content).total;
      const currentWords = wordCount;
      const previousWords = getWordCount(previousVersion.content);
      const currentLines = linesCount;
      const previousLines = getLinesCount(previousVersion.content);
      const currentElements = elementCount;
      const previousElements = getElementCount(previousVersion.content);

      return {
        chars: currentChars - previousChars,
        words: currentWords - previousWords,
        lines: currentLines - previousLines,
        elements: currentElements - previousElements,
        percentage:
          previousChars > 0
            ? (((currentChars - previousChars) / previousChars) * 100).toFixed(
                1
              )
            : "100",
      };
    };

    const changeStats = getChangeStats();

    return (
      <div
        className="mt-3 p-4 bg-linear-to-br from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200/60 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`grid gap-3 mb-3 ${
            isMobile ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          <div className="bg-white/90 rounded-lg p-3 border border-gray-200/50">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Content Size
            </div>
            <div
              className={`font-bold text-gray-900 ${
                isMobile ? "text-base" : "text-lg"
              }`}
            >
              {formatFileSize(version.content?.length || 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                <div className="flex justify-between">
                  <span>Chars:</span>
                  <span className="font-medium">
                    {characterStats.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span className="font-medium">
                    {wordCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lines:</span>
                  <span className="font-medium">
                    {linesCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/90 rounded-lg p-3 border border-gray-200/50">
            <div className="text-xs font-medium text-gray-600 mb-1">Type</div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${
                  version.type === "whiteboard"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {version.type === "whiteboard" ? "Whiteboard" : "Document"}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(version.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-2">
            {version.author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={version.author.image} />
                  <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                    {version.author.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {version.author.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {version.type === "whiteboard" && (
              <div className="text-xs text-gray-600">
                <div className="font-medium">{elementCount} elements</div>
              </div>
            )}
          </div>
        </div>

        {previousVersion && changeStats && (
          <div className="bg-white/80 rounded-lg p-2 border border-gray-200/50 mb-3">
            <div className="text-xs font-medium text-gray-600 mb-2 text-center">
              Changes from v{previousVersion.version} ({changeStats.percentage}
              %)
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <div
                  className={`text-sm font-bold ${
                    changeStats.chars > 0
                      ? "text-green-600"
                      : changeStats.chars < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {changeStats.chars > 0 ? "+" : ""}
                  {changeStats.chars}
                </div>
                <div className="text-[10px] text-gray-500">chars</div>
              </div>
              <div>
                <div
                  className={`text-sm font-bold ${
                    changeStats.words > 0
                      ? "text-green-600"
                      : changeStats.words < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {changeStats.words > 0 ? "+" : ""}
                  {changeStats.words}
                </div>
                <div className="text-[10px] text-gray-500">words</div>
              </div>
              <div>
                <div
                  className={`text-sm font-bold ${
                    changeStats.lines > 0
                      ? "text-green-600"
                      : changeStats.lines < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {changeStats.lines > 0 ? "+" : ""}
                  {changeStats.lines}
                </div>
                <div className="text-[10px] text-gray-500">lines</div>
              </div>
              {version.type === "whiteboard" && (
                <div>
                  <div
                    className={`text-sm font-bold ${
                      changeStats.elements > 0
                        ? "text-green-600"
                        : changeStats.elements < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {changeStats.elements > 0 ? "+" : ""}
                    {changeStats.elements}
                  </div>
                  <div className="text-[10px] text-gray-500">elements</div>
                </div>
              )}
            </div>
          </div>
        )}

        {version.type === "whiteboard" &&
          Object.keys(elementTypes).length > 0 && (
            <div className="bg-white/80 rounded-lg p-2 border border-gray-200/50 mb-3">
              <div className="text-xs font-medium text-gray-600 mb-1 text-center">
                Elements
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {Object.entries(elementTypes)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      {type}: {count}
                    </Badge>
                  ))}
                {Object.keys(elementTypes).length > 5 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0.5"
                  >
                    +{Object.keys(elementTypes).length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

        <Button
          onClick={handleOpenPortal}
          className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 py-2 text-sm"
        >
          <GitCompare className="h-3.5 w-3.5 mr-1.5" />
          Detailed Comparison
        </Button>
      </div>
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (portalDiff) setPortalDiff(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, portalDiff]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterOpen) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);

  return (
    <>
      {portalDiff && (
        <PortalChangesPreview
          version={portalDiff.version}
          previousVersion={portalDiff.previousVersion}
          onClose={() => setPortalDiff(null)}
          isOpen={true}
        />
      )}

      <div
        className={`bg-white flex flex-col shadow-2xl rounded-xl border border-gray-200 ${
          isMobile ? "fixed inset-0 z-50 w-full h-full" : "w-96 h-[92vh]"
        }`}
      >
        <div
          className={`
          border-b bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 shrink-0
          transition-all duration-300 ease-in-out
          ${isHeaderCollapsed ? "max-h-16" : "max-h-80"}
        `}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg shadow-sm p-2">
                  <History className="text-indigo-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Version History
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {stats.totalVersions}{" "}
                    {filterByType === "all" ? "total" : filterByType} versions
                    {lastRefreshTime && (
                      <span className="text-gray-400 ml-1">
                        • {formatTimeAgo(lastRefreshTime)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onRefreshVersions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshVersions}
                    disabled={isRefreshing || isLoading}
                    className="hover:bg-white/80 rounded-lg h-9 w-9 p-0"
                    title="Refresh versions"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-white/80 rounded-lg h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div
              className={`
              transition-all duration-300 ease-in-out
              ${
                isHeaderCollapsed
                  ? "opacity-0 max-h-0 overflow-hidden"
                  : "opacity-100 max-h-64 overflow-visible"
              }
            `}
            >
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 mb-4">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                    count: typeStats.all,
                    icon: History,
                  },
                  {
                    key: "document" as const,
                    label: "Doc",
                    count: typeStats.document,
                    icon: File,
                  },
                  {
                    key: "whiteboard" as const,
                    label: "Board",
                    count: typeStats.whiteboard,
                    icon: Palette,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterByType(tab.key)}
                    className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                      filterByType === tab.key
                        ? "bg-indigo-100 text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`px-1 py-0.5 text-xs rounded-full min-w-5 ${
                          filterByType === tab.key
                            ? "bg-indigo-200 text-indigo-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="text-blue-600 h-3.5 w-3.5" />
                    <span className="font-medium text-gray-600 text-xs">
                      7 Days
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-xl">
                    {stats.last7Days}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="text-purple-600 h-3.5 w-3.5" />
                    <span className="font-medium text-gray-600 text-xs">
                      Authors
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-xl">
                    {stats.uniqueAuthors}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="text-green-600 h-3.5 w-3.5" />
                    <span className="font-medium text-gray-600 text-xs">
                      {filterByType === "document"
                        ? "Doc"
                        : filterByType === "whiteboard"
                        ? "Board"
                        : "Avg"}{" "}
                      Size
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {formatFileSize(stats.avgSize)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search versions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pl-9"
                  />
                </div>
                <div className="flex gap-2 h-10">
                  <div className="flex-1 relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterOpen(!filterOpen)}
                      className="h-full bg-white hover:bg-gray-50 min-w-[180px]"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {filterByAuthor ? "Filtered" : "Filter"}
                    </Button>
                    {filterOpen && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        <button
                          onClick={() => {
                            setFilterByAuthor("");
                            setFilterOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100"
                        >
                          All Authors
                        </button>
                        {uniqueAuthors.map((author) => (
                          <button
                            key={author.id}
                            onClick={() => {
                              setFilterByAuthor(author.id);
                              setFilterOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={author.image} />
                              <AvatarFallback className="text-xs">
                                {author.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {author.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {filteredVersions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const latestVersion = filteredVersions[0];
                        if (canRestoreVersion(latestVersion)) {
                          onRestoreVersion(latestVersion);
                        }
                      }}
                      disabled={!canRestoreVersion(filteredVersions[0])}
                      className="h-full bg-white hover:bg-gray-50 min-w-[180px]"
                      title={
                        !canRestoreVersion(filteredVersions[0])
                          ? getRestoreDisabledReason(filteredVersions[0])
                          : "Restore latest version"
                      }
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Latest
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center ml-0.5">
          <Button
            variant="outline"
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className={`
              flex items-center justify-center rounded-full
              border border-transparent
              active:scale-95
              transition-all duration-300 ease-in-out
              group
            `}
            title={isHeaderCollapsed ? "Expand header" : "Collapse header"}
          >
            <ChevronUp
              className={`
                h-8 w-8 text-gray-600 transition-transform duration-500 ease-in-out
                ${isHeaderCollapsed ? "rotate-180" : "rotate-0"}
                group-hover:scale-135
              `}
            />
          </Button>
        </div>

        <div
          className={`
            flex-1 bg-gray-50 transition-[max-height] duration-700 ease-in-out
            ${
              isHeaderCollapsed
                ? "max-h-[calc(100%-4rem)]"
                : "max-h-[calc(100%-20rem)]"
            }
          `}
        >
          {isLoading || isRefreshing ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading versions...</span>
              </div>
            </div>
          ) : currentVersions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <History className="mx-auto mb-4 text-gray-300 w-16 h-16" />
              <h3 className="font-semibold mb-2 text-gray-800 text-lg">
                No {filterByType !== "all" ? filterByType : ""} versions yet
              </h3>
              <p className="text-gray-600 mb-4 max-w-sm mx-auto text-sm">
                {filterByType === "all"
                  ? "Save your document or whiteboard to create the first version."
                  : `Save your ${filterByType} to create the first version.`}
              </p>
              {onRefreshVersions && (
                <Button
                  onClick={handleRefreshVersions}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          ) : filteredVersions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Search className="mx-auto mb-4 text-gray-300 w-12 h-12" />
              <p className="text-gray-600 mb-3 text-sm">
                No {filterByType !== "all" ? filterByType : ""} versions match
                your search
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterByAuthor("");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="pl-4 pr-4">
              {Object.entries(groupedVersions).map(([date, dayVersions]) => (
                <div key={date}>
                  <h4 className="font-bold text-gray-500 mb-2 uppercase tracking-wider sticky top-0 bg-gray-50 py-1.5 text-xs z-10">
                    {date}
                  </h4>
                  <div className="space-y-3">
                    {dayVersions.map((version, index) => (
                      <div
                        key={version.id}
                        className={`border bg-white hover:shadow-md transition-all duration-200 rounded-xl ${
                          compareTarget?.id === version.id
                            ? "border-indigo-500 border-2"
                            : "border-gray-200 hover:border-indigo-300"
                        } p-4`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 truncate text-sm">
                                {version.name || `Version ${version.version}`}
                              </h4>
                              {index === 0 &&
                                filteredVersions[0]?.id === version.id && (
                                  <Badge className="text-white bg-green-500 text-xs">
                                    Latest
                                  </Badge>
                                )}
                              <Badge
                                variant="outline"
                                className={`${
                                  version.type === "whiteboard"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                } text-xs`}
                              >
                                {version.type === "whiteboard"
                                  ? "Whiteboard"
                                  : "Document"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="font-mono bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                              >
                                v{version.version}
                              </Badge>
                              <span className="text-gray-500 text-xs">
                                {formatFileSize(version.content?.length || 0)}
                              </span>
                            </div>
                            {version.description && (
                              <p className="text-gray-600 line-clamp-2 mb-2 text-xs">
                                {version.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-500 mb-3 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={version.author.image} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px]">
                                {version.author.name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {version.author.name}
                            </span>
                          </div>
                          <span>•</span>
                          <span>
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <VersionDiffPreview version={version} />

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedVersion(
                                expandedVersion === version.id
                                  ? null
                                  : version.id
                              );
                            }}
                            className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 h-8 text-xs px-3"
                          >
                            {expandedVersion === version.id ? (
                              <ChevronUp className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 mr-1" />
                            )}
                            {expandedVersion === version.id ? "Hide" : "Show"}{" "}
                            Details
                          </Button>

                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-0 opacity-60 hover:opacity-100 h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 text-sm z-50"
                              >
                                <DropdownMenuItem
                                  onClick={() => downloadVersion(version)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download as JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyVersionAsJSON(version)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy as JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    copyToClipboard(version.content)
                                  }
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Content Only
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (
                                      compareTarget &&
                                      compareTarget.id !== version.id
                                    ) {
                                      compareVersions(compareTarget, version);
                                      setCompareTarget(null);
                                    } else {
                                      setCompareTarget(version);
                                    }
                                  }}
                                >
                                  <GitCompare className="h-4 w-4 mr-2" />
                                  {compareTarget &&
                                  compareTarget.id !== version.id
                                    ? "Compare with selected"
                                    : compareTarget?.id === version.id
                                    ? "Cancel comparison"
                                    : "Select for comparison"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "🎯 VERSION HISTORY: Restore button clicked",
                                  {
                                    versionId: version.id,
                                    versionType: version.type,
                                    componentType: componentType,
                                    canRestore: canRestoreVersion(version),
                                  }
                                );
                                onRestoreVersion(version);
                              }}
                              className="h-8 text-xs px-3"
                              disabled={!canRestoreVersion(version)}
                              title={
                                !canRestoreVersion(version)
                                  ? getRestoreDisabledReason(version)
                                  : `Restore ${version.type} version`
                              }
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t bg-linear-to-r from-gray-50 to-white shrink-0 p-4">
          {compareTarget && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-blue-800 text-sm">
                  <strong>Selected for comparison:</strong>{" "}
                  {compareTarget.name || `Version ${compareTarget.version}`}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareTarget(null)}
                  className="p-0 text-blue-800 hover:text-blue-900 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-blue-600 mt-1 text-xs">
                Select another version to compare
              </p>
            </div>
          )}
          <div className="text-gray-600 space-y-1 text-center text-xs">
            <p>💡 Click "Save" to create new versions</p>
            <p>🔄 Click refresh button to update the list</p>
            <p>⏰ Press ESC to close</p>
          </div>
        </div>
      </div>
    </>
  );
}
