export interface AdminLogs {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string;
  // metadata:
  ip_address: string;
  user_agent: string;
  created_at: string;
}
