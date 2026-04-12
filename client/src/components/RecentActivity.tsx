// components/RecentActivity.tsx
import { ActivityItem } from "../types/dashboard";

type Props = {
  data: ActivityItem[];
};

export function RecentActivity({ data }: Props) {
  return (
    <div className="rounded-xl border p-4">
      <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>

      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{item.email}</p>
              <p className="text-gray-500">{item.time}</p>
            </div>

            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                item.success
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.success ? "Success" : "Failed"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
