export interface User {
  id: string; // uuid
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  verification_code: string | null;
  verification_code_expiry_time: Date | null;
  registration_date: Date;
  last_login: Date | null;
  is_super_user: boolean;
  oauth_provider: string | null;
  oauth_id: string | null;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  oauth_token_expires_at: Date | null;
  reset_password_token: string | null;
  reset_password_token_expiry_time: Date | null;
  profile_pic: string | null;
  last_login_method: string | null;
  is_two_factor_enabled: boolean;
  two_factor_secret: string | null;
  is_deleted: boolean;
  last_ip: string | null;
  last_browser: string | null;
  last_os: string | null;
  last_device: string | null;
  last_location: string | null;
  last_country: string | null;
  last_city: string | null;
  tmp_two_factor_secret: string | null;
  disable_2fa_otp: string | null;
  disable_2fa_otp_expiry_time: Date | null;
}

// User input for creating a user (e.g., POST /users)
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

// When returning a user to frontend (hiding password)
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  registration_date: Date;
  last_login: Date | null;
}
