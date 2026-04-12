// types/dashboard.ts
export type AdminStats = {
  totalUsers: number;
  successfulLogins: number;
  failedLogins: number;
};

export type ActivityItem = {
  success: boolean;
  email: string;
  time: string;
};
