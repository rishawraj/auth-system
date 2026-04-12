// components/StatCard.tsx
type Props = {
  label: string;
  value: number;
  color: "green" | "red" | "blue";
};

const colorMap = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

export function StatCard({ label, value, color }: Props) {
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
