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

  // Refs для відстеження стану
  const lastVersionTime = useRef<number>(0);
  const pendingAutoVersion = useRef<NodeJS.Timeout | null>(null);

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
      const { name, description, content } = options;

      try {
        console.log(`🆕 Creating version for file: ${fileId}`, {
          name,
          contentLength: content.length,
        });

        // Перевіряємо валідність контенту
        if (!content || content.length === 0) {
          throw new Error("Content cannot be empty");
        }

        // Перевіряємо, чи це валідний JSON
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

        // Парсимо успішну відповідь
        const newVersion = JSON.parse(responseText);
        console.log(`✅ Version created:`, newVersion.id);

        // Оновлюємо стан
        setVersions((prev) => [newVersion, ...prev]);
        lastVersionTime.current = Date.now();

        return newVersion;
      } catch (error) {
        console.error("❌ Error creating version:", error);
        throw error;
      }
    },
    [fileId]
  );

  // Автоматичне створення версії з дебаунсом та перевірками
  const createAutoVersion = useCallback(
    (options: CreateVersionOptions) => {
      const now = Date.now();
      const timeSinceLastVersion = now - lastVersionTime.current;
      const minTimeBetweenAutoVersions = 2 * 60 * 1000; // 2 хвилини

      // Якщо минуло менше 2 хвилин з останньої версії - пропускаємо
      if (timeSinceLastVersion < minTimeBetweenAutoVersions) {
        console.log("⏰ Too soon since last version, skipping auto-version");
        return;
      }

      // Очищаємо попередній таймер
      if (pendingAutoVersion.current) {
        clearTimeout(pendingAutoVersion.current);
      }

      // Встановлюємо новий таймер (30 секунд дебаунс для авто-версій)
      pendingAutoVersion.current = setTimeout(() => {
        createVersion(options).catch((error) => {
          console.error("❌ Auto-version creation failed:", error);
          // Не показуємо toast для автоматичних помилок
        });
      }, 30000); // 30 секунд
    },
    [createVersion]
  );

  // Примусове створення версії (для кнопки save)
  const createManualVersion = useCallback(
    async (options: CreateVersionOptions) => {
      // Очищаємо авто-таймер
      if (pendingAutoVersion.current) {
        clearTimeout(pendingAutoVersion.current);
        pendingAutoVersion.current = null;
      }

      return await createVersion(options);
    },
    [createVersion]
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      try {
        console.log(`🔄 Restoring version via query params: ${versionId}`);

        // Використовуємо endpoint з query параметрами
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
        console.log(`✅ Version data retrieved:`, restoreData.version.id);
        return restoreData;
      } catch (error) {
        console.error("❌ Error restoring version:", error);
        throw error;
      }
    },
    [fileId]
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
