"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/app/_context/AppearanceContext";

function WhiteboardMockup({ isDark }: { isDark: boolean }) {
  const colors = {
    bg: isDark ? "#0A0A0A" : "#FFFFFF",
    grid: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    nodeBg: isDark ? "oklch(0.13 0.005 260)" : "oklch(0.96 0.005 260)",
    nodeBorder: isDark ? "oklch(0.28 0.005 260)" : "oklch(0.85 0.005 260)",
    textPrimary: isDark ? "oklch(0.85 0 0)" : "oklch(0.2 0 0)",
    textSecondary: isDark ? "oklch(0.5 0 0)" : "oklch(0.45 0 0)",
    accentBlue: isDark ? "oklch(0.72 0.19 220)" : "oklch(0.55 0.19 220)",
    accentOrange: isDark ? "oklch(0.7 0.2 30)" : "oklch(0.6 0.2 30)",
    accentGreen: isDark ? "oklch(0.7 0.15 160)" : "oklch(0.5 0.15 160)",
    stickyNote: isDark
      ? "oklch(0.85 0.15 90 / 0.12)"
      : "oklch(0.95 0.15 90 / 0.3)",
    stickyNoteBorder: isDark
      ? "oklch(0.75 0.15 90 / 0.3)"
      : "oklch(0.85 0.15 90 / 0.5)",
  };

  return (
    <svg
      viewBox="0 0 800 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full transition-colors duration-300"
    >
      <defs>
        <pattern
          id="mockGrid"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="0.8" fill={colors.grid} />
        </pattern>
      </defs>
      <rect width="800" height="500" fill={colors.bg} />
      <rect width="800" height="500" fill="url(#mockGrid)" />

      <rect
        x="320"
        y="40"
        width="160"
        height="48"
        rx="24"
        fill={
          isDark ? "oklch(0.72 0.19 220 / 0.15)" : "oklch(0.55 0.19 220 / 0.1)"
        }
        stroke={
          isDark ? "oklch(0.72 0.19 220 / 0.5)" : "oklch(0.55 0.19 220 / 0.3)"
        }
        strokeWidth="1.5"
      />
      <text
        x="400"
        y="69"
        textAnchor="middle"
        fill={colors.accentBlue}
        fontSize="14"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        User Request
      </text>

      <line
        x1="400"
        y1="88"
        x2="400"
        y2="130"
        stroke={isDark ? "oklch(0.35 0 0)" : "oklch(0.75 0 0)"}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="400"
        y1="198"
        x2="400"
        y2="240"
        stroke={isDark ? "oklch(0.35 0 0)" : "oklch(0.75 0 0)"}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="400"
        y1="308"
        x2="400"
        y2="350"
        stroke={isDark ? "oklch(0.35 0 0)" : "oklch(0.75 0 0)"}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      <line
        x1="400"
        y1="198"
        x2="200"
        y2="240"
        stroke={isDark ? "oklch(0.35 0 0)" : "oklch(0.75 0 0)"}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="400"
        y1="198"
        x2="600"
        y2="240"
        stroke={isDark ? "oklch(0.35 0 0)" : "oklch(0.75 0 0)"}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      <rect
        x="310"
        y="130"
        width="180"
        height="68"
        rx="12"
        fill={colors.nodeBg}
        stroke={colors.nodeBorder}
        strokeWidth="1.5"
      />
      <text
        x="400"
        y="159"
        textAnchor="middle"
        fill={colors.textPrimary}
        fontSize="13"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        Validate Input
      </text>
      <text
        x="400"
        y="180"
        textAnchor="middle"
        fill={colors.textSecondary}
        fontSize="11"
        fontFamily="Geist, sans-serif"
      >
        Schema + Auth check
      </text>

      <rect
        x="110"
        y="240"
        width="180"
        height="68"
        rx="12"
        fill={colors.nodeBg}
        stroke={colors.nodeBorder}
        strokeWidth="1.5"
      />
      <text
        x="200"
        y="269"
        textAnchor="middle"
        fill={colors.textPrimary}
        fontSize="13"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        Cache Layer
      </text>
      <text
        x="200"
        y="290"
        textAnchor="middle"
        fill={colors.textSecondary}
        fontSize="11"
        fontFamily="Geist, sans-serif"
      >
        Redis lookup
      </text>

      <rect
        x="310"
        y="240"
        width="180"
        height="68"
        rx="12"
        fill={colors.nodeBg}
        stroke={
          isDark ? "oklch(0.72 0.19 220 / 0.4)" : "oklch(0.55 0.19 220 / 0.3)"
        }
        strokeWidth="1.5"
      />
      <text
        x="400"
        y="269"
        textAnchor="middle"
        fill={colors.textPrimary}
        fontSize="13"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        Process Data
      </text>
      <text
        x="400"
        y="290"
        textAnchor="middle"
        fill={colors.textSecondary}
        fontSize="11"
        fontFamily="Geist, sans-serif"
      >
        Transform + enrich
      </text>

      <rect
        x="510"
        y="240"
        width="180"
        height="68"
        rx="12"
        fill={colors.nodeBg}
        stroke={colors.nodeBorder}
        strokeWidth="1.5"
      />
      <text
        x="600"
        y="269"
        textAnchor="middle"
        fill={colors.textPrimary}
        fontSize="13"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        Notify Team
      </text>
      <text
        x="600"
        y="290"
        textAnchor="middle"
        fill={colors.textSecondary}
        fontSize="11"
        fontFamily="Geist, sans-serif"
      >
        Webhook + email
      </text>

      <rect
        x="300"
        y="350"
        width="200"
        height="56"
        rx="12"
        fill={
          isDark ? "oklch(0.18 0.06 160 / 0.2)" : "oklch(0.9 0.06 160 / 0.3)"
        }
        stroke={
          isDark ? "oklch(0.55 0.15 160 / 0.5)" : "oklch(0.45 0.15 160 / 0.3)"
        }
        strokeWidth="1.5"
      />
      <text
        x="400"
        y="383"
        textAnchor="middle"
        fill={colors.accentGreen}
        fontSize="13"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        Response Sent
      </text>

      <g
        transform="translate(520, 140)"
        style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))" }}
      >
        <path
          d="M34.5886 96.815C42.9777 95.9679 48.8335 82.4952 55.7265 78.2871C58.4419 76.6292 60.8491 78.3131 62.5498 80.5271L79.0059 101.946C81.8728 105.678 83.8921 106.789 88.2153 104.576C94.8616 101.173 101.178 94.8479 104.575 88.2138C106.789 83.8921 105.678 81.8723 101.947 79.0059L80.5271 62.5498C78.3131 60.8486 76.6297 58.4419 78.2876 55.7265C82.4952 48.8334 95.9684 42.9776 96.815 34.5885C98.3043 19.2974 26.7317 5.37326 16.0518 16.0518C5.3732 26.7316 19.2973 98.3038 34.5886 96.815Z"
          stroke={colors.accentBlue}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="scale(0.12)"
        />
        <g transform="translate(3, 3) scale(0.05)">
          <path
            d="M0 0 L0 18 L5 13 L11 22 L14 20 L8 11 L14 9 Z"
            fill={colors.accentBlue}
            stroke={isDark ? "oklch(0.07 0.005 260)" : "oklch(0.2 0 0)"}
            strokeWidth="1"
          />
        </g>
      </g>
      <rect
        x="544"
        y="153"
        width="48"
        height="20"
        rx="4"
        fill={colors.accentBlue}
      />
      <text
        x="568"
        y="167"
        textAnchor="middle"
        fill={isDark ? "oklch(0.07 0.005 260)" : "white"}
        fontSize="9"
        fontFamily="Geist, sans-serif"
        fontWeight="600"
      >
        Sarah
      </text>

      <g
        transform="translate(140, 325)"
        style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))" }}
      >
        <path
          d="M34.5886 96.815C42.9777 95.9679 48.8335 82.4952 55.7265 78.2871C58.4419 76.6292 60.8491 78.3131 62.5498 80.5271L79.0059 101.946C81.8728 105.678 83.8921 106.789 88.2153 104.576C94.8616 101.173 101.178 94.8479 104.575 88.2138C106.789 83.8921 105.678 81.8723 101.947 79.0059L80.5271 62.5498C78.3131 60.8486 76.6297 58.4419 78.2876 55.7265C82.4952 48.8334 95.9684 42.9776 96.815 34.5885C98.3043 19.2974 26.7317 5.37326 16.0518 16.0518C5.3732 26.7316 19.2973 98.3038 34.5886 96.815Z"
          stroke={colors.accentOrange}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="scale(0.12)"
        />
        <g transform="translate(3, 3) scale(0.05)">
          <path
            d="M0 0 L0 18 L5 13 L11 22 L14 20 L8 11 L14 9 Z"
            fill={colors.accentOrange}
            stroke={isDark ? "oklch(0.07 0.005 260)" : "oklch(0.2 0 0)"}
            strokeWidth="1"
          />
        </g>
      </g>
      <rect
        x="164"
        y="338"
        width="40"
        height="20"
        rx="4"
        fill={colors.accentOrange}
      />
      <text
        x="184"
        y="352"
        textAnchor="middle"
        fill={isDark ? "oklch(0.07 0.005 260)" : "white"}
        fontSize="9"
        fontFamily="Geist, sans-serif"
        fontWeight="600"
      >
        Alex
      </text>

      <rect
        x="620"
        y="380"
        width="130"
        height="80"
        rx="6"
        fill={colors.stickyNote}
        stroke={colors.stickyNoteBorder}
        strokeWidth="1"
      />
      <text
        x="685"
        y="408"
        textAnchor="middle"
        fill={isDark ? "oklch(0.75 0.1 90)" : "oklch(0.45 0.1 90)"}
        fontSize="11"
        fontFamily="Geist, sans-serif"
        fontWeight="500"
      >
        TODO:
      </text>
      <text
        x="685"
        y="425"
        textAnchor="middle"
        fill={isDark ? "oklch(0.55 0.05 90)" : "oklch(0.35 0.05 90)"}
        fontSize="10"
        fontFamily="Geist, sans-serif"
      >
        Add error handling
      </text>
      <text
        x="685"
        y="442"
        textAnchor="middle"
        fill={isDark ? "oklch(0.55 0.05 90)" : "oklch(0.35 0.05 90)"}
        fontSize="10"
        fontFamily="Geist, sans-serif"
      >
        for edge cases
      </text>
    </svg>
  );
}

export function ProductShowcase() {
  const [mounted, setMounted] = useState(false);
  const ref = useRef(null);

  let theme;
  try {
    theme = useTheme();
  } catch (e) {
    theme = { isDark: false };
  }

  const { isDark } = theme;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section id="product" className="relative px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="product"
      className="relative px-6 py-8 w-full transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #1A1A1A, #0A0A0A)"
                : "linear-gradient(135deg, #F9FAFB, #FFFFFF)",
              backdropFilter: "blur(40px)",
              boxShadow: isDark
                ? "0 0 0 1px rgba(255,255,255,0.05), 0 25px 80px -12px rgba(0,0,0,0.8)"
                : "0 0 0 1px rgba(0,0,0,0.05), 0 25px 80px -12px rgba(0,0,0,0.2), 0 0 120px -40px rgba(59,130,246,0.2)",
            }}
          >
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1">
                <div className="h-3 w-3 rounded-sm bg-blue-500/50" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  clario.app/whiteboard/product-roadmap
                </span>
              </div>
              <div className="w-[52px]" />
            </div>

            <div className="aspect-16/10 w-full">
              <WhiteboardMockup isDark={isDark} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
