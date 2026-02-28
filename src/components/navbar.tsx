"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
  LoginLink,
  RegisterLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { useTheme } from "@/app/_context/AppearanceContext";
import Link from "next/link";

const navLinks = [
  { label: "Action", href: "#action" },
  { label: "Reviews", href: "#reviews" },
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Stack", href: "#stack" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const { user, isAuthenticated } = useKindeBrowserClient();

  let themeContext;
  try {
    themeContext = useTheme();
  } catch (e) {}

  useEffect(() => {
    setMounted(true);

    const timer = setTimeout(() => {
      setThemeReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !themeReady) {
    return (
      <div className="h-16 bg-background/60 backdrop-blur-xl border-b border-border/50" />
    );
  }

  const { toggleTheme, isDark } = themeContext!;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 dark:bg-gray-700">
            <img
              src={"/logo-1.png"}
              alt="logo img"
              width="32"
              height="32"
              className="rounded-lg"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Clario
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            const isHash = link.href.startsWith("#");
            const Component = isHash ? "a" : Link;
            const props = isHash
              ? { href: link.href }
              : {
                  href: link.href,
                  className:
                    "text-sm text-muted-foreground transition-colors hover:text-foreground",
                };

            return (
              <Component
                key={link.label}
                {...props}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={isHash ? undefined : () => setMobileOpen(false)}
              >
                {link.label}
              </Component>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <span className="text-sm text-muted-foreground">
                {user?.given_name || user?.email}
              </span>
              <LogoutLink className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                Sign out
              </LogoutLink>
            </>
          ) : (
            <>
              <LoginLink className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Sign in
              </LoginLink>
              <RegisterLink className="rounded-lg bg-blue-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                Get Started
              </RegisterLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/50 bg-background/95 backdrop-blur-xl lg:hidden"
        >
          <div className="flex flex-col gap-4 px-6 py-6">
            {navLinks.map((link) => {
              const isHash = link.href.startsWith("#");
              const Component = isHash ? "a" : Link;
              const props = isHash
                ? { href: link.href, onClick: () => setMobileOpen(false) }
                : {
                    href: link.href,
                    onClick: () => setMobileOpen(false),
                    className:
                      "text-sm text-muted-foreground transition-colors hover:text-foreground",
                  };

              return (
                <Component
                  key={link.label}
                  {...props}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Component>
              );
            })}

            <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    Signed in as {user?.given_name || user?.email}
                  </span>
                  <LogoutLink
                    className="rounded-lg bg-secondary px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign out
                  </LogoutLink>
                </>
              ) : (
                <>
                  <LoginLink
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </LoginLink>
                  <RegisterLink
                    className="rounded-lg bg-blue-400 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </RegisterLink>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
