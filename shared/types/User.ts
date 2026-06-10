/**
 * Core User Interface
 * Represents the public-facing or application-level user object.
 */
export interface User {
  id: string; // uuid
  name: string;
  email: string;
  is_active: boolean;
  is_super_user: boolean;
  registration_date: string; // ISO Timestamp
  last_login: string | null;
  profile_pic: string | null;
  last_login_method: string | null;

  // Security/Status Flags
  is_two_factor_enabled: boolean;
  is_deleted: boolean;

  // Metadata / Tracking
  last_ip: string | null;
  last_browser: string | null;
  last_os: string | null;
  last_device: string | null;
  last_location: string | null;
  last_country: string | null;
  last_city: string | null;

  // update email
  pending_email: string | null;
}

/**
 * Sensitive Authentication Data
 * Fields used strictly for Auth logic (login, OAuth, 2FA).
 */
export interface UserAuthData extends User {
  password?: string; // Optional if user is OAuth only

  // Verification & Password Reset
  verification_code: string | null;
  verification_code_expiry_time: string | null;
  reset_password_token: string | null;
  reset_passsword_token_expiry_time: string | null;

  // OAuth specific
  oauth_provider: string | null;
  oauth_id: string | null;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  oauth_token_expires_at: string | null;

  // 2FA Internal
  two_factor_secret: string | null;
  tmp_two_factor_secret: string | null;
  disable_2fa_otp: string | null;
  disable_2fa_otp_expiry_time: string | null;
  regenerate_2fa_otp: string | null;
  regenerate_2fa_otp_expiry: string | null;
}

/**
 * Utility Type for creating a new user
 */
export type CreateUserInput = Pick<
  UserAuthData,
  "name" | "email" | "password"
> & {
  oauth_provider?: string;
  oauth_id?: string;
};
