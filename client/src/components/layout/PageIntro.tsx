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
    <p className="text-accent mb-4 text-[11px] font-medium tracking-[0.25em] uppercase">
      {eyebrow}
    </p>
    <h1 className="text-text font-serif text-3xl md:text-4xl">{title}</h1>
    {description && (
      <p className="text-text/70 mt-4 text-base">{description}</p>
    )}
  </div>
);
