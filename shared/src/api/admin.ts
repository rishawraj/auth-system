import { z } from "zod";
import {
  AdminAuditLogRowSchema,
  AdminOverviewStatsSchema,
  AdminUsersPaginationSchema,
  RecentActivityItemSchema,
  UserSchema,
} from "../models/index.js";

// ================== Admin Update User Status ===================
export const UpdateUserStatusRequestSchema = z.object({
  is_active: z.boolean(),
});

export type UpdateUserStatusRequest = z.infer<
  typeof UpdateUserStatusRequestSchema
>;

// ================== Admin Paginated Users Response ===================
export const AdminPaginatedUsersResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.object({
    users: z.array(UserSchema),
    pagination: AdminUsersPaginationSchema,
  }),
});

export type AdminPaginatedUsersResponse = z.infer<
  typeof AdminPaginatedUsersResponseSchema
>;

// ================== Admin Overview Stats Response ===================
export const AdminStatsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: AdminOverviewStatsSchema,
});

export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>;

// ================== Admin Recent Activity Response ===================
export const RecentActivityResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.array(RecentActivityItemSchema),
});

export type RecentActivityResponse = z.infer<
  typeof RecentActivityResponseSchema
>;

// ================== Admin Audit Logs Response ===================
export const AdminLogsPageSchema = z.object({
  status: z.string().optional(),
  message: z.string().optional(),
  data: z.object({
    logs: z.array(AdminAuditLogRowSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type AdminLogsPage = z.infer<typeof AdminLogsPageSchema>;
