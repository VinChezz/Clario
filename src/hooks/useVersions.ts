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
}

export function useVersions(fileId: string) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const lastVersionTime = useRef<number>(0);
  const pendingAutoVersion = useRef<NodeJS.Timeout | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!fileId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/files/${fileId}/versions`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ Failed to fetch versions: ${response.status}`,
          errorText,
        );
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }

      const data = await response.json();

      setVersions(data);
    } catch (error) {
      console.error("Error fetching versions:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  const createVersion = useCallback(
    async (options: CreateVersionOptions) => {
      const { name, description, content } = options;

      try {
        if (!content || content.length === 0) {
          throw new Error("Content cannot be empty");
        }

        try {
          JSON.parse(content);
        } catch (parseError) {
          console.error("❌ Invalid JSON content:", parseError);
          throw new Error("Content must be valid JSON");
        }

        const response = await fetch(`/api/files/${fileId}/versions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, description, content }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          console.error(
            `❌ Failed to create version: ${response.status}`,
            responseText,
          );

          let errorMessage = `Failed to create version: ${response.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = responseText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const newVersion = JSON.parse(responseText);

        setVersions((prev) => [newVersion, ...prev]);
        lastVersionTime.current = Date.now();

        return newVersion;
      } catch (error) {
        console.error("❌ Error creating version:", error);
        throw error;
      }
    },
    [fileId],
  );

  const createAutoVersion = useCallback(
    (options: CreateVersionOptions) => {
      const now = Date.now();
      const timeSinceLastVersion = now - lastVersionTime.current;
      const minTimeBetweenAutoVersions = 2 * 60 * 1000;

      if (timeSinceLastVersion < minTimeBetweenAutoVersions) {
        return;
      }

      if (pendingAutoVersion.current) {
        clearTimeout(pendingAutoVersion.current);
      }

      pendingAutoVersion.current = setTimeout(() => {
        createVersion(options).catch((error) => {
          console.error("❌ Auto-version creation failed:", error);
        });
      }, 30000);
    },
    [createVersion],
  );

  const createManualVersion = useCallback(
    async (options: CreateVersionOptions) => {
      if (pendingAutoVersion.current) {
        clearTimeout(pendingAutoVersion.current);
        pendingAutoVersion.current = null;
      }

      return await createVersion(options);
    },
    [createVersion],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      try {
        const response = await fetch(
          `/api/versions/restore?fileId=${fileId}&versionId=${versionId}`,
        );

        const responseText = await response.text();

        if (!response.ok) {
          console.error(
            `❌ Failed to restore: ${response.status}`,
            responseText,
          );

          let errorMessage = `Failed to restore version: ${response.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = responseText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const restoreData = JSON.parse(responseText);
        return restoreData;
      } catch (error) {
        console.error("❌ Error restoring version:", error);
        throw error;
      }
    },
    [fileId],
  );

  return {
    versions,
    isLoading,
    fetchVersions,
    createAutoVersion,
    createManualVersion,
    restoreVersion,
  };
}
