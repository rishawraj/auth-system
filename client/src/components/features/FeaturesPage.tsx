// src/components/features/FeaturesPage.tsx
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

const customEase = [0.23, 1, 0.32, 1]; // Strong ease-out

export const FeaturesPage = () => (
  <div className="bg-background px-4 py-20 md:py-28">
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
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: customEase }}
              className="border-secondary rounded-xl border p-7"
            >
              <div className="bg-secondary/60 flex h-10 w-10 items-center justify-center rounded-full">
                <Icon size={18} className="text-primary" />
              </div>
              <h3 className="text-text mt-5 font-serif text-lg">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="text-text/70 flex items-start gap-2.5 text-sm"
                  >
                    <span
                      aria-hidden
                      className="bg-accent mt-2 h-1 w-1 shrink-0 rounded-full"
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
