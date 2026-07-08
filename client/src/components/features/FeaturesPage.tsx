import { motion } from "framer-motion";
import { Mail, ShieldCheck, Users, type LucideIcon } from "lucide-react";

import { PageIntro } from "../layout/PageIntro";

const GROUPS: { icon: LucideIcon; title: string; items: string[] }[] = [
  {
    icon: Mail,
    title: "For every account",
    items: [
      "Sign up with email & password, or continue with Google",
      "Email verification before you're fully active",
      "Self-serve password reset",
      "Secure, auto-refreshing sessions",
    ],
  },
  {
    icon: ShieldCheck,
    title: "For extra security",
    items: [
      "Two-factor authentication",
      "One-time backup recovery codes",
      "Full login history you can review yourself",
    ],
  },
  {
    icon: Users,
    title: "For admins",
    items: [
      "Searchable, paginated user directory",
      "Full audit trail of account activity",
    ],
  },
];

export const FeaturesPage = () => (
  <div className="bg-[var(--color-background)] px-4 py-20 md:py-28">
    <div className="container mx-auto max-w-5xl">
      <PageIntro
        eyebrow="Features"
        title="Everything your account needs. Nothing it doesn't."
        description="No pricing tiers, no upsells — just the parts of an authentication system that actually matter, grouped by who they're for."
      />

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {GROUPS.map((group, i) => {
          const Icon = group.icon;
          return (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-[var(--color-secondary)] p-7"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary)]/60">
                <Icon size={18} className="text-[var(--color-primary)]" />
              </div>
              <h3 className="mt-5 font-serif text-lg text-[var(--color-text)]">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[var(--color-text)]/70"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);
