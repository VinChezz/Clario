"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Users, Lock, Layers } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Real-time sync",
    description:
      "Sub-millisecond latency with conflict-free collaboration. Every stroke, every shape, instantly shared across your team.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    icon: Users,
    title: "Multiplayer by default",
    description:
      "Built for teams of any size. See live cursors, follow teammates, and comment inline without leaving the board.",
    className: "md:col-span-1 md:row-span-2",
  },
  {
    icon: Lock,
    title: "Enterprise-grade security",
    description:
      "SOC 2 Type II certified. End-to-end encryption. SSO and SCIM provisioning. Your data stays yours.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Layers,
    title: "Infinite canvas",
    description:
      "No boundaries, no limits. Pan, zoom, and organize across an infinite space with nested frames and smart layers.",
    className: "md:col-span-1 md:row-span-1",
  },
];

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your team needs
          </h2>
          <p className="mt-4 text-muted-foreground">
            Powerful features, thoughtfully crafted for modern workflows.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/30 ${feature.className}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), oklch(0.72 0.19 220 / 0.04), transparent 60%)",
                  }}
                />
                <div className="relative z-10">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
                    <Icon size={20} className="text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
