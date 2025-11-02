import { useState, useCallback, useRef } from "react";

interface DocumentVersion {
  id: string;
  version: number;
  name?: string;
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
  onVersionRestore?: (content: string, type: "document" | "whiteboard") => void;
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
        console.log("🔄 Using cached versions (request too recent)");
        return;
      }

      setIsLoading(true);
      try {
        console.log(`📋 Fetching versions for file: ${fileId}`, {
          forceRefresh,
        });
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
        console.log(`✅ Versions fetched:`, data.length);

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
    [fileId]
  );

  const createManualVersion = useCallback(
    async (options: CreateVersionOptions) => {
      const { name, description, content, type } = options;

      try {
        console.log(`🆕 Creating ${type} version for file: ${fileId}`, {
          name,
          contentLength: content.length,
          type,
        });

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
              parseError
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
                email: "local@example.com",
              },
            };

            setVersions((prev) => [localVersion, ...prev]);
            console.log(`✅ Local ${type} version created:`, localVersion.id);
            return localVersion;
          }

          throw new Error(`Failed to create version: ${response.status}`);
        }

        const newVersion = await response.json();
        console.log(`✅ ${type} version created successfully:`, newVersion.id);

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
        };

        setVersions((prev) => [fallbackVersion, ...prev]);
        console.log(`✅ Fallback ${type} version created:`, fallbackVersion.id);
        return fallbackVersion;
      }
    },
    [fileId, versions.length]
  );

  const restoreVersion = useCallback(
    async (versionId: string, type: "document" | "whiteboard") => {
      try {
        console.log(`🔄 Restoring ${type} version: ${versionId}`);

        const localVersion = versions.find((v) => v.id === versionId);
        if (localVersion && onVersionRestore) {
          console.log("✅ Using local version for restore");
          onVersionRestore(localVersion.content, type);
          return { version: localVersion };
        }

        const response = await fetch(
          `/api/versions/restore?fileId=${fileId}&versionId=${versionId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to restore version: ${response.status}`);
        }

        const restoreData = await response.json();
        console.log(
          `✅ ${type} version data retrieved:`,
          restoreData.version.id
        );

        if (onVersionRestore) {
          onVersionRestore(restoreData.version.content, type);
        }

        return restoreData;
      } catch (error) {
        console.error(`❌ Error restoring ${type} version:`, error);
        throw error;
      }
    },
    [fileId, onVersionRestore, versions]
  );

  const refreshVersions = useCallback(async () => {
    console.log("🔄 Manual refresh of versions requested");
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
