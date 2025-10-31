"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Author {
  id: string;
  name: string;
  email?: string;
  image?: string;
}

interface Version {
  version: number;
  createdAt?: string;
  author?: Author;
  content: string;
}

interface ChangesPreviewProps {
  version: Version;
  previousVersion?: Version | null;
  onClose: () => void;
  isOpen?: boolean;
  showCloseButton?: boolean;
}

interface LineDiff {
  oldLineNumber?: number;
  newLineNumber?: number;
  type: "added" | "removed" | "same";
  content: string;
}

function computeLineDiff(oldContent: string, newContent: string): LineDiff[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const diff: LineDiff[] = [];
  let i = 0,
    j = 0;

  while (i < oldLines.length || j < newLines.length) {
    const oldLine = oldLines[i];
    const newLine = newLines[j];

    if (oldLine === newLine) {
      // Линии идентичны
      diff.push({
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
        type: "same",
        content: oldLine,
      });
      i++;
      j++;
    } else {
      // Ищем следующее совпадение
      let nextOldMatch = -1;
      let nextNewMatch = -1;

      // Ищем старую линию в новых линиях
      for (let k = j; k < newLines.length; k++) {
        if (newLines[k] === oldLine) {
          nextNewMatch = k;
          break;
        }
      }

      // Ищем новую линию в старых линиях
      for (let k = i; k < oldLines.length; k++) {
        if (oldLines[k] === newLine) {
          nextOldMatch = k;
          break;
        }
      }

      if (
        nextNewMatch !== -1 &&
        (nextOldMatch === -1 || nextNewMatch - j <= nextOldMatch - i)
      ) {
        // Добавлены новые линии
        while (j < nextNewMatch) {
          diff.push({
            oldLineNumber: undefined,
            newLineNumber: j + 1,
            type: "added",
            content: newLines[j],
          });
          j++;
        }
      } else if (
        nextOldMatch !== -1 &&
        (nextNewMatch === -1 || nextOldMatch - i <= nextNewMatch - j)
      ) {
        // Удалены старые линии
        while (i < nextOldMatch) {
          diff.push({
            oldLineNumber: i + 1,
            newLineNumber: undefined,
            type: "removed",
            content: oldLines[i],
          });
          i++;
        }
      } else {
        // Замена линии
        if (oldLine !== undefined) {
          diff.push({
            oldLineNumber: i + 1,
            newLineNumber: undefined,
            type: "removed",
            content: oldLine,
          });
          i++;
        }
        if (newLine !== undefined) {
          diff.push({
            oldLineNumber: undefined,
            newLineNumber: j + 1,
            type: "added",
            content: newLine,
          });
          j++;
        }
      }
    }
  }

  return diff;
}

export function ChangesPreview({
  version,
  previousVersion,
  onClose,
  isOpen = true,
  showCloseButton = true,
}: ChangesPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [version, isOpen]);

  const lineDiff = useMemo(() => {
    if (!previousVersion) {
      const lines = version.content.split("\n");
      return lines.map((content, index) => ({
        oldLineNumber: undefined,
        newLineNumber: index + 1,
        type: "added" as const,
        content,
      }));
    }
    return computeLineDiff(previousVersion.content, version.content);
  }, [version, previousVersion]);

  const stats = useMemo(() => {
    if (!previousVersion) {
      return {
        added: version.content.split("\n").length,
        removed: 0,
        unchanged: 0,
      };
    }

    const diff = computeLineDiff(previousVersion.content, version.content);
    return {
      added: diff.filter((line) => line.type === "added").length,
      removed: diff.filter((line) => line.type === "removed").length,
      unchanged: diff.filter((line) => line.type === "same").length,
    };
  }, [version, previousVersion]);

  return (
    <div
      className="flex flex-col w-full h-full bg-white border rounded-xl shadow-sm overflow-hidden select-text"
      style={{
        userSelect: "text",
        WebkitUserSelect: "text",
      }}
    >
      {/* Header с статистикой */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">
            Version {version.version}
            {previousVersion && ` vs Version ${previousVersion.version}`}
          </span>
          <span className="text-xs text-gray-500">
            {version.createdAt
              ? new Date(version.createdAt).toLocaleString()
              : "Unknown date"}
          </span>
        </div>

        {/* Статистика изменений */}
        <div className="flex items-center gap-4 text-xs">
          {stats.added > 0 && (
            <span className="text-green-600 font-medium">+{stats.added}</span>
          )}
          {stats.removed > 0 && (
            <span className="text-red-600 font-medium">-{stats.removed}</span>
          )}
          {stats.unchanged > 0 && (
            <span className="text-gray-500">{stats.unchanged} unchanged</span>
          )}
        </div>

        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-gray-600 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Дифф */}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-xs leading-tight bg-gray-50"
        style={{
          overscrollBehavior: "contain",
        }}
      >
        <div className="min-w-full">
          {lineDiff.length === 0 ? (
            <div className="text-center text-gray-500 italic py-4">
              No differences found.
            </div>
          ) : (
            lineDiff.map((line, idx) => {
              const bgClass =
                line.type === "added"
                  ? "bg-green-50"
                  : line.type === "removed"
                  ? "bg-red-50"
                  : "bg-white";
              const borderClass =
                line.type === "added"
                  ? "border-l-4 border-green-400"
                  : line.type === "removed"
                  ? "border-l-4 border-red-400"
                  : "border-l-4 border-transparent";

              return (
                <div
                  key={idx}
                  className={`flex px-2 py-0.5 ${bgClass} ${borderClass} transition-colors duration-150 select-text`}
                >
                  <div className="w-10 text-right pr-2 text-gray-400 shrink-0">
                    {line.oldLineNumber ?? ""}
                  </div>
                  <div className="w-10 text-right pr-2 text-gray-400 shrink-0">
                    {line.newLineNumber ?? ""}
                  </div>
                  <div
                    className={`flex-1 select-text ${
                      line.type === "removed"
                        ? "line-through text-red-800"
                        : line.type === "added"
                        ? "text-green-800"
                        : "text-gray-700"
                    }`}
                  >
                    {line.content || "<empty>"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
