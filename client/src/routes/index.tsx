import { Link, createFileRoute } from "@tanstack/react-router";

import { Navbar } from "../components/Navbar";
import ColorPaletteCard from "../components/ColorPalette";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="h-full">
      <h3>Welcome Home!</h3>
      <h2>Go to Dashboard</h2>
      <button>
        <Link to="/admin"> Admin</Link>
      </button>
      <ColorPaletteCard />
    </div>
  );
}
