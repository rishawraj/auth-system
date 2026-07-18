// // components/StatCard.tsx
// type Props = {
//   label: string;
//   value: number;
//   color: "green" | "red" | "blue";
// };

// const colorMap = {
//   green: "bg-green-100 text-green-700",
//   red: "bg-red-100 text-red-700",
//   blue: "bg-blue-100 text-blue-700",
// };

// export function StatCard({ label, value, color }: Props) {
//   return (
//     <div className={`rounded-xl p-4 ${colorMap[color]}`}>
//       <p className="text-sm font-medium">{label}</p>
//       <p className="mt-1 text-2xl font-bold">{value}</p>
//     </div>
//   );
// }

// components/StatCard.tsx
import { User, Key, AlertTriangle } from "lucide-react"; // Or your preferred icon library

type Props = {
  label: string;
  value: number;
  color: "green" | "red" | "blue";
};

// Map the color prop to specific border, text, and icon styles
const styleMap = {
  blue: {
    border: "border-blue-500",
    text: "text-blue-400",
    icon: <User className="h-6 w-6 text-blue-500" />,
  },
  green: {
    border: "border-green-500",
    text: "text-green-400",
    icon: <Key className="h-6 w-6 text-green-500" />,
  },
  red: {
    border: "border-red-500",
    text: "text-red-400",
    icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
  },
};

export function StatCard({ label, value, color }: Props) {
  const styles = styleMap[color];

  return (
    <div
      className={`bg-background hover:bg-background relative flex items-center justify-between rounded-xl border-l-4 p-6 shadow-md transition-all ${styles.border}`}
    >
      <div>
        {/* Muted label for better visual hierarchy */}
        <p className="text-sm font-medium text-slate-400">{label}</p>

        {/* Accent color for the primary metric */}
        <p className={`mt-2 text-3xl font-bold tracking-tight ${styles.text}`}>
          {value}
        </p>
      </div>

      {/* Icon wrapper for the right side */}
      <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-full">
        {styles.icon}
      </div>
    </div>
  );
}
