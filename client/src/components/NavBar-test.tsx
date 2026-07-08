import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { getToken } from "../utils/authToken";

import { ThemeToggle } from "./ThemeToggle";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const [isAuthenticated] = useState(() => {
    const token = getToken();
    return token !== null && token.length > 0;
  });

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="sticky top-0 z-50 mx-auto w-full border-b border-[var(--color-secondary)] bg-[var(--color-background)]"
    >
      <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 md:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none"
        >
          <motion.span
            className="block h-2 w-2 shrink-0 rotate-45 bg-[var(--color-accent)]"
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
          />
          <span className="font-serif text-[1.35rem] tracking-tight text-[var(--color-primary)]">
            AuthSystem
          </span>
        </Link>

        {/* Hamburger (mobile only) */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="cursor-pointer text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:outline-none md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </motion.button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-9 md:flex">
          <NavLink to="/" activeOptions={{ exact: true }}>
            Home
          </NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/features">Features</NavLink>

          {isAuthenticated ? (
            <Link to="/profile" className="focus-visible:outline-none">
              {({ isActive }) => (
                <span
                  className={`inline-block rounded-full border border-[var(--color-primary)] px-5 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-background)]"
                      : "text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-background)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  Profile
                </span>
              )}
            </Link>
          ) : (
            <div className="flex items-center gap-5">
              <NavLink to="/login">Login</NavLink>
              <Link
                to="/register"
                className="rounded-full bg-[var(--color-primary)] px-5 py-1.5 text-[11px] font-medium tracking-[0.14em] text-[var(--color-background)] uppercase transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-text)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Sign Up
              </Link>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{ height: menuOpen ? "auto" : 0, opacity: menuOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden border-t border-transparent data-[open=true]:border-[var(--color-secondary)] md:hidden"
        data-open={menuOpen}
      >
        <div className="flex flex-col gap-1 px-4 pt-3 pb-5">
          <MobileNavLink
            to="/"
            activeOptions={{ exact: true }}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </MobileNavLink>
          <MobileNavLink to="/about" onClick={() => setMenuOpen(false)}>
            About
          </MobileNavLink>
          <MobileNavLink to="/features" onClick={() => setMenuOpen(false)}>
            Features
          </MobileNavLink>

          <div className="mt-3 flex flex-col gap-3 border-t border-[var(--color-secondary)] pt-4">
            {isAuthenticated ? (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-background)]"
              >
                Profile
              </Link>
            ) : (
              <>
                <MobileNavLink to="/login" onClick={() => setMenuOpen(false)}>
                  Login
                </MobileNavLink>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-background)]"
                >
                  Sign Up
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
};

// Desktop nav link — small-caps label with a sliding underline on the active route
const NavLink = ({
  to,
  children,
  activeOptions,
}: {
  to: string;
  children: React.ReactNode;
  activeOptions?: { exact?: boolean };
}) => (
  <Link
    to={to}
    activeOptions={activeOptions}
    activeProps={{ "aria-current": "page" }}
    className="group focus-visible:outline-none"
  >
    {({ isActive }) => (
      <motion.span
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        className={`relative inline-flex items-center text-[11px] font-medium tracking-[0.14em] uppercase transition-colors ${
          isActive
            ? "text-[var(--color-primary)]"
            : "text-[var(--color-text)]/60 group-hover:text-[var(--color-primary)]"
        }`}
      >
        {children}
        {isActive && (
          <motion.span
            layoutId="nav-underline"
            className="absolute right-0 -bottom-2 left-0 h-px bg-[var(--color-accent)]"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
      </motion.span>
    )}
  </Link>
);

// Mobile nav link — active route gets a left accent bar + tinted background
const MobileNavLink = ({
  to,
  children,
  onClick,
  activeOptions,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  activeOptions?: { exact?: boolean };
}) => (
  <Link
    to={to}
    onClick={onClick}
    activeOptions={activeOptions}
    activeProps={{ "aria-current": "page" }}
  >
    {({ isActive }) => (
      <span
        className={`relative block rounded-md py-2.5 pl-4 text-base transition-colors ${
          isActive
            ? "bg-[var(--color-secondary)]/50 font-medium text-[var(--color-primary)]"
            : "text-[var(--color-text)]/70"
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="nav-underline-mobile"
            className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        {children}
      </span>
    )}
  </Link>
);

export default NavBar;
