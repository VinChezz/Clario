"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 799px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 800px) and (max-width: 1020px)");
}

export function useIsLargeTablet(): boolean {
  return useMediaQuery("(min-width: 1021px) and (max-width: 1366px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1367px)");
}
