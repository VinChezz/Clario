import Image from "next/image";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { HeaderProps } from "@/types/header";
import { TextProps } from "@/types/common";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelRightOpen, X } from "lucide-react";

export default function Header({ variant = "dark" }: HeaderProps & TextProps) {
  const isDark = variant === "dark";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    "About",
    "Careers",
    "History",
    "Services",
    "Projects",
    "Blog",
  ];

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`bg-white/5 backdrop-blur-xl border-b border-indigo-400/20 ${
        isDark ? "text-white" : "text-slate-900"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-screen-xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-center gap-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Image
            src={"/logo-1.png"}
            alt="logo"
            width={48}
            height={48}
            className="rounded-lg"
            priority
          />
          <motion.div
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-slate-200 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Clario
          </motion.div>
        </motion.div>

        <div className="flex flex-1 items-center justify-end md:justify-between">
          <motion.nav
            aria-label="Global"
            className="hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ul className="flex items-center gap-8 text-medium">
              {[
                "About",
                "Careers",
                "History",
                "Services",
                "Projects",
                "Blog",
              ].map((item, index) => (
                <motion.li key={item} whileHover={{ y: -2 }}>
                  <a
                    className="text-slate-200 font-light transition-all duration-300 hover:text-indigo-400 hover:font-medium"
                    href="#"
                  >
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.nav>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <LoginLink
                  postLoginRedirectURL="/dashboard"
                  className="block rounded-lg px-6 py-2.5 text-sm font-medium text-slate-200 transition-all duration-300 border border-indigo-400/30 hover:border-indigo-400 hover:bg-indigo-400/10 hover:text-white"
                >
                  Login
                </LoginLink>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <RegisterLink className="block rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-indigo-500/25">
                  Register
                </RegisterLink>
              </motion.div>
            </div>

            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-lg bg-white/10 text-slate-200 transition-all duration-300 hover:bg-white/20 hover:text-white border border-indigo-400/20"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isMobileMenuOpen ? "open" : "closed"}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isMobileMenuOpen ? (
                          <PanelRightOpen className="h-5 w-5" />
                        ) : (
                          <PanelLeftOpen className="h-5 w-5" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-[85vw] max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-indigo-400/20 p-0 overflow-hidden"
                >
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between p-6 border-b border-indigo-400/20">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <Image
                          src={"/logo-1.png"}
                          alt="logo"
                          width={32}
                          height={32}
                          className="rounded-lg"
                          priority
                        />
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-slate-200 bg-clip-text text-transparent">
                          Clario
                        </span>
                      </motion.div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="h-8 w-8 rounded-lg text-slate-200 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <nav className="flex-1 p-6">
                      <motion.ul
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.1,
                            },
                          },
                        }}
                      >
                        {navigationItems.map((item, index) => (
                          <motion.li key={item}>
                            <motion.a
                              href="#"
                              className="block py-3 px-4 rounded-lg text-slate-200 font-light transition-all duration-300 hover:bg-indigo-400/10 hover:text-indigo-400 border border-transparent hover:border-indigo-400/30"
                              variants={{
                                hidden: { opacity: 0, x: 20 },
                                visible: { opacity: 1, x: 0 },
                              }}
                              whileHover={{ x: 5 }}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {item}
                            </motion.a>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </nav>

                    <motion.div
                      className="p-6 border-t border-indigo-400/20 space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LoginLink
                          postLoginRedirectURL="/dashboard"
                          className="block w-full rounded-lg px-6 py-3 text-sm font-medium text-slate-200 text-center transition-all duration-300 border border-indigo-400/30 hover:border-indigo-400 hover:bg-indigo-400/10 hover:text-white"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Login
                        </LoginLink>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RegisterLink
                          className="block w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-medium text-white text-center shadow-lg transition-all duration-300 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-indigo-500/25"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Register
                        </RegisterLink>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      className="absolute bottom-4 left-4 w-8 h-8 bg-indigo-400/20 rounded-full blur-sm"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                  </motion.div>
                </SheetContent>
              </Sheet>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
