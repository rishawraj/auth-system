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
      className="h-60 overflow-y-auto bg-orange-200 p-5"
      onScroll={handleScroll}
    >
      <h1 className="mb-2 text-4xl">Admin Logs</h1>

      {data.map((item, idx) => (
        // Note: Better to use item.log_id as key instead of idx if available
        <div key={idx} className="mb-1 flex gap-2">
          <div className="font-bold">{item.admin_name}</div>
          <div>{item.action}</div>
          <div className="italic">{item.target_user_name}</div>
        </div>
      ))}

      {/* Optional loading indicator at the bottom */}
      {isFetchingNextPage && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Loading more logs...
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
