// export interface User {
//   id: string;
//   email: string;
//   name: string;
//   picture?: string;
//   oauth_provider?: string;
//   is_active: boolean;
//   last_login?: string;
// }
export interface User {
  id: number;
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
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
