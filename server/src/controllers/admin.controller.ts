import { formatDistanceToNow } from "date-fns";
import { pool } from "../config/db.config.js";
import { User } from "../models/user.model.js";

export async function getAllUsers() {
  const users = await pool.query(
    "SELECT * FROM users WHERE is_deleted = false ORDER BY registration_date DESC;"
  );
  return users;
}

/**
 * Retrieves a user by their ID from the database
 * @param id - The unique identifier of the user
 * @returns The user object or null if not found
 * @throws Error if database query fails
 */

export async function getUserById(id: string): Promise<User | null> {
  try {
    // Validate input
    if (!id) {
      throw new Error("User ID is required");
    }

    // Query database for user with specified fields only
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    // Return the first row or null if no user found
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    throw new Error(
      `Failed to retrieve user: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const getPaginatedUsers = async (page = 1, limit = 10, search = "") => {
  const offset = (page - 1) * limit;
  const searchParam = `%${search}%`;

  // const countQuery = search
  //   ? "SELECT COUNT(*) FROM users WHERE is_deleted = false AND (name ILIKE $1 OR email ILIKE $1"
  //   : "SELECT COUNT(*) FROM users WHERE is_deleted = false";

  // const usersQuery = search
  //   ? `
  //   SELECT * FROM users
  //   WHERE is_deleted = false
  //   AND (name ILIKE $3 OR email ILIKE $3)
  //   ORDER BY registration_date DESC
  //   LIMIT $1 OFFSET $2`
  //   : `
  //   SELECT * FROM users
  //   WHERE is_deleted = false
  //   ORDER BY registration_date DESC
  //   LIMIT $1 OFFSET $2
  // `;

  // const totalCount = await pool.query(countQuery, search ? [searchParam] : []);
  // const users = await pool.query(
  //   usersQuery,
  //   search ? [limit, offset, searchParam] : [limit, offset]
  // );

  const countQuery = search
    ? "SELECT COUNT(*) FROM users WHERE is_deleted = false AND (name ILIKE $1 OR email ILIKE $1)"
    : "SELECT COUNT(*) FROM users WHERE is_deleted = false";

  const usersQuery = search
    ? `SELECT * FROM users WHERE is_deleted = false AND (name ILIKE $3 OR email ILIKE $3) ORDER BY registration_date DESC LIMIT $1 OFFSET $2`
    : `SELECT * FROM users WHERE is_deleted = false ORDER BY registration_date DESC LIMIT $1 OFFSET $2`;

  const totalCount = await pool.query(countQuery, search ? [searchParam] : []);
  const users = await pool.query(
    usersQuery,
    search ? [limit, offset, searchParam] : [limit, offset]
  );

  return {
    users: users.rows,
    totalCount: parseInt(totalCount.rows[0].count),
    totalPages: Math.ceil(totalCount.rows[0].count / limit),
  };
};

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: string
) {
  const user = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4);",
    [name, email, password, role]
  );
  return user;
}

// todo
export async function updateUser(
  id: number,
  name: string,
  email: string,
  password: string,
  role: string
) {
  const user = await pool.query(
    "UPDATE users SET name = $1, email = $2, password = $3, role = $4 WHERE id = $5;",
    [name, email, password, role, id]
  );
  return user;
}
export async function updateUserStatus(
  id: string,
  { is_active }: { is_active: boolean }
) {
  const query = `
  UPDATE users
  SET is_active = $1
  WHERE id = $2
  RETURNING id, name, email, is_active;
  `;
  const result = await pool.query(query, [is_active, id]);
  return result.rows[0];
}

// export async function deleteUser(id: string) {
//   const user = await pool.query("DELETE FROM users WHERE id = $1;", [id]);
//   return user;
// }

// Soft delete
export const softDeleteUser = async (id: string) => {
  const query = `
    UPDATE users 
    SET is_deleted = true, is_active = false 
    WHERE id = $1 
    RETURNING id;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export async function getAdminOverviewStats() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE is_deleted = false) AS total_users,
      (SELECT COUNT(*) FROM login_activity WHERE success = true) AS successful_logins,
      (SELECT COUNT(*) FROM login_activity WHERE success = false) AS failed_logins
  `;

  const { rows } = await pool.query(query);
  return {
    totalUsers: Number(rows[0].total_users),
    successfulLogins: Number(rows[0].successful_logins),
    failedLogins: Number(rows[0].failed_logins),
  };
}

export async function getRecentActivity() {
  const query = `
    SELECT success, email, created_at
    FROM login_activity
    ORDER BY created_at DESC
    LIMIT 10;
  `;
  // sucess, email , time(relative)
  const result = await pool.query(query);

  return result.rows.map((row) => ({
    success: row.success,
    email: row.email,
    time: formatDistanceToNow(new Date(row.created_at), { addSuffix: true }),
  }));
}

// admin-audit-logs
export async function logAdminActions({
  adminId,
  userId,
  action,
}: {
  adminId: string;
  userId: string;
  action: string;
}) {
  console.log({ adminId, userId, action });
  const query = `
    INSERT INTO admin_audit_logs (
    admin_id, action, target_user_id
    ) VALUES ($1, $2, $3)
  `;

  try {
    await pool.query(query, [adminId, action, userId]);
  } catch (error) {
    console.error("could not log this event ", error);
  }
}

export async function getAdminLogs(cursor: string | null, limit: number) {
  console.log(cursor, limit);

  // const query = `
  //   SELECT
  //     a.id AS log_id,
  //     a.action,
  //     a.metadata,
  //     a.ip_address,
  //     a.user_agent,
  //     a.created_at,
  //     admins.id AS admin_id,
  //     admins.name AS admin_name,
  //     targets.id AS target_user_id,
  //     targets.name AS target_user_name
  //   FROM admin_audit_logs a
  //   INNER JOIN
  //     users admins ON a.admin_id = admins.id
  //   INNER JOIN
  //     users targets ON a.target_user_id = targets.id
  //   ORDER BY
  //     a.created_at DESC;
  // `;

  // const logs = pool.query(query);

  // return logs;

  let lastcreatedAt = null;
  let lastId = null;

  // 1. if cursor
  if (cursor) {
    try {
      const decodedCursor = Buffer.from(cursor, "base64").toString("utf-8");
      const parsedCursor = JSON.parse(decodedCursor);
      lastcreatedAt = parsedCursor.created_at;
      lastId = parsedCursor.id;
    } catch (error) {
      console.warn(
        "Invalid cursor provided, failling back to first page.",
        error
      );
    }
  }
  //2. buid query
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
        OR (a.created_at = $1 AND a.id<$2)
    `;

    queryParams.push(lastcreatedAt, lastId);
  }

  // +1 for next page
  query += `
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT $${queryParams.length + 1}
  `;

  queryParams.push(limit + 1);

  const { rows } = await pool.query(query, queryParams);

  const hasMore = rows.length > limit;
  console.log({ hasMore });
  // only return 10
  const logsToReturn = hasMore ? rows.slice(0, -1) : rows;

  // generate the next cursor from the last item in arr

  let nextCursor = null;
  if (logsToReturn.length > 0) {
    const lastLog = logsToReturn[logsToReturn.length - 1];
    const cursorObj = {
      created_at: lastLog.created_at,
      id: lastLog.log_id,
    };
    nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
  }

  return {
    logs: logsToReturn,
    nextCursor,
    hasMore,
  };
}
