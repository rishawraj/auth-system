import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react"; // optional icons from lucide-react
import { useState } from "react";

import { ThemeToggle } from "./ThemeToggle";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-primary">
      <div className="container m-auto flex items-center justify-between px-4 py-2">
        {/* Brand or logo */}
        <div className="text-lg font-bold">MyApp</div>

        {/* Hamburger Icon (visible on small screens only) */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden gap-4 md:flex">
          <Link to="/">Home</Link>
          <Link to="/">About</Link>
          <Link to="/">Services</Link>
          <Link to="/">Contact</Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center justify-center gap-2 md:flex">
          <Link to="/login">Login</Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu (shown when hamburger is clicked) */}
      {menuOpen && (
        <div className="flex flex-col justify-center space-y-2 px-4 pb-4 md:hidden">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Services
          </Link>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
          <div className="flex flex-col border-t p-2">
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
