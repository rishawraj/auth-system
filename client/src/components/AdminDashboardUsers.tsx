import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Search, UserCog } from "lucide-react";
import { useState } from "react";

import { deleteUser, toggleUserStatus } from "../queries/adminDashboardUsers";
import { adminLogsQuery, statsQuery } from "../queries/dashboard";
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

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-users"],
      });

      await queryClient.invalidateQueries({
        queryKey: adminLogsQuery.queryKey,
      });

      await queryClient.invalidateQueries({
        queryKey: statsQuery.queryKey,
      });
    },
    onError: (error) => {
      console.error("Mutation failed", error);
      // todo toast
      alert("Could not delete user");
    },
  });

  return (
    <div className="text-text bg-background borde overflow-hidden rounded-xl shadow-2xl">
      {/* Header & Search */}
      <div className="border-primary/10 bg-secondary/20 flex flex-col justify-between gap-4 border-b p-6 sm:flex-row sm:items-center">
        <h3 className="font-fraunces text-primary flex items-center gap-2 text-xl font-bold">
          <span className="material-symbols-outlined text-accent">
            <UserCog />
          </span>
          User Directory
          <Link
            to="/admin/users"
            className="text-primary/80 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
          </Link>
        </h3>

        <div className="relative flex w-full max-w-sm items-center">
          <div className="pointer-events-none absolute left-3 flex items-center">
            <Search className="text-text/50 h-4 w-4" />
          </div>
          <input
            className="border-primary/20 bg-background text-text placeholder-text/40 focus:border-primary focus:ring-primary/40 w-full rounded-lg border py-2 pr-4 pl-10 text-sm transition-all focus:ring-2 focus:outline-none"
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
            <tr className="bg-secondary/20 text-text/60 text-xs tracking-wider uppercase">
              <th className="px-6 py-4 font-semibold">User Information</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-primary/10 bg-background/50 divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="text-text/30 h-8 w-8" />
                    <p className="text-text/60 text-sm font-medium">
                      No users found
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
                        <div className="text-text font-mono text-xs">
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
                          <p className="text-text text-sm font-medium">
                            <HighlightMatch
                              text={user.name}
                              search={hightlightedWord}
                            />
                          </p>
                          <p className="text-text/80 text-xs">
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
