"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer className="relative px-6 pb-12 pt-24">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-20 max-w-3xl text-center"
      >
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to think together?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Join thousands of teams already collaborating on Clario.
        </p>
        <RegisterLink className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-400 px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-blue-400/90">
          Start for free
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </RegisterLink>
      </motion.div>

      <div className="mx-auto max-w-5xl border-t border-border/50 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
              <img
                src={"/logo-1.png"}
                alt="logo img"
                width={"32"}
                height={"32"}
              />
            </div>
            <span className="text-sm font-medium text-foreground">Clario</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} Clario, Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
