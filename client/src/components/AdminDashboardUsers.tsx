import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Search, UserCog } from "lucide-react";
import { useState } from "react";

import { deleteUser, toggleUserStatus } from "../queries/adminDashboardUsers";
import { adminLogsQuery } from "../queries/dashboard";
import type { User } from "../types/types";

import { HighlightMatch } from "./HighlightMatch";

// Status Styles Mapping
const STATUS_STYLES = {
  active: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  inactive: "bg-white/10 text-slate-400 border-white/10",
  admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const AdminDashboardUsers = ({
  users,
  currentPage,
  onSearchChange,
}: {
  users: User[];
  currentPage: number;
  onSearchChange: (val: string) => void;
}) => {
  const [hightlightedWord, setHighlightedWord] = useState("");

  const queryClient = useQueryClient();
  const userStatusMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-users"],
      });

      await queryClient.invalidateQueries({
        queryKey: adminLogsQuery.queryKey,
      });
    },
    onError: (error) => {
      console.error("Mutation failed: ", error);
      //todo toast
      alert("Could not update user status");
    },
  });

  const userDeleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-users"] });
    },
    onError: (error) => {
      console.error("Mutation failed", error);
      // todo toast
      alert("Could not delete user");
    },
  });

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#121212] shadow-2xl">
      {/* Header & Search */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 p-6 sm:flex-row sm:items-center">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="material-symbols-outlined text-blue-400">
            <UserCog />
          </span>
          User Directory
          {/*  */}
          <Link
            to="/admin/users"
            className="brightness-75 hover:brightness-100"
          >
            <ExternalLink />
          </Link>
        </h3>

        <div className="relative flex w-full max-w-sm items-center">
          {/* The Icon: Positioned absolutely to the left */}
          <div className="pointer-events-none absolute left-3 flex items-center">
            <Search className="h-4 w-4 text-white/50" />
          </div>

          {/* The Input: Added pl-10 (left padding) to make room for the icon */}
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-4 pl-10 text-sm text-white transition-all focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
            placeholder="Search users..."
            type="text"
            onChange={(e) => {
              setHighlightedWord(e.target.value);
              onSearchChange(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-white/5 text-xs tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-4 font-medium">User Information</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-white/20" />
                    <p className="text-sm font-medium text-white/40">
                      No users found
                    </p>
                    <p className="text-xs text-white/20">
                      Try searching with a different name or email
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const userNumber = (currentPage - 1) * 10 + (index + 1);
                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-white/5"
                  >
                    {/* User Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xs text-slate-500">
                          {userNumber.toString().padStart(2, "0")}
                        </div>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold`}
                        >
                          <img
                            src={`${user.profile_pic}`}
                            alt={user.name.slice(0, 2)}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            <HighlightMatch
                              text={user.name}
                              search={hightlightedWord}
                            />
                          </p>
                          <p className="text-xs text-slate-500">
                            {
                              <HighlightMatch
                                text={user.email}
                                search={hightlightedWord}
                              />
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${STATUS_STYLES[user.is_active ? "active" : "inactive"]}`}
                      >
                        {user.is_active ? "active" : "inactive"}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            userStatusMutation.mutate({
                              id: user.id,
                              is_active: !user.is_active,
                            });
                          }}
                          disabled={
                            user.is_super_user || userStatusMutation.isPending
                          }
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${user.is_super_user ? "cursor-not-allowed text-slate-400 opacity-30" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
                        >
                          {user.is_active ? "block" : "unblock"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure?"))
                              userDeleteMutation.mutate({ id: user.id });
                          }}
                          disabled={
                            user.is_super_user || userDeleteMutation.isPending
                          }
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${user.is_super_user ? "cursor-not-allowed text-slate-400 opacity-30" : "text-red-400/80 hover:bg-red-400/10 hover:text-red-400"}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardUsers;
