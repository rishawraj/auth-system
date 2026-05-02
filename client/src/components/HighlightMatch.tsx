export const HighlightMatch = ({
  text,
  search,
}: {
  text: string;
  search: string;
}) => {
  if (!`${search}`.trim()) return <span>{text}</span>;

  const regex = new RegExp(`(${search})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-black">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
};
