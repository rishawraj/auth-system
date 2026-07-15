import { AdminLogItem } from "../types/dashboard";

type Props = {
  data: AdminLogItem[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};
const AdminLogs = ({
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: Props) => {
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    console.log("scrolling", {
      isNearBottom,
      hasNextPage,
      isFetchingNextPage,
    });

    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  return (
    <div
      className="bg-secondary/20 border-primary/10 scrollbar-thumb-accent h-100 min-h-64 overflow-auto overflow-y-auto rounded-2xl border p-5 shadow-sm"
      onScroll={handleScroll}
    >
      <h2 className="font-fraunces text-primary mb-4 text-2xl font-bold">
        System Logs
      </h2>

      <div className="space-y-3">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="bg-background/50 border-secondary hover:bg-background/80 flex flex-col gap-1 rounded-xl border p-3 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-text text-sm font-semibold">
                {item.admin_name}
              </span>
              <span className="bg-accent/20 text-accent-foreground rounded-full px-2 py-0.5 font-mono text-xs">
                {item.action}
              </span>
            </div>
            <div className="text-text/60 text-sm italic">
              Target: {item.target_user_name}
            </div>
          </div>
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="text-primary/70 mt-4 animate-pulse text-center text-sm font-medium">
          Loading more logs...
        </div>
      )}
    </div>
  );

  // return (
  //   <div
  //     className="h-60 overflow-y-auto bg-orange-200 p-5"
  //     onScroll={handleScroll}
  //   >
  //     <h1 className="mb-2 text-4xl">Admin Logs</h1>

  //     {data.map((item, idx) => (
  //       // Note: Better to use item.log_id as key instead of idx if available
  //       <div key={idx} className="mb-1 flex gap-2">
  //         <div className="font-bold">{item.admin_name}</div>
  //         <div>{item.action}</div>
  //         <div className="italic">{item.target_user_name}</div>
  //       </div>
  //     ))}

  //     {/* Optional loading indicator at the bottom */}
  //     {isFetchingNextPage && (
  //       <div className="mt-2 text-center text-sm text-gray-600">
  //         Loading more logs...
  //       </div>
  //     )}
  //   </div>
  // );
};

export default AdminLogs;
