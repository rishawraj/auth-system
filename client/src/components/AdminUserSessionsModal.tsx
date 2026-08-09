import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Trash2,
  X,
  ShieldAlert,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  getAdminUserSessions,
  revokeAdminUserSessions,
} from "../queries/adminDashboardUsers";
import { adminLogsQuery } from "../queries/dashboard";
import type { User } from "../types/types";

interface AdminUserSessionsModalProps {
  user: User | null;
  onClose: () => void;
}

export default function AdminUserSessionsModal({
  user,
  onClose,
}: AdminUserSessionsModalProps) {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["admin-user-sessions", user?.id],
    queryFn: () => getAdminUserSessions(user!.id),
    enabled: !!user,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeAdminUserSessions,
    onSuccess: async (_, variables) => {
      toast.success(
        variables.jti
          ? "Session revoked successfully"
          : "All user sessions revoked successfully",
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin-user-sessions", user?.id],
      });
      await queryClient.invalidateQueries({
        queryKey: adminLogsQuery.queryKey,
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke session",
      );
    },
  });

  if (!user) return null;

  const sessions = sessionsQuery.data?.data?.sessions || [];

  const getDeviceIcon = (deviceType: string) => {
    const lower = deviceType.toLowerCase();
    if (lower.includes("mobile") || lower.includes("phone")) {
      return <Smartphone className="h-5 w-5 text-indigo-400" />;
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return <Tablet className="h-5 w-5 text-indigo-400" />;
    }
    return <Laptop className="h-5 w-5 text-indigo-400" />;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600)
      return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400)
      return `${Math.floor(diffSeconds / 3600)} hours ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pr-8 pb-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{user.name}</h3>
                <span className="rounded-full border border-indigo-700/50 bg-indigo-950/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  {sessions.length} Active Session
                  {sessions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
            </div>

            {sessions.length > 0 && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to revoke ALL sessions for ${user.name}?`,
                    )
                  ) {
                    revokeMutation.mutate({ userId: user.id });
                  }
                }}
                disabled={revokeMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/60 bg-red-950/50 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-900/60 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Revoke All Sessions
              </button>
            )}
          </div>

          {/* Sessions List */}
          <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {sessionsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading user sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 py-12 text-slate-400">
                <ShieldAlert className="h-8 w-8 text-slate-500" />
                <p className="text-sm font-medium text-slate-300">
                  No active sessions found for this user.
                </p>
              </div>
            ) : (
              sessions.map((session: any) => (
                <div
                  key={session.jti}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 rounded-lg border border-slate-700 bg-slate-800/80 p-2.5">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {session.browser}
                        </span>
                        <span className="text-xs text-slate-400">
                          on {session.os}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5 text-slate-500" />
                          {session.ip_address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {formatLastActive(session.last_used_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      revokeMutation.mutate({
                        userId: user.id,
                        jti: session.jti,
                      })
                    }
                    disabled={revokeMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50 hover:text-white disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
