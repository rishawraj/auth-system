export const PageIntro = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className="mb-4 text-[11px] font-medium tracking-[0.25em] text-[var(--color-accent)] uppercase">
      {eyebrow}
    </p>
    <h1 className="font-serif text-3xl text-[var(--color-text)] md:text-4xl">
      {title}
    </h1>
    {description && (
      <p className="mt-4 text-base text-[var(--color-text)]/70">
        {description}
      </p>
    )}
  </div>
);
