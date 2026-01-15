import { useEffect } from "react";

export function useIosScrollFix() {
  useEffect(() => {
    const preventBounce = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const isAtTop = scrollY === 0;
      const isAtBottom =
        scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 1;

      if (
        (isAtTop && e.touches[0].clientY > 10) ||
        (isAtBottom && e.touches[0].clientY < window.innerHeight - 10)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventBounce, { passive: false });

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      document.removeEventListener("touchmove", preventBounce);
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);
}
