import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "./ThemeToggle";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 z-50 w-full bg-white shadow-md dark:bg-gray-800"
    >
      <div className="container m-auto flex items-center justify-between px-4 py-4">
        {/* Brand or logo */}
        <motion.div
          className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
          whileHover={{ scale: 1.05 }}
        >
          AuthSystem
        </motion.div>

        {/* Hamburger Icon (visible on small screens only) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-gray-600 md:hidden dark:text-gray-300"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        {/* Desktop Menu */}
        <div className="hidden items-center space-x-8 md:flex">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/services">Services</NavLink>
          <div className="flex items-center gap-4">
            <NavLink to="/login">Login</NavLink>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/register"
                className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </motion.div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: menuOpen ? 1 : 0,
          height: menuOpen ? "auto" : 0,
        }}
        className="overflow-hidden md:hidden"
      >
        <div className="flex flex-col space-y-4 px-4 pt-2 pb-6">
          <NavLink mobile to="/" onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink mobile to="/about" onClick={() => setMenuOpen(false)}>
            About
          </NavLink>
          <NavLink mobile to="/services" onClick={() => setMenuOpen(false)}>
            Services
          </NavLink>
          <div className="flex flex-col gap-4 border-t pt-4">
            <NavLink mobile to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </NavLink>
            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
              className="w-full rounded-full bg-indigo-600 px-6 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Sign Up
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
};

// NavLink component with animation and styling
const NavLink = ({
  to,
  children,
  mobile = false,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void;
}) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Link
      to={to}
      onClick={onClick}
      className={`${
        mobile ? "block text-base" : "text-sm"
      } font-medium text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400`}
    >
      {children}
    </Link>
  </motion.div>
);

export default NavBar;
