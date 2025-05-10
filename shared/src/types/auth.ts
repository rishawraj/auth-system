export interface User {
  id: string;
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
}

export interface AuthResponse {
  status: "success" | "error";
  message: string;
  data?: {
    user: User;
    token?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    registration_date: string;
  };
  accessToken: string;
}
