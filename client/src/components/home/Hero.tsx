// src/components/home/Hero.tsx
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <section className="bg-background relative overflow-hidden px-4 py-24 md:py-32">
      <div
        aria-hidden
        className="bg-accent pointer-events-none absolute top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-3xl"
      />

      <div className="relative container mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-accent mb-5 text-[11px] font-medium tracking-[0.25em] uppercase"
        >
          Secure by default
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-text font-serif text-4xl leading-tight md:text-5xl"
        >
          Authentication, built the way you'd want it built for you.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-text/70 mt-5 max-w-xl text-base md:text-lg"
        >
          A reference implementation of production auth patterns — email
          verification, 2FA, token rotation, and admin oversight, built from
          scratch and open to read.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            to="/register"
            className="bg-primary text-background hover:bg-accent hover:text-text focus-visible:ring-accent rounded-full px-7 py-2.5 text-sm font-medium tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Create your account
          </Link>
          <Link
            to="/login"
            className="border-secondary text-text hover:border-primary hover:text-primary focus-visible:ring-accent rounded-full border px-7 py-2.5 text-sm font-medium tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Log in
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
