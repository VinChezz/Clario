"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Calendar } from "lucide-react";

interface VersionHistoryProps {
  versions: any[];
  onRestoreVersion: (version: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function VersionHistory({
  versions,
  onRestoreVersion,
  onClose,
}: VersionHistoryProps) {
  const downloadVersion = (version: any) => {
    const element = document.createElement("a");
    const file = new Blob([version.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${version.name || `version-${version.version}`}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-96 border-l bg-white flex flex-col shadow-xl h-[90vh]">
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Version History
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {versions.length} version{versions.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-gray-100"
        >
          ✕
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {versions.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">⏱️</div>
            <p className="font-medium text-lg mb-2">No versions yet</p>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Document versions will be automatically saved as you make
              significant changes
            </p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-white group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {version.name || `Version ${version.version}`}
                    </h4>
                    {index === 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 text-xs"
                      >
                        Latest
                      </Badge>
                    )}
                  </div>
                  {version.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {version.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={version.author.image} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                      {version.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{version.author.name}</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(version.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono bg-gray-50"
                  >
                    v{version.version}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadVersion(version)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    title="Download version"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestoreVersion(version)}
                    className="h-8 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            💡 Versions are automatically created when you make significant
            changes
          </p>
          <p>⏰ Each version includes the complete document state</p>
        </div>
      </div>
    </div>
  );
}
