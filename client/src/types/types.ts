import type {
  User as SharedUser,
  CreateUserInput as SharedCreateUserInput,
} from "@auth-system/shared";

/**
 * Core User Interface
 * Represents the public-facing or application-level user object.
 */
export type User = SharedUser;

/**
 * Full User Data including sensitive auth fields.
 */
export type UserAuthData = SharedUser;

/**
 * Utility Type for creating a new user
 */
export type CreateUserInput = SharedCreateUserInput;
