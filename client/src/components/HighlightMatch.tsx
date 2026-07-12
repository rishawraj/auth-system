export const HighlightMatch = ({
  text,
  search,
}: {
  text: string | null | undefined;
  search: string;
}) => {
  if (!text) return null;
  if (!`${search}`.trim()) return <span>{text}</span>;

  const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const regex = new RegExp(`(${escapedSearch})`, "gi");

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? ( // odd indexes are matches
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
