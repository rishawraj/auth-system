// import type { AdminLogs } from "../../../shared/types/AdminLogs";

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
  id: string;

  action: string;

  admin_id: string;
  admin_name: string;

  target_user_name: string;
  target_user_id: string;

  created_at: string;
  ip_address: string;
  log_id: string;
  metadata: string;
  user_agent: string;
};
