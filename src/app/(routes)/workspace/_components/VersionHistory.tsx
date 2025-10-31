"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  Eye,
  Calendar,
  X,
  Search,
  Filter,
  RotateCcw,
  Copy,
  GitCompare,
  History,
  Save,
  Edit,
  Clock,
  Users,
  FileText,
  ChevronUp,
  ChevronDown,
  MoreVertical,
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
}

export function VersionHistory({
  versions = [],
  onRestoreVersion,
  onClose,
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
  const isMobile = useIsMobile();

  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalVersions: versions.length,
      last30Days: versions.filter((v) => new Date(v.createdAt) > last30Days)
        .length,
      last7Days: versions.filter((v) => new Date(v.createdAt) > last7Days)
        .length,
      uniqueAuthors: new Set(versions.map((v) => v.author.id)).size,
      totalSize: versions.reduce((sum, v) => sum + (v.content?.length || 0), 0),
      avgSize:
        versions.length > 0
          ? Math.round(
              versions.reduce((sum, v) => sum + (v.content?.length || 0), 0) /
                versions.length
            )
          : 0,
    };
  }, [versions]);

  const uniqueAuthors = useMemo(() => {
    const authors = versions.reduce((acc: Author[], version) => {
      if (!acc.find((a) => a.id === version.author.id)) {
        acc.push(version.author);
      }
      return acc;
    }, []);
    return authors;
  }, [versions]);

  const filteredVersions = useMemo(() => {
    return versions.filter((version) => {
      const matchesSearch =
        version.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.author.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAuthor =
        !filterByAuthor || version.author.id === filterByAuthor;
      return matchesSearch && matchesAuthor;
    });
  }, [versions, searchTerm, filterByAuthor]);

  const groupedVersions = useMemo(() => {
    const groups: { [key: string]: Version[] } = {};
    filteredVersions.forEach((version) => {
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
        description: version.description || "",
        createdAt: version.createdAt,
        author: version.author,
        exportedAt: new Date().toISOString(),
      },
      content: version.content,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(versionData, null, 2));
      console.log("Version copied to clipboard");
    } catch (err) {
      console.error("Failed to copy version: ", err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Content copied to clipboard");
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

  const VersionDiffPreview = ({ version }: { version: Version }) => {
    const isExpanded = expandedVersion === version.id;
    if (!isExpanded) return null;

    const currentIndex = versions.findIndex((v) => v.id === version.id);
    const previousVersion =
      currentIndex < versions.length - 1 ? versions[currentIndex + 1] : null;

    const handleOpenPortal = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPortalDiff({
        version,
        previousVersion: previousVersion || undefined,
      });
    };

    return (
      <div
        className={`mt-3 p-4 bg-linear-to-br from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-200/60 shadow-sm ${
          isMobile ? "p-3" : ""
        }`}
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
            <div className="text-xs text-gray-500 mt-1">
              {version.content?.split("\n")?.length || 0} lines
            </div>
          </div>
          <div className="bg-white/90 rounded-lg p-3 border border-gray-200/50">
            <div className="text-xs font-medium text-gray-600 mb-1">Author</div>
            <div
              className={`font-semibold text-gray-900 truncate ${
                isMobile ? "text-base" : "text-sm"
              }`}
            >
              {version.author?.name || "Unknown"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(version.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {previousVersion && (
          <div className="bg-white/90 rounded-lg p-3 border border-gray-200/50 mb-3">
            <div className="text-xs font-medium text-gray-600 mb-2">
              Changes from v{previousVersion.version}
            </div>
            <div
              className={`flex justify-around ${isMobile ? "gap-2" : "gap-4"}`}
            >
              <div className="text-center">
                <div
                  className={`font-bold ${
                    version.content.length > previousVersion.content.length
                      ? "text-green-600"
                      : version.content.length < previousVersion.content.length
                      ? "text-red-600"
                      : "text-gray-600"
                  } ${isMobile ? "text-lg" : "text-xl"}`}
                >
                  {version.content.length - previousVersion.content.length > 0
                    ? "+"
                    : ""}
                  {version.content.length - previousVersion.content.length}
                </div>
                <div className="text-xs text-gray-500">chars</div>
              </div>
              <div className="text-center">
                <div
                  className={`font-bold ${
                    version.content.split("\n").length >
                    previousVersion.content.split("\n").length
                      ? "text-green-600"
                      : version.content.split("\n").length <
                        previousVersion.content.split("\n").length
                      ? "text-red-600"
                      : "text-gray-600"
                  } ${isMobile ? "text-lg" : "text-xl"}`}
                >
                  {version.content.split("\n").length -
                    previousVersion.content.split("\n").length >
                  0
                    ? "+"
                    : ""}
                  {version.content.split("\n").length -
                    previousVersion.content.split("\n").length}
                </div>
                <div className="text-xs text-gray-500">lines</div>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleOpenPortal}
          className={`w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all duration-200 ${
            isMobile ? "py-3 text-base" : "py-2.5"
          }`}
        >
          <GitCompare
            className={`${isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"}`}
          />
          {isMobile ? "Open Comparison" : "Open Detailed Comparison"}
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
        className={`bg-white flex flex-col shadow-2xl rounded-xl overflow-hidden border border-gray-200 ${
          isMobile ? "fixed inset-0 z-50 w-full h-full" : "w-96 h-[92vh]"
        }`}
      >
        {/* Header */}
        <div
          className={`border-b bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 shrink-0 ${
            isMobile ? "p-4" : "p-5"
          }`}
        >
          <div
            className={`flex items-center justify-between ${
              isMobile ? "mb-4" : "mb-4"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`bg-white rounded-lg shadow-sm ${
                  isMobile ? "p-2" : "p-2"
                }`}
              >
                <History
                  className={`text-indigo-600 ${
                    isMobile ? "h-6 w-6" : "h-5 w-5"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`font-bold text-gray-900 ${
                    isMobile ? "text-xl" : "text-lg"
                  }`}
                >
                  Version History
                </h3>
                <p
                  className={`text-gray-600 ${
                    isMobile ? "text-base" : "text-sm"
                  }`}
                >
                  {stats.totalVersions} total versions
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`hover:bg-white/80 rounded-lg ${
                isMobile ? "h-10 w-10 p-0" : "h-9 w-9 p-0"
              }`}
            >
              <X className={isMobile ? "h-5 w-5" : "h-5 w-5"} />
            </Button>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-2 ${isMobile ? "mb-4" : "mb-4"}`}
          >
            <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock
                  className={`text-blue-600 ${
                    isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
                  }`}
                />
                <span
                  className={`font-medium text-gray-600 ${
                    isMobile ? "text-sm" : "text-xs"
                  }`}
                >
                  7 Days
                </span>
              </div>
              <div
                className={`font-bold text-gray-900 ${
                  isMobile ? "text-lg" : "text-xl"
                }`}
              >
                {stats.last7Days}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Users
                  className={`text-purple-600 ${
                    isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
                  }`}
                />
                <span
                  className={`font-medium text-gray-600 ${
                    isMobile ? "text-sm" : "text-xs"
                  }`}
                >
                  Authors
                </span>
              </div>
              <div
                className={`font-bold text-gray-900 ${
                  isMobile ? "text-lg" : "text-xl"
                }`}
              >
                {stats.uniqueAuthors}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200/50">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText
                  className={`text-green-600 ${
                    isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
                  }`}
                />
                <span
                  className={`font-medium text-gray-600 ${
                    isMobile ? "text-sm" : "text-xs"
                  }`}
                >
                  Avg Size
                </span>
              </div>
              <div
                className={`font-bold text-gray-900 ${
                  isMobile ? "text-sm" : "text-sm"
                }`}
              >
                {formatFileSize(stats.avgSize)}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
                  isMobile ? "h-5 w-5" : "h-4 w-4"
                }`}
              />
              <Input
                placeholder="Search versions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                  isMobile ? "pl-12 h-12 text-base" : "pl-9"
                }`}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`w-full bg-white hover:bg-gray-50 ${
                    isMobile ? "h-12 text-base" : ""
                  }`}
                >
                  <Filter
                    className={`${isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2"}`}
                  />
                  {filterByAuthor ? "Filtered" : "Filter"}
                </Button>
                {filterOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        setFilterByAuthor("");
                        setFilterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                        isMobile ? "text-base" : "text-sm"
                      }`}
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
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                          isMobile ? "text-base" : "text-sm"
                        }`}
                      >
                        <Avatar
                          className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`}
                        >
                          <AvatarImage src={author.image} />
                          <AvatarFallback
                            className={isMobile ? "text-xs" : "text-xs"}
                          >
                            {author.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {author.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {versions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestoreVersion(versions[0])}
                  className={`bg-white hover:bg-gray-50 ${
                    isMobile ? "h-12 text-base flex-1" : "flex-1"
                  }`}
                >
                  <RotateCcw
                    className={`${isMobile ? "h-5 w-5 mr-1" : "h-4 w-4 mr-1"}`}
                  />
                  {isMobile ? "Latest" : "Latest"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {versions.length === 0 ? (
            <div
              className={`text-center text-gray-500 ${
                isMobile ? "py-20" : "py-12"
              }`}
            >
              <History
                className={`mx-auto mb-4 text-gray-300 ${
                  isMobile ? "w-20 h-20" : "w-16 h-16"
                }`}
              />
              <h3
                className={`font-semibold mb-2 text-gray-800 ${
                  isMobile ? "text-xl" : "text-lg"
                }`}
              >
                No version history yet
              </h3>
              <p
                className={`text-gray-600 mb-4 max-w-sm mx-auto ${
                  isMobile ? "text-base" : "text-sm"
                }`}
              >
                Versions are automatically created when you make significant
                changes.
              </p>
            </div>
          ) : filteredVersions.length === 0 ? (
            <div
              className={`text-center text-gray-500 ${
                isMobile ? "py-16" : "py-8"
              }`}
            >
              <Search
                className={`mx-auto mb-4 text-gray-300 ${
                  isMobile ? "w-16 h-16" : "w-12 h-12"
                }`}
              />
              <p
                className={`text-gray-600 mb-3 ${
                  isMobile ? "text-base" : "text-sm"
                }`}
              >
                No versions match your search
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterByAuthor("");
                }}
                className={isMobile ? "h-10 text-base px-4" : ""}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className={`space-y-4 ${isMobile ? "p-3" : "p-4"}`}>
              {Object.entries(groupedVersions).map(([date, dayVersions]) => (
                <div key={date}>
                  <h4
                    className={`font-bold text-gray-500 mb-2 uppercase tracking-wider sticky top-0 bg-gray-50 py-1.5 ${
                      isMobile ? "text-sm" : "text-xs"
                    }`}
                  >
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
                        } ${isMobile ? "p-4" : "p-4"}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4
                                className={`font-semibold text-gray-900 truncate ${
                                  isMobile ? "text-base" : "text-sm"
                                }`}
                              >
                                {version.name || `Version ${version.version}`}
                              </h4>
                              {index === 0 && (
                                <Badge
                                  className={`text-white bg-green-500 ${
                                    isMobile ? "text-sm px-2 py-1" : "text-xs"
                                  }`}
                                >
                                  Latest
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`font-mono bg-indigo-50 text-indigo-700 border-indigo-200 ${
                                  isMobile ? "text-sm px-2 py-1" : "text-xs"
                                }`}
                              >
                                v{version.version}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`bg-purple-50 text-purple-700 border-purple-200 ${
                                  isMobile ? "text-sm px-2 py-1" : "text-xs"
                                }`}
                              >
                                JSON
                              </Badge>
                              <span
                                className={`text-gray-500 ${
                                  isMobile ? "text-sm" : "text-xs"
                                }`}
                              >
                                {formatFileSize(version.content?.length || 0)}
                              </span>
                            </div>
                            {version.description && (
                              <p
                                className={`text-gray-600 line-clamp-2 mb-2 ${
                                  isMobile ? "text-base" : "text-xs"
                                }`}
                              >
                                {version.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Author and Date */}
                        <div
                          className={`flex items-center gap-3 text-gray-500 mb-3 flex-wrap ${
                            isMobile ? "text-sm" : "text-xs"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Avatar
                              className={isMobile ? "h-6 w-6" : "h-5 w-5"}
                            >
                              <AvatarImage src={version.author.image} />
                              <AvatarFallback
                                className={`bg-indigo-100 text-indigo-700 ${
                                  isMobile ? "text-xs" : "text-[10px]"
                                }`}
                              >
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

                        {/* Actions */}
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
                            className={`text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 ${
                              isMobile
                                ? "h-10 text-base px-4"
                                : "h-8 text-xs px-3"
                            }`}
                          >
                            {expandedVersion === version.id ? (
                              <ChevronUp
                                className={`${
                                  isMobile ? "h-5 w-5 mr-1" : "h-3.5 w-3.5 mr-1"
                                }`}
                              />
                            ) : (
                              <ChevronDown
                                className={`${
                                  isMobile ? "h-5 w-5 mr-1" : "h-3.5 w-3.5 mr-1"
                                }`}
                              />
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
                                  className={`p-0 opacity-60 hover:opacity-100 ${
                                    isMobile ? "h-10 w-10" : "h-8 w-8"
                                  }`}
                                >
                                  <MoreVertical
                                    className={isMobile ? "h-5 w-5" : "h-4 w-4"}
                                  />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className={
                                  isMobile ? "w-56 text-base" : "w-48 text-sm"
                                }
                              >
                                <DropdownMenuItem
                                  onClick={() => downloadVersion(version)}
                                >
                                  <Download
                                    className={`${
                                      isMobile ? "h-5 w-5 mr-3" : "h-4 w-4 mr-2"
                                    }`}
                                  />
                                  Download as JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyVersionAsJSON(version)}
                                >
                                  <Copy
                                    className={`${
                                      isMobile ? "h-5 w-5 mr-3" : "h-4 w-4 mr-2"
                                    }`}
                                  />
                                  Copy as JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    copyToClipboard(version.content)
                                  }
                                >
                                  <Copy
                                    className={`${
                                      isMobile ? "h-5 w-5 mr-3" : "h-4 w-4 mr-2"
                                    }`}
                                  />
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
                                  <GitCompare
                                    className={`${
                                      isMobile ? "h-5 w-5 mr-3" : "h-4 w-4 mr-2"
                                    }`}
                                  />
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
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadVersion(version)}
                              className={`hover:bg-gray-100 ${
                                isMobile ? "h-10 w-10 p-0" : "h-8 w-8 p-0"
                              }`}
                              title="Download version as JSON"
                            >
                              <Download
                                className={isMobile ? "h-5 w-5" : "h-4 w-4"}
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRestoreVersion(version)}
                              className={`${
                                isMobile
                                  ? "h-10 text-base px-4"
                                  : "h-8 text-xs px-3"
                              }`}
                            >
                              <Eye
                                className={`${
                                  isMobile ? "h-5 w-5 mr-2" : "h-3.5 w-3.5 mr-1"
                                }`}
                              />
                              {isMobile ? "View" : "Restore"}
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

        {/* Footer */}
        <div
          className={`border-t bg-linear-to-r from-gray-50 to-white shrink-0 ${
            isMobile ? "p-4" : "p-4"
          }`}
        >
          {compareTarget && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div
                  className={`text-blue-800 ${
                    isMobile ? "text-base" : "text-sm"
                  }`}
                >
                  <strong>Selected for comparison:</strong>{" "}
                  {compareTarget.name || `Version ${compareTarget.version}`}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareTarget(null)}
                  className={`p-0 text-blue-800 hover:text-blue-900 ${
                    isMobile ? "h-8 w-8" : "h-6 w-6"
                  }`}
                >
                  <X className={isMobile ? "h-4 w-4" : "h-3 w-3"} />
                </Button>
              </div>
              <p
                className={`text-blue-600 mt-1 ${
                  isMobile ? "text-sm" : "text-xs"
                }`}
              >
                Select another version to compare
              </p>
            </div>
          )}
          <div
            className={`text-gray-600 space-y-1 text-center ${
              isMobile ? "text-sm" : "text-xs"
            }`}
          >
            <p>💡 Auto-saved on significant changes</p>
            <p>⏰ Press ESC to close</p>
          </div>
        </div>
      </div>
    </>
  );
}
