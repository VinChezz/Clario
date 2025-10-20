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

  const lastVersionTime = useRef<number>(0);
  const pendingAutoVersion = useRef<NodeJS.Timeout | null>(null);
  const lastContent = useRef<string>("");
  const lastElementCount = useRef<number>(0);

  const autoVersioning = fileData?.autoVersioning ?? true;

  const fetchVersions = useCallback(async () => {
    if (!fileId) return;

    setIsLoading(true);
    try {
      console.log(`📋 Fetching versions for file: ${fileId}`);
      const response = await fetch(`/api/files/${fileId}/versions`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ Failed to fetch versions: ${response.status}`,
          errorText
        );
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Versions fetched:`, data.length);
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
      const { name, description, content, type } = options;

      try {
        console.log(`🆕 Creating ${type} version for file: ${fileId}`, {
          name,
          contentLength: content.length,
        });

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
            responseText
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
        console.log(`✅ ${type} version created:`, newVersion.id);

        setVersions((prev) => [newVersion, ...prev]);
        lastVersionTime.current = Date.now();

        return newVersion;
      } catch (error) {
        console.error(`❌ Error creating ${type} version:`, error);
        throw error;
      }
    },
    [fileId]
  );

  const createAutoVersion = useCallback(
    (options: CreateVersionOptions) => {
      const now = Date.now();
      const timeSinceLastVersion = now - lastVersionTime.current;
      const minTimeBetweenAutoVersions = 2 * 60 * 1000;

      if (timeSinceLastVersion < minTimeBetweenAutoVersions) {
        console.log("⏰ Too soon since last version, skipping auto-version");
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
    [createVersion]
  );

  const createManualVersion = useCallback(
    async (options: CreateVersionOptions) => {
      if (pendingAutoVersion.current) {
        clearTimeout(pendingAutoVersion.current);
        pendingAutoVersion.current = null;
      }

      return await createVersion(options);
    },
    [createVersion]
  );

  const restoreVersion = useCallback(
    async (versionId: string, type: "document" | "whiteboard") => {
      try {
        console.log(`🔄 Restoring ${type} version: ${versionId}`);

        const response = await fetch(
          `/api/versions/restore?fileId=${fileId}&versionId=${versionId}`
        );

        const responseText = await response.text();

        if (!response.ok) {
          console.error(
            `❌ Failed to restore: ${response.status}`,
            responseText
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
    [fileId, onVersionRestore]
  );

  const hasSignificantChanges = useCallback(
    (newContent: string, oldContent: string): boolean => {
      if (!oldContent) return true;

      try {
        const newData = JSON.parse(newContent);
        const oldData = JSON.parse(oldContent);

        if (newData.blocks && oldData.blocks) {
          const blockChangeThreshold = 2;
          const textChangeThreshold = 100;

          if (
            Math.abs(newData.blocks.length - oldData.blocks.length) >=
            blockChangeThreshold
          ) {
            return true;
          }

          const newText = newData.blocks
            .map((block: any) => block.data?.text || "")
            .join("");
          const oldText = oldData.blocks
            .map((block: any) => block.data?.text || "")
            .join("");
          const textChange = Math.abs(newText.length - oldText.length);

          return textChange >= textChangeThreshold;
        }

        return true;
      } catch {
        const changeThreshold = 100;
        return (
          Math.abs(newContent.length - oldContent.length) >= changeThreshold
        );
      }
    },
    []
  );

  const hasSignificantCanvasChanges = useCallback(
    (elements: any, oldElementCount: number): boolean => {
      if (oldElementCount === 0) return true;

      const currentElementCount = elements?.length || 0;
      const elementChange = Math.abs(currentElementCount - oldElementCount);

      return elementChange >= 3;
    },
    []
  );

  return {
    versions,
    isLoading,
    showVersionHistory,

    setShowVersionHistory,

    fetchVersions,
    createVersion,
    createAutoVersion,
    createManualVersion,
    restoreVersion,

    hasSignificantChanges,
    hasSignificantCanvasChanges,

    lastContent,
    lastElementCount,

    autoVersioning,
  };
}
