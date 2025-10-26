"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoLoaderProps {
  onLoadingComplete?: () => void;
  loadingTime?: number;
}

export default function LogoClarioLoader({
  onLoadingComplete,
  loadingTime = 4000,
}: LogoLoaderProps) {
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
          setTimeout(() => onLoadingComplete?.(), 500);
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
      <div className="absolute inset-0 pointer-events-none -z-20">
        <motion.div
          className="absolute -left-20 -top-20 w-[520px] h-[520px] rounded-full bg-indigo-600/8 blur-3xl"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 -bottom-16 w-[420px] h-[420px] rounded-full bg-slate-200/6 blur-3xl"
          animate={{ scale: [1.1, 0.95, 1.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-indigo-400/20 max-w-md w-full relative z-10"
      >
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
            <motion.svg
              width="80"
              height="56"
              viewBox="0 0 200 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <defs>
                <linearGradient id="dropGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#78E6FF" />
                  <stop offset="100%" stopColor="#1E60FF" />
                </linearGradient>
                <linearGradient id="innerGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#4FC3FF" />
                  <stop offset="100%" stopColor="#0D47A1" />
                </linearGradient>
              </defs>

              <motion.path
                d="M100 6 C120 32 162 66 162 102 C162 128 132 142 100 136 C68 142 38 128 38 102 C38 66 80 32 100 6 Z"
                fill="url(#dropGrad)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
                initial={{ translateY: 0 }}
                animate={{ translateY: [0, -6, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.path
                d="M102 46 C118 62 142 78 142 104 C142 122 120 132 102 130 C86 132 72 124 72 110 C72 96 86 72 102 46 Z"
                fill="url(#innerGrad)"
                initial={{ translateY: 0 }}
                animate={{ translateY: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.path
                d="M82 36 C94 54 118 68 116 96"
                stroke="#FFFFFF"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0.9] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                opacity={0.95}
              />

              <motion.path
                d="M128 14 C140 28 150 44 146 66"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ opacity: 0.6, translateX: -3 }}
                animate={{ opacity: [0.6, 1, 0.6], translateX: [-3, 0, -3] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.svg>

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
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/30 rounded-r-full" />
            </motion.div>
          </div>
        </div>

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
