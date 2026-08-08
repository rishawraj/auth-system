import { z } from "zod";

export const AdminOverviewStatsSchema = z.object({
  totalUsers: z.number(),
  successfulLogins: z.number(),
  failedLogins: z.number(),
});

export type AdminOverviewStats = z.infer<typeof AdminOverviewStatsSchema>;

export const RecentActivityItemSchema = z.object({
  success: z.boolean(),
  email: z.string(),
  time: z.string(),
});

export type RecentActivityItem = z.infer<typeof RecentActivityItemSchema>;

export const AdminAuditLogRowSchema = z.object({
  log_id: z.string(),
  action: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.coerce.date(),
  admin_id: z.string(),
  admin_name: z.string(),
  target_user_id: z.string().nullable(),
  target_user_name: z.string().nullable(),
});

export type AdminAuditLogRow = z.infer<typeof AdminAuditLogRowSchema>;
export type AdminLogItem = AdminAuditLogRow;

export const AdminAuditLogsCursorSchema = z.object({
  created_at: z.string(),
  id: z.string(),
});

export type AdminAuditLogsCursor = z.infer<typeof AdminAuditLogsCursorSchema>;

export const AdminUsersPaginationSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalCount: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export type AdminUsersPagination = z.infer<typeof AdminUsersPaginationSchema>;
