import { IncomingMessage, ServerResponse } from "http";
import { formatDistanceToNow } from "date-fns";
import { pool } from "../config/db.config.js";
import { parseDevice } from "../utils/deviceParser.js";
import { readBody, send } from "../utils/helpers.js";

export interface SuperUser {
  id: string;
  email: string;
  is_super_user: boolean;
}

export interface AdminAuditLogRow {
  log_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  admin_id: string;
  admin_name: string;
  target_user_id: string | null;
  target_user_name: string | null;
}

// Internal helper to record admin audit actions
export async function logAdminActions({
  adminId,
  userId,
  action,
}: {
  adminId: string;
  userId: string;
  action: string;
}) {
  const query = `
    INSERT INTO admin_audit_logs (
      admin_id, action, target_user_id
    ) VALUES ($1, $2, $3)
  `;
  try {
    await pool.query(query, [adminId, action, userId]);
  } catch (error) {
    console.error("Could not log admin event:", error);
  }
}

// ──────────────────────────────────────────────────────────
// 1 Function per Route Handlers
// ──────────────────────────────────────────────────────────

/**
 * GET /admin/stats/overview
 */
export async function handleGetAdminOverviewStats(
  _req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_deleted = false) AS total_users,
        (SELECT COUNT(*) FROM login_activity WHERE success = true) AS successful_logins,
        (SELECT COUNT(*) FROM login_activity WHERE success = false) AS failed_logins
    `;
    const { rows } = await pool.query(query);
    send(res, 200, {
      status: "OK",
      message: "Admin overview stats fetched successfully",
      data: {
        totalUsers: Number(rows[0].total_users),
        successfulLogins: Number(rows[0].successful_logins),
        failedLogins: Number(rows[0].failed_logins),
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    send(res, 500, {
      status: "Internal Server Error",
      message: "Failed to fetch admin stats",
    });
  }
}

/**
 * GET /admin/recent-activity
 */
export async function handleGetRecentActivity(
  _req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const query = `
      SELECT success, email, created_at
      FROM login_activity
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    const result = await pool.query<{
      success: boolean;
      email: string;
      created_at: Date;
    }>(query);

    const activity = result.rows.map((row) => ({
      success: row.success,
      email: row.email,
      time: formatDistanceToNow(new Date(row.created_at), { addSuffix: true }),
    }));

    send(res, 200, {
      status: "OK",
      message: "Recent Activity fetched successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    send(res, 500, {
      status: "Internal Server Error",
      message: "Failed to fetch recent activity",
    });
  }
}

/**
 * GET /admin/paginated-users
 */
export async function handleGetPaginatedUsers(
  req: IncomingMessage,
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  try {
    const page = parseInt(parsedUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(parsedUrl.searchParams.get("limit") || "10", 10);
    const search = parsedUrl.searchParams.get("search") || "";
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;

    const countQuery = search
      ? "SELECT COUNT(*) FROM users WHERE is_deleted = false AND (name ILIKE $1 OR email ILIKE $1)"
      : "SELECT COUNT(*) FROM users WHERE is_deleted = false";

    const usersQuery = search
      ? "SELECT * FROM users WHERE is_deleted = false AND (name ILIKE $3 OR email ILIKE $3) ORDER BY registration_date DESC LIMIT $1 OFFSET $2"
      : "SELECT * FROM users WHERE is_deleted = false ORDER BY registration_date DESC LIMIT $1 OFFSET $2";

    const totalCountRes = await pool.query(
      countQuery,
      search ? [searchParam] : []
    );
    const totalCount = parseInt(totalCountRes.rows[0].count, 10);
    const usersRes = await pool.query(
      usersQuery,
      search ? [limit, offset, searchParam] : [limit, offset]
    );

    send(res, 200, {
      status: "OK",
      message: "Users fetched successfully",
      data: {
        users: usersRes.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Pagination error:", error);
    send(res, 500, { status: "Error", message: "Failed to fetch users" });
  }
}

/**
 * GET /admin/users/:id/sessions
 */
export async function handleGetUserActiveSessions(
  req: IncomingMessage,
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const match = /^\/admin\/users\/([^/]+)\/sessions$/.exec(parsedUrl.pathname);
  const userId = match?.[1];

  if (!userId) {
    send(res, 400, { status: "Error", message: "Invalid user ID" });
    return;
  }

  try {
    const query = `
      SELECT id, jti, ip_address, user_agent, issued_at, last_used_at
      FROM refresh_tokens
      WHERE user_id = $1 AND (revoked IS FALSE OR revoked IS NULL) AND expires_at > NOW()
      ORDER BY last_used_at DESC;
    `;
    const { rows } = await pool.query(query, [userId]);

    const sessions = rows.map((row) => {
      const parsed = parseDevice(row.user_agent);
      return {
        id: row.id,
        jti: row.jti,
        ip_address: row.ip_address || "Unknown IP",
        user_agent: row.user_agent,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
        issued_at: row.issued_at,
        last_used_at: row.last_used_at || row.issued_at,
      };
    });

    send(res, 200, {
      status: "OK",
      message: "User active sessions fetched successfully",
      data: { sessions },
    });
  } catch (error) {
    console.error("Error fetching user sessions for admin:", error);
    send(res, 500, {
      status: "Error",
      message: "Failed to fetch user active sessions",
    });
  }
}

/**
 * POST /admin/users/:id/revoke-sessions
 */
export async function handleRevokeUserSessions(
  req: IncomingMessage & { user?: SuperUser },
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const match = /^\/admin\/users\/([^/]+)\/revoke-sessions$/.exec(
    parsedUrl.pathname
  );
  const userId = match?.[1];

  if (!userId) {
    send(res, 400, { status: "Error", message: "Invalid user ID" });
    return;
  }

  try {
    const body = (await readBody(req)) as { jti?: string };
    if (body?.jti) {
      await pool.query(
        "DELETE FROM refresh_tokens WHERE user_id = $1 AND jti = $2",
        [userId, body.jti]
      );
    } else {
      await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
        userId,
      ]);
    }

    if (req.user) {
      await logAdminActions({
        adminId: req.user.id,
        userId: userId,
        action: body?.jti
          ? `REVOKE_SESSION_${body.jti}`
          : "REVOKE_ALL_SESSIONS",
      });
    }

    send(res, 200, {
      status: "OK",
      message: body?.jti
        ? "Session revoked successfully"
        : "All user sessions revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking user sessions by admin:", error);
    send(res, 500, {
      status: "Error",
      message: "Failed to revoke user sessions",
    });
  }
}

/**
 * PATCH /admin/users/:id
 */
export async function handleUpdateUserStatus(
  req: IncomingMessage & { user?: SuperUser },
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const match = /^\/admin\/users\/([^/]+)$/.exec(parsedUrl.pathname);
  const userId = match?.[1];

  if (!userId) {
    send(res, 400, { status: "Error", message: "Invalid user ID" });
    return;
  }

  try {
    const body = (await readBody(req)) as { is_active: boolean };
    const { is_active } = body;

    const query = `
      UPDATE users
      SET is_active = $1
      WHERE id = $2
      RETURNING id, name, email, is_active;
    `;
    const result = await pool.query(query, [is_active, userId]);

    if (result.rows[0]) {
      // If user is deactivated, revoke all active sessions immediately
      if (!is_active) {
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
          userId,
        ]);
      }

      if (req.user) {
        await logAdminActions({
          adminId: req.user.id,
          userId: userId,
          action: is_active ? "ACTIVATE" : "DEACTIVATE",
        });
      }

      send(res, 200, {
        status: "OK",
        message: `User ${is_active ? "activated" : "blocked"} successfully`,
      });
    } else {
      send(res, 404, { status: "Not Found", message: "User not found" });
    }
  } catch (error) {
    send(res, 500, {
      status: "Error",
      message: `Failed to update user status: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

/**
 * DELETE /admin/users/:id
 */
export async function handleSoftDeleteUser(
  req: IncomingMessage & { user?: SuperUser },
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const match = /^\/admin\/users\/([^/]+)$/.exec(parsedUrl.pathname);
  const userId = match?.[1];

  if (!userId) {
    send(res, 400, { status: "Error", message: "Invalid user ID" });
    return;
  }

  try {
    const query = `
      UPDATE users 
      SET is_deleted = true, is_active = false 
      WHERE id = $1 
      RETURNING id;
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows[0]) {
      await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
        userId,
      ]);

      if (req.user) {
        await logAdminActions({
          adminId: req.user.id,
          userId: userId,
          action: "DELETE",
        });
      }

      send(res, 200, {
        status: "OK",
        message: "User marked as deleted successfully",
      });
    } else {
      send(res, 404, { status: "Not Found", message: "User not found" });
    }
  } catch (error) {
    send(res, 500, {
      status: "Error",
      message: `Failed to delete user: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

/**
 * GET /admin/admin-audit-logs
 */
export async function handleGetAdminLogs(
  req: IncomingMessage,
  res: ServerResponse
) {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  try {
    const limit = parseInt(parsedUrl.searchParams.get("limit") || "10", 10);
    const cursor = parsedUrl.searchParams.get("cursor") || null;

    let lastcreatedAt: string | null = null;
    let lastId: string | null = null;

    if (cursor) {
      try {
        const decodedCursor = Buffer.from(cursor, "base64").toString("utf-8");
        const parsedCursor = JSON.parse(decodedCursor) as {
          created_at: string;
          id: string;
        };
        lastcreatedAt = parsedCursor.created_at;
        lastId = parsedCursor.id;
      } catch (error) {
        console.warn(
          "Invalid cursor provided, falling back to first page.",
          error
        );
      }
    }

    let query = `
      SELECT 
        a.id AS log_id,
        a.action,
        a.metadata,
        a.ip_address,
        a.user_agent,
        a.created_at,
        admins.id AS admin_id,
        admins.name AS admin_name,      
        targets.id AS target_user_id,
        targets.name AS target_user_name 
      FROM admin_audit_logs a
      INNER JOIN users admins ON a.admin_id = admins.id
      LEFT JOIN users targets ON a.target_user_id = targets.id
    `;

    const queryParams: unknown[] = [];

    if (lastcreatedAt && lastId) {
      query += `
        WHERE a.created_at < $1
          OR (a.created_at = $1 AND a.id < $2)
      `;
      queryParams.push(lastcreatedAt, lastId);
    }

    query += `
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT $${queryParams.length + 1}
    `;
    queryParams.push(limit + 1);

    const { rows } = await pool.query<AdminAuditLogRow>(query, queryParams);

    const hasMore = rows.length > limit;
    const logsToReturn = hasMore ? rows.slice(0, -1) : rows;

    let nextCursor: string | null = null;
    if (logsToReturn.length > 0) {
      const lastLog = logsToReturn[logsToReturn.length - 1];
      const cursorObj = {
        created_at: lastLog.created_at.toISOString(),
        id: lastLog.log_id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
    }

    send(res, 200, {
      status: "OK",
      message: "Admin logs fetched successfully",
      data: {
        logs: logsToReturn,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error getting logs:", error);
    send(res, 500, {
      status: "Internal Server Error",
      message: "Failed to get admin logs",
    });
  }
}
