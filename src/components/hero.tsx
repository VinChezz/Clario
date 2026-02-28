"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/_context/AppearanceContext";

export function Hero() {
  const { isAuthenticated, user } = useKindeBrowserClient();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  let isDark = false;
  try {
    const theme = useTheme();
    isDark = theme.isDark;
  } catch (e) {
    if (typeof window !== "undefined") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20 bg-white dark:bg-[#0A0A0A]">
        <div className="h-screen w-full" />
      </section>
    );
  }

  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.03)"
    : "rgba(0, 0, 0, 0.05)";

  const bgColor = isDark ? "#0A0A0A" : "#ffffff";

  const darkGradients = (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 10% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse at 90% 60%, rgba(139, 92, 246, 0.05) 0%, transparent 40%)
          `,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(10, 10, 10, 0) 0%, #0A0A0A 100%),
            linear-gradient(0deg, rgba(10, 10, 10, 0) 0%, #0A0A0A 100%)
          `,
          opacity: 0.5,
        }}
      />
    </>
  );

  const lightGradients = (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
          `,
        }}
      />
    </>
  );

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20"
      style={{ backgroundColor: bgColor }}
    >
      {isDark ? darkGradients : lightGradients}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Now in public beta
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl text-gray-900 dark:text-white"
        >
          <span>Think together.</span>
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Build faster.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-gray-600 dark:text-gray-400"
        >
          Clario is the collaborative whiteboard where teams brainstorm, plan,
          and design together in real-time. Beautifully minimal. Blazingly fast.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {isAuthenticated ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 shadow-md hover:shadow-lg"
            >
              Go to Dashboard
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <RegisterLink className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 shadow-md hover:shadow-lg">
              Get Started
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </RegisterLink>
          )}
          <a
            href="#product"
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-800 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            See it in action
          </a>
        </motion.div>

        {isAuthenticated && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-sm text-gray-600 dark:text-gray-400"
          >
            Welcome back, {user?.given_name || user?.email}! 👋
          </motion.p>
        )}
      </div>
    </section>
  );
}
