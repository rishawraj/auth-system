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
export async function updateUserStatus(id: string, { is_active }) {
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
