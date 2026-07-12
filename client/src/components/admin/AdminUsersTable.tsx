import { useNavigate } from "@tanstack/react-router";

import { User } from "../../types/types";

// import { User } from "../../types/auth";

type Props = {
  users: User[];
};

export default function AdminUsersTable({ users }: Props) {
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    navigate({ to: `/admin/users/${userId}` });
  };

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-20 text-center">
        <h2 className="text-xl font-semibold text-white">No users found</h2>

        <p className="mt-2 text-zinc-400">
          There are currently no registered users.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background text-text overflow-hidden rounded-2xl border border-zinc-800 shadow-lg">
      {/* Header */}
      <div className="text-text bg-secondary grid grid-cols-[80px_1fr_2fr_150px_120px] items-center border-b border-zinc-800 px-6 py-4 text-sm font-semibold tracking-wider uppercase">
        <span>Avatar</span>
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span className="text-right">Action</span>
      </div>

      {/* Rows */}
      {users.map((user) => (
        <div
          key={user.id}
          className="text-text grid grid-cols-[80px_1fr_2fr_150px_120px] items-center border-b border-zinc-800 px-6 py-5 transition-colors duration-200 hover:bg-zinc-800/40"
        >
          {/* Avatar */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/20 text-lg font-semibold text-violet-300">
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <div>
            <p className="text-text font-medium">{user.name}</p>
          </div>

          {/* Email */}
          <p className="text-text truncate">{user.email}</p>

          {/* Role */}
          <div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                user.is_super_user
                  ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-300"
              }`}
            >
              {user.is_super_user ? "admin" : "regular user"}
            </span>
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={() => handleUserClick(user.id)}
              className="cursor-pointer rounded-full border border-violet-500 px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:bg-violet-500 hover:text-white active:scale-95"
            >
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
