const ColorPaletteCard = () => {
  return (
    <div className="bg-background text-text space-y-4 rounded-xl p-6 shadow-lg transition-colors duration-300">
      <h1 className="text-2xl font-bold">Tailwind Theme Colors</h1>

      <div className="space-y-2">
        <div className="bg-primary text-background rounded px-4 py-2">
          Primary: Button or Highlight
        </div>

        <div className="bg-secondary text-background rounded px-4 py-2">
          Secondary: Subtle Background
        </div>

        <div className="bg-accent text-background rounded px-4 py-2">
          Accent: Attention-grabbing UI
        </div>
      </div>

      <p className="text-text mt-4 text-sm">
        Text and background colors adapt with `.dark` mode.
      </p>
    </div>
  );
};

export default ColorPaletteCard;
