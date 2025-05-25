import { Link, createFileRoute } from "@tanstack/react-router";

import { Navbar } from "../components/Navbar";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="h-full bg-white p-2 dark:bg-gray-900">
      <h3>Welcome Home!</h3>
      <h2>Go to Dashboard</h2>
      <button>
        <Link to="/admin"> Admin</Link>
      </button>
      <ProfileCard />
    </div>
  );
}

const ProfileCard = () => {
  return (
    <div>
      <div className="bg-mint-500 dark:bg-avacado-100 p-5 dark:text-black">
        <p>hele</p>
      </div>
    </div>
  );
};
