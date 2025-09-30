"use client";

import { motion } from "framer-motion";

const colors = [
  "bg-indigo-900",
  "bg-indigo-800",
  "bg-indigo-700",
  "bg-indigo-600",
  "bg-indigo-500",
  "bg-indigo-400",
  "bg-indigo-300",
  "bg-indigo-100",
];

export default function Loader() {
  const dots = Array.from({ length: 8 });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <motion.div
        className="relative w-32 h-32"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      >
        {dots.map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <motion.div
              key={i}
              className={`absolute w-6 h-6 rounded-full ${colors[i]}`}
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${angle}deg) translate(0, -60px)`,
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
