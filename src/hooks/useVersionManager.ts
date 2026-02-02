import { useState, useCallback, useRef } from "react";

interface DocumentVersion {
  id: string;
  version: number;
  name?: string;
  type?: "document" | "whiteboard";
  description?: string;
  content: string;
  fileId: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface CreateVersionOptions {
  name?: string;
  description?: string;
  content: string;
  type: "document" | "whiteboard";
}

interface UseVersionManagerProps {
  fileId: string;
  fileData: any;
  onVersionRestore?: (
    content: string,
    type: "document" | "whiteboard",
  ) => void | Promise<void>;
}

export function useVersionManager({
  fileId,
  fileData,
  onVersionRestore,
}: UseVersionManagerProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const lastFetchRef = useRef<number>(0);

  const fetchVersions = useCallback(
    async (forceRefresh = false) => {
      if (!fileId) return;

      const now = Date.now();
      if (!forceRefresh && now - lastFetchRef.current < 2000) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/files/${fileId}/versions?t=${now}`);

        if (!response.ok) {
          if (response.status === 404) {
            console.warn("Versions API not found, returning empty array");
            setVersions([]);
            return;
          }
          throw new Error(`Failed to fetch versions: ${response.status}`);
        }

        const data = await response.json();

        setVersions(data);
        lastFetchRef.current = now;

        return data;
      } catch (error) {
        console.error("Error fetching versions:", error);
        setVersions([]);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fileId],
  );

  const createManualVersion = useCallback(
    async (options: CreateVersionOptions) => {
      const { name, description, content, type } = options;

      try {
        if (!content || content.length === 0) {
          console.error("❌ Empty content for version");
          throw new Error("Content cannot be empty");
        }

        if (type === "whiteboard") {
          try {
            JSON.parse(content);
          } catch (parseError) {
            console.error(
              "❌ Invalid JSON content for whiteboard:",
              parseError,
            );
            throw new Error("Whiteboard content must be valid JSON");
          }
        }

        const response = await fetch(`/api/files/${fileId}/versions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, description, content, type }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.warn("Versions API not found, creating local version");
            const localVersion: DocumentVersion = {
              id: `local-${Date.now()}`,
              version: versions.length + 1,
              name: name || `Local ${type} version`,
              description: description || "Locally created version",
              content,
              fileId,
              authorId: "local-user",
              createdAt: new Date().toISOString(),
              author: {
                id: "local-user",
                name: "Local User",
                email: "fallback@example.com",
              },
              type: type,
            };

            setVersions((prev) => [localVersion, ...prev]);

            return localVersion;
          }

          throw new Error(`Failed to create version: ${response.status}`);
        }

        const newVersion = await response.json();

        setVersions((prev) => [newVersion, ...prev]);

        return newVersion;
      } catch (error) {
        console.error(`❌ Error creating ${type} version:`, error);

        console.warn("Creating fallback local version due to error");
        const fallbackVersion: DocumentVersion = {
          id: `fallback-${Date.now()}`,
          version: versions.length + 1,
          name: name || `Fallback ${type} version`,
          description: description || "Fallback version created due to error",
          content,
          fileId,
          authorId: "fallback-user",
          createdAt: new Date().toISOString(),
          author: {
            id: "fallback-user",
            name: "Fallback User",
            email: "fallback@example.com",
          },
          type: type,
        };

        setVersions((prev) => [fallbackVersion, ...prev]);

        return fallbackVersion;
      }
    },
    [fileId, versions.length],
  );

  const restoreVersion = useCallback(
    async (versionId: string, expectedType?: "document" | "whiteboard") => {
      try {
        if (!versions.length) {
          console.warn("⚠️ Versions list empty — fetching...");
          await fetchVersions(true);
        }

        const currentVersions = versions.length
          ? versions
          : await fetchVersions(true);
        const version = currentVersions?.find((v: any) => v.id === versionId);
        if (!version) throw new Error("Version not found after refetch");

        const versionType = version.type || expectedType;
        if (!versionType) throw new Error("Version type not specified");

        await onVersionRestore?.(version.content, versionType);
        return { version, restoredVia: "callback" } as const;
      } catch (error) {
        console.error("❌ VERSION MANAGER: Error:", error);
        throw error;
      }
    },
    [fileId, onVersionRestore, versions, fetchVersions],
  );

  const refreshVersions = useCallback(async () => {
    return await fetchVersions(true);
  }, [fetchVersions]);

  return {
    versions,
    isLoading,
    showVersionHistory,
    setShowVersionHistory,
    fetchVersions,
    createManualVersion,
    restoreVersion,
    refreshVersions,
  };
}
