import { motion, AnimatePresence } from "framer-motion";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/api";

export interface SessionInfo {
  id: string;
  jti: string;
  ip_address: string;
  user_agent: string | null;
  browser: string;
  os: string;
  device: string;
  issued_at: string;
  last_used_at: string;
  is_current: boolean;
}

export function DevicesSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [revokingJti, setRevokingJti] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showConfirmAll, setShowConfirmAll] = useState(false);

  const fetchSessions = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError("");
    try {
      const data = await fetchWithAuth<{ sessions: SessionInfo[] }>(
        "/sessions",
      );
      setSessions(data.sessions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load active sessions",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingle = async (jti: string, isCurrent: boolean) => {
    setRevokingJti(jti);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetchWithAuth<{
        message: string;
        revokedCurrent?: boolean;
      }>("/sessions/revoke", {
        method: "POST",
        body: JSON.stringify({ jti }),
      });

      if (isCurrent || res.revokedCurrent) {
        window.location.href = "/login";
        return;
      }

      setSuccessMsg("Session revoked successfully");
      setTimeout(() => setSuccessMsg(""), 3500);
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setRevokingJti(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    setError("");
    setSuccessMsg("");
    setShowConfirmAll(false);
    try {
      await fetchWithAuth("/sessions/revoke-others", {
        method: "POST",
      });
      setSuccessMsg("Successfully logged out of all other devices");
      setTimeout(() => setSuccessMsg(""), 3500);
      await fetchSessions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke other sessions",
      );
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    const lower = deviceType.toLowerCase();
    if (lower.includes("mobile") || lower.includes("phone")) {
      return (
        <Smartphone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
      );
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return (
        <Tablet className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
      );
    }
    return <Laptop className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />;
  };

  const formatLastActive = (dateString: string, isCurrent: boolean) => {
    if (isCurrent) return "Active now";
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

  const otherSessionsCount = sessions.filter((s) => !s.is_current).length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            Devices & Active Sessions
            <button
              onClick={() => fetchSessions(true)}
              disabled={refreshing || loading}
              className="btn-press rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
              title="Refresh sessions"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your logged-in devices and revoke sessions remotely.
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <button
            onClick={() => setShowConfirmAll(true)}
            disabled={revokingAll}
            className="btn-press inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
          >
            <LogOut className="h-4 w-4" />
            Sign out all other devices ({otherSessionsCount})
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-200"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-200"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* Confirmation modal for revoking all other sessions */}
      <AnimatePresence>
        {showConfirmAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Sign out all other devices?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                This will immediately log you out of {otherSessionsCount} other
                active session{otherSessionsCount > 1 ? "s" : ""}. You will
                remain logged in on this device.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmAll(false)}
                  className="btn-press rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAllOther}
                  disabled={revokingAll}
                  className="btn-press flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {revokingAll ? "Signing out..." : "Yes, sign out all"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/50"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No active sessions found.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session.jti}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                  session.is_current
                    ? "border-indigo-200 bg-indigo-50/50 shadow-xs dark:border-indigo-800/60 dark:bg-indigo-950/20"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700/60 dark:bg-gray-800/50 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs dark:border-gray-600 dark:bg-gray-700">
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {session.browser}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        on {session.os}
                      </span>

                      {session.is_current ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          This device
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-gray-400" />
                        {session.ip_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatLastActive(
                          session.last_used_at,
                          session.is_current,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:justify-end">
                  <button
                    onClick={() =>
                      handleRevokeSingle(session.jti, session.is_current)
                    }
                    disabled={revokingJti === session.jti}
                    className={`btn-press inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      session.is_current
                        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        : "text-gray-600 hover:bg-gray-200/60 hover:text-red-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    }`}
                  >
                    {revokingJti === session.jti ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    {session.is_current ? "Revoke (Sign out)" : "Revoke"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
