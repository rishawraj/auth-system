import { CheckCircle2, XCircle, Clock, Mail } from "lucide-react";

interface RecentActivity {
  success: boolean;
  email: string;
  time: string;
}

type Props = {
  data: RecentActivity[] | undefined;
};

export function RecentActivity({ data }: Props) {
  return (
    <div className="border-primary/10 bg-secondary/10 rounded-2xl border p-5 shadow-sm">
      <h2 className="font-fraunces text-primary mb-4 flex items-center gap-2 text-xl font-bold">
        <Clock className="text-accent h-5 w-5" />
        Recent Login Activity
      </h2>
      <div className="space-y-3">
        {data && data.length > 0 ? (
          data.map((item, idx) => (
            <div
              key={idx}
              className="bg-background/40 border-primary/10 flex items-center justify-between rounded-xl border p-3 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="text-text/40 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-text text-xs font-medium sm:text-sm">
                    {item.email}
                  </p>
                  <p className="text-text/50 mt-0.5 text-xs">{item.time}</p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  item.success
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {item.success ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Success</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                    <span>Failed</span>
                  </>
                )}
              </span>
            </div>
          ))
        ) : (
          <p className="text-text/50 py-4 text-center text-xs">
            No recent activity recorded.
          </p>
        )}
      </div>
    </div>
  );
}
