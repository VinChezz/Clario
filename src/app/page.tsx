"use client";
import Header from "./_components/Header";
import Hero from "./_components/Hero";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useEffect, useState } from "react";
import EraserLoader from "./_loaders/ErasorLoader";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingParticles } from "./_components/FloatingParticles";

export default function Home() {
  const { user } = useKindeBrowserClient();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    console.log("User info", user);
  }, [user]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setTimeout(() => setShowContent(true), 300);
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <EraserLoader
            onLoadingComplete={handleLoadingComplete}
            loadingTime={3000}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden"
          >
            {/* Фоновые элементы как в лоадере */}
            <div className="absolute inset-0">
              <motion.div
                className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-slate-200/5 blur-3xl"
                animate={{ scale: [1.2, 1, 1.2] }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </div>

            {/* Плавающие частицы */}
            <FloatingParticles />

            {/* Декоративные элементы */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-10 left-10 w-32 h-32 bg-indigo-400/5 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-20 right-20 w-48 h-48 bg-slate-200/3 rounded-full blur-2xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 7, repeat: Infinity }}
              />
            </div>

            {/* Контент */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative z-10"
            >
              <Header />
              <Hero />
            </motion.div>

            {/* Дополнительные анимированные элементы */}
            <motion.div
              className="absolute bottom-10 left-10 w-6 h-6 bg-indigo-400/20 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="absolute top-20 right-1/4 w-4 h-4 bg-slate-200/30 rounded-full"
              animate={{
                y: [0, 15, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
