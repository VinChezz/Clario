"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EraserLoaderProps {
  onLoadingComplete?: () => void;
  loadingTime?: number;
}
export default function EraserLoader({
  onLoadingComplete,
  loadingTime = 4000,
}: EraserLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    "Initialization of schemes...",
    "Loading tools...",
    "Preparing the canvas...",
    "Ready!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (loadingTime / 100);
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onLoadingComplete?.();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, loadingTime / loadingSteps.length);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [loadingTime, loadingSteps.length, onLoadingComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Фоновые элементы */}
      <div className="absolute inset-0">
        {/* Большие круги */}
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

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-indigo-400/20 max-w-md w-full relative z-10"
      >
        {/* Логотип и заголовок */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-slate-200 to-indigo-400 bg-clip-text text-transparent"
            animate={{ backgroundPosition: ["0%", "200%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{ backgroundSize: "200% auto" }}
          >
            Clario
          </motion.h1>
          <p className="text-slate-200/70 text-sm mt-3 font-light tracking-wide">
            Clean workspace for your ideas
          </p>
        </motion.div>

        {/* Анимированный ластик */}
        <div className="flex justify-center mb-8">
          <motion.div
            className="relative"
            animate={{
              y: [0, -12, 0],
              rotate: [-4, 4, -4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Ластик */}
            <motion.div
              className="w-20 h-10 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 rounded-xl shadow-2xl relative z-10 border border-slate-200/20"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Полоски на ластике */}
              <div className="absolute inset-0 flex items-center justify-between px-3">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-6 bg-white/40 rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.3, type: "spring" }}
                  />
                ))}
              </div>

              {/* Блики */}
              <div className="absolute top-1 left-2 w-3 h-1 bg-white/30 rounded-full blur-sm" />
              <div className="absolute bottom-1 right-2 w-2 h-1 bg-white/20 rounded-full blur-sm" />
            </motion.div>

            {/* След от ластика */}
            <motion.div
              className="absolute -bottom-3 left-3 right-3 h-2 bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent rounded-full blur-sm"
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scaleX: [0.7, 1.3, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>

        {/* Прогресс бар */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-200 font-medium">Progress</span>
            <motion.span
              className="text-indigo-400 font-semibold"
              key={Math.round(progress)}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
          <div className="h-3 bg-slate-200/10 rounded-full overflow-hidden border border-slate-200/5">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }}
            >
              {/* Блик на прогресс баре */}
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/30 rounded-r-full" />
            </motion.div>
          </div>
        </div>

        {/* Текущий статус */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.05 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="text-center text-slate-200 font-medium h-7 text-sm tracking-wide"
          >
            {loadingSteps[currentStep]}
          </motion.p>
        </AnimatePresence>

        {/* Декоративные элементы вокруг карточки */}
        <div className="absolute -inset-4 -z-10">
          <motion.div
            className="absolute top-0 left-0 w-20 h-20 bg-indigo-400/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-16 h-16 bg-slate-200/5 rounded-full blur-xl"
            animate={{
              scale: [1.5, 1, 1.5],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// Компонент плавающих частиц
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 3,
    size: Math.random() * 3 + 1,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `rgba(99, 102, 241, ${0.2 + Math.random() * 0.3})`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
