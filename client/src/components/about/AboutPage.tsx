// src/components/about/AboutPage.tsx
import { motion } from "framer-motion";

import { PageIntro } from "../layout/PageIntro";

const STACK = [
  { name: "React", note: "TanStack Router & Query for routing and data" },
  { name: "Node.js", note: "Raw HTTP handlers — no framework in between" },
  { name: "PostgreSQL", note: "Transactions, migrations, compound cursors" },
  { name: "Docker", note: "Compose-based deployment, Nginx in front" },
];

const customEase = [0.23, 1, 0.32, 1]; // Strong ease-out

export const AboutPage = () => (
  <div className="bg-background px-4 py-20 md:py-28">
    <div className="container mx-auto max-w-4xl">
      <PageIntro
        eyebrow="About"
        title="Built to be read, not just used."
        description="This is a self-contained, production-pattern reference implementation of authentication — the parts most projects either skip or bolt on badly. Every flow here is meant to be opened up and understood, not just consumed as a black box."
      />

      {/* Stack */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, ease: customEase }}
        className="border-secondary bg-secondary mt-16 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2"
      >
        {STACK.map((item) => (
          <div key={item.name} className="bg-background p-6">
            <h3 className="text-primary text-sm font-medium tracking-wide uppercase">
              {item.name}
            </h3>
            <p className="text-text/65 mt-1.5 text-sm">{item.note}</p>
          </div>
        ))}
      </motion.div>

      {/* Security principles */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, delay: 0.08, ease: customEase }}
        className="border-accent mt-16 border-l-2 pl-6"
      >
        <h2 className="text-text font-serif text-xl md:text-2xl">
          How it protects your account
        </h2>
        <p className="text-text/70 mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
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
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4, delay: 0.16, ease: customEase }}
        className="mt-16 flex flex-col items-center gap-3 text-center"
      >
        <p className="text-text/60 text-sm">
          Curious how a specific flow works under the hood?
        </p>
        <a
          href="https://github.com/rishawraj/auth-system/"
          target="_blank"
          rel="noreferrer"
          className="btn-press border-secondary text-text hover:border-primary hover:text-primary focus-visible:ring-accent rounded-full border px-6 py-2 text-xs font-medium tracking-wide uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View source on GitHub
        </a>
      </motion.div>
    </div>
  </div>
);
