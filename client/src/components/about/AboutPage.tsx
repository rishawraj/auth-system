import { motion } from "framer-motion";

import { PageIntro } from "../layout/PageIntro";
const STACK = [
  { name: "React", note: "TanStack Router & Query for routing and data" },
  { name: "Node.js", note: "Raw HTTP handlers — no framework in between" },
  { name: "PostgreSQL", note: "Transactions, migrations, compound cursors" },
  { name: "Docker", note: "Compose-based deployment, Nginx in front" },
];

export const AboutPage = () => (
  <div className="bg-[var(--color-background)] px-4 py-20 md:py-28">
    <div className="container mx-auto max-w-4xl">
      <PageIntro
        eyebrow="About"
        title="Built to be read, not just used."
        description="This is a self-contained, production-pattern reference implementation of authentication — the parts most projects either skip or bolt on badly. Every flow here is meant to be opened up and understood, not just consumed as a black box."
      />

      {/* Stack */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mt-16 grid gap-px overflow-hidden rounded-xl border border-[var(--color-secondary)] bg-[var(--color-secondary)] sm:grid-cols-2"
      >
        {STACK.map((item) => (
          <div key={item.name} className="bg-[var(--color-background)] p-6">
            <h3 className="text-sm font-medium tracking-wide text-[var(--color-primary)] uppercase">
              {item.name}
            </h3>
            <p className="mt-1.5 text-sm text-[var(--color-text)]/65">
              {item.note}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Security principles */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-16 border-l-2 border-[var(--color-accent)] pl-6"
      >
        <h2 className="font-serif text-xl text-[var(--color-text)] md:text-2xl">
          How it protects your account
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text)]/70 md:text-base">
          Passwords are hashed with bcrypt and never stored or logged in plain
          text. Sessions run on short-lived access tokens paired with rotating
          refresh tokens, each one invalidated server-side the moment it's
          replaced or revoked. Sensitive actions — changing your email,
          disabling two-factor authentication — are gated behind a verified
          email and, where enabled, a second factor.
        </p>
      </motion.div>

      {/* Repo link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-16 flex flex-col items-center gap-3 text-center"
      >
        <p className="text-sm text-[var(--color-text)]/60">
          Curious how a specific flow works under the hood?
        </p>
        <a
          href="https://github.com/rishawraj/auth-system/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[var(--color-secondary)] px-6 py-2 text-xs font-medium tracking-wide text-[var(--color-text)] uppercase transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View source on GitHub
        </a>
      </motion.div>
    </div>
  </div>
);
