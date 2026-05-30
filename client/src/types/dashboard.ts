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

export type AdminLogItem = {
  admin_name: string;
  target_user_name: string;
  id: string;
  target_user_id: string;
  action: string;
};
