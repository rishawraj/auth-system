// src/components/home/HowItWorks.tsx
import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign up with your email and password, or continue with Google. Either way, you're in within seconds.",
  },
  {
    number: "02",
    title: "Verify your email",
    description:
      "We'll send a code to confirm it's really you. This one step closes off most of the account-takeover attempts we see.",
  },
  {
    number: "03",
    title: "Secure it with 2FA",
    description:
      "Turn on two-factor authentication and save your backup codes somewhere safe. From here, your account stays yours even if your password doesn't.",
  },
] as const;

const customEase = [0.23, 1, 0.32, 1]; // Strong ease-out

export const HowItWorks = () => {
  return (
    <section className="bg-secondary/25 px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-5xl">
        <p className="text-accent mb-3 text-center text-[11px] font-medium tracking-[0.25em] uppercase">
          Getting started
        </p>
        <h2 className="text-text mb-14 text-center font-serif text-2xl md:text-3xl">
          Three steps. That's it.
        </h2>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: customEase }}
              className="relative"
            >
              <span className="text-accent/40 font-serif text-4xl">
                {step.number}
              </span>
              <h3 className="text-text mt-3 text-lg font-medium">
                {step.title}
              </h3>
              <p className="text-text/65 mt-2 text-sm leading-relaxed">
                {step.description}
              </p>

              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="bg-secondary absolute top-6 left-[calc(100%+1rem)] hidden h-px w-8 md:block"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
