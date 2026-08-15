import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserCog,
  Laptop,
  Ban,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  XCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteUser, toggleUserStatus } from "../queries/adminDashboardUsers";
import { adminLogsQuery, statsQuery } from "../queries/dashboard";
import type { User } from "../types/types";

import AdminUserSessionsModal from "./AdminUserSessionsModal";
import { HighlightMatch } from "./HighlightMatch";

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
  const [selectedUserForSessions, setSelectedUserForSessions] =
    useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const queryClient = useQueryClient();
  const userStatusMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: async () => {
      toast.success("User status updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard-users"],
      });

      await queryClient.invalidateQueries({
        queryKey: adminLogsQuery.queryKey,
      });
    },
    onError: (error) => {
      console.error("Mutation failed: ", error);
      toast.error(
        error instanceof Error ? error.message : "Could not update user status",
      );
    },
  });

  const userDeleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      toast.success("User deleted successfully");
      setUserToDelete(null);
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
      toast.error(
        error instanceof Error ? error.message : "Could not delete user",
      );
    },
  });

  return (
    <div className="text-text bg-background border-primary/10 overflow-hidden rounded-xl border shadow-2xl">
      {/* Header & Search */}
      <div className="border-primary/10 bg-secondary/20 flex flex-col justify-between gap-4 border-b p-6 sm:flex-row sm:items-center">
        <h3 className="font-fraunces text-primary flex items-center gap-2 text-xl font-bold">
          <UserCog className="text-accent h-6 w-6" />
          User Directory
        </h3>

        <div className="relative flex w-full max-w-sm items-center">
          <div className="pointer-events-none absolute left-3 flex items-center">
            <Search className="text-text/50 h-4 w-4" />
          </div>
          <input
            className="border-primary/20 bg-background text-text placeholder-text/40 focus:border-primary focus:ring-primary/40 w-full rounded-lg border py-2 pr-4 pl-10 text-sm transition-all focus:ring-2 focus:outline-none"
            placeholder="Search users by name or email..."
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
                const initials = user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U";

                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-white/5"
                  >
                    {/* User Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-text/50 font-mono text-xs">
                          {userNumber.toString().padStart(2, "0")}
                        </div>
                        <div className="bg-secondary text-primary border-primary/20 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold">
                          {user.profile_pic ? (
                            <img
                              src={user.profile_pic}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-text text-sm font-semibold">
                              <HighlightMatch
                                text={user.name}
                                search={hightlightedWord}
                              />
                            </p>
                            {user.is_super_user && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400"
                                title="Administrator"
                              >
                                <ShieldCheck className="h-3 w-3 text-blue-400" />
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-text/70 text-xs">
                            <HighlightMatch
                              text={user.email}
                              search={hightlightedWord}
                            />
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                          <XCircle className="h-3.5 w-3.5 text-amber-400" />
                          Blocked
                        </span>
                      )}
                    </td>

                    {/* Actions Column with Icon Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Sessions Button */}
                        <button
                          onClick={() => setSelectedUserForSessions(user)}
                          title="Manage Active Sessions & Revocation"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20 hover:text-indigo-300"
                        >
                          <Laptop className="h-3.5 w-3.5" />
                          <span>Sessions</span>
                        </button>

                        {/* Block / Unblock Icon Button */}
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
                          title={
                            user.is_super_user
                              ? "Superusers cannot be blocked"
                              : user.is_active
                                ? "Block user access"
                                : "Unblock user access"
                          }
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                            user.is_super_user
                              ? "cursor-not-allowed border-slate-700 text-slate-500 opacity-40"
                              : user.is_active
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <Ban className="h-3.5 w-3.5 text-amber-400" />
                              <span>Block</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Unblock</span>
                            </>
                          )}
                        </button>

                        {/* Delete Icon Button */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={
                            user.is_super_user || userDeleteMutation.isPending
                          }
                          title={
                            user.is_super_user
                              ? "Superusers cannot be deleted"
                              : "Delete user"
                          }
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                            user.is_super_user
                              ? "cursor-not-allowed border-slate-700 text-slate-500 opacity-40"
                              : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
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

      {/* Admin User Sessions Modal */}
      {selectedUserForSessions && (
        <AdminUserSessionsModal
          user={selectedUserForSessions}
          onClose={() => setSelectedUserForSessions(null)}
        />
      )}

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border-primary/20 bg-background text-text w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
                  <Trash2 className="h-6 w-6" />
                </div>
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="text-text/50 hover:text-text rounded-lg p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-text text-lg font-bold">
                  Delete User Account?
                </h3>
                <p className="text-text/70 mt-2 text-sm leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <span className="text-text font-semibold">
                    {userToDelete.name}
                  </span>{" "}
                  (
                  <span className="text-primary font-mono text-xs">
                    {userToDelete.email}
                  </span>
                  )?
                </p>
                <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    This action cannot be undone. All active sessions, tokens,
                    and data associated with this user will be removed
                    immediately.
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={userDeleteMutation.isPending}
                  className="border-primary/20 hover:bg-secondary/40 text-text/80 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    userDeleteMutation.mutate({ id: userToDelete.id })
                  }
                  disabled={userDeleteMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 disabled:opacity-50"
                >
                  {userDeleteMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Yes, Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardUsers;
