"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Compass, Ghost, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl transition-all duration-300"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl transition-all duration-300"
          style={{
            transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`,
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f0f0f0_1px,transparent_1px),linear-gradient(180deg,#f0f0f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 dark:bg-[linear-gradient(90deg,#333_1px,transparent_1px),linear-gradient(180deg,#333_1px,transparent_1px)] dark:opacity-5" />
      </div>

      <div className="relative max-w-xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          {/* Main 404 with floating animation */}
          <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="text-[120px] md:text-[140px] font-bold tracking-tighter">
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                  4
                </span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500/20 border border-blue-400/30"
                />
              </span>

              <span className="relative mx-2 md:mx-4">
                <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                  0
                </span>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              </span>

              <span className="relative">
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 bg-clip-text text-transparent">
                  4
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-emerald-500/20"
                />
              </span>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-8 right-12 p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30"
            >
              <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </motion.div>

            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, -180, -360],
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-8 left-12 p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30"
            >
              <Ghost className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </motion.div>
          </motion.div>

          {/* Message card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
              <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                    <Compass className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Lost in the digital void?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                      This page seems to have wandered off. Let's get you back
                      on track.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action buttons with glow */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button
              asChild
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-blue-500/25"
            >
              <a href="/dashboard">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Home className="h-4 w-4 mr-2" />
                Take me home
              </a>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleGoBack}
              className="group border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to safety</span>
              </div>
            </Button>
          </motion.div>

          {/* Techy footer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-8 border-t border-gray-200/50 dark:border-gray-800/50"
          >
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800/50">
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Error 404
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  System status:{" "}
                  <span className="text-green-600 dark:text-green-400">
                    Operational
                  </span>
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Need assistance? Our support team is just a click away.
            </p>
          </motion.div>
        </motion.div>

        {/* Interactive floating dots */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-blue-400/30"
            initial={{
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
              scale: 0,
            }}
            animate={{
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
