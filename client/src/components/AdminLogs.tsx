import {
  ScrollText,
  UserCheck,
  UserX,
  Trash2,
  KeyRound,
  Shield,
} from "lucide-react";

import { AdminLogItem } from "../types/dashboard";

type Props = {
  data: AdminLogItem[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export default function AdminLogs({
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: Props) {
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const getActionBadge = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.includes("DEACTIVATE") || upper.includes("BLOCK")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-400">
          <UserX className="h-3 w-3" />

          {action}
        </span>
      );
    }
    if (upper.includes("ACTIVATE")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
          <UserCheck className="h-3 w-3" />
          {action}
        </span>
      );
    }
    if (upper.includes("DELETE")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-red-400">
          <Trash2 className="h-3 w-3" />
          {action}
        </span>
      );
    }
    if (upper.includes("REVOKE") || upper.includes("SESSION")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-indigo-400">
          <KeyRound className="h-3 w-3" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-400">
        <Shield className="h-3 w-3" />
        {action}
      </span>
    );
  };

  return (
    <div
      className="bg-secondary/20 border-primary/10 scrollbar-thumb-accent h-100 min-h-64 overflow-auto overflow-y-auto rounded-2xl border p-5 shadow-sm"
      onScroll={handleScroll}
    >
      <h2 className="font-fraunces text-primary mb-4 flex items-center gap-2 text-2xl font-bold">
        <ScrollText className="text-accent h-6 w-6" />
        System Audit Logs
      </h2>

      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-text/50 py-6 text-center text-xs">
            No audit logs available.
          </p>
        ) : (
          data.map((item, idx) => (
            <div
              key={idx}
              className="bg-background/50 border-secondary hover:bg-background/80 flex flex-col gap-1.5 rounded-xl border p-3.5 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-text text-sm font-semibold">
                  {item.admin_name}
                </span>
                {getActionBadge(item.action)}
              </div>
              {item.target_user_name && (
                <div className="text-text/60 mt-0.5 flex items-center gap-1 text-xs">
                  <span className="text-text/40">Target:</span>
                  <span className="text-text/80 font-medium">
                    {item.target_user_name}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isFetchingNextPage && (
        <div className="text-primary/70 mt-4 animate-pulse text-center text-sm font-medium">
          Loading more logs...
        </div>
      )}
    </div>
  );
}
