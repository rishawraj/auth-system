import { Link } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <>
      <div className="flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
        <Link to="/login" className="[&.active]:font-bold">
          Login
        </Link>
        <Link to="/register" className="[&.active]:font-bold">
          Register
        </Link>
        <Link to="/profile" className="[&.active]:font-bold">
          Profile
        </Link>
        <Link to="/admin" className="[&.active]:font-bold">
          Admin
        </Link>
        <ThemeToggle />
        <button
          onClick={() => {
            toast.success("Toast message");
          }}
        >
          toast
        </button>
      </div>
      <hr />
    </>
  );
}
