import { pool } from "../config/db.config.js";
import { User } from "../models/user.model.js";

export async function getAllUsers() {
  const users = await pool.query("SELECT * FROM users;");
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

export async function deleteUser(id: number) {
  const user = await pool.query("DELETE FROM users WHERE id = $1;", [id]);
  return user;
}
