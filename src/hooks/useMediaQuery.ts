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
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsLargeTablet(): boolean {
  return useMediaQuery("(min-width: 1024px) and (max-width: 1400px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}

export function useIsHorizontalMobile(): boolean {
  return useMediaQuery("(max-width: 950px) and (max-height: 600px)");
}

export function useIsHorizontalTablet(): boolean {
  return useMediaQuery("(max-width: 1200px) and (max-height: 980px)");
}

export function useIsSmallMobile(): boolean {
  return useMediaQuery("(max-width: 380px)");
}

export function useIsLandscape(): boolean {
  return useMediaQuery("(orientation: landscape) and (max-height: 600px)");
}

export function useWindowHeight(): number | null {
  const [windowHeight, setWindowHeight] = useState<number | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  return windowHeight;
}
