import { motion } from "framer-motion";
import { redirect } from "next/navigation";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 right-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-slate-200/5 rounded-full blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center pb-20">
        {/* Bage */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-baseline justify-center mb-12"
        >
          <motion.h2
            className="text-slate-200 border border-indigo-400/40 px-6 py-3 rounded-full text-center bg-white/5 backdrop-blur-sm"
            whileHover={{
              scale: 1.05,
              borderColor: "rgba(129, 140, 248, 0.6)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
            See What's New |{" "}
            <span className="text-indigo-400 font-semibold">AI Diagram</span>
          </motion.h2>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mb-8"
        >
          <motion.h1
            className="text-6xl lg:text-8xl font-bold mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <span className="text-slate-300">Documents &</span>
            <span className="text-indigo-400"> diagrams</span>
            <br />
            <span className="text-slate-300">for </span>
            <strong className="bg-gradient-to-r from-indigo-400 via-slate-200 to-indigo-500 bg-clip-text text-transparent bg-size-200 animate-gradient">
              engineering
            </strong>
            <span className="text-slate-300"> teams.</span>
          </motion.h1>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12 max-w-3xl mx-auto"
        >
          <p className="text-xl lg:text-2xl text-slate-300/90 font-light leading-relaxed">
            All-in-one markdown editor, collaborative canvas, and
            <span className="text-indigo-400 font-medium">
              {" "}
              diagram-as-code{" "}
            </span>
            builder
          </p>
        </motion.div>

        {/* button CTA */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex justify-center gap-6"
        >
          <motion.a
            href="#"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 font-semibold text-white shadow-2xl transition-all duration-300 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-indigo-500/25"
            whileHover={{
              scale: 1.05,
              y: -2,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span
              className="relative z-10"
              onClick={() => redirect("/dashboard")}
            >
              Get Started Free
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </motion.a>

          <motion.a
            href="#"
            className="rounded-xl border border-indigo-400/40 px-8 py-4 font-semibold text-slate-200 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-400/10 hover:text-white"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            View Demo
          </motion.a>
        </motion.div>

        {/* Additional information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 flex justify-center items-center gap-8 text-sm text-slate-400"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            Start free, no credit card
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            Free plan for a month
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            Setup in 2 minutes
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400/30 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.3 }}
      />
      <motion.div
        className="absolute top-1/4 right-20 w-3 h-3 bg-slate-200/40 rounded-full"
        animate={{
          y: [0, 15, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 0.7 }}
      />
    </section>
  );
}
