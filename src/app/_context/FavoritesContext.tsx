"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (fileId: string) => void;
  isFavorite: (fileId: string) => boolean;
  favoritesCount: number;
  refreshFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useKindeBrowserClient();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const favoritesKey = user?.id ? `favorites_${user.id}` : null;

  const loadFavorites = useCallback(() => {
    if (!favoritesKey) return;

    try {
      const saved = localStorage.getItem(favoritesKey);
      if (saved) {
        const favoritesArray = JSON.parse(saved) as string[];
        const favoritesSet = new Set<string>(favoritesArray);
        setFavorites(favoritesSet);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [favoritesKey]);

  const saveFavorites = useCallback(
    (newFavorites: Set<string>) => {
      if (!favoritesKey) return;

      try {
        localStorage.setItem(
          favoritesKey,
          JSON.stringify(Array.from(newFavorites)),
        );
      } catch (error) {
        console.error("Error saving favorites:", error);
      }
    },
    [favoritesKey],
  );

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    (fileId: string) => {
      console.log("toggleFavorite called with:", fileId);

      setFavorites((prev) => {
        const newFavorites = new Set(prev);

        if (newFavorites.has(fileId)) {
          newFavorites.delete(fileId);
          console.log("Removed from favorites:", fileId);
        } else {
          newFavorites.add(fileId);
          console.log("Added to favorites:", fileId);
        }

        saveFavorites(newFavorites);

        return newFavorites;
      });
    },
    [saveFavorites],
  );

  const isFavorite = useCallback(
    (fileId: string): boolean => {
      return favorites.has(fileId);
    },
    [favorites],
  );

  const refreshFavorites = useCallback(() => {
    loadFavorites();
  }, [loadFavorites]);

  const contextValue = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      favoritesCount: favorites.size,
      refreshFavorites,
    }),
    [favorites, toggleFavorite, isFavorite, refreshFavorites],
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === favoritesKey && e.newValue) {
        loadFavorites();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [favoritesKey, loadFavorites]);

  if (!isInitialized) {
    return null;
  }

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
